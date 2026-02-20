import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const templates = await db.template.findMany({
      where: { workspace: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
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
    const { name, body, category, tags } = await req.json();
    if (!name || !body) return NextResponse.json({ error: "Name and body required" }, { status: 400 });
    const template = await db.template.create({
      data: { workspaceId: workspace.id, name, body, category: category || "General", tags: tags || [] },
    });
    return NextResponse.json(template);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}