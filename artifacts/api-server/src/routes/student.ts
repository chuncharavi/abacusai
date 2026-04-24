import { Router } from "express";
import type { IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { db, usersTable, studentsTable, sessionsTable, subscriptionsTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import {
  StartSessionBody,
  CompleteSessionBody,
  ListSessionsQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

function getAnthropicClient() {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return new Anthropic({ apiKey, baseURL });
}

async function generateProblemsWithAI(level: number, count: number, studentAge: number, recentAccuracy: number): Promise<ReturnType<typeof generateProblems>> {
  const client = getAnthropicClient();
  if (!client) return generateProblems(level, count);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Generate exactly ${count} abacus math problems for a Level ${level} student aged ${studentAge}. Their recent accuracy is ${recentAccuracy}%. Level guide: L1=single digits (show number on abacus), L2=single-digit addition, L3=double-digit addition/subtraction, L4=multi-digit addition/subtraction, L5=multiplication/division. Make problems appropriate to the abacus bead method. Return ONLY a JSON array, no markdown: [{"question":"...","answer":0,"hint":"which beads to move","difficulty":"easy|medium|hard"}]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    logger.warn({ err }, "AI problem generation failed, using static fallback");
  }
  return generateProblems(level, count);
}

const router: IRouter = Router();

router.get("/v1/student/dashboard", authMiddleware, async (req, res): Promise<void> => {
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, req.user!.id))
    .limit(1);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .limit(1);

  const plan = subscription?.plan ?? "FREE";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.studentId, student.id),
        gte(sessionsTable.createdAt, sevenDaysAgo)
      )
    )
    .orderBy(desc(sessionsTable.createdAt))
    .limit(10);

  const weeklyAccuracy =
    recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
      : 0;

  const now = new Date();
  const resetAt = student.sessionsResetAt;
  const isNewDay =
    !resetAt ||
    now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
    now.getUTCMonth() !== resetAt.getUTCMonth() ||
    now.getUTCDate() !== resetAt.getUTCDate();

  let todaySessions = student.sessionsToday;
  if (isNewDay) {
    todaySessions = 0;
    await db
      .update(studentsTable)
      .set({ sessionsToday: 0, sessionsResetAt: now })
      .where(eq(studentsTable.id, student.id));
  }

  const maxSessionsToday = plan === "FREE" ? 5 : 9999;
  const canStartSession = todaySessions < maxSessionsToday;

  res.json({
    student: {
      id: student.id,
      userId: student.userId,
      name: user?.name ?? "Student",
      level: student.level,
      xp: student.xp,
      streak: student.streak,
      lastActive: student.lastActive.toISOString(),
    },
    todaySessions,
    maxSessionsToday,
    weeklyAccuracy: Math.round(weeklyAccuracy * 100) / 100,
    totalXp: student.xp,
    level: student.level,
    streak: student.streak,
    badges: (student.badges as string[]) || [],
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      level: s.level,
      score: s.score,
      accuracy: s.accuracy,
      duration: s.duration,
      hintsUsed: s.hintsUsed,
      createdAt: s.createdAt.toISOString(),
    })),
    planName: plan,
    canStartSession,
  });
});

