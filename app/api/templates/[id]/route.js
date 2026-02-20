import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const data = await req.json();
    const template = await db.template.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
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
    const template = await db.template.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.template.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}