import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
const { db: prisma } = pkg;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const PLAN_MAP = {
  trial: "TRIAL",
  starter: "STARTER",
  growth: "GROWTH",
  enterprise: "ENTERPRISE",
};

async function isAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

// GET single client
export async function GET(request, { params }) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        status: true,
        createdAt: true,
        conversationsUsed: true,
        workspace: {
          select: {
            id: true,
            name: true,
            plan: true,
            waVerified: true,
            waPhoneNumberId: true,
            twilioAccountSid: true,
            twilioAuthToken: true,
            twilioPhoneNumber: true,
            _count: {
              select: {
                contacts: true,
                chatbots: true,
                conversations: true,
                broadcasts: true,
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({
      client: {
        id: user.id,
        email: user.email,
        name: user.name || user.workspace?.name || null,
        plan: user.workspace?.plan?.toLowerCase() || user.plan || "starter",
        status: user.status || "active",
        conversationsUsed: user.conversationsUsed ?? 0,
        createdAt: user.createdAt,
        workspaceId: user.workspace?.id || null,
        waVerified: user.workspace?.waVerified || false,
        waPhoneNumberId: user.workspace?.waPhoneNumberId || null,
        contactsCount: user.workspace?._count?.contacts ?? 0,
        flowsCount: user.workspace?._count?.chatbots ?? 0,
        conversationsCount: user.workspace?._count?.conversations ?? 0,
        broadcastsCount: user.workspace?._count?.broadcasts ?? 0,
        twilioAccountSid:  user.workspace?.twilioAccountSid  || null,
        twilioAuthToken:   user.workspace?.twilioAuthToken   || null,
        twilioPhoneNumber: user.workspace?.twilioPhoneNumber || null,
      },
    });
  } catch (error) {
    console.error("Admin client fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — update plan and/or status
export async function PATCH(request, { params }) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { plan, status, twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = await request.json();

  if (plan && !PLAN_MAP[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const userUpdate = {};
    if (plan) userUpdate.plan = plan;
    if (status) userUpdate.status = status;

    await prisma.user.update({ where: { id }, data: userUpdate });

    // Also update Workspace.plan enum
const workspace = await prisma.workspace.findUnique({ where: { userId: id } });
if (workspace) {
  await prisma.workspace.update({
    where: { userId: id },
    data: {
      ...(plan && { plan: PLAN_MAP[plan] }),
      ...(twilioAccountSid  !== undefined && { twilioAccountSid }),
      ...(twilioAuthToken   !== undefined && { twilioAuthToken }),
      ...(twilioPhoneNumber !== undefined && { twilioPhoneNumber }),
    },
  });
}

    return NextResponse.json({ success: true, plan, status });
  } catch (error) {
    console.error("Admin plan update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — permanently delete a client
export async function DELETE(request, { params }) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
