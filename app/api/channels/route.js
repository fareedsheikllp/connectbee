import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";

const { db: prisma } = pkg;

async function getWorkspaceId(session) {
  const role = session.user.role;
  if (role === "owner" || role === "admin") {
    const workspace = await prisma.workspace.findUnique({ where: { userId: session.user.id } });
    return workspace?.id ?? null;
  }
  return session.user.workspaceId ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const channels = await prisma.channel.findMany({
    where: { workspaceId },
    include: {
      members: { include: { member: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ channels });
}
export async function POST(req) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });
  // Check channel limit
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  const planConfig = await prisma.planConfig.findUnique({ where: { planKey: workspace?.plan?.toLowerCase() || "trial" } });
  const currentChannels = await prisma.channel.count({ where: { workspaceId } });
  if (planConfig && currentChannels >= planConfig.channels) {
    return NextResponse.json({ error: `Your plan allows a maximum of ${planConfig.channels} channels. Upgrade to add more.` }, { status: 403 });
  }
  const { name, description, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const channel = await prisma.channel.create({
    data: { workspaceId, name, description: description || "", color: color || "#6366f1" },
  });

  return NextResponse.json({ channel }, { status: 201 });
}