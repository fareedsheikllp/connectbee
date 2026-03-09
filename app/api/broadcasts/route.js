import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const broadcasts = await db.broadcast.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { recipients: true } },
        recipients: { select: { status: true } },
      },
    });

    // Fetch chatbot names from chatbotIds array
    const allBotIds = [...new Set(broadcasts.flatMap(b => b.chatbotIds || []))];
    const chatbots = allBotIds.length > 0
      ? await db.chatbot.findMany({ where: { id: { in: allBotIds } } })
      : [];

    const enriched = broadcasts.map(b => ({
      ...b,
      _count: {
        ...b._count,
        sentRecipients: b.recipients.filter(r => r.status === "SENT").length,
        failedRecipients: b.recipients.filter(r => r.status === "FAILED").length,
      },
      chatbots: (b.chatbotIds || []).map(id => chatbots.find(c => c.id === id)).filter(Boolean),
      recipients: undefined,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { name, message, status, contactIds, scheduledAt, chatbotIds } = await req.json();
    if (!name || !message) return NextResponse.json({ error: "Name and message required" }, { status: 400 });

    const hasBots = Array.isArray(chatbotIds) && chatbotIds.length > 0;

    const broadcast = await db.broadcast.create({
      data: {
        workspaceId: workspace.id,
        name,
        message,
        status: status ? status.toUpperCase() : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        chatbotIds: hasBots ? chatbotIds : [],
        recipients: {
          create: (contactIds || []).map((contactId) => ({ contactId })),
        },
      },
    });

    if (status?.toLowerCase() === "sent") {
      const contacts = await db.contact.findMany({
        where: { id: { in: contactIds || [] }, subscribed: { not: false } },
      });

      await Promise.all(
        contacts.map(async (contact) => {
          const result = await sendWhatsApp(contact.phone, message, broadcast.mediaUrl || null);

          await db.broadcastRecipient.updateMany({
            where: { broadcastId: broadcast.id, contactId: contact.id },
            data: {
              status: result.success ? "SENT" : "FAILED",
              sentAt: result.success ? new Date() : null,
              failureReason: result.success ? null : (result.error ?? "Unknown error"),
              errorCode: result.success ? null : (result.code ?? null),
              waMessageId: result.success ? result.messageId : null,
            },
          });

          if (result.success) {
            try {
              let conv = await db.conversation.findFirst({
                where: { workspaceId: workspace.id, contactId: contact.id },
              });

              // Use first bot id for conversation (single chatbotId field)
              const primaryBotId = hasBots ? chatbotIds[0] : null;

              if (!conv) {
                conv = await db.conversation.create({
                  data: {
                    workspaceId: workspace.id,
                    contactId: contact.id,
                    status: hasBots ? "BOT" : "OPEN",
                    chatbotId: primaryBotId,
                    lastMessage: message,
                  },
                });
              } else {
                await db.conversation.update({
                  where: { id: conv.id },
                  data: {
                    lastMessage: message,
                    updatedAt: new Date(),
                    status: hasBots ? "BOT" : conv.status,
                    chatbotId: primaryBotId ?? conv.chatbotId,
                  },
                });
              }

              await db.message.create({
                data: {
                  conversationId: conv.id,
                  direction: "OUTBOUND",
                  type: "TEXT",
                  content: message,
                  status: "SENT",
                  sentAt: new Date(),
                },
              });
            } catch (convErr) {
              console.error("Conversation creation failed:", convErr.message);
            }
          }
        })
      );
    }

    return NextResponse.json(broadcast, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}