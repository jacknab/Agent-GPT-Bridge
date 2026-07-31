import WebSocket from "ws";
import { db, callsTable, agentConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const OPENAI_MODEL =
  process.env["OPENAI_REALTIME_MODEL"] ??
  "gpt-4o-realtime-preview-2024-12-17";
const OPENAI_WS_URL = `wss://api.openai.com/v1/realtime?model=${OPENAI_MODEL}`;

const DEFAULT_SYSTEM_PROMPT = `You are a professional after-hours answering service for an apartment complex. 
Help tenants with emergency maintenance requests, general questions, and take messages for the management office.
Be empathetic, calm, and professional at all times.
If there is a genuine emergency (fire, flood, gas leak, medical), advise them to call 911 immediately.
For urgent maintenance issues, collect the caller's name, unit number, and a description of the issue.
For non-urgent matters, offer to take a message that the office will receive in the morning.`;

const DEFAULT_GREETING =
  "Thank you for calling. Our office is currently closed for the evening. I am an automated assistant and I am here to help. How can I assist you today?";

interface TwilioStartEvent {
  event: "start";
  start: { streamSid: string; callSid: string };
}
interface TwilioMediaEvent {
  event: "media";
  media: { payload: string };
}
interface TwilioStopEvent {
  event: "stop";
}
type TwilioEvent = TwilioStartEvent | TwilioMediaEvent | TwilioStopEvent;

interface OpenAIEvent {
  type: string;
  delta?: string;
  transcript?: string;
  error?: unknown;
  item?: { id: string };
  response?: { id: string };
}

export function handleTwilioStream(twilioWs: WebSocket): void {
  let streamSid: string | null = null;
  let callSid: string | null = null;
  let callDbId: number | null = null;
  const transcriptLines: string[] = [];

  // Open connection to OpenAI Realtime API
  const openaiWs = new WebSocket(OPENAI_WS_URL, {
    headers: {
      Authorization: `Bearer ${process.env["OPENAI_API_KEY"]}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiWs.on("open", async () => {
    logger.info("OpenAI Realtime connection opened");

    const configs = await db.select().from(agentConfigTable).limit(1);
    const config = configs[0];

    const systemPrompt = config?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const voice = config?.voice ?? "alloy";
    const greeting = config?.greeting ?? DEFAULT_GREETING;

    // Configure the session
    openaiWs.send(
      JSON.stringify({
        type: "session.update",
        session: {
          turn_detection: { type: "server_vad" },
          input_audio_format: "g711_ulaw",
          output_audio_format: "g711_ulaw",
          voice,
          instructions: systemPrompt,
          modalities: ["text", "audio"],
          input_audio_transcription: { model: "whisper-1" },
        },
      })
    );

    // Trigger initial greeting
    openaiWs.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Please greet the caller by saying: "${greeting}"`,
            },
          ],
        },
      })
    );
    openaiWs.send(JSON.stringify({ type: "response.create" }));
  });

  openaiWs.on("message", (rawData: Buffer) => {
    let event: OpenAIEvent;
    try {
      event = JSON.parse(rawData.toString()) as OpenAIEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case "response.audio.delta":
        // Forward AI audio to Twilio
        if (streamSid && event.delta && twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(
            JSON.stringify({
              event: "media",
              streamSid,
              media: { payload: event.delta },
            })
          );
        }
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          transcriptLines.push(`Agent: ${event.transcript}`);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          transcriptLines.push(`Caller: ${event.transcript}`);
        }
        break;

      case "error":
        logger.error({ error: event.error }, "OpenAI Realtime API error");
        break;

      default:
        break;
    }
  });

  openaiWs.on("close", () => {
    logger.info("OpenAI Realtime connection closed");
  });

  openaiWs.on("error", (err: Error) => {
    logger.error({ err }, "OpenAI Realtime WebSocket error");
  });

  // Handle messages from Twilio
  twilioWs.on("message", async (rawData: Buffer) => {
    let msg: TwilioEvent;
    try {
      msg = JSON.parse(rawData.toString()) as TwilioEvent;
    } catch {
      return;
    }

    switch (msg.event) {
      case "start": {
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        logger.info({ streamSid, callSid }, "Twilio media stream started");

        if (callSid) {
          const updated = await db
            .update(callsTable)
            .set({ status: "in-progress" })
            .where(eq(callsTable.callSid, callSid))
            .returning({ id: callsTable.id });
          if (updated[0]) callDbId = updated[0].id;
        }
        break;
      }

      case "media":
        if (
          openaiWs.readyState === WebSocket.OPEN &&
          msg.media?.payload
        ) {
          openaiWs.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload,
            })
          );
        }
        break;

      case "stop":
        logger.info({ callSid }, "Twilio media stream stopped");

        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.close();
        }

        if (callDbId) {
          const transcript = transcriptLines.join("\n");
          await db
            .update(callsTable)
            .set({ transcript, status: "completed", endedAt: new Date() })
            .where(eq(callsTable.id, callDbId));
          logger.info({ callDbId, lines: transcriptLines.length }, "Transcript saved");
        }
        break;
    }
  });

  twilioWs.on("close", () => {
    logger.info("Twilio WebSocket connection closed");
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  twilioWs.on("error", (err: Error) => {
    logger.error({ err }, "Twilio WebSocket error");
  });
}
