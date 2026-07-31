import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, agentConfigTable } from "@workspace/db";
import {
  GetConfigResponse,
  UpdateConfigBody,
  UpdateConfigResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_SYSTEM_PROMPT = `You are a professional after-hours answering service for an apartment complex. 
Help tenants with emergency maintenance requests, general questions, and take messages for the management office.
Be empathetic, calm, and professional at all times.
If there is a genuine emergency (fire, flood, gas leak, medical), advise them to call 911 immediately.
For urgent maintenance issues, collect the caller's name, unit number, and a description of the issue.
For non-urgent matters, offer to take a message that the office will receive in the morning.`;

const DEFAULT_GREETING =
  "Thank you for calling. Our office is currently closed for the evening. I am an automated assistant and I am here to help. How can I assist you today?";

const DEFAULT_CONFIG = {
  id: 0,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  voice: "alloy",
  greeting: DEFAULT_GREETING,
  updatedAt: new Date(),
};

/**
 * GET /config
 * Return the current agent configuration (or built-in defaults).
 */
router.get("/config", async (_req, res): Promise<void> => {
  const configs = await db.select().from(agentConfigTable).limit(1);
  if (configs.length === 0) {
    res.json(GetConfigResponse.parse(DEFAULT_CONFIG));
    return;
  }
  res.json(GetConfigResponse.parse(configs[0]));
});

/**
 * PUT /config
 * Create or update the agent configuration.
 */
router.put("/config", async (req, res): Promise<void> => {
  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: agentConfigTable.id })
    .from(agentConfigTable)
    .limit(1);

  if (existing.length === 0) {
    const [created] = await db
      .insert(agentConfigTable)
      .values({
        systemPrompt: parsed.data.systemPrompt ?? DEFAULT_CONFIG.systemPrompt,
        voice: parsed.data.voice ?? DEFAULT_CONFIG.voice,
        greeting: parsed.data.greeting ?? DEFAULT_CONFIG.greeting,
      })
      .returning();
    res.json(UpdateConfigResponse.parse(created));
    return;
  }

  const [updated] = await db
    .update(agentConfigTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(agentConfigTable.id, existing[0].id))
    .returning();

  res.json(UpdateConfigResponse.parse(updated));
});

export default router;
