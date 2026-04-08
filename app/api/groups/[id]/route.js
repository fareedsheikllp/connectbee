import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const group = await db.contactGroup.findFirst({
      where: { id, workspaceId },
      include: { members: { include: { contact: true } } },
    });

    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(group);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const data = await req.json();

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const group = await db.contactGroup.findFirst({ where: { id, workspaceId } });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.contactGroup.update({
      where: { id },
      data: {
        name: data.name ?? group.name,
        description: data.description ?? group.description,
      },
    });

    const incomingIds = data.contactIds ?? data.memberIds;
    if (Array.isArray(incomingIds)) {
      await db.contactGroupMember.deleteMany({ where: { groupId: id } });
      if (incomingIds.length > 0) {
        await db.contactGroupMember.createMany({
          data: incomingIds.map((contactId) => ({ groupId: id, contactId })),
          skipDuplicates: true,
        });
      }
    }

    const result = await db.contactGroup.findFirst({
      where: { id },
      include: { members: { include: { contact: true } } },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const group = await db.contactGroup.findFirst({ where: { id, workspaceId } });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.contactGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}