import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const automations = await db.automation.findMany({
      where: { enabled: true },
      include: { workspace: true },
    });

    let fired = 0;

    for (const auto of automations) {
      if (!["NO_AGENT_REPLY", "NO_CUSTOMER_REPLY", "CONVERSATION_OPEN"].includes(auto.trigger)) continue;
      if (!auto.delayHours) continue;

      const cutoff = new Date(Date.now() - auto.delayHours * 3600000);

        let where = {
        workspaceId: auto.workspaceId,
        status: "OPEN",
        };

      if (auto.channelId) {
        where.conversationChannels = { some: { channelId: auto.channelId } };
      }

      const conditions = auto.conditions || {};
      if (conditions.unassignedOnly) {
        where.assignedTo = null;
      }
      if (conditions.priority && conditions.priority !== "ALL") {
        where.priority = conditions.priority;
      }

      const conversations = await db.conversation.findMany({
        where,
        include: {
          contact: true,
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
      });

      for (const conv of conversations) {
        // Check if already fired for this conversation
        const alreadyFired = await db.automationLog.findFirst({
        where: { automationId: auto.id, contactId: conv.contact.id },
        });
        if (alreadyFired) continue;

        const lastMsg = conv.messages[0];
        if (!lastMsg) continue;

        // Check if last message is old enough
        if (new Date(lastMsg.sentAt) > cutoff) continue;

        // Check trigger condition
        if (auto.trigger === "NO_CUSTOMER_REPLY" && lastMsg.direction !== "OUTBOUND") continue;

        // Execute actions
        const actions = Array.isArray(auto.actions) ? auto.actions : [];
        for (const action of actions) {
          if (action.type === "SEND_MESSAGE" && action.value) {
            try {
              await sendWhatsApp({
                workspace: auto.workspace,
                to: conv.contact.phone,
                message: action.value,
              });
              await db.message.create({
                data: {
                  conversationId: conv.id,
                  direction: "OUTBOUND",
                  type: "TEXT",
                  content: action.value,
                  status: "SENT",
                },
              });
            } catch (e) { console.error("sendWhatsApp failed:", e); }
          }
          if (action.type === "CHANGE_STATUS") {
            await db.conversation.update({
              where: { id: conv.id },
              data: { status: action.value },
            });
          }
          if (action.type === "CHANGE_PRIORITY") {
            await db.conversation.update({
              where: { id: conv.id },
              data: { priority: action.value },
            });
          }
          if (action.type === "ADD_LABEL") {
            const current = conv.labels ? conv.labels.split(",").filter(Boolean) : [];
            if (!current.includes(action.value)) {
              await db.conversation.update({
                where: { id: conv.id },
                data: { labels: [...current, action.value].join(",") },
              });
            }
          }
        }

        // Log it so it doesn't fire again
        await db.automationLog.create({
        data: { automationId: auto.id, contactId: conv.contact.id },
        });
        fired++;
      }
    }

    return NextResponse.json({ success: true, fired });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
//test