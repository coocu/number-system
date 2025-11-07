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

// ✅ 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// ✅ 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 매장별 socket 관리
io.on("connection", (socket) => {
  console.log("🟢 클라이언트 연결됨");

  let currentStore = "default";

  // 매장 식별
  socket.on("joinStore", (storeId) => {
    currentStore = storeId || "default";
    socket.join(currentStore);
    console.log(`🏪 매장 접속: ${currentStore}`);
  });

  // 호출
  socket.on("call", (data) => {
    if (!data.storeId) data.storeId = currentStore;
    console.log(`🔔 [${data.storeId}] ${data.number}번 호출`);
    io.to(data.storeId).emit("call", data);
  });

  // 재호출
  socket.on("recall", (data) => {
    if (!data.storeId) data.storeId = currentStore;
    console.log(`🔁 [${data.storeId}] ${data.number}번 재호출`);
    io.to(data.storeId).emit("recall", data);
  });

  // 초기화
  socket.on("reset", (data) => {
    if (!data.storeId) data.storeId = currentStore;
    console.log(`♻️ [${data.storeId}] 초기화`);
    io.to(data.storeId).emit("reset");
  });

  socket.on("disconnect", () => {
    console.log(`🔴 ${currentStore} 매장 클라이언트 연결 종료`);
  });
});

// ✅ Keep-alive ping (Render 자동종료 방지)
setInterval(() => {
  const url = "https://number-system-seo9.onrender.com"; // 네 Render 도메인
  fetch(url)
    .then((res) => console.log("💓 Keep-alive ping:", res.status))
    .catch((err) => console.log("ping 실패:", err));
}, 600000); // 10분마다 ping

// ✅ 서버 실행
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
