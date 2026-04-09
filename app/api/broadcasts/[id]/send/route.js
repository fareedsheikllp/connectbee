import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { checkConversationLimit, incrementConversationsUsed } from "@/lib/planLimits";
import { broadcastRateLimit } from "@/lib/ratelimit";

export async function POST(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const { success } = await broadcastRateLimit.limit(session.user.id);
    if (!success) return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const broadcast = await db.broadcast.findFirst({
      where: { id, workspaceId },
      include: {
        recipients: { include: { contact: true } },
        workspace: true,
      },
    });

    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (broadcast.status !== "DRAFT" && broadcast.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Only draft broadcasts can be sent" }, { status: 400 });
    }
    if (broadcast.recipients.length === 0) {
      return NextResponse.json({ error: "No recipients on this broadcast" }, { status: 400 });
    }

    // Mark as SENDING
    await db.broadcast.update({ where: { id }, data: { status: "SENDING" } });

    const hasBots = broadcast.chatbotIds?.length > 0;
    const primaryBotId = hasBots ? broadcast.chatbotIds[0] : null;

    // Send to each recipient
    await Promise.all(
      broadcast.recipients.map(async (recipient) => {
        const contact = recipient.contact;
        if (!contact) return;

        if (!contact.subscribed) {
          await db.broadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              failureReason: "Contact unsubscribed",
            },
          });
          return;
        }

        console.log("Sending to:", contact.phone, "Message:", broadcast.message);
        let templateSid = null;
        if (broadcast.templateId) {
          const template = await db.template.findFirst({ where: { id: broadcast.templateId, metaStatus: { in: ["approved", "APPROVED"] } } });
          templateSid = template?.metaTemplateId || null;
        }
        const personalizedMessage = broadcast.message
          .replace(/{{name}}/g, contact.name || "")
          .replace(/{{phone}}/g, contact.phone || "")
          .replace(/{{email}}/g, contact.email || "")
          .replace(/{{company}}/g, contact.company || "");
          const creds = broadcast.workspace?.twilioAccountSid ? {
            accountSid:  broadcast.workspace.twilioAccountSid,
            authToken:   broadcast.workspace.twilioAuthToken,
            phoneNumber: broadcast.workspace.twilioPhoneNumber,
          } : null;
          const result = await sendWhatsApp(contact.phone, personalizedMessage, null, templateSid, creds);
        console.log("Send result:", JSON.stringify(result));

        await db.broadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: result.success ? "SENT" : "FAILED",
            sentAt: result.success ? new Date() : null,
            failureReason: result.success ? null : (result.error ?? "Unknown error"),
            errorCode: result.success ? null : (result.code ? String(result.code) : null),
            waMessageId: result.messageId || null,
          },
        });

        if (!result.success) {
          console.error(`Failed to send to ${contact.phone}:`, result.error);
          return;
        }

        if (result.success) {
          try {
            let conv = await db.conversation.findFirst({
              where: { workspaceId: broadcast.workspaceId, contactId: contact.id },
            });

          if (!conv) {
            const convCheck = await checkConversationLimit(broadcast.workspaceId);
            if (!convCheck.allowed) {
              console.log("Conversation limit reached, skipping:", contact.phone);
              return;
            }
            conv = await db.conversation.create({
              data: {
                workspaceId: broadcast.workspaceId,
                contactId: contact.id,
                status: hasBots ? "BOT" : "OPEN",
                chatbotId: primaryBotId,
                chatbotIds: broadcast.chatbotIds || [],
                lastMessage: broadcast.message,
              },
            });
            await incrementConversationsUsed(broadcast.workspaceId);
          } else {
              await db.conversation.update({
                where: { id: conv.id },
                data: {
                  lastMessage: broadcast.message,
                  updatedAt: new Date(),
                  status: hasBots ? "BOT" : conv.status,
                  chatbotId: primaryBotId ?? conv.chatbotId,
                  chatbotIds: broadcast.chatbotIds?.length > 0 ? broadcast.chatbotIds : conv.chatbotIds,
                },
              });
            }

            await db.message.create({
              data: {
                conversationId: conv.id,
                direction: "OUTBOUND",
                type: "TEXT",
                content: personalizedMessage,
                status: "SENT",
                isInternal: false,
                sentAt: new Date(),
                waMessageId: result.messageId || null,
              },
            });
          } catch (convErr) {
            console.error("Conversation error:", convErr.message);
          }
        }
      })
    );

    // Mark as SENT
    await db.broadcast.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SEND ERROR:", err.message);
    // If something went wrong mid-send, revert to DRAFT
    try {
      await db.broadcast.update({ where: { id: context.params.id }, data: { status: "DRAFT" } });
    } catch {}
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}