import { Router, type IRouter } from "express";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import { db, callsTable } from "@workspace/db";
import {
  ListCallsQueryParams,
  ListCallsResponseItem,
  GetCallParams,
  GetCallResponse,
  GetCallStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /calls
 * List recent calls with pagination.
 */
router.get("/calls", async (req, res): Promise<void> => {
  const parsed = ListCallsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit, offset } = parsed.data;

  const calls = await db
    .select()
    .from(callsTable)
    .orderBy(desc(callsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(calls.map((c) => ListCallsResponseItem.parse(c)));
});

/**
 * GET /calls/stats
 * Aggregate statistics across all calls.
 * Must be registered before /calls/:id to avoid being matched as an id param.
 */
router.get("/calls/stats", async (_req, res): Promise<void> => {
  const [aggregate] = await db
    .select({
      totalCalls: count(callsTable.id),
      averageDurationSeconds: avg(callsTable.durationSeconds),
    })
    .from(callsTable);

  const [todayRow] = await db
    .select({ ct: count() })
    .from(callsTable)
    .where(
      sql`DATE(${callsTable.createdAt} AT TIME ZONE 'UTC') = CURRENT_DATE`
    );

  const statusRows = await db
    .select({ status: callsTable.status, ct: count() })
    .from(callsTable)
    .groupBy(callsTable.status);

  const callsByStatus: Record<string, number> = {};
  for (const row of statusRows) {
    callsByStatus[row.status] = Number(row.ct);
  }

  res.json(
    GetCallStatsResponse.parse({
      totalCalls: Number(aggregate?.totalCalls ?? 0),
      callsToday: Number(todayRow?.ct ?? 0),
      averageDurationSeconds:
        aggregate?.averageDurationSeconds != null
          ? Number(aggregate.averageDurationSeconds)
          : null,
      callsByStatus,
    })
  );
});

/**
 * GET /calls/:id
 * Get a single call with full transcript.
 */
router.get("/calls/:id", async (req, res): Promise<void> => {
  const params = GetCallParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [call] = await db
    .select()
    .from(callsTable)
    .where(eq(callsTable.id, params.data.id));

  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  res.json(GetCallResponse.parse(call));
});

export default router;
