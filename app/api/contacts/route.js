import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contacts = await db.contact.findMany({
      where: { workspace: { userId: session.user.id } },
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

    const workspace = await db.workspace.findFirst({
      where: { userId: session.user.id },
    });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { name, phone, email, notes, company } = await req.json();
    if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });

    // Check duplicate phone
    const existing = await db.contact.findFirst({
      where: { workspaceId: workspace.id, phone },
    });
    if (existing) return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });

    const contact = await db.contact.create({
      data: { workspaceId: workspace.id, name, phone, email: email || "", notes: notes || "", company: company || "" },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