router.get("/v1/student/progress", authMiddleware, async (req, res): Promise<void> => {
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, req.user!.id))
    .limit(1);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.studentId, student.id))
    .orderBy(desc(sessionsTable.createdAt));

  const recentSessions = allSessions.filter(
    (s) => s.createdAt >= thirtyDaysAgo
  );

  const dailyMap = new Map<string, { accuracy: number[]; sessions: number }>();
  for (const session of recentSessions) {
    const date = session.createdAt.toISOString().split("T")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { accuracy: [], sessions: 0 });
    }
    const entry = dailyMap.get(date)!;
    entry.accuracy.push(session.accuracy);
    entry.sessions += 1;
  }

  const dailyAccuracy = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      accuracy: Math.round(
        (data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length) * 100
      ) / 100,
      sessions: data.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const levelMap = new Map<number, { sessions: number; accuracy: number[] }>();
  for (const session of allSessions) {
    if (!levelMap.has(session.level)) {
      levelMap.set(session.level, { sessions: 0, accuracy: [] });
    }
    const entry = levelMap.get(session.level)!;
    entry.sessions += 1;
    entry.accuracy.push(session.accuracy);
  }

  const levelProgress = Array.from(levelMap.entries()).map(([level, data]) => ({
    level,
    sessionsCompleted: data.sessions,
    avgAccuracy: Math.round(
      (data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length) * 100
    ) / 100,
  }));

  const totalSessions = allSessions.length;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(
          (allSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions) * 100
        ) / 100
      : 0;
  const avgDuration =
    totalSessions > 0
      ? Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions)
      : 0;
  const hintsUsedTotal = allSessions.reduce((sum, s) => sum + s.hintsUsed, 0);

  res.json({
    dailyAccuracy,
    levelProgress,
    totalSessions,
    avgAccuracy,
    avgDuration,
    hintsUsedTotal,
    strongAreas: student.level >= 3 ? ["Addition", "Subtraction"] : ["Bead Recognition"],
    weakAreas: ["Multi-digit Operations"],
  });
});

router.post("/v1/student/session/start", authMiddleware, async (req, res): Promise<void> => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { level } = parsed.data;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, req.user!.id))
    .limit(1);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  const plan = req.user!.plan;
  const maxSessionsToday = plan === "FREE" ? 5 : 9999;

  const now = new Date();
  const resetAt = student.sessionsResetAt;
  const isNewDay =
    !resetAt ||
    now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
    now.getUTCMonth() !== resetAt.getUTCMonth() ||
    now.getUTCDate() !== resetAt.getUTCDate();

  let todaySessions = isNewDay ? 0 : student.sessionsToday;

  if (todaySessions >= maxSessionsToday) {
    res.status(403).json({
      upgrade: true,
      message: "Unlock unlimited sessions with AbacusAI Star - ₹399/month",
      requiredPlan: "STAR",
    });
    return;
  }

  if (level > 2 && plan === "FREE") {
    res.status(403).json({
      upgrade: true,
      message: "Unlock all 5 levels with AbacusAI Star - ₹399/month",
      requiredPlan: "STAR",
    });
    return;
  }

  // For STAR plan: use AI-generated problems personalized to student's performance
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const recentSessions = await db.select().from(sessionsTable).where(eq(sessionsTable.studentId, student.id)).orderBy(desc(sessionsTable.createdAt)).limit(5);
  const recentAccuracy = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
    : 50;

  const problems = plan === "STAR"
    ? await generateProblemsWithAI(level, 10, user?.age ?? 10, Math.round(recentAccuracy))
    : generateProblems(level, 10);

  const [session] = await db
    .insert(sessionsTable)
    .values({
      studentId: student.id,
      level,
      score: 0,
      accuracy: 0,
      duration: 0,
      problems: [],
      hintsUsed: 0,
    })
    .returning();

  await db
    .update(studentsTable)
    .set({
      sessionsToday: todaySessions + 1,
      sessionsResetAt: isNewDay ? now : undefined,
      lastActive: now,
    })
    .where(eq(studentsTable.id, student.id));

  res.status(201).json({
    sessionId: session.id,
    problems,
    level,
    difficulty: "medium",
  });
});

