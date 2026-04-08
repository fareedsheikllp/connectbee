import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const group = await db.contactGroup.findFirst({
      where: { id, workspace: { userId: session.user.id } },
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

    const group = await db.contactGroup.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { userId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
      T
    });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.contactGroup.update({
      where: { id },
      data: {
        name: data.name ?? group.name,
        description: data.description ?? group.description,
      },
    });

    // If memberIds are passed, sync the members
    if (Array.isArray(data.memberIds)) {
      await db.contactGroupMember.deleteMany({ where: { groupId: id } });
      if (data.memberIds.length > 0) {
        await db.contactGroupMember.createMany({
          data: data.memberIds.map((contactId) => ({ groupId: id, contactId })),
        });
      }
    }
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

    const group = await db.contactGroup.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.contactGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}