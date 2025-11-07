import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== storeId 처리 함수 =====
function sanitizeStoreId(s) {
  if (!s) return "default";
  return String(s).split(/[\/&?]/)[0].replace(/[^a-zA-Z0-9_-]/g, "") || "default";
}
function extractStoreId(req) {
  let id = null;
  if (req.query?.store) id = sanitizeStoreId(req.query.store);
  else if (req.headers["x-store-id"]) id = sanitizeStoreId(req.headers["x-store-id"]);
  else if (req.originalUrl.includes("store=")) {
    id = sanitizeStoreId(req.originalUrl.split("store=")[1]);
  }
  return id || "default";
}

// ===== 메인 페이지 =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== 소켓 =====
io.on("connection", (socket) => {
  let storeId = "default";
  socket.on("joinStore", (id) => {
    storeId = sanitizeStoreId(id);
    socket.join(storeId);
    console.log(`🏪 모니터 접속: ${storeId}`);
  });
  socket.on("disconnect", () => {
    console.log(`🔴 연결 종료: ${storeId}`);
  });
});

// ===== 관리자앱 API =====
function parseNum(cmd) {
  const m = (cmd || "").match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

// 호출
app.post("/api/call", (req, res) => {
  const storeId = extractStoreId(req);
  const num = parseNum(req.body?.cmd);
  if (!num) return res.status(400).json({ ok: false });
  console.log(`📢 [${storeId}] ${num}번 호출`);
  io.to(storeId).emit("call", { number: num });
  res.json({ ok: true });
});

// 재호출
app.post("/api/recall", (req, res) => {
  const storeId = extractStoreId(req);
  const num = parseNum(req.body?.cmd);
  if (!num) return res.status(400).json({ ok: false });
  console.log(`🔁 [${storeId}] ${num}번 재호출`);
  io.to(storeId).emit("recall", { number: num });
  res.json({ ok: true });
});

// 초기화
app.post("/api/reset", (req, res) => {
  const storeId = extractStoreId(req);
  console.log(`♻️ [${storeId}] reset`);
  io.to(storeId).emit("reset");
  res.json({ ok: true });
});

// Keep alive
setInterval(() => {
  fetch("https://number-system-seo9.onrender.com/health")
    .then(r => console.log("💓 keep-alive:", r.status))
    .catch(e => console.log("keep-alive fail:", e.message));
}, 600000);
app.get("/health", (_, res) => res.json({ ok: true }));

server.listen(PORT, "0.0.0.0", () => console.log(`🚀 PORT ${PORT}`));
