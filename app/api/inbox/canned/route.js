import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getWorkspaceId(session) {
  const role = session.user.role;
  if (role === "owner" || role === "admin") {
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const canned = await db.cannedResponse.findMany({
      where: { workspaceId },
      orderBy: { shortcut: "asc" },
    });
    return NextResponse.json({ canned });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { shortcut, title, content } = await req.json();
    const canned = await db.cannedResponse.create({
      data: { workspaceId, shortcut, title, content },
    });
    return NextResponse.json({ canned }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await db.cannedResponse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}