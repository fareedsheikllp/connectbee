import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    let workspaceId = session.user.workspaceId;

    // Owner/admin — get workspaceId from their user record
    if (role === "owner" || role === "admin") {
      const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
      if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
      workspaceId = workspace.id;
    }

    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    let where = { workspaceId };
    if (role === "agent") {
      where = {
        ...where,
        conversationChannels: { some: { assignedTo: session.user.memberId } },
      };
    }


    const conversations = await db.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        contact: {
          select: {
            id: true, name: true, phone: true, avatar: true, subscribed: true,
            groupMembers: { select: { group: { select: { id: true, name: true, channel: { select: { id: true, name: true, color: true } } } } } },
          }
        },
        conversationChannels: {
          include: {
            channel: { select: { id: true, name: true, color: true } },
            assignedMember: { select: { id: true, name: true, role: true } },
          }
        },
        channel: { select: { id: true, name: true, color: true } },
        assignedMember: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}