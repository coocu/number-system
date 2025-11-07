import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // ✅ ping용

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

// ✅ 정적 파일(public 폴더)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ✅ 매장별 접속 관리
io.on("connection", (socket) => {
  console.log("✅ 새 클라이언트 접속됨");

  // 🔹 매장 입장 (index.html 에서 joinStore emit)
  socket.on("joinStore", (storeId) => {
    socket.join(storeId);
    console.log(`🟢 매장 연결됨: ${storeId}`);
  });

  socket.on("disconnect", () => console.log("❌ 클라이언트 연결 해제"));
});

// ✅ 관리자앱 호출 API
app.post("/api/call", (req, res) => {
  const { cmd, store } = req.body;

  console.log("📩 수신됨:", cmd, store);

  if (cmd.startsWith("CALL ")) {
    const number = cmd.split(" ")[1];
    io.to(store).emit("call", { number });
  } else if (cmd.startsWith("RECALL ")) {
    const number = cmd.split(" ")[1];
    io.to(store).emit("recall", { number });
  } else if (cmd.startsWith("RESET")) {
    io.to(store).emit("reset");
  }

  res.json({ ok: true });
});

// ✅ 기본 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 서버 자동 유지 (Render 무료 플랜용 ping)
const SELF_URL = "https://number-system-seo9.onrender.com";
setInterval(() => {
  fetch(SELF_URL)
    .then(() => console.log("💓 Keep-alive ping"))
    .catch((err) => console.log("⚠️ Ping 실패:", err.message));
}, 12 * 60 * 1000); // 12분마다 ping (15분 제한 방지)

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
