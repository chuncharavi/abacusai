import { Router } from "express";
import type { IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { authMiddleware, requirePlan } from "../middlewares/auth";
import { db, studentsTable, sessionsTable, usersTable, reportsTable } from "@workspace/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  GetAIHintBody,
  GenerateProblemsBody,
  AdaptDifficultyBody,
  GenerateWeeklyReportBody,
  ProcessVoiceIntentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getAnthropicClient() {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey || !baseURL) {
    throw new Error("Anthropic AI integration not configured");
  }
  return new Anthropic({ apiKey, baseURL });
}

router.post("/v1/ai/hint", authMiddleware, async (req, res): Promise<void> => {
  const parsed = GetAIHintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { studentAge, level, problem, wrongAnswers } = parsed.data;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are a friendly abacus tutor for a ${studentAge}-year-old at Level ${level}. Problem: "${problem}". Wrong answers given: ${wrongAnswers.length > 0 ? wrongAnswers.join(", ") : "none yet"}.\n\nExplain the ABACUS BEAD METHOD: which column to use, whether to move heaven bead (worth 5) or earth beads (worth 1 each), and how many beads to slide up or down. Use simple words. Under 80 words. Warm and encouraging.\n\nReturn ONLY JSON: {"hint":"...","encouragement":"..."}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ hint: text, encouragement: "You can do it!" });
    }
  } catch (err) {
    logger.warn({ err }, "AI hint failed, returning fallback");
    res.json({
      hint: `For Level ${level}, try breaking the problem into smaller steps. Use the beads one column at a time.`,
      encouragement: "Keep trying! You are doing great!",
    });
  }
});

router.post("/v1/ai/generate-problems", authMiddleware, requirePlan("STAR"), async (req, res): Promise<void> => {
  const parsed = GenerateProblemsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { level, recentAccuracy, focusArea, studentAge } = parsed.data;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Generate exactly 10 abacus math problems for a Level ${level} student aged ${studentAge}. Their recent accuracy is ${recentAccuracy}%. Focus area: ${focusArea}. Return ONLY a JSON array, no markdown, no explanation: [{"question":"...","answer":0,"hint":"...","difficulty":"easy|medium|hard"}]`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json(generateFallbackProblems(level, 10));
    }
  } catch (err) {
    logger.warn({ err }, "AI generate problems failed, returning fallback");
    res.json(generateFallbackProblems(level, 10));
  }
});

router.post("/v1/ai/adapt", authMiddleware, async (req, res): Promise<void> => {
  const parsed = AdaptDifficultyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionScore, timePerProblem, hintsUsed, currentLevel, recentHistory } = parsed.data;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are an adaptive learning engine. Based on: score=${sessionScore}, timePerProblem=${timePerProblem}s, hints=${hintsUsed}, level=${currentLevel}, recentScores=${recentHistory.join(",")}. Return ONLY JSON (no markdown): {"next_difficulty":"easy|medium|hard","recommended_problem_count":10,"focus_area":"...","should_advance_level":false,"coach_tip":"...under 20 words"}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({
        next_difficulty: "medium",
        recommended_problem_count: 10,
        focus_area: "General practice",
        should_advance_level: false,
        coach_tip: "Keep practicing consistently to improve!",
      });
    }
  } catch (err) {
    logger.warn({ err }, "AI adapt failed, returning fallback");
    res.json({
      next_difficulty: "medium" as const,
      recommended_problem_count: 10,
      focus_area: "General practice",
      should_advance_level: false,
      coach_tip: "Keep practicing consistently to improve!",
    });
  }
});

router.post("/v1/ai/weekly-report", authMiddleware, requirePlan("STAR"), async (req, res): Promise<void> => {
  const parsed = GenerateWeeklyReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { studentId } = parsed.data;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, studentId))
    .limit(1);

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, student.userId))
    .limit(1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.studentId, studentId),
        gte(sessionsTable.createdAt, sevenDaysAgo)
      )
    )
    .orderBy(desc(sessionsTable.createdAt));

  const avgScore =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
      : 0;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are an abacus learning coach. Write a friendly, encouraging weekly progress report for ${user?.name ?? "the student"} aged ${user?.age ?? 10}. Data: sessions=${sessions.length}, avgAccuracy=${avgScore.toFixed(1)}%, level=${student.level}, streak=${student.streak}. Include: what improved, what needs work, a specific practice tip, and a motivational close. Format as HTML with <h3>, <p>, <ul> tags. Keep it under 200 words.`,
        },
      ],
    });

    const htmlContent = message.content[0].type === "text" ? message.content[0].text : "<p>Great week of practice!</p>";
    const weekOf = sevenDaysAgo;

    const [report] = await db
      .insert(reportsTable)
      .values({
        studentId,
        htmlContent,
        weekOf,
      })
      .returning();

    res.json({
      reportId: report.id,
      htmlContent,
      weekOf: weekOf.toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, "AI weekly report failed");
    const htmlContent = `<h3>Weekly Progress</h3><p>You completed ${sessions.length} sessions this week with ${avgScore.toFixed(1)}% accuracy. Keep up the great work!</p>`;
    const weekOf = sevenDaysAgo;

    const [report] = await db
      .insert(reportsTable)
      .values({ studentId, htmlContent, weekOf })
      .returning();

    res.json({
      reportId: report.id,
      htmlContent,
      weekOf: weekOf.toISOString(),
    });
  }
});

router.post("/v1/ai/voice-intent", authMiddleware, requirePlan("STAR"), async (req, res): Promise<void> => {
  const parsed = ProcessVoiceIntentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { transcript, context } = parsed.data;

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are an abacus learning voice assistant. The student said: "${transcript}". Context: ${context}. Return ONLY JSON: {"intent":"next_problem|give_hint|read_question|show_answer|how_many_beads|unknown","response_text":"...friendly response under 20 words","action":"next_problem|show_hint|speak_question|show_answer|explain_beads|none"}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ intent: "unknown", response_text: "I did not understand that.", action: "none" });
    }
  } catch (err) {
    logger.warn({ err }, "Voice intent failed");
    res.json({ intent: "unknown", response_text: "I did not understand that.", action: "none" });
  }
});

function generateFallbackProblems(level: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    if (level === 1) {
      const n = i + 1;
      return { question: `What is ${n}?`, answer: n, hint: `Show ${n} on abacus`, difficulty: "easy" as const };
    } else if (level === 2) {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      return { question: `${a} + ${b}`, answer: a + b, hint: `Add beads step by step`, difficulty: "easy" as const };
    } else {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 50) + 10;
      return { question: `${a} + ${b}`, answer: a + b, hint: `Work column by column`, difficulty: "medium" as const };
    }
  });
}

export default router;
