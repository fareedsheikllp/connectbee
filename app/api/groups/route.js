import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const groups = await db.contactGroup.findMany({
      where: { workspaceId },
      include: {
        members: { include: { contact: true } },
        channel: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const workspace = { id: workspaceId };

    const { name, description, contactIds, channelId } = await req.json();
    if (!name) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

    const group = await db.contactGroup.create({
      data: {
        workspaceId: workspace.id,
        name,
        description: description || "",
        channelId: channelId || null,
        members: {
          create: (contactIds || []).map((contactId) => ({ contactId })),
        },
      },
      include: {
        members: { include: { contact: true } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
