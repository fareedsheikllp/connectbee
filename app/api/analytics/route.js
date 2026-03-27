import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("range") || "30");
    const since = new Date();
    since.setDate(since.getDate() - days);

    // ── Same pattern as broadcasts/[id]/route.js ───────────────────
    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = workspace?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const where = { workspaceId };

    // ── Core counts ────────────────────────────────────────────────
    const [
      totalContacts,
      totalBroadcasts,
      totalConversations,
      totalTemplates,
      totalMessages,
    ] = await Promise.all([
      db.contact.count({ where }),
      db.broadcast.count({ where }),
      db.conversation.count({ where }),
      db.template.count({ where }).catch(() => 0),
      db.message.count({ where: { conversation: where } }).catch(() => 0),
    ]);

    // ── All broadcasts with recipients ─────────────────────────────
    const broadcasts = await db.broadcast.findMany({
      where,
      include: {
        recipients: {
          select: {
            status: true,
            failureReason: true,
            errorCode: true,
            sentAt: true,
            contactId: true,
            contact: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Recipient-level aggregations ───────────────────────────────
    const allRecipients = broadcasts.flatMap(b => b.recipients);
    const totalSent    = allRecipients.filter(r => r.status === "SENT").length;
    const totalFailed  = allRecipients.filter(r => r.status === "FAILED").length;
    const deliveryRate = totalSent + totalFailed > 0
      ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
      : 0;

    // ── Failure reason breakdown ───────────────────────────────────
    const ERROR_LABELS = {
      "21211": "Invalid phone number",
      "21408": "Permission denied for region",
      "21610": "Number is unsubscribed",
      "21614": "Not a valid mobile number",
      "63003": "Channel auth failed",
      "63007": "WhatsApp number not registered",
      "63016": "Message blocked by WhatsApp",
      "63032": "Outside messaging window",
    };

    const failMap = {};
    allRecipients.filter(r => r.status === "FAILED").forEach(r => {
      const label = (r.errorCode && ERROR_LABELS[r.errorCode])
        ? ERROR_LABELS[r.errorCode]
        : (r.failureReason || "Unknown error").slice(0, 60);
      failMap[label] = (failMap[label] || 0) + 1;
    });
    const failureReasons = Object.entries(failMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([reason, count]) => ({ reason, count }));

    // ── Top contacts with failures ─────────────────────────────────
    const contactFailMap = {};
    allRecipients.filter(r => r.status === "FAILED").forEach(r => {
      const key = r.contact?.phone || "unknown";
      if (!contactFailMap[key]) {
        contactFailMap[key] = { name: r.contact?.name, phone: r.contact?.phone, count: 0 };
      }
      contactFailMap[key].count++;
    });
    const topFailedContacts = Object.values(contactFailMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Per-broadcast stats ────────────────────────────────────────
    const broadcastStats = broadcasts.map(b => {
      const sent    = b.recipients.filter(r => r.status === "SENT").length;
      const failed  = b.recipients.filter(r => r.status === "FAILED").length;
      const pending = b.recipients.filter(r => ["SENDING", "PENDING"].includes(r.status)).length;
      const total   = b.recipients.length;
      const rate    = sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : null;
      return {
        id: b.id,
        name: b.name,
        status: b.status,
        isRetarget: b.name.includes("Retarget"),
        total,
        sent,
        failed,
        pending,
        deliveryRate: rate,
        createdAt: b.createdAt,
      };
    });

    const retargetedBroadcasts = broadcastStats.filter(b => b.isRetarget);

    // Broadcast status breakdown
    const bStatusMap = {};
    broadcasts.forEach(b => { bStatusMap[b.status] = (bStatusMap[b.status] || 0) + 1; });

    // ── Conversations breakdown ────────────────────────────────────
    const conversations = await db.conversation.findMany({
      where,
      select: { status: true, chatbotId: true },
    }).catch(() => []);

    const convStatusMap = {};
    conversations.forEach(c => { convStatusMap[c.status] = (convStatusMap[c.status] || 0) + 1; });

    const botConversations  = conversations.filter(c => c.chatbotId).length;
    const openConversations = conversations.filter(c => c.status === "OPEN").length;

    // ── Message direction breakdown ────────────────────────────────
    const messages = await db.message.findMany({
      where: { conversation: where },
      select: { direction: true, createdAt: true },
    }).catch(() => []);

    const inbound  = messages.filter(m => m.direction === "INBOUND").length;
    const outbound = messages.filter(m => m.direction === "OUTBOUND").length;

    // ── Templates breakdown ────────────────────────────────────────
    const templates = await db.template.findMany({
      where,
      select: { metaStatus: true, category: true },
    }).catch(() => []);

    const tStatusMap = {};
    templates.forEach(t => {
      const s = t.metaStatus || "NONE";
      tStatusMap[s] = (tStatusMap[s] || 0) + 1;
    });
    const tCatMap = {};
    templates.forEach(t => { tCatMap[t.category] = (tCatMap[t.category] || 0) + 1; });

    // ── Time series ────────────────────────────────────────────────
    function makeBuckets() {
      const b = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        b[key] = {
          date: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
          value: 0,
        };
      }
      return b;
    }

    // Contact growth
    const newContacts = await db.contact.findMany({
      where: { ...where, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const contactBuckets = makeBuckets();
    newContacts.forEach(c => {
      const key = new Date(c.createdAt).toISOString().split("T")[0];
      if (contactBuckets[key]) contactBuckets[key].value++;
    });

    // Broadcast activity
    const broadcastBuckets = makeBuckets();
    broadcasts
      .filter(b => new Date(b.createdAt) >= since)
      .forEach(b => {
        const key = new Date(b.createdAt).toISOString().split("T")[0];
        if (broadcastBuckets[key]) broadcastBuckets[key].value++;
      });

    // Message activity
    const msgBuckets = makeBuckets();
    messages
      .filter(m => new Date(m.createdAt) >= since)
      .forEach(m => {
        const key = new Date(m.createdAt).toISOString().split("T")[0];
        if (msgBuckets[key]) msgBuckets[key].value++;
      });

    // Delivery rate trend
    const deliveryTrend = broadcastStats
      .filter(b => b.status === "SENT" && b.deliveryRate !== null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-20)
      .map(b => ({
        date: new Date(b.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
        value: b.deliveryRate,
        name: b.name,
      }));
// ── Channel breakdown ──────────────────────────────────────
    const channelStats = await db.channel.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { conversations: true } },
        conversations: { select: { status: true } },
      },
    }).catch(() => []);

    const channelBreakdown = channelStats.map(ch => ({
      id: ch.id,
      name: ch.name,
      color: ch.color,
      total: ch._count.conversations,
      open: ch.conversations.filter(c => c.status === "OPEN").length,
      resolved: ch.conversations.filter(c => c.status === "RESOLVED").length,
      bot: ch.conversations.filter(c => c.status === "BOT").length,
    }));

    // ── Agent breakdown ────────────────────────────────────────
    const agentStats = await db.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: {
        conversations: { select: { status: true } },
      },
    }).catch(() => []);

    const agentBreakdown = agentStats.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      total: m.conversations.length,
      open: m.conversations.filter(c => c.status === "OPEN").length,
      resolved: m.conversations.filter(c => c.status === "RESOLVED").length,
    }));
    return NextResponse.json({
      totals: {
        contacts:             totalContacts,
        broadcasts:           totalBroadcasts,
        conversations:        totalConversations,
        messages:             totalMessages,
        templates:            totalTemplates,
        messagesSent:         totalSent,
        messagesFailed:       totalFailed,
        deliveryRate,
        inboundMessages:      inbound,
        outboundMessages:     outbound,
        botConversations,
        openConversations,
        retargetedBroadcasts: retargetedBroadcasts.length,
      },
      charts: {
        contactGrowth:     Object.values(contactBuckets),
        broadcastActivity: Object.values(broadcastBuckets),
        messageActivity:   Object.values(msgBuckets),
        deliveryTrend,
      },
      breakdowns: {
        broadcastStatus:    Object.entries(bStatusMap).map(([status, count]) => ({ status, count })),
        conversationStatus: Object.entries(convStatusMap).map(([status, count]) => ({ status, count })),
        templateStatus:     Object.entries(tStatusMap).map(([status, count]) => ({ status, count })),
        templateCategory:   Object.entries(tCatMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
        failureReasons,
        channelBreakdown,
        agentBreakdown,
      },
      tables: {
        recentBroadcasts:    broadcastStats.slice(0, 15),
        retargetedBroadcasts,
        topFailedContacts,
      },
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err.message, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}