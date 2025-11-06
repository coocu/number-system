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

// ✅ Render가 자동으로 지정하는 포트 사용
const PORT = process.env.PORT || 3000;

// ✅ 정적 파일(public) 제공
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 페이지(index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Socket 이벤트
io.on("connection", (socket) => {
  console.log("✅ 클라이언트 연결됨");
  socket.on("call", (data) => io.emit("call", data));
  socket.on("recall", (data) => io.emit("recall", data));
  socket.on("reset", () => io.emit("reset"));
});

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
