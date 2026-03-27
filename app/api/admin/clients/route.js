import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
const { db: prisma } = pkg;
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function isAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

// GET — fetch all clients
export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { email: { not: ADMIN_EMAIL } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        status: true,
        conversationsUsed: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            plan: true,
            waVerified: true,
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

    const clients = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || u.workspace?.name || null,
      plan: u.workspace?.plan?.toLowerCase() || u.plan || "starter",
      status: u.status || "active",
      conversationsUsed: u.workspace?._count?.conversations ?? 0,
      createdAt: u.createdAt,
      workspaceId: u.workspace?.id || null,
      waVerified: u.workspace?.waVerified || false,
      contactsCount: u.workspace?._count?.contacts ?? 0,
      flowsCount: u.workspace?._count?.chatbots ?? 0,
      conversationsCount: u.workspace?._count?.conversations ?? 0,
      broadcastsCount: u.workspace?._count?.broadcasts ?? 0,
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Admin clients fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — create a new client account
export async function POST(request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, plan, twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const PLAN_MAP = { starter: "STARTER", growth: "GROWTH", enterprise: "ENTERPRISE", trial: "TRIAL" };

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email: email.toLowerCase(),
        password: hashed,
        plan: plan || "starter",
        status: "active",
        workspace: {
          create: {
            name: name || email.split("@")[0],
            slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Date.now(),
            plan: PLAN_MAP[plan] || "STARTER",
            twilioAccountSid:  twilioAccountSid  || null,
            twilioAuthToken:   twilioAuthToken   || null,
            twilioPhoneNumber: twilioPhoneNumber || null,
          },
        },
      },
      select: { id: true, email: true, name: true, plan: true, status: true, createdAt: true },
    });

    return NextResponse.json({ user, success: true }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
