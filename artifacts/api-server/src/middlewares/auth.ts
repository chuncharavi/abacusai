import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "abacusai_secret_key";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, user.id))
      .limit(1);

    const plan = subscription?.plan ?? "FREE";

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan,
    };
    next();
  } catch (err) {
    logger.warn({ err }, "Invalid token");
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requirePlan(requiredPlan: "STAR") {
  const planOrder: Record<string, number> = { FREE: 0, STAR: 1 };
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPlan = req.user?.plan ?? "FREE";
    if ((planOrder[userPlan] ?? 0) < (planOrder[requiredPlan] ?? 0)) {
      res.status(403).json({
        upgrade: true,
        message: `Unlock this with AbacusAI Star - ₹399/month`,
        requiredPlan,
      });
      return;
    }
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
