import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { handleTwilioStream } from "./lib/realtimeBridge";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server from Express app so we can attach the WebSocket server
const server = createServer(app);

// WebSocket server for Twilio Media Streams (no-server mode so we can share the HTTP server)
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  if (url.pathname === "/api/twilio/stream") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  logger.info("New Twilio stream WebSocket connection");
  handleTwilioStream(ws);
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
