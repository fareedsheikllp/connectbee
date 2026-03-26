import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";

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

  // Verify channel belongs to this workspace
  const existing = await prisma.channel.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description, color, addMemberId, removeMemberId } = await req.json();

  if (addMemberId) {
    // Also verify the member belongs to this workspace
    const member = await prisma.workspaceMember.findFirst({ where: { id: addMemberId, workspaceId } });
    if (!member) return NextResponse.json({ error: "Member not in workspace" }, { status: 403 });

    await prisma.channelMember.upsert({
      where: { channelId_memberId: { channelId: id, memberId: addMemberId } },
      update: {},
      create: { channelId: id, memberId: addMemberId },
    });
    return NextResponse.json({ success: true });
  }

  if (removeMemberId) {
    await prisma.channelMember.deleteMany({
      where: { channelId: id, memberId: removeMemberId },
    });
    return NextResponse.json({ success: true });
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (color !== undefined) data.color = color;

  const channel = await prisma.channel.update({ where: { id }, data });
  return NextResponse.json({ channel });
}

export async function DELETE(req, context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  // Verify channel belongs to this workspace before deleting
  const existing = await prisma.channel.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.channel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}