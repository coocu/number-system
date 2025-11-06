// ===== server.js =====
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Render 환경 포트 대응 (process.env.PORT)
const PORT = process.env.PORT || 3000;

// ===== 정적 파일 서빙 =====
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ===== 호출 API (관리자앱에서 전송됨) =====
app.post("/api/call", (req, res) => {
  const cmd = req.body.cmd || "";
  console.log("📨 명령 수신:", cmd);

  const parts = cmd.split(" ");
  const type = parts[0];
  const number = parseInt(parts[1] || "0");

  if (type === "CALL") {
    io.emit("call", { number });
  } else if (type === "RECALL") {
    io.emit("recall", { number });
  } else if (type === "RESET") {
    io.emit("reset");
  }

  res.json({ ok: true });
});

// ===== 웹소켓 연결 =====
io.on("connection", (socket) => {
  console.log("✅ 웹 연결됨:", socket.id);
});

// ===== 서버 시작 =====
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
