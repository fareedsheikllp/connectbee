import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";

const { db: prisma } = pkg;

export async function PATCH(req, context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const { name, description, color, addMemberId, removeMemberId } = await req.json();

  if (addMemberId) {
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
  await prisma.channel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}