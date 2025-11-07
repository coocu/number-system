const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ✅ JSON 데이터 파싱 (관리자앱 POST 요청 받기 위함)
app.use(express.json());

// ✅ public 폴더 정적 파일
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 🔥 관리자앱에서 보내는 호출 명령 처리 (핵심 추가 부분)
app.post("/api/call", (req, res) => {
  const { cmd } = req.body;
  console.log("📩 관리자앱 명령 수신:", cmd);

  if (cmd.startsWith("CALL")) {
    const num = cmd.split(" ")[1];
    io.emit("call", { number: num });
    console.log(`📢 호출: ${num}번`);
  } else if (cmd.startsWith("RECALL")) {
    const num = cmd.split(" ")[1];
    io.emit("recall", { number: num });
    console.log(`🔁 재호출: ${num}번`);
  } else if (cmd.startsWith("RESET")) {
    io.emit("reset");
    console.log("🔄 초기화");
  }

  res.json({ ok: true });
});

// ✅ 소켓 연결
io.on("connection", (socket) => {
  console.log("✅ 웹 클라이언트 연결됨");
});

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
