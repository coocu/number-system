import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Render가 주는 포트 사용 (로컬에선 3000)
const PORT = process.env.PORT || 3000;

// public 정적 서빙
app.use(express.static(path.join(__dirname, "public")));

// 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 소켓 이벤트
io.on("connection", (socket) => {
  console.log("✅ 클라이언트 연결됨");
  socket.on("call", (data) => io.emit("call", data));
  socket.on("recall", (data) => io.emit("recall", data));
  socket.on("reset", () => io.emit("reset"));
});

// 서버 시작 (0.0.0.0 필수)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
