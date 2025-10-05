// server.js
// SSE + HTTP POST based web terminal (no WebSocket)
// Binds to 127.0.0.1:3000 by default.

const express = require("express");
const pty = require("node-pty");
const path = require("path");
const bodyParser = require("body-parser");
const helmet = require("helmet");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;

// Create a single PTY instance (one shared shell).
// For multi-user, you'd create one PTY per session and map them.
const shell = process.env.SHELL || (process.platform === "win32" ? "powershell.exe" : "bash");
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env
});

const app = express();
app.use(helmet());
app.use(bodyParser.text({ type: "*/*", limit: "1mb" })); // accept raw text input
app.use(express.static(path.join(__dirname, "public")));

// SSE clients list (we'll only have few; this is a simple example)
let sseClients = new Set();

// When PTY sends data, broadcast to all SSE clients
ptyProcess.on("data", (data) => {
  // SSE requires each message to be "data: <line>\n\n".
  // We'll send raw chunks (may contain newlines).
  for (const res of sseClients) {
    try {
      // Replace any single '\r' with '\n' to avoid odd SSE formatting.
      const safe = data.replace(/\r/g, "");
      // Send as a single SSE message. Client will write to xterm.
      res.write(`data: ${JSON.stringify(safe)}\n\n`);
    } catch (e) {
      // ignore broken clients
    }
  }
});

// SSE endpoint for terminal output
app.get("/events", (req, res) => {
  // minimal CORS for local debugging if needed:
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    // Prevent buffering on some proxies
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders();

  // heartbeats to keep connection alive in some networks
  const hb = setInterval(() => {
    res.write(":hb\n\n");
  }, 25000);

  sseClients.add(res);

  req.on("close", () => {
    clearInterval(hb);
    sseClients.delete(res);
  });
});

// Input from client (keypresses / pasted text) -> write to PTY
app.post("/input", (req, res) => {
  const chunk = req.body || "";
  // Expect raw text; write to PTY directly.
  // No encoding changes here — send literal bytes.
  ptyProcess.write(chunk);
  res.status(204).end();
});

// Resize request from client
app.post("/resize", (req, res) => {
  try {
    // Expect JSON like: { cols: 120, rows: 40 }
    const parsed = typeof req.body === "string" && req.body.length ? JSON.parse(req.body) : {};
    const cols = parseInt(parsed.cols, 10) || 80;
    const rows = parseInt(parsed.rows, 10) || 24;
    ptyProcess.resize(cols, rows);
    res.status(204).end();
  } catch (e) {
    res.status(400).send("bad resize payload");
  }
});

// health
app.get("/ping", (req, res) => res.send("ok"));

app.listen(PORT, HOST, () => {
  console.log(`SSE terminal server listening on http://${HOST}:${PORT}`);
  console.log(`Open http://${HOST}:${PORT}/ in a browser on the server (or proxy to it).`);
});
