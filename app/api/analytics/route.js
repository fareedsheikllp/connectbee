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

    const where = { workspace: { userId: session.user.id } };

    const [totalContacts, totalBroadcasts, totalConversations, allContacts, allBroadcasts] =
      await Promise.all([
        db.contact.count({ where }),
        db.broadcast.count({ where }),
        db.conversation.count({ where }),
        db.contact.findMany({
          where: { ...where, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        db.broadcast.findMany({
          where,
          select: { id: true, name: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Build day-by-day buckets
    const makeBuckets = () => {
      const b = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        b[d.toISOString().split("T")[0]] = 0;
      }
      return b;
    };

    const contactBuckets = makeBuckets();
    allContacts.forEach((c) => {
      const key = new Date(c.createdAt).toISOString().split("T")[0];
      if (key in contactBuckets) contactBuckets[key]++;
    });

    const broadcastBuckets = makeBuckets();
    allBroadcasts.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      if (key in broadcastBuckets) broadcastBuckets[key] += 1;
    });

    const statusMap = {};
    allBroadcasts.forEach((b) => {
      statusMap[b.status] = (statusMap[b.status] || 0) + 1;
    });

    return NextResponse.json({
      totals: {
        contacts: totalContacts,
        broadcasts: totalBroadcasts,
        conversations: totalConversations,
        messagesSent: allBroadcasts.length,
      },
      charts: {
        contactGrowth: Object.entries(contactBuckets).map(([date, value]) => ({ date, value })),
        broadcastActivity: Object.entries(broadcastBuckets).map(([date, value]) => ({ date, value })),
      },
      broadcastStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      recentBroadcasts: allBroadcasts.slice(0, 5),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}