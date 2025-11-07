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

// ====== 기본 세팅 ======
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== 메인 페이지 ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== Socket 연결 ======
io.on("connection", (socket) => {
  console.log("✅ 클라이언트 연결됨");

  socket.on("call", (data) => {
    io.emit("call", data);
    console.log("📢 호출:", data);
  });

  socket.on("recall", (data) => {
    io.emit("recall", data);
    console.log("🔁 재호출:", data);
  });

  socket.on("reset", () => {
    io.emit("reset");
    console.log("♻️ 초기화");
  });

  socket.on("disconnect", () => {
    console.log("🔴 클라이언트 연결 해제");
  });
});

// ====== Keep Alive ======
app.get("/health", (req, res) => res.json({ ok: true }));

setInterval(() => {
  fetch("https://number-system-seo9.onrender.com/health")
    .then((r) => console.log("💓 keep-alive:", r.status))
    .catch(() => {});
}, 600000);

// ====== 서버 시작 ======
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