router.post("/v1/student/session/complete", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CompleteSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, problems, duration, hintsUsed } = parsed.data;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, req.user!.id))
    .limit(1);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  const correct = problems.filter((p) => p.correct).length;
  const accuracy = problems.length > 0 ? (correct / problems.length) * 100 : 0;
  const score = correct;

  await db
    .update(sessionsTable)
    .set({
      score,
      accuracy,
      duration,
      problems,
      hintsUsed,
    })
    .where(eq(sessionsTable.id, sessionId));

  let xpEarned = 10;
  if (accuracy === 100) xpEarned += 25;
  const newBadges: string[] = [];

  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.studentId, student.id));

  const existingBadges = (student.badges as string[]) || [];

  if (!existingBadges.includes("First Step") && allSessions.length === 1) {
    newBadges.push("First Step");
  }
  if (!existingBadges.includes("Zero Error") && accuracy === 100) {
    const perfectSessions = allSessions.filter((s) => s.accuracy === 100).length;
    if (perfectSessions >= 3) {
      newBadges.push("Zero Error");
    }
  }
  if (!existingBadges.includes("Hint-Free Hero") && hintsUsed === 0) {
    newBadges.push("Hint-Free Hero");
  }

  const now = new Date();
  const lastActiveDate = student.lastActive;
  const diffDays = Math.floor(
    (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const newStreak = diffDays <= 1 ? student.streak + 1 : 1;

  if (newStreak >= 7 && !existingBadges.includes("7-Day Streak")) {
    newBadges.push("7-Day Streak");
    xpEarned += 15;
  }

  const updatedBadges = [...existingBadges, ...newBadges];

  // Level-up: advance if accuracy >= 80% and not already at max level
  const MAX_LEVEL = 5;
  let newLevel: number | null = null;
  const sessionsAtCurrentLevel = allSessions.filter(s => s.level === student.level).length;
  if (
    accuracy >= 80 &&
    student.level < MAX_LEVEL &&
    sessionsAtCurrentLevel >= 3
  ) {
    newLevel = student.level + 1;
    if (!existingBadges.includes(`Level ${newLevel} Unlocked`)) {
      newBadges.push(`Level ${newLevel} Unlocked`);
    }
    xpEarned += 50;
  }

  await db
    .update(studentsTable)
    .set({
      xp: student.xp + xpEarned,
      streak: newStreak,
      lastActive: now,
      badges: [...updatedBadges, ...newBadges.filter(b => !updatedBadges.includes(b))],
      ...(newLevel ? { level: newLevel } : {}),
    })
    .where(eq(studentsTable.id, student.id));

  res.json({
    score,
    accuracy: Math.round(accuracy * 100) / 100,
    xpEarned,
    badges: newBadges,
    newLevel,
    streakUpdated: newStreak !== student.streak,
  });
});

router.get("/v1/student/sessions", authMiddleware, async (req, res): Promise<void> => {
  const params = ListSessionsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 10) : 10;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.userId, req.user!.id))
    .limit(1);

  if (!student) {
    res.json([]);
    return;
  }

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.studentId, student.id))
    .orderBy(desc(sessionsTable.createdAt))
    .limit(Number(limit));

  res.json(
    sessions.map((s) => ({
      id: s.id,
      level: s.level,
      score: s.score,
      accuracy: s.accuracy,
      duration: s.duration,
      hintsUsed: s.hintsUsed,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

function generateProblems(level: number, count: number) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    if (level === 1) {
      const n = Math.floor(Math.random() * 9) + 1;
      problems.push({
        question: `What number is ${n}?`,
        answer: n,
        hint: `Show ${n} beads on the abacus`,
        difficulty: "easy",
      });
    } else if (level === 2) {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      problems.push({
        question: `${a} + ${b} = ?`,
        answer: a + b,
        hint: `Start with ${a} beads and add ${b} more`,
        difficulty: "easy",
      });
    } else if (level === 3) {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      problems.push({
        question: `${a} × ${b} = ?`,
        answer: a * b,
        hint: `Multiply ${a} by ${b}`,
        difficulty: "medium",
      });
    } else if (level === 4) {
      const a = Math.floor(Math.random() * 90) + 10;
      const b = Math.floor(Math.random() * 90) + 10;
      problems.push({
        question: `${a} + ${b} = ?`,
        answer: a + b,
        hint: `Add the tens then the ones`,
        difficulty: "hard",
      });
    } else {
      const a = Math.floor(Math.random() * 900) + 100;
      const b = Math.floor(Math.random() * 900) + 100;
      problems.push({
        question: `${a} + ${b} = ?`,
        answer: a + b,
        hint: `Use mental abacus to add the digits`,
        difficulty: "hard",
      });
    }
  }
  return problems;
}

export default router;
