import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { checkConversationLimit, incrementConversationsUsed } from "@/lib/planLimits";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await db.broadcast.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      recipients: { include: { contact: true } },
      workspace: { select: { twilioAccountSid: true, twilioAuthToken: true, twilioPhoneNumber: true } },
    },
  });

  for (const broadcast of due) {
    const contacts = broadcast.recipients
      .map(r => r.contact)
      .filter(c => c && c.subscribed !== false);

    await Promise.all(contacts.map(async (contact) => {
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
    const result = await sendWhatsApp(contact.phone, personalizedMessage, broadcast.mediaUrl || null, templateSid, creds);
      await db.broadcastRecipient.updateMany({
        where: { broadcastId: broadcast.id, contactId: contact.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? new Date() : null,
          failureReason: result.success ? null : result.error ?? "Unknown error",
          errorCode: result.success ? null : (result.code ? String(result.code) : null),
          waMessageId: result.success ? result.messageId : null,
        },
      });
    }));

await db.broadcast.update({
  where: { id: broadcast.id },
  data: { status: "SENT" },
});

// Create conversations and messages just like the direct send does
const hasBots = broadcast.chatbotIds?.length > 0;
const primaryBotId = hasBots ? broadcast.chatbotIds[0] : null;

for (const recipient of broadcast.recipients) {
  const contact = recipient.contact;
  if (!contact) continue;
  const recipientStatus = await db.broadcastRecipient.findFirst({
    where: { broadcastId: broadcast.id, contactId: contact.id },
  });
  if (recipientStatus?.status !== "SENT") continue;

  try {
    let conv = await db.conversation.findFirst({
      where: { workspaceId: broadcast.workspaceId, contactId: contact.id },
    });
    if (!conv) {
      const convCheck = await checkConversationLimit(broadcast.workspaceId);
      if (!convCheck.allowed) {
        console.log("Conversation limit reached, skipping:", contact.phone);
        continue;
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
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Conversation creation failed:", err.message);
  }
}

  }
  return NextResponse.json({ processed: due.length });
}