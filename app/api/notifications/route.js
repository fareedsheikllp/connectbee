import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getWorkspaceId(session) {
  if (session.user.role === "owner" || session.user.role === "admin") {
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

// GET — fetch unread notifications for current user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ notifications: [] });

  const memberId = session.user.memberId ?? null;
  const role = session.user.role;

  // Owner sees workspace-level notifications (memberId null)
  // Members see their own notifications
  const where = role === "owner" || role === "admin"
    ? { workspaceId, memberId: null }
    : { workspaceId, memberId };

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH — mark all as read
export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ success: true });

  const memberId = session.user.memberId ?? null;
  const role = session.user.role;

  const where = role === "owner" || role === "admin"
    ? { workspaceId, memberId: null }
    : { workspaceId, memberId };

  await db.notification.updateMany({ where, data: { read: true } });

  return NextResponse.json({ success: true });
}