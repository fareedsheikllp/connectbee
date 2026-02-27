import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

// ─── Webhook verification (GET) ───────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── Incoming messages (POST) ─────────────────────────────────────
export async function POST(req) {
  try {
    const payload = await req.json();

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Ignore status updates (delivered, read etc)
    if (value?.statuses) return new NextResponse("OK", { status: 200 });

    const msgObj = value?.messages?.[0];
    if (!msgObj) return new NextResponse("OK", { status: 200 });

    const from = msgObj.from; // e.g. "14155238886"
    console.log("Incoming from:", from);
    const body = msgObj.type === "text"
      ? msgObj.text?.body
      : msgObj.type === "image"
      ? "[Image]"
      : `[${msgObj.type}]`;

    if (!from || !body) return new NextResponse("OK", { status: 200 });

    // Find contact
    const contact = await db.contact.findFirst({
      where: { phone: { contains: from.slice(-10) } },
      include: { workspace: true },
    });

    if (!contact) return new NextResponse("OK", { status: 200 });

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: { workspaceId: contact.workspaceId, contactId: contact.id },
      select: { id: true, status: true, chatbotId: true, contactId: true },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          workspaceId: contact.workspaceId,
          contactId: contact.id,
          status: "OPEN",
          lastMessage: body,
        },
      });
    } else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: body, updatedAt: new Date() },
      });
    }

    // Save message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        content: body,
        direction: "INBOUND",
        status: "DELIVERED",
        sentAt: new Date(),
      },
    });

    // Run chatbot if in BOT mode
    if (conversation.status === "BOT") {
      const botIds = conversation.chatbotIds || [];
      const chatbots = botIds.length > 0
        ? await db.chatbot.findMany({ where: { id: { in: botIds }, active: true } })
        : await db.chatbot.findMany({ where: { workspaceId: contact.workspaceId, active: true } });

      for (const chatbot of chatbots) {
        if (chatbot?.flow?.nodes?.length > 0) {
          await runBotFlow(chatbot.flow.nodes, body, from, conversation.id);
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new NextResponse("OK", { status: 200 });
  }
}

async function runBotFlow(nodes, incomingMessage, phone, conversationId) {
  const msgLower = incomingMessage.toLowerCase().trim();

  const conditionNodes = nodes.filter(n => n.type === "condition");

  if (conditionNodes.length === 0) {
    const messageNodes = nodes
      .filter(n => n.type === "message")
      .sort((a, b) => a.order - b.order);
    for (const node of messageNodes) {
      await handleNode(node, phone, conversationId);
    }
    return;
  }

  for (const condNode of conditionNodes) {
    const keywords = condNode.data?.keyword
      ?.toLowerCase()
      .split(",")
      .map(k => k.trim())
      .filter(Boolean) || [];

    if (keywords.length === 0) continue;

    const matchType = condNode.data?.matchType || "contains";
    const matched = keywords.some(keyword => {
      if (matchType === "contains") return msgLower.includes(keyword);
      if (matchType === "exact")    return msgLower === keyword;
      if (matchType === "starts")   return msgLower.startsWith(keyword);
      return false;
    });

    if (matched) {
      const connectedIds = condNode.connections || [];
      for (const connId of connectedIds) {
        const connNode = nodes.find(n => n.id === connId);
        if (connNode) await handleNode(connNode, phone, conversationId);
      }
      return;
    }
  }
}

async function handleNode(node, phone, conversationId) {
  if (node.type === "message" && node.data?.message) {
    await sendBotMessage(node.data.message, phone, conversationId);
  }

  if (node.type === "delay" && node.data?.seconds) {
    await new Promise(r => setTimeout(r, node.data.seconds * 1000));
  }

  if (node.type === "action") {
    if (node.data?.action === "Assign to human agent") {
      await db.conversation.update({ where: { id: conversationId }, data: { status: "OPEN" } });
    }
    if (node.data?.action === "Mark conversation as resolved") {
      await db.conversation.update({ where: { id: conversationId }, data: { status: "RESOLVED" } });
    }
    if (node.data?.action === "Subscribe contact") {
      const conv = await db.conversation.findUnique({ where: { id: conversationId } });
      if (conv) await db.contact.update({ where: { id: conv.contactId }, data: { subscribed: true } });
    }
    if (node.data?.action === "Unsubscribe contact") {
      const conv = await db.conversation.findUnique({ where: { id: conversationId } });
      if (conv) await db.contact.update({ where: { id: conv.contactId }, data: { subscribed: false } });
    }
  }
}

async function sendBotMessage(text, phone, conversationId) {
  await sendWhatsApp(phone, text);
  await db.message.create({
    data: {
      conversationId,
      content: text,
      direction: "OUTBOUND",
      status: "SENT",
      sentAt: new Date(),
    },
  });
  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: text, updatedAt: new Date() },
  });
}