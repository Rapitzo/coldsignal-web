import { pgTable, text, timestamp, integer, uuid, boolean } from "drizzle-orm/pg-core";

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  packSlug: text("pack_slug").notNull(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  amountGbpPence: integer("amount_gbp_pence").notNull(),
  fulfilled: boolean("fulfilled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
