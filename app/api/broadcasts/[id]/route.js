import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Normalize status to lowercase everywhere
const normalizeStatus = (status) => status?.toLowerCase() ?? "draft";

export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const broadcast = await db.broadcast.findFirst({
      where: { id, workspace: { userId: session.user.id } },
      include: { recipients: { include: { contact: true } } },
    });

    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch chatbot names manually from chatbotIds array
    const chatbots = broadcast.chatbotIds?.length > 0
      ? await db.chatbot.findMany({
          where: { id: { in: broadcast.chatbotIds } },
          select: { id: true, name: true },
        })
      : [];

    return NextResponse.json({
      ...broadcast,
      status: normalizeStatus(broadcast.status),
      chatbots,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const data = await req.json();

    const broadcast = await db.broadcast.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.broadcast.update({
      where: { id },
      data: {
        name: data.name ?? broadcast.name,
        message: data.message ?? broadcast.message,
        // Always store lowercase
        status: (data.status ?? broadcast.status)?.toUpperCase(),
        scheduledAt: data.scheduledAt ?? broadcast.scheduledAt,
      },
    });

    return NextResponse.json({ ...updated, status: normalizeStatus(updated.status), chatbots: [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const broadcast = await db.broadcast.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.broadcast.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}