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
    const chatbot = await db.chatbot.findFirst({ where: { id, workspaceId } });

    if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ chatbot });
  } catch (err) {
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
    const chatbot = await db.chatbot.findFirst({ where: { id, workspaceId } });

    if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.chatbot.update({
      where: { id },
      data: {
        name: data.name ?? chatbot.name,
        description: data.description ?? chatbot.description,
        active: data.active !== undefined ? data.active : chatbot.active,
        flow: data.flow ?? chatbot.flow,
        isDefault: data.isDefault !== undefined ? data.isDefault : chatbot.isDefault,
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
    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const chatbot = await db.chatbot.findFirst({ where: { id, workspaceId } });

    if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.chatbot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}