import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentConfigTable = pgTable("agent_config", {
  id: serial("id").primaryKey(),
  systemPrompt: text("system_prompt").notNull(),
  voice: text("voice").notNull().default("alloy"),
  greeting: text("greeting").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAgentConfigSchema = createInsertSchema(agentConfigTable).omit(
  { id: true, updatedAt: true }
);
export type InsertAgentConfig = z.infer<typeof insertAgentConfigSchema>;
export type AgentConfig = typeof agentConfigTable.$inferSelect;
