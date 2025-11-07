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

// ------- 유틸: storeId 안전 파싱 -------
function sanitizeStoreId(s) {
  if (!s) return null;
  // 'z399/api/call' 같이 꼬인 값 들어오면 첫 '/' 전까지만 취함
  s = String(s).trim().split("/")[0].split("&")[0];
  // 허용 문자만
  const m = s.match(/^[A-Za-z0-9_-]{1,32}$/);
  return m ? m[0] : null;
}

function extractStoreId(req) {
  // 1) 정상 쿼리 ?store=z399
  if (req.query && req.query.store) {
    const id = sanitizeStoreId(req.query.store);
    if (id) return id;
  }
  // 2) 헤더 (원하면 관리자앱에서 X-Store-Id 보낼 수도 있음)
  const headerId = sanitizeStoreId(req.headers["x-store-id"]);
  if (headerId) return headerId;

  // 3) 비정상 형태: "/?store=z399/api/call" 같은 케이스
  const raw = req.originalUrl || "";
  // originalUrl 의 '?' 뒤를 통째로 보고 'store=' 뒤 토큰 뽑기
  const q = raw.includes("?") ? raw.split("?")[1] : "";
  if (q && q.includes("store=")) {
    const token = q.split("store=")[1]; // "z399/api/call&..." 등
    const id = sanitizeStoreId(token);
    if (id) return id;
  }
  return "default";
}

// ------- 메인 페이지 --------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------- Socket.IO: 프론트 모니터 join -------
io.on("connection", (socket) => {
  let storeId = "default";

  socket.on("joinStore", (id) => {
    const clean = sanitizeStoreId(id) || "default";
    storeId = clean;
    socket.join(clean);
    console.log(`🏪 모니터 접속: ${clean}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 모니터 연결 종료 (${storeId})`);
  });
});

// ------- 관리자앱이 때리는 HTTP API -------
function parseNumberFromCmd(cmd) {
  // "CALL 7", "RECALL 12", "RESET 1" 등에서 정수만 추출
  if (typeof cmd !== "string") return null;
  const m = cmd.match(/(-?\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// 호출
app.post("/api/call", (req, res) => {
  const storeId = extractStoreId(req);
  // 관리자앱은 {"cmd":"CALL 7"} 형태로 보냄
  const { cmd, number } = req.body || {};
  let n = Number.isInteger(number) ? number : parseNumberFromCmd(cmd);
  if (!Number.isInteger(n) || n < 1) {
    return res.status(400).json({ ok: false, error: "invalid number" });
  }
  console.log(`📢 [${storeId}] ${n}번 호출`);
  io.to(storeId).emit("call", { number: n });
  res.json({ ok: true });
});

// 재호출
app.post("/api/recall", (req, res) => {
  const storeId = extractStoreId(req);
  const { cmd, number } = req.body || {};
  let n = Number.isInteger(number) ? number : parseNumberFromCmd(cmd);
  if (!Number.isInteger(n) || n < 1) {
    return res.status(400).json({ ok: false, error: "invalid number" });
  }
  console.log(`🔁 [${storeId}] ${n}번 재호출`);
  io.to(storeId).emit("recall", { number: n });
  res.json({ ok: true });
});

// 초기화 (모니터 팝업만 닫음)
app.post("/api/reset", (req, res) => {
  const storeId = extractStoreId(req);
  console.log(`♻️ [${storeId}] reset`);
  io.to(storeId).emit("reset");
  res.json({ ok: true });
});

// 헬스체크/Keep-alive
app.get("/health", (req, res) => res.json({ ok: true }));

// 무료 플랜 절전 방지 (10분마다 핑)
setInterval(() => {
  fetch("https://number-system-seo9.onrender.com/health")
    .then(r => console.log("💓 keep-alive:", r.status))
    .catch(e => console.log("keep-alive fail:", e.message));
}, 600000);

// 서버 시작
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: ${PORT}`);
});
