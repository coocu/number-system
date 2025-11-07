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

// ✅ 정적 파일(public) 제공
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 페이지(index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 매장별 socket 채널 분리
io.on("connection", (socket) => {
  console.log("🟢 클라이언트 연결됨");
  let storeId = "default";

  // 클라이언트에서 store ID 전달 시 해당 채널로 join
  socket.on("joinStore", (id) => {
    storeId = id || "default";
    socket.join(storeId);
    console.log(`🏪 매장 접속: ${storeId}`);
  });

  // 호출
  socket.on("call", (data) => {
    const targetStore = data.storeId || storeId;
    console.log(`📢 [${targetStore}] ${data.number}번 호출`);
    io.to(targetStore).emit("call", { number: data.number });
  });

  // 재호출
  socket.on("recall", (data) => {
    const targetStore = data.storeId || storeId;
    console.log(`🔁 [${targetStore}] ${data.number}번 재호출`);
    io.to(targetStore).emit("recall", { number: data.number });
  });

  // 초기화
  socket.on("reset", (data) => {
    const targetStore = data.storeId || storeId;
    console.log(`♻️ [${targetStore}] 초기화`);
    io.to(targetStore).emit("reset");
  });

  socket.on("disconnect", () => {
    console.log(`🔴 ${storeId} 매장 연결 종료`);
  });
});

// ✅ Render 무료 플랜 절전 방지
setInterval(() => {
  const url = "https://number-system-seo9.onrender.com";
  fetch(url)
    .then((res) => console.log("💓 Keep-alive ping:", res.status))
    .catch((err) => console.log("ping 실패:", err.message));
}, 600000); // 10분마다

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
