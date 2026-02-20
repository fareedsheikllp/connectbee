import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groups = await db.contactGroup.findMany({
      where: { workspace: { userId: session.user.id } },
      include: {
        members: {
          include: { contact: true },
        },
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

    const workspace = await db.workspace.findFirst({
      where: { userId: session.user.id },
    });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { name, description, contactIds } = await req.json();
    if (!name) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

    const group = await db.contactGroup.create({
      data: {
        workspaceId: workspace.id,
        name,
        description: description || "",
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
