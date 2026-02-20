import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const chatbots = await db.chatbot.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ chatbots });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const chatbot = await db.chatbot.create({
      data: { workspaceId: workspace.id, name, description: description || "", flow: { nodes: [] }, active: false },
    });
    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
