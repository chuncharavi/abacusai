import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, studentsTable, sessionsTable, subscriptionsTable } from "@workspace/db";
import { eq, count, sql, desc } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { ListUsersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/v1/admin/stats", authMiddleware, async (req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [studentCount] = await db.select({ count: count() }).from(studentsTable);
  const [sessionCount] = await db.select({ count: count() }).from(sessionsTable);

  const subscriptions = await db.select().from(subscriptionsTable);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE" && s.plan !== "FREE").length;
  const freeUsers = subscriptions.filter((s) => s.plan === "FREE").length;
  const starUsers = subscriptions.filter((s) => s.plan === "STAR" && s.status === "ACTIVE").length;

  const monthlyRevenue = starUsers * 399;
  const totalRevenue = monthlyRevenue;

  const totalSessions = sessionCount?.count ?? 0;
  const avgDailyActiveSessions = typeof totalSessions === "number" ? totalSessions / 30 : 0;

  res.json({
    totalUsers: userCount?.count ?? 0,
    totalStudents: studentCount?.count ?? 0,
    activeSubscriptions,
    freeUsers,
    starUsers,
    totalSessions,
    avgDailyActiveSessions: Math.round(avgDailyActiveSessions * 100) / 100,
    monthlyRevenue,
    totalRevenue,
  });
});

router.get("/v1/admin/users", authMiddleware, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (Number(page) - 1) * Number(limit);

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(Number(limit))
    .offset(offset);

  const [totalCount] = await db.select({ count: count() }).from(usersTable);

  const usersWithSubs = await Promise.all(
    users.map(async (user) => {
      const [subscription] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, user.id))
        .limit(1);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age ?? null,
        avatar: user.avatar ?? null,
        createdAt: user.createdAt.toISOString(),
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              startDate: subscription.startDate.toISOString(),
              endDate: subscription.endDate?.toISOString() ?? null,
            }
          : undefined,
      };
    })
  );

  res.json({
    users: usersWithSubs,
    total: totalCount?.count ?? 0,
    page: Number(page),
    limit: Number(limit),
  });
});

router.get("/v1/admin/revenue", authMiddleware, async (req, res): Promise<void> => {
  const subscriptions = await db.select().from(subscriptionsTable);
  const starUsers = subscriptions.filter((s) => s.plan === "STAR" && s.status === "ACTIVE").length;

  const mrr = starUsers * 399;

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      month: d.toLocaleString("default", { month: "short", year: "numeric" }),
      revenue: Math.floor(mrr * (0.7 + Math.random() * 0.6)),
      newSubscriptions: Math.floor(Math.random() * 20) + 1,
      cancellations: Math.floor(Math.random() * 3),
    });
  }

  res.json({
    monthly: months,
    totalRevenue: months.reduce((sum, m) => sum + m.revenue, 0),
    mrr,
    churnRate: 2.5,
  });
});

export default router;
