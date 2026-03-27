import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

async function getWorkspaceId(session) {
  const role = session.user.role;
  if (role === "owner" || role === "admin") {
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

export async function GET(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // Find the conversation first, then verify the user has access to it
    const conversation = await db.conversation.findUnique({
      where: { id },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Resolve the workspaceId from session
    const role = session.user.role;
    let workspaceId = session.user.workspaceId;
    if (role === "owner" || role === "admin") {
      const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = workspace?.id ?? null;
    }

    // Make sure the conversation belongs to this user's workspace
    if (conversation.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await db.message.findMany({
      where: { conversationId: id, NOT: { status: "FAILED" } },
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
    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const conversation = await db.conversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.workspaceId !== workspaceId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const workspace = await db.workspace.findUnique({
      where: { id: conversation.workspaceId },
      select: { id: true, twilioAccountSid: true, twilioAuthToken: true, twilioPhoneNumber: true },
    });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { content, isInternal } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Message content required" }, { status: 400 });

    const contact = await db.contact.findFirst({
      where: { id: conversation.contactId },
    });

    if (!isInternal && contact?.phone) {
      const creds = workspace.twilioAccountSid ? {
        accountSid:  workspace.twilioAccountSid,
        authToken:   workspace.twilioAuthToken,
        phoneNumber: workspace.twilioPhoneNumber,
      } : null;
      const result = await sendWhatsApp(contact.phone, content.trim(), null, null, creds);
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? "Failed to send WhatsApp message" }, { status: 500 });
      }
    }

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

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}