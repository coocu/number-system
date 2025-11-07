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

// ✅ store 파라미터 확실히 인식
function getStoreId(req) {
  const queryStore = req.query.store;
  const bodyStore = req.body?.store;
  const headerStore = req.headers["x-store-id"];
  return (queryStore || bodyStore || headerStore || "default").trim();
}

// ✅ 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 소켓 연결
io.on("connection", (socket) => {
  socket.on("joinStore", (storeId) => {
    const id = (storeId || "default").trim();
    socket.join(id);
    console.log(`🟢 모니터 연결됨: ${id}`);
  });
  socket.on("disconnect", () => console.log("🔴 모니터 연결 해제"));
});

// ✅ 호출
app.post("/api/call", (req, res) => {
  const storeId = getStoreId(req);
  const cmd = req.body?.cmd || "";
  const numMatch = cmd.match(/\d+/);
  const number = numMatch ? parseInt(numMatch[0]) : null;

  if (!number) return res.status(400).json({ ok: false });

  console.log(`📢 [${storeId}] ${number}번 호출`);
  io.to(storeId).emit("call", { number });
  res.json({ ok: true });
});

// ✅ 재호출
app.post("/api/recall", (req, res) => {
  const storeId = getStoreId(req);
  const cmd = req.body?.cmd || "";
  const numMatch = cmd.match(/\d+/);
  const number = numMatch ? parseInt(numMatch[0]) : null;

  if (!number) return res.status(400).json({ ok: false });

  console.log(`🔁 [${storeId}] ${number}번 재호출`);
  io.to(storeId).emit("recall", { number });
  res.json({ ok: true });
});

// ✅ 초기화
app.post("/api/reset", (req, res) => {
  const storeId = getStoreId(req);
  console.log(`♻️ [${storeId}] reset`);
  io.to(storeId).emit("reset");
  res.json({ ok: true });
});

// ✅ keep-alive
app.get("/health", (req, res) => res.json({ ok: true }));

setInterval(() => {
  fetch("https://number-system-seo9.onrender.com/health")
    .then(r => console.log("💓 keep-alive:", r.status))
    .catch(() => {});
}, 600000);

server.listen(PORT, "0.0.0.0", () => console.log(`🚀 서버 실행 중: ${PORT}`));
