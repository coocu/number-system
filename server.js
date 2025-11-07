const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ✅ JSON 데이터 파싱
app.use(express.json());

// ✅ 정적 파일(public 폴더)
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 🔥 관리자앱에서 보내는 호출 명령 처리
app.post("/:code/api/call", (req, res) => {
  const { cmd } = req.body;
  const code = req.params.code.toUpperCase(); // ex: A123
  console.log(`📩 [${code}] 명령 수신: ${cmd}`);

  if (cmd.startsWith("CALL")) {
    const num = cmd.split(" ")[1];
    io.to(code).emit("call", { number: num });
    console.log(`📢 [${code}] 호출: ${num}번`);
  } else if (cmd.startsWith("RECALL")) {
    const num = cmd.split(" ")[1];
    io.to(code).emit("recall", { number: num });
    console.log(`🔁 [${code}] 재호출: ${num}번`);
  } else if (cmd.startsWith("RESET")) {
    io.to(code).emit("reset");
    console.log(`🔄 [${code}] 초기화`);
  }

  res.json({ ok: true });
});

// ✅ 소켓 연결
io.on("connection", (socket) => {
  socket.on("joinRoom", (code) => {
    socket.join(code.toUpperCase());
    console.log(`✅ [JOIN] ${code}`);
  });
});

// ✅ Render 서버 sleep 방지용 self-ping
setInterval(() => {
  fetch("https://your-app.onrender.com").catch(() => {});
}, 5 * 60 * 1000); // 5분마다 호출

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
