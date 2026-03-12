import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const conversation = await db.conversation.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { sentAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const conversation = await db.conversation.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { content, isInternal } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Message content required" }, { status: 400 });

    const message = await db.message.create({
      data: {
        conversationId: id,
        direction: "OUTBOUND",
        type: "TEXT",
        content: content.trim(),
        status: "SENT",
        isInternal: isInternal || false,
      },
    });
    await db.conversation.update({
      where: { id },
      data: { lastMessage: content.trim(), updatedAt: new Date() },
    });

    // Send via WhatsApp
    const contact = await db.contact.findFirst({
      where: { id: conversation.contactId },
    });
    if (!isInternal && contact?.phone) {
      await sendWhatsApp(contact.phone, content.trim());
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}