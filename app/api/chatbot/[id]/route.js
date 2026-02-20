import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const chatbot = await db.chatbot.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
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
    const chatbot = await db.chatbot.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.chatbot.update({
      where: { id },
      data: {
        name: data.name ?? chatbot.name,
        description: data.description ?? chatbot.description,
        active: data.active !== undefined ? data.active : chatbot.active,
        flow: data.flow ?? chatbot.flow,
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
    const chatbot = await db.chatbot.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!chatbot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.chatbot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}