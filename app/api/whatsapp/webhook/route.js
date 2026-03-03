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
    const body = await req.json();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.length) {
      return NextResponse.json({ status: "no messages" });
    }

    const msg = value.messages[0];
    const from = msg.from; // e.g. "14375993361"
    const text = msg.text?.body;
    const waMessageId = msg.id;

    if (!text) return NextResponse.json({ status: "non-text ignored" });

    // Handle STOP / START before anything else
    const displayPhoneNumberIdEarly = value.metadata?.phone_number_id;
    const wsEarly = await db.workspace.findFirst({ where: { waPhoneNumberId: displayPhoneNumberIdEarly } }) ?? await db.workspace.findFirst();

    if (text.trim().toUpperCase() === "STOP") {
      const stopContact = await db.contact.findFirst({
        where: { workspaceId: wsEarly.id, phone: { in: [from, `+${from}`] } },
      });
      if (stopContact) {
        await db.contact.update({ where: { id: stopContact.id }, data: { subscribed: false } });
        await sendWhatsApp(from, "You have been unsubscribed. Send START to subscribe again.");
      }
      return NextResponse.json({ status: "unsubscribed" });
    }

    if (text.trim().toUpperCase() === "START") {
      const startContact = await db.contact.findFirst({
        where: { workspaceId: wsEarly.id, phone: { in: [from, `+${from}`] } },
      });
      if (startContact) {
        await db.contact.update({ where: { id: startContact.id }, data: { subscribed: true } });
        await sendWhatsApp(from, "You have been resubscribed successfully!");
      }
      return NextResponse.json({ status: "resubscribed" });
    }

    // Find workspace via the phone number ID that received the message
    const displayPhoneNumberId = value.metadata?.phone_number_id;

    const workspace = await db.workspace.findFirst({
      where: { waPhoneNumberId: displayPhoneNumberId },
    });

    // Fallback: grab first workspace if you only have one
    const ws = workspace ?? await db.workspace.findFirst();
    if (!ws) return NextResponse.json({ status: "no workspace" });

    // Find or create contact
let contact = await db.contact.findFirst({
  where: { 
    workspaceId: ws.id, 
    phone: { in: [from, `+${from}`] }  // match with or without +
  },
});

if (!contact) {
  contact = await db.contact.create({
    data: {
      workspaceId: ws.id,
      name: value.contacts?.[0]?.profile?.name || from,
      phone: from,  // store without + going forward
      email: "",
      notes: "",
    },
  });
}

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: { workspaceId: ws.id, contactId: contact.id },
    });
    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          workspaceId: ws.id,
          contactId: contact.id,
          status: "OPEN",
          lastMessage: text,
        },
      });
    } else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: text, updatedAt: new Date(), status: conversation.status === "RESOLVED" ? "OPEN" : conversation.status },
      });
    }

    // Avoid duplicate messages
    const existing = await db.message.findFirst({
      where: { conversationId: conversation.id, waMessageId },
    });
    if (!existing) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          direction: "INBOUND",
          type: "TEXT",
          content: text,
          status: "DELIVERED",
          sentAt: new Date(parseInt(msg.timestamp) * 1000),
          waMessageId,
        },
      });
    }
    if (conversation.chatbotId) {
      const chatbot = await db.chatbot.findFirst({
        where: { id: conversation.chatbotId, active: true },
      });
      if (chatbot?.flow) {
        const nodes = Object.values(chatbot.flow);
        await runBotFlow(nodes, text, from, conversation.id);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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