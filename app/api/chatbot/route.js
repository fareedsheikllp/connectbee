import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const workspace = { id: workspaceId };
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const chatbots = await db.chatbot.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ chatbots });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let workspaceId = session.user.workspaceId;
    if (session.user.role === "owner" || session.user.role === "admin") {
      const ws = await db.workspace.findUnique({ where: { userId: session.user.id } });
      workspaceId = ws?.id ?? null;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const workspace = { id: workspaceId };

    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    const planKey = user?.plan || "trial";
    console.log("USER PLAN:", planKey);

    const planConfig = await db.planConfig.findUnique({ where: { planKey } });
    console.log("PLAN CONFIG:", planConfig);

    const flowLimit = planConfig?.flows ?? 1;
    console.log("FLOW LIMIT:", flowLimit);

    const existingCount = await db.chatbot.count({ where: { workspaceId: workspace.id } });
    console.log("EXISTING COUNT:", existingCount);

    if (flowLimit < 999999) {
      if (existingCount >= flowLimit) {
        return NextResponse.json(
          { error: `Your ${planKey} plan allows a maximum of ${flowLimit} chatbot flow${flowLimit === 1 ? "" : "s"}. Upgrade your plan to create more.` },
          { status: 403 }
        );
      }
    }

    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const chatbot = await db.chatbot.create({
      data: { workspaceId: workspace.id, name, description: description || "", flow: { nodes: [] }, active: false },
    });

    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (err) {
    console.error("CHATBOT POST ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}