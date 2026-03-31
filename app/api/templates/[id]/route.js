import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getWorkspaceId(session) {
  if (session.user.role === "owner" || session.user.role === "admin") {
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const workspaceId = await getWorkspaceId(session);
    const data = await req.json();
    const template = await db.template.findFirst({ where: { id, workspaceId } });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.template.update({
      where: { id },
      data: {
        name: data.name ?? template.name,
        body: data.body ?? template.body,
        category: data.category ?? template.category,
        tags: data.tags ?? template.tags,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const workspaceId = await getWorkspaceId(session);
    const template = await db.template.findFirst({ where: { id, workspaceId } });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.template.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}