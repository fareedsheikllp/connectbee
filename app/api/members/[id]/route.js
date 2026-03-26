import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
import bcrypt from "bcryptjs";

const { db: prisma } = pkg;

// PATCH — update member (name, role, isActive, password)
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, role, isActive, password } = await req.json();

  const data = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role.toUpperCase();
  if (isActive !== undefined) data.isActive = isActive;
  if (password) data.password = await bcrypt.hash(password, 10);

  const member = await prisma.workspaceMember.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ member });
}

// DELETE — remove member
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.workspaceMember.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}