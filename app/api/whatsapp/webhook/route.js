import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const from = params.get("From")?.replace("whatsapp:+", "").replace("whatsapp:", "");
    const body = params.get("Body")?.trim();
    const waMessageId = params.get("MessageSid");

    if (!from || !body) return NextResponse.json({ status: "ignored" });

    const ws = await db.workspace.findFirst();
    if (!ws) return NextResponse.json({ status: "no workspace" });

    if (body.toUpperCase() === "STOP") {
      const contact = await db.contact.findFirst({
        where: { workspaceId: ws.id, phone: { in: [from, `+${from}`] } },
      });
      if (contact) {
        await db.contact.update({ where: { id: contact.id }, data: { subscribed: false } });
        await sendWhatsApp(from, "You have been unsubscribed. Send START to subscribe again.");
      }
      return NextResponse.json({ status: "unsubscribed" });
    }

    if (body.toUpperCase() === "START") {
      const contact = await db.contact.findFirst({
        where: { workspaceId: ws.id, phone: { in: [from, `+${from}`] } },
      });
      if (contact) {
        await db.contact.update({ where: { id: contact.id }, data: { subscribed: true } });
        await sendWhatsApp(from, "You have been resubscribed successfully!");
      }
      return NextResponse.json({ status: "resubscribed" });
    }

    let contact = await db.contact.findFirst({
      where: { workspaceId: ws.id, phone: { in: [from, `+${from}`] } },
    });
    if (!contact) {
      contact = await db.contact.create({
        data: { workspaceId: ws.id, name: from, phone: from, email: "", notes: "" },
      });
    }

    let conversation = await db.conversation.findFirst({
      where: { workspaceId: ws.id, contactId: contact.id },
    });
    if (!conversation) {
      const defaultBot = await db.chatbot.findFirst({
        where: { workspaceId: ws.id, active: true, isDefault: true },
      });
      conversation = await db.conversation.create({
        data: {
          workspaceId: ws.id,
          contactId: contact.id,
          status: defaultBot ? "BOT" : "OPEN",
          chatbotId: defaultBot?.id || null,
          lastMessage: body,
        },
      });
    } else {
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: body,
          updatedAt: new Date(),
          status: conversation.status === "RESOLVED" ? "OPEN" : conversation.status,
        },
      });
    }

    const existing = await db.message.findFirst({
      where: { conversationId: conversation.id, waMessageId },
    });
    if (!existing) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          direction: "INBOUND",
          type: "TEXT",
          content: body,
          status: "DELIVERED",
          sentAt: new Date(),
          waMessageId,
        },
      });
    }

    if (conversation.status === "BOT") {
      const botIds = conversation.chatbotIds?.length > 0 
        ? conversation.chatbotIds 
        : conversation.chatbotId ? [conversation.chatbotId] : [];
      
      for (const botId of botIds) {
        const chatbot = await db.chatbot.findFirst({
          where: { id: botId, active: true },
        });
        if (chatbot?.flow) {
          const flow = chatbot.flow;
          const nodes = flow.nodes || (Array.isArray(flow) ? flow : Object.values(flow));
          const edges = flow.edges || [];
          await runBotFlow(nodes, edges, body, from, conversation.id);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function runBotFlow(nodes, edges, incomingMessage, phone, conversationId) {
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
      if (matchType === "exact") return msgLower === keyword;
      if (matchType === "starts") return msgLower.startsWith(keyword);
      return false;
    });

    if (matched) {
      const connectedIds = condNode.connections?.length > 0
        ? condNode.connections
        : edges.filter(e => e.source === condNode.id).map(e => e.target);
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