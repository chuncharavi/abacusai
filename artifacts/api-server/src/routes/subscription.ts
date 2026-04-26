import crypto from "crypto";
import { Router } from "express";
import type { IRouter } from "express";
import Razorpay from "razorpay";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { CreateSubscriptionBody, VerifyPaymentBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PLAN_PRICES: Record<string, Record<string, number>> = {
  STAR: { monthly: 39900, yearly: 349900 },
};

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
  }
  return new Razorpay({ key_id, key_secret });
}

router.get("/v1/subscription/status", authMiddleware, async (req, res): Promise<void> => {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .limit(1);

  if (!subscription) {
    res.json({ plan: "FREE", status: "ACTIVE", startDate: new Date().toISOString(), endDate: null });
    return;
  }

  const now = new Date();
  if (subscription.endDate && subscription.endDate < now && subscription.status === "ACTIVE") {
    await db
      .update(subscriptionsTable)
      .set({ status: "EXPIRED", plan: "FREE" })
      .where(eq(subscriptionsTable.id, subscription.id));
    res.json({ plan: "FREE", status: "EXPIRED", startDate: subscription.startDate.toISOString(), endDate: subscription.endDate.toISOString() });
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

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${req.user!.id.slice(0, 8)}_${Date.now()}`,
      notes: { plan, billingCycle, userId: req.user!.id },
    });

    logger.info({ plan, billingCycle, amount, orderId: order.id }, "Razorpay order created");

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create Razorpay order");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/v1/subscription/verify", authMiddleware, async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan, billingCycle } = parsed.data;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    res.status(500).json({ error: "Payment verification not configured" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    logger.warn({ razorpay_order_id, razorpay_payment_id }, "Invalid Razorpay signature — possible tampering");
    res.status(400).json({ error: "Payment verification failed: invalid signature" });
    return;
  }

  const endDate = new Date();
  if (billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptionsTable)
      .set({ plan: "STAR", status: "ACTIVE", endDate, razorpaySubId: razorpay_payment_id })
      .where(eq(subscriptionsTable.userId, req.user!.id));
  } else {
    await db.insert(subscriptionsTable).values({
      userId: req.user!.id,
      plan: "STAR",
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      razorpaySubId: razorpay_payment_id,
    });
  }

  logger.info({ userId: req.user!.id, plan, billingCycle, razorpay_payment_id }, "Subscription activated");
  res.json({ success: true, plan: "STAR" });
});

router.post("/v1/subscription/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers["x-razorpay-signature"] as string;
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (signature !== expectedSig) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
  }
  logger.info({ event: req.body?.event }, "Razorpay webhook received");
  res.json({ success: true });
});

router.post("/v1/subscription/cancel", authMiddleware, async (req, res): Promise<void> => {
  await db
    .update(subscriptionsTable)
    .set({ status: "CANCELLED", plan: "FREE" })
    .where(eq(subscriptionsTable.userId, req.user!.id));

  res.json({ plan: "FREE", status: "CANCELLED", startDate: new Date().toISOString(), endDate: null });
});

export default router;
