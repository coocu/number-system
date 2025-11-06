const socket = io();

socket.on("connect", () => {
  console.log("🟢 웹서버 연결됨");
});

socket.on("call", (data) => {
  console.log("📣 호출:", data);
  showPopup(data.number);
  playSound(data.number);
});

socket.on("recall", (data) => {
  console.log("🔁 재호출:", data);
  showPopup(data.number);
  playSound(data.number);
});

socket.on("reset", () => {
  hidePopup();
});

function showPopup(num) {
  const popup = document.getElementById("popup");
  const span = document.getElementById("call-number");
  span.innerHTML = `${num}번`;
  popup.classList.remove("hidden");
  popup.classList.add("blink");

  setTimeout(() => {
    popup.classList.add("hidden");
    popup.classList.remove("blink");
  }, 7000);
}

function hidePopup() {
  document.getElementById("popup").classList.add("hidden");
}

function playSound(num) {
  const filePath = `sounds/${num}.mp3`;
  const audio = new Audio(filePath);
  audio.play().then(() => {
    console.log(`🔈 ${filePath} 재생됨`);
  }).catch((err) => {
    console.warn("⚠️ 사운드 재생 실패:", err);
  });
}
