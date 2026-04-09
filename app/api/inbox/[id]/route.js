import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const role = session.user.role;

    let workspaceId = session.user.workspaceId;
    if (role === "owner" || role === "admin") {
      const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
      if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
      workspaceId = workspace.id;
    }

    const conversation = await db.conversation.findFirst({
      where: { id, workspaceId },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { status, priority, labels, dueAt, assignedTo, channelId, channelIds } = await req.json();

    // Agents can't change priority or assign
    if (role === "agent" && (priority !== undefined || assignedTo !== undefined || channelId !== undefined)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (channelIds !== undefined) {
      await db.conversationChannel.deleteMany({ where: { conversationId: id } });
      if (channelIds.length > 0) {
        await db.conversationChannel.createMany({
          data: channelIds.map(cid => ({ conversationId: id, channelId: cid })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await db.conversation.update({
      where: { id },
      data: {
        ...(status     !== undefined && { status }),
        ...(priority   !== undefined && { priority }),
        ...(labels     !== undefined && { labels }),
        ...(dueAt      !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
        ...(channelId  !== undefined && { channelId: channelId || null }),
      },
      include: {
        assignedMember: { select: { id: true, name: true } },
        channel: { select: { id: true, name: true, color: true } },
        conversationChannels: { include: { channel: { select: { id: true, name: true, color: true } } } },
      },
    });
// Notify assigned agent
if (assignedTo && assignedTo !== conversation.assignedTo) {
  try {
    await db.notification.create({
      data: {
        workspaceId,
        memberId: assignedTo,
        type: "assigned",
        title: "Conversation assigned to you",
        body: `You have a new conversation assigned`,
        conversationId: id,
      },
    });
  } catch (e) { console.error("Assignment notification error:", e.message); }
}

// Notify supervisors in the channel when channel is assigned
if (channelId && channelId !== conversation.channelId) {
  try {
    const channelMembers = await db.channelMember.findMany({
      where: { channelId },
      include: { member: { select: { id: true, role: true } } },
    });
    const supervisors = channelMembers.filter(cm => cm.member.role === "SUPERVISOR");
    if (supervisors.length > 0) {
      await db.notification.createMany({
        data: supervisors.map(cm => ({
          workspaceId,
          memberId: cm.member.id,
          type: "new_conversation",
          title: "New conversation in your channel",
          body: `A conversation was assigned to your channel`,
          conversationId: id,
        })),
      });
    }
  } catch (e) { console.error("Channel notification error:", e.message); }
}
    return NextResponse.json({ conversation: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}