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
const io = new Server(server, {
  cors: { origin: "*" },
});
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🧩 store ID 처리
function getStoreId(req) {
  let id = null;
  if (req.query?.store) id = req.query.store;
  else if (req.headers["x-store-id"]) id = req.headers["x-store-id"];
  else if (req.originalUrl.includes("store=")) {
    id = req.originalUrl.split("store=")[1].split(/[/?&]/)[0];
  }
  if (!id) return "default";
  return id.replace(/[^a-zA-Z0-9_-]/g, "") || "default";
}

// 🧩 숫자 파싱
function parseNum(cmd) {
  const m = (cmd || "").match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

// ===== 메인 페이지 =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== 소켓 연결 =====
io.on("connection", (socket) => {
  let store = "default";
  socket.on("joinStore", (id) => {
    store = id || "default";
    socket.join(store);
    console.log(`🏪 모니터 접속됨: ${store}`);
  });
  socket.on("disconnect", () => {
    console.log(`❌ 연결 종료: ${store}`);
  });
});

// ====== 관리자 호출 ======
app.post("/api/call", (req, res) => {
  const store = getStoreId(req);
  const cmd = req.body?.cmd || "";
  const num = parseNum(cmd);
  console.log("📡 요청 수신:", req.body, "STORE:", store);

  if (!num) return res.status(400).json({ ok: false, error: "invalid number" });

  console.log(`📢 [${store}] ${num}번 호출`);
  io.to(store).emit("call", { number: num });
  res.json({ ok: true });
});

app.post("/api/recall", (req, res) => {
  const store = getStoreId(req);
  const cmd = req.body?.cmd || "";
  const num = parseNum(cmd);

  if (!num) return res.status(400).json({ ok: false });

  console.log(`🔁 [${store}] ${num}번 재호출`);
  io.to(store).emit("recall", { number: num });
  res.json({ ok: true });
});

app.post("/api/reset", (req, res) => {
  const store = getStoreId(req);
  console.log(`♻️ [${store}] reset`);
  io.to(store).emit("reset");
  res.json({ ok: true });
});

// ====== 헬스체크 + Keep Alive ======
app.get("/health", (_, res) => res.json({ ok: true }));
setInterval(() => {
  fetch("https://number-system-seo9.onrender.com/health")
    .then(r => console.log("💓 ping:", r.status))
    .catch(() => console.log("ping fail"));
}, 600000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중 (포트 ${PORT})`);
});
