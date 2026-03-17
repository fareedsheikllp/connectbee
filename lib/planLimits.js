import { db } from "@/lib/db";

const PLAN_DEFAULTS = {
  trial:      { conversations: 100,    flows: 1,   agents: 1   },
  starter:    { conversations: 1000,   flows: 3,   agents: 2   },
  growth:     { conversations: 10000,  flows: 10,  agents: 10  },
  enterprise: { conversations: 999999, flows: 999, agents: 999 },
};

export async function getPlanLimits(planKey) {
  try {
    const config = await db.planConfig.findUnique({ where: { planKey } });
    if (config) return config;
  } catch {}
  return PLAN_DEFAULTS[planKey] || PLAN_DEFAULTS.starter;
}

export async function checkConversationLimit(workspaceId) {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { user: { select: { plan: true, conversationsUsed: true } } },
  });
  if (!workspace) return { allowed: false, reason: "Workspace not found" };

  const plan = workspace.plan?.toLowerCase() || workspace.user?.plan || "starter";
  const limits = await getPlanLimits(plan);
  const used = workspace.user?.conversationsUsed ?? 0;

  if (limits.conversations >= 999999) return { allowed: true };
  if (used >= limits.conversations) {
    return { allowed: false, reason: `Conversation limit reached (${used}/${limits.conversations}) for ${plan} plan` };
  }
  return { allowed: true };
}

export async function incrementConversationsUsed(workspaceId) {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { userId: true },
  });
  if (!workspace?.userId) return;
  await db.user.update({
    where: { id: workspace.userId },
    data: { conversationsUsed: { increment: 1 } },
  });
}

export async function checkFlowLimit(workspaceId) {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      user: { select: { plan: true } },
      _count: { select: { chatbots: true } },
    },
  });
  if (!workspace) return { allowed: false, reason: "Workspace not found" };

  const plan = workspace.plan?.toLowerCase() || workspace.user?.plan || "starter";
  const limits = await getPlanLimits(plan);
  const used = workspace._count?.chatbots ?? 0;

  if (limits.flows >= 999) return { allowed: true };
  if (used >= limits.flows) {
    return { allowed: false, reason: `Chatbot flow limit reached (${used}/${limits.flows}) for ${plan} plan` };
  }
  return { allowed: true };
}