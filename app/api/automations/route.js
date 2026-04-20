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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const automations = await db.automation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ automations });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspaceId = await getWorkspaceId(session);
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const body = await req.json();
    const { name, trigger, delayHours, keyword, channelId, conditions, actions } = body;

    if (!name || !trigger || !actions?.length) {
      return NextResponse.json({ error: "Name, trigger and actions are required" }, { status: 400 });
    }

    const automation = await db.automation.create({
      data: {
        workspaceId,
        name,
        trigger,
        delayHours: delayHours ? parseInt(delayHours) : null,
        keyword: keyword || null,
        channelId: channelId || null,
        conditions: conditions || {},
        actions,
      },
    });
    return NextResponse.json({ automation }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}