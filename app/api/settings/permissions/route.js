import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const DEFAULT_PERMISSIONS = {
  supervisor: { inbox: true, contacts: true, broadcasts: true, templates: true, analytics: true, integrations: false, chatbot: true },
  agent:      { inbox: true, contacts: false, broadcasts: false, templates: false, analytics: false, integrations: false, chatbot: false },
};

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let workspace = null;

    if (session.user.role === "owner" || session.user.role === "admin") {
      workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    } else {
      workspace = await db.workspace.findUnique({ where: { id: session.user.workspaceId } });
    }

    if (!workspace) return NextResponse.json({ permissions: DEFAULT_PERMISSIONS });

    const permissions = workspace.permissions || DEFAULT_PERMISSIONS;
    return NextResponse.json({ permissions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { permissions } = await req.json();
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    await db.workspace.update({ where: { id: workspace.id }, data: { permissions } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}