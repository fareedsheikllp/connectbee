import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
import bcrypt from "bcryptjs";

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
  if (!["owner", "admin", "supervisor"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { channels: { include: { channel: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const workspaceId = await getWorkspaceId(session);
  if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_email: { workspaceId, email } },
  });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  // Check agent limit
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  const planConfig = await prisma.planConfig.findUnique({ where: { planKey: workspace?.plan?.toLowerCase() || "trial" } });
  const currentMembers = await prisma.workspaceMember.count({ where: { workspaceId, isActive: true } });
  if (planConfig && currentMembers >= planConfig.agents) {
    return NextResponse.json({ error: `Your plan allows a maximum of ${planConfig.agents} agents. Upgrade to add more.` }, { status: 403 });
  }
  const hashed = await bcrypt.hash(password, 10);

  const member = await prisma.workspaceMember.create({
    data: { workspaceId, name, email, password: hashed, role: role.toUpperCase() },
  });

  return NextResponse.json({ member }, { status: 201 });
}