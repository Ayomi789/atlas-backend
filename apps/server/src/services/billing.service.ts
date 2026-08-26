import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import prisma from "../config/db";
import { env } from "../config/env";

export const paddle = new Paddle(env.PADDLE_API_KEY, {
  environment:
    env.PADDLE_ENVIRONMENT === "production"
      ? Environment.production
      : Environment.sandbox,
});

export const PLAN_LIMITS = {
  free: { docs: 50, questionsPerMonth: 100, seats: 3 },
  team: { docs: 5000, questionsPerMonth: 5000, seats: 50 },
  business: { docs: 100000, questionsPerMonth: 100000, seats: 500 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export async function getWorkspacePlan(workspaceId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { plan: true, status: true },
  });
  if (!sub) return "free";
  if (sub.status === "active" || sub.status === "trialing") {
    return sub.plan as Plan;
  }
  return "free";
}

export async function getMonthlyUsage(workspaceId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [questions, docs, members] = await Promise.all([
    prisma.message.count({
      where: {
        role: "user",
        conversation: { workspaceId },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.document.count({ where: { workspaceId } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
  ]);

  return { questions, docs, members, periodStart: startOfMonth };
}

export async function checkQuestionLimit(workspaceId: string) {
  const plan = await getWorkspacePlan(workspaceId);
  const limits = PLAN_LIMITS[plan];
  const usage = await getMonthlyUsage(workspaceId);
  if (usage.questions >= limits.questionsPerMonth) {
    throw new Error(
      `You've reached the ${limits.questionsPerMonth} monthly question limit on the ${plan} plan. Upgrade to keep asking.`
    );
  }
}

export async function checkDocumentLimit(workspaceId: string) {
  const plan = await getWorkspacePlan(workspaceId);
  const limits = PLAN_LIMITS[plan];
  const usage = await getMonthlyUsage(workspaceId);
  if (usage.docs >= limits.docs) {
    throw new Error(
      `You've reached the ${limits.docs} document limit on the ${plan} plan. Upgrade to upload more.`
    );
  }
}

export async function checkSeatLimit(workspaceId: string) {
  const plan = await getWorkspacePlan(workspaceId);
  const limits = PLAN_LIMITS[plan];
  const members = await prisma.workspaceMember.count({
    where: { workspaceId },
  });
  if (members >= limits.seats) {
    throw new Error(
      `You've reached the ${limits.seats} seat limit on the ${plan} plan. Upgrade to add more members.`
    );
  }
}

// Keeps the Paddle subscription quantity in sync with the workspace's member
// count so per-seat billing stays accurate. No-op for free workspaces.
// Returns true if a quantity update was pushed to Paddle.
export async function syncSeats(workspaceId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  if (!sub || !isPaddleSubscriptionId(sub.stripeSubscriptionId)) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;

  const priceId = PRICE_IDS[sub.plan];
  if (!priceId) return false;

  const seats = await prisma.workspaceMember.count({
    where: { workspaceId },
  });
  const quantity = Math.max(seats, 1);
  if (quantity === sub.seats) return false; // nothing changed

  await paddle.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ priceId, quantity }],
    prorationBillingMode: "prorated_immediately",
  });
  // The subscription.updated webhook writes the new seats back to the row.
  return true;
}

// Daily true-up: force every active subscription's quantity back to its real
// member count. Catches admins who reduce seats via the customer portal.
export async function reconcileAllSeats() {
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing"] } },
  });

  const results = {
    checked: subs.length,
    corrected: 0,
    inSync: 0,
    failed: 0,
    details: [] as { workspaceId: string; outcome: string; error?: string }[],
  };

  for (const sub of subs) {
    try {
      const changed = await syncSeats(sub.workspaceId);
      if (changed) {
        results.corrected++;
        results.details.push({
          workspaceId: sub.workspaceId,
          outcome: "quantity corrected to member count",
        });
      } else {
        results.inSync++;
      }
    } catch (e) {
      results.failed++;
      results.details.push({
        workspaceId: sub.workspaceId,
        outcome: "failed",
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return results;
}

const PRICE_IDS: Record<string, string> = {
  team: env.PADDLE_TEAM_PRICE_ID,
  business: env.PADDLE_BUSINESS_PRICE_ID,
};

export async function changePlan(
  workspaceId: string,
  userId: string,
  plan: "team" | "business"
) {
  await assertBillingAccess(workspaceId, userId);
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  if (!sub || !isPaddleSubscriptionId(sub.stripeSubscriptionId)) {
    throw new Error("No active subscription found for this workspace");
  }
  if (sub.status !== "active" && sub.status !== "trialing") {
    throw new Error("Subscription is not active");
  }

  const seats = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  await paddle.subscriptions.update(sub.stripeSubscriptionId, {
    items: [{ priceId: PRICE_IDS[plan], quantity: Math.max(seats, 1) }],
    // Keep customData in sync so webhook fallbacks never see a stale plan.
    customData: { workspaceId, plan },
    prorationBillingMode: "prorated_immediately",
  });
}

// The Subscription table's stripeCustomerId/stripeSubscriptionId columns now
// store Paddle's ctm_/sub_ ids — same columns, no migration needed.

// Paddle Billing ids look like ctm_01.../sub_01...; anything else (e.g. legacy
// Stripe cus_/sub_1... ids) must never reach the Paddle API.
function isPaddleCustomerId(id: string | null | undefined): id is string {
  return !!id && id.startsWith("ctm_01");
}
function isPaddleSubscriptionId(id: string | null | undefined): id is string {
  return !!id && id.startsWith("sub_01");
}

// Only owners and admins may view billing details or trigger billing actions.
async function assertBillingAccess(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (!membership) {
    throw new Error("Workspace not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Only workspace owners and admins can manage billing");
  }
}

// Any member (any role) may view plan/usage for their own workspace.
// Returns the member's role so callers can tailor the UI.
export async function assertWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<string> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (!membership) {
    throw new Error("Workspace not found");
  }
  return membership.role;
}

export async function getCheckoutParams(
  userId: string,
  workspaceId: string,
  plan: "team" | "business"
) {
  await assertBillingAccess(workspaceId, userId);
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw new Error("Workspace not found");

  // Reuse the Paddle customer if one exists (ignore legacy Stripe ids).
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  let customerId = isPaddleCustomerId(existing?.stripeCustomerId)
    ? (existing!.stripeCustomerId as string)
    : undefined;

  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      throw new Error(
        "Your account needs an email address before you can subscribe"
      );
    }

    // Paddle enforces unique customer emails — if this email already has a
    // Paddle customer (e.g. from another workspace), reuse it.
    const matches = await paddle.customers.list({ email: [user.email] });
    for await (const c of matches) {
      customerId = c.id;
      break;
    }

    if (!customerId) {
      const customer = await paddle.customers.create({
        email: user.email,
        name: workspace.name,
        customData: { workspaceId },
      });
      customerId = customer.id;
    }

    await prisma.subscription.upsert({
      where: { workspaceId },
      create: { workspaceId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const seats = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  return { customerId, priceId: PRICE_IDS[plan], quantity: Math.max(seats, 1) };
}


export async function createPortalSession(
  workspaceId: string,
  userId: string
) {
  await assertBillingAccess(workspaceId, userId);
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  if (!sub || !isPaddleCustomerId(sub.stripeCustomerId)) {
    throw new Error("No billing account found for this workspace yet");
  }

  const session = await paddle.customerPortalSessions.create(
    sub.stripeCustomerId,
    [] // all subscriptions included
  );

  return { url: session.urls?.general?.overview ?? null };
}
// export async function createPortalSession(workspaceId: string) {
//   const sub = await prisma.subscription.findUnique({
//     where: { workspaceId },
//   });
//   if (!sub?.stripeCustomerId) {
//     throw new Error("No billing account found for this workspace yet");
//   }

//   const session = await paddle.customerPortalSessions.create({
//     customerId: sub.stripeCustomerId,
//   });

//   return { url: session.urls?.general?.overview ?? session.urls?.general?.view };
// }

export async function handlePaddleEvent(event: {
  eventType: string;
  data: any;
}) {
  switch (event.eventType) {
    case "subscription.created":
    case "subscription.activated":
    case "subscription.resumed":
    case "subscription.updated": {
      const d = event.data;
      const workspaceId = d.customData?.workspaceId;
      if (!workspaceId) break;

      // Resolve plan from the price ID first, fall back to checkout customData.
      const priceId = d.items?.[0]?.price?.id;
      const plan =
        Object.entries(PRICE_IDS).find(([, id]) => id === priceId)?.[0] ??
        (d.customData?.plan === "business" ? "business" : "team");
      const quantity = d.items?.[0]?.quantity ?? 1;
      const periodEnd = d.currentBillingPeriod?.endsAt
        ? new Date(d.currentBillingPeriod.endsAt)
        : null;
      const status = ["active", "trialing", "past_due"].includes(d.status)
        ? d.status
        : "canceled";

      // A late subscription.updated for a canceled sub must converge to the
      // same state as subscription.canceled (events can arrive together).
      if (status === "canceled") {
        await prisma.subscription.updateMany({
          where: { workspaceId },
          data: {
            plan: "free",
            status: "canceled",
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        });
        break;
      }

      await prisma.subscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          plan,
          status,
          seats: quantity,
          stripeCustomerId: d.customerId,
          stripeSubscriptionId: d.id,
          ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        },
        update: {
          plan,
          status,
          seats: quantity,
          stripeCustomerId: d.customerId,
          stripeSubscriptionId: d.id,
          ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        },
      });

      // Portal self-service lets admins reduce their seat quantity below the
      // real member count. Correct it immediately — syncSeats no-ops when the
      // quantity already matches, so this can't loop.
      if (status === "active" || status === "trialing") {
        await syncSeats(workspaceId).catch((e) =>
          console.error("Seat sync after webhook failed:", e.message)
        );
      }
      break;
    }

    case "subscription.canceled": {
      const d = event.data;
      const workspaceId = d.customData?.workspaceId;
      if (!workspaceId) break;

      // updateMany, not update: the row may not exist yet if earlier events failed.
      await prisma.subscription.updateMany({
        where: { workspaceId },
        data: {
          plan: "free",
          status: "canceled",
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        },
      });
      break;
    }
  }
}