import { Router, type IRouter } from "express";
import { twiml } from "twilio";
import { db, callsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/**
 * POST /twilio/voice
 * Twilio webhook — called when a call comes in.
 * Returns TwiML that connects the call to a Media Stream WebSocket.
 */
router.post("/twilio/voice", async (req, res): Promise<void> => {
  const response = new twiml.VoiceResponse();

  // Build the WebSocket URL for this server
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? process.env["REPLIT_DEV_DOMAIN"];
  const wsUrl = `wss://${host}/api/twilio/stream`;

  const connect = response.connect();
  connect.stream({ url: wsUrl });

  const callSid = req.body?.CallSid as string | undefined;
  const fromNumber = (req.body?.From as string | undefined) ?? "unknown";
  const toNumber = (req.body?.To as string | undefined) ?? "unknown";

  if (callSid) {
    await db
      .insert(callsTable)
      .values({ callSid, fromNumber, toNumber, status: "initiated" })
      .onConflictDoNothing();
  }

  req.log.info({ callSid, fromNumber }, "Incoming Twilio call — streaming TwiML returned");

  res.type("text/xml").send(response.toString());
});

/**
 * POST /twilio/status
 * Twilio status callback — updates call record when status changes.
 */
router.post("/twilio/status", async (req, res): Promise<void> => {
  const callSid = req.body?.CallSid as string | undefined;
  const callStatus = req.body?.CallStatus as string | undefined;
  const callDuration = req.body?.CallDuration as string | undefined;

  if (callSid && callStatus) {
    const terminalStatuses = ["completed", "failed", "busy", "no-answer", "canceled"];
    await db
      .update(callsTable)
      .set({
        status: callStatus,
        ...(callDuration
          ? { durationSeconds: parseInt(callDuration, 10) }
          : {}),
        ...(terminalStatuses.includes(callStatus)
          ? { endedAt: new Date() }
          : {}),
      })
      .where(eq(callsTable.callSid, callSid));
  }

  req.log.info({ callSid, callStatus }, "Call status updated");
  res.sendStatus(200);
});

export default router;
