import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import pkg from "@/lib/db/index.js";
const { db: prisma } = pkg;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const DEFAULTS = [
  { planKey: "trial",      label: "Trial",      priceLabel: "Free",       price: 0,      conversations: 100,   flows: 1,   agents: 1,   channels: 1   },
  { planKey: "starter",    label: "Starter",    priceLabel: "$99.99/mo",  price: 99.99,  conversations: 1000,  flows: 3,   agents: 2,   channels: 2   },
  { planKey: "growth",     label: "Growth",     priceLabel: "$149.99/mo", price: 149.99, conversations: 10000, flows: 10,  agents: 10,  channels: 5   },
  { planKey: "enterprise", label: "Enterprise", priceLabel: "Custom",     price: 0,      conversations: 999999, flows: 999, agents: 999, channels: 999 },
];

async function isAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

// GET — fetch all plan configs (seed defaults if empty)
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let plans = await prisma.planConfig.findMany({ orderBy: { price: "asc" } });

    if (plans.length === 0) {
      await prisma.planConfig.createMany({ data: DEFAULTS });
      plans = await prisma.planConfig.findMany({ orderBy: { price: "asc" } });
    }

    return NextResponse.json({ plans });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — update a plan config
export async function PATCH(request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planKey, price, conversations, flows, agents, priceLabel } = await request.json();

    const updated = await prisma.planConfig.update({
      where: { planKey },
      data: {
        price:         parseFloat(price),
        priceLabel:    priceLabel,
        conversations: parseInt(conversations),
        flows:         parseInt(flows),
        agents:        parseInt(agents),
        channels:      parseInt(channels || 999),
      },
    });

    return NextResponse.json({ plan: updated, success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}