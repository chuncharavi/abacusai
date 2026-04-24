import {
  pgTable,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const planEnum = pgEnum("plan", ["FREE", "STAR"]);
export const statusEnum = pgEnum("status", ["ACTIVE", "EXPIRED", "CANCELLED"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id),
  plan: planEnum("plan").notNull().default("FREE"),
  status: statusEnum("status").notNull().default("ACTIVE"),
  razorpaySubId: text("razorpay_sub_id"),
  startDate: timestamp("start_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(
  subscriptionsTable
).omit({ id: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
