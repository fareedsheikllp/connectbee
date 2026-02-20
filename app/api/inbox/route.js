import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const conversations = await db.conversation.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      include: { contact: { select: { id: true, name: true, phone: true, avatar: true } } },
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
