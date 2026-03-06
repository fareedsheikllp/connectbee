import { NextResponse } from "next/server";
import pkg from "@/lib/db/index.js";
const { db: prisma } = pkg;

const DEFAULTS = [
  { planKey: "trial",      label: "Trial",      priceLabel: "Free",       price: 0,      conversations: 100,   flows: 1,   agents: 1   },
  { planKey: "starter",    label: "Starter",    priceLabel: "$99.99/mo",  price: 99.99,  conversations: 1000,  flows: 3,   agents: 2   },
  { planKey: "growth",     label: "Growth",     priceLabel: "$149.99/mo", price: 149.99, conversations: 10000, flows: 10,  agents: 10  },
  { planKey: "enterprise", label: "Enterprise", priceLabel: "Custom",     price: 0,      conversations: 999999,flows: 999, agents: 999 },
];

export async function GET() {
  try {
    let plans = await prisma.planConfig.findMany({ orderBy: { price: "asc" } });
    if (plans.length === 0) {
      await prisma.planConfig.createMany({ data: DEFAULTS });
      plans = await prisma.planConfig.findMany({ orderBy: { price: "asc" } });
    }
    // Return as object keyed by planKey for easy lookup
    const planMap = Object.fromEntries(plans.map(p => [p.planKey, p]));
    return NextResponse.json({ plans: planMap });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}