import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const item = await db.catalogItem.findFirst({ where: { id, workspaceId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.catalogItem.update({
      where: { id },
      data: {
        name: data.name ?? item.name,
        description: data.description ?? item.description,
        price: data.price !== undefined ? parseFloat(data.price) : item.price,
        currency: data.currency ?? item.currency,
        imageUrl: data.imageUrl ?? item.imageUrl,
        category: data.category ?? item.category,
        inStock: data.inStock !== undefined ? data.inStock : item.inStock,
        linkUrl: data.linkUrl ?? item.linkUrl,
      },
    });

    return NextResponse.json(updated);
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
    const item = await db.catalogItem.findFirst({ where: { id, workspaceId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.catalogItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}