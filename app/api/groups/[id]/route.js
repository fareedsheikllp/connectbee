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
        channelId: data.channelId !== undefined ? (data.channelId || null) : group.channelId,
      },
    });

const incomingIds = data.contactIds ?? data.memberIds;
if (Array.isArray(incomingIds) && group.channelId) {
  const previousMembers = await db.contactGroupMember.findMany({
    where: { groupId: id },
    select: { contactId: true },
  });
  const previousIds = previousMembers.map(m => m.contactId);

  // Contacts added to group → assign to channel
  const addedContactIds = incomingIds.filter(cid => !previousIds.includes(cid));
  if (addedContactIds.length > 0) {
    const addedConversations = await db.conversation.findMany({
      where: { contactId: { in: addedContactIds }, workspaceId },
      select: { id: true },
    });
    if (addedConversations.length > 0) {
      await db.conversationChannel.createMany({
        data: addedConversations.map(c => ({ conversationId: c.id, channelId: group.channelId })),
        skipDuplicates: true,
      });
    }
  }

  // Contacts removed from group → only remove from channel if not in another group with same channel
    const removedContactIds = previousIds.filter(cid => !incomingIds.includes(cid));
    if (removedContactIds.length > 0) {
      const stillInChannel = await db.contactGroupMember.findMany({
        where: {
          contactId: { in: removedContactIds },
          groupId: { not: id },
          group: { channelId: group.channelId },
        },
        select: { contactId: true },
      });
      const stillInChannelIds = stillInChannel.map(m => m.contactId);
      const safeToRemove = removedContactIds.filter(cid => !stillInChannelIds.includes(cid));

      if (safeToRemove.length > 0) {
        const removedConversations = await db.conversation.findMany({
          where: { contactId: { in: safeToRemove }, workspaceId },
          select: { id: true },
        });
        if (removedConversations.length > 0) {
          await db.conversationChannel.deleteMany({
            where: {
              conversationId: { in: removedConversations.map(c => c.id) },
              channelId: group.channelId,
            },
          });
        }
      }
    }
  }

if (Array.isArray(incomingIds)) {
  await db.contactGroupMember.deleteMany({ where: { groupId: id } });
  if (incomingIds.length > 0) {
    await db.contactGroupMember.createMany({
      data: incomingIds.map((contactId) => ({ groupId: id, contactId })),
      skipDuplicates: true,
    });
  }
}

// Sync existing conversations when channel changes
if (data.channelId !== undefined && data.channelId !== group.channelId) {
  const groupMembers = await db.contactGroupMember.findMany({
    where: { groupId: id },
    select: { contactId: true },
  });
  const contactIds = groupMembers.map(m => m.contactId);
  const conversations = await db.conversation.findMany({
    where: { contactId: { in: contactIds }, workspaceId },
    select: { id: true },
  });

  if (conversations.length > 0) {
    // Remove old channel assignment if there was one
    if (group.channelId) {
      const stillInOldChannel = await db.contactGroupMember.findMany({
        where: {
          contactId: { in: contactIds },
          groupId: { not: id },
          group: { channelId: group.channelId },
        },
        select: { contactId: true },
      });
      const stillInOldChannelIds = stillInOldChannel.map(m => m.contactId);
      const safeToRemoveFromOld = contactIds.filter(cid => !stillInOldChannelIds.includes(cid));
      if (safeToRemoveFromOld.length > 0) {
        const safeConvs = await db.conversation.findMany({
          where: { contactId: { in: safeToRemoveFromOld }, workspaceId },
          select: { id: true },
        });
        if (safeConvs.length > 0) {
          await db.conversationChannel.deleteMany({
            where: {
              conversationId: { in: safeConvs.map(c => c.id) },
              channelId: group.channelId,
            },
          });
        }
      }
    }
    // Add new channel assignment if one was selected
    if (data.channelId) {
      await db.conversationChannel.createMany({
        data: conversations.map(c => ({
          conversationId: c.id,
          channelId: data.channelId,
        })),
        skipDuplicates: true,
      });
    }
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

if (group.channelId) {
  const members = await db.contactGroupMember.findMany({
    where: { groupId: id },
    select: { contactId: true },
  });
  const contactIds = members.map(m => m.contactId);

  const stillInChannel = await db.contactGroupMember.findMany({
    where: {
      contactId: { in: contactIds },
      groupId: { not: id },
      group: { channelId: group.channelId },
    },
    select: { contactId: true },
  });
  const stillInChannelIds = stillInChannel.map(m => m.contactId);
  const safeToRemove = contactIds.filter(cid => !stillInChannelIds.includes(cid));

  if (safeToRemove.length > 0) {
    const conversations = await db.conversation.findMany({
      where: { contactId: { in: safeToRemove }, workspaceId },
      select: { id: true },
    });
    if (conversations.length > 0) {
      await db.conversationChannel.deleteMany({
        where: {
          conversationId: { in: conversations.map(c => c.id) },
          channelId: group.channelId,
        },
      });
    }
  }
}
await db.contactGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}