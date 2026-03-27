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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contacts = await db.contact.findMany({
      where: { workspaceId: await getWorkspaceId(session) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { name, phone, email, notes, company } = await req.json();
    if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });

    // Check duplicate phone
    const existing = await db.contact.findFirst({
      where: { workspaceId: workspace.id, phone },
    });
    if (existing) return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });

    const contact = await db.contact.create({
      data: { workspaceId, name, phone, email: email || "", notes: notes || "", company: company || "" },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
