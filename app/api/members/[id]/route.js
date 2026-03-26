import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
import bcrypt from "bcryptjs";

const { db: prisma } = pkg;

async function getWorkspaceId(session) {
  if (session.user.role === "owner" || session.user.role === "admin") {
    const workspace = await prisma.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

export async function PATCH(req, context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  // Verify member belongs to this workspace
  const existing = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, role, isActive, password } = await req.json();

  const data = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role.toUpperCase();
  if (isActive !== undefined) data.isActive = isActive;
  if (password) data.password = await bcrypt.hash(password, 10);

  const member = await prisma.workspaceMember.update({
    where: { id },
    data,
  });

  return NextResponse.json({ member });
}

export async function DELETE(req, context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  // Verify member belongs to this workspace before deleting
  const existing = await prisma.workspaceMember.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workspaceMember.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

