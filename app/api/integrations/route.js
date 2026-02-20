import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const integrations = await db.integration.findMany({
      where: { workspace: { userId: session.user.id } },
    });
    return NextResponse.json(integrations);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await db.workspace.findFirst({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const { provider, enabled, config } = await req.json();
    const integration = await db.integration.upsert({
      where: { workspaceId_provider: { workspaceId: workspace.id, provider } },
      update: { enabled, config },
      create: { workspaceId: workspace.id, provider, enabled, config: config || {} },
    });
    return NextResponse.json(integration);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}