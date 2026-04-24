import { Router } from "express";
import type { IRouter } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { CreateSubscriptionBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PLAN_PRICES: Record<string, Record<string, number>> = {
  STAR: { monthly: 39900, yearly: 349900 },
};

router.get("/v1/subscription/status", authMiddleware, async (req, res): Promise<void> => {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .limit(1);

  if (!subscription) {
    res.json({
      plan: "FREE",
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      endDate: null,
    });
    return;
  }

  const now = new Date();
  if (
    subscription.endDate &&
    subscription.endDate < now &&
    subscription.status === "ACTIVE"
  ) {
    await db
      .update(subscriptionsTable)
      .set({ status: "EXPIRED", plan: "FREE" })
      .where(eq(subscriptionsTable.id, subscription.id));

    res.json({
      plan: "FREE",
      status: "EXPIRED",
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
    });
    return;
  }

  res.json({
    plan: subscription.plan,
    status: subscription.status,
    startDate: subscription.startDate.toISOString(),
    endDate: subscription.endDate?.toISOString() ?? null,
  });
});

router.post("/v1/subscription/create", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { plan, billingCycle } = parsed.data;
  const amount = PLAN_PRICES[plan]?.[billingCycle] ?? 39900;
  const keyId = process.env.RAZORPAY_KEY_ID ?? "rzp_test_placeholder";

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info({ plan, billingCycle, amount, orderId }, "Subscription order created");

  res.json({
    orderId,
    amount,
    currency: "INR",
    keyId,
  });
});

router.post("/v1/subscription/webhook", async (req, res): Promise<void> => {
  logger.info({ body: req.body }, "Razorpay webhook received");
  res.json({ success: true });
});

router.post("/v1/subscription/cancel", authMiddleware, async (req, res): Promise<void> => {
  await db
    .update(subscriptionsTable)
    .set({ status: "CANCELLED" })
    .where(eq(subscriptionsTable.userId, req.user!.id));

  res.json({
    plan: "FREE",
    status: "CANCELLED",
    startDate: new Date().toISOString(),
    endDate: null,
  });
});

export default router;
