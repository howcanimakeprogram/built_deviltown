/**
 * visuals.js
 * 역할: 배경 캔버스(디지털 레인/노이즈), ASCII 로고 데이터, 스크램블 유틸, 공용 DOM 참조를 준비합니다.
 * 참고: 다른 파일에서 `SKULL`, `scramble`, `skullSpan` 전역을 사용하므로 가장 먼저 로드되어야 합니다.
 */
/* ===== Noise ===== */
let backgroundMode = "digitalRain"; // "digitalRain" or "noiseFade"
let enableSuckIn = false;

// iPhone perf
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const DPR_CAP = isMobile ? 1.5 : 2;
let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
let lastFrame = 0;
const TARGET_DT = isMobile ? 33 : 16;

// Digital-rain visibility controls (start strong, then fade)
let rainTextAlpha = 0.32;
let rainTargetTextAlpha = 0.18;
let rainClearAlpha = 0.10;
let rainTargetClearAlpha = 0.18;

const canvas = document.getElementById("noise");
const ctx = canvas.getContext("2d");

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
const fontSize = 16;
let cols, rows, grid = [];

let noiseTextAlpha = 0.22;
let noiseTrailAlpha = 0.35;
let noiseTargetTextAlpha = noiseTextAlpha;
let noiseTargetTrailAlpha = noiseTrailAlpha;

let dropsY = [];
let dropsSpeed = [];
let dropsChar = [];

let suck = 0;
let suckTarget = 0;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  cols = Math.ceil(innerWidth / fontSize);
  rows = Math.ceil(innerHeight / fontSize);
  grid = new Array(cols * rows).fill("");

  dropsY = new Array(cols).fill(0);
  dropsSpeed = new Array(cols).fill(0).map(() => 0.45 + Math.random() * 1.2); // speed up
  dropsChar = new Array(cols).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]);

  ctx.font = fontSize + "px monospace";
}

function drawNoise(now = performance.now()) {
  if (now - lastFrame < TARGET_DT) {
    requestAnimationFrame(drawNoise);
    return;
  }
  lastFrame = now;

  suck += (suckTarget - suck) * 0.025;

  if (backgroundMode === "digitalRain") {
    ctx.fillStyle = `rgba(0,0,0,${rainClearAlpha + 0.25 * suck})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    rainTextAlpha += (rainTargetTextAlpha - rainTextAlpha) * 0.02;
    rainClearAlpha += (rainTargetClearAlpha - rainClearAlpha) * 0.02;

    const alpha = Math.max(0, rainTextAlpha * (1 - 0.65 * suck));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = fontSize + "px monospace";

    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.92) dropsChar[c] = chars[Math.floor(Math.random() * chars.length)];
      const x = c * fontSize;
      const y = dropsY[c] * fontSize;
      ctx.fillText(dropsChar[c], x, y);

      dropsY[c] += dropsSpeed[c];

      if (y > innerHeight + fontSize * 2 && Math.random() > 0.97) {
        dropsY[c] = 0;
        dropsSpeed[c] = 0.35 + Math.random() * 1.0;
      }
    }
  } else {
    ctx.fillStyle = `rgba(0,0,0,${noiseTrailAlpha})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    noiseTextAlpha += (noiseTargetTextAlpha - noiseTextAlpha) * 0.02;
    noiseTrailAlpha += (noiseTargetTrailAlpha - noiseTrailAlpha) * 0.02;

    const a = Math.max(0, noiseTextAlpha * (1 - 0.65 * suck));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.font = fontSize + "px monospace";

    const step = isMobile ? 2 : 1;
    for (let i = 0; i < grid.length; i += step) {
      if (Math.random() > 0.90) {
        grid[i] = chars[Math.floor(Math.random() * chars.length)];
      }
      const ch = grid[i];
      if (ch) {
        const x = (i % cols) * fontSize;
        const y = Math.floor(i / cols) * fontSize + fontSize;
        ctx.fillText(ch, x, y);
        if (Math.random() > 0.985) grid[i] = "";
      }
    }
  }

  requestAnimationFrame(drawNoise);
}

/* ===== ASCII DATA ===== */
const SKULL = `
 @@@@@                                        @@@@@
@@@@@@@                                      @@@@@@@
@@@@@@@           @@@@@@@@@@@@@@@            @@@@@@@
 @@@@@@@@       @@@@@@@@@@@@@@@@@@@        @@@@@@@@
     @@@@@     @@@@@@@@@@@@@@@@@@@@@     @@@@@
       @@@@@  @@@@@@@@@@@@@@@@@@@@@@@  @@@@@
         @@  @@@@@@@@@@@@@@@@@@@@@@@@@  @@
            @@@@@@@    @@@@@@    @@@@@@
            @@@@@@      @@@@      @@@@@
            @@@@@@      @@@@      @@@@@
             @@@@@@    @@@@@@    @@@@@
              @@@@@@@@@@@  @@@@@@@@@@
               @@@@@@@@@@  @@@@@@@@@
           @@   @@@@@@@@@@@@@@@@@   @@
           @@@@  @@@@ @ @ @ @ @@@@  @@@@
          @@@@@   @@@ @ @ @ @ @@@   @@@@@
        @@@@@      @@@@@@@@@@@@@      @@@@@
      @@@@          @@@@@@@@@@@          @@@@
   @@@@@              @@@@@@@              @@@@@
  @@@@@@@                                 @@@@@@@
   @@@@@                                   @@@@@
`;

const LOGO = `
██████╗ ███████╗██╗   ██╗██╗██╗  ████████╗ ██████╗ ██╗    ██╗███╗   ██╗
██╔══██╗██╔════╝██║   ██║██║██║  ╚══██╔══╝██╔═══██╗██║    ██║████╗  ██║
██║  ██║█████╗  ██║   ██║██║██║     ██║   ██║   ██║██║ █╗ ██║██╔██╗ ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║██║     ██║   ██║   ██║██║███╗██║██║╚██╗██║
██████╔╝███████╗ ╚████╔╝ ██║███████╗██║   ╚██████╔╝╚███╔███╔╝██║ ╚████║
╚═════╝ ╚══════╝  ╚═══╝  ╚═╝╚══════╝╚═╝    ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝
`;

/* ===== Scramble ===== */
const decode = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*░▒▓█";
function reserveBlock(text) {
  return text.split("\n").map(line => line.replace(/[^\s]/g, " ")).join("\n");
}
function scramble(el, text, speed = 22, steps = 50) {
  const lines = text.split("\n");
  const totalLines = lines.length;
  let revealed = 0;

  return new Promise(res => {
    const it = setInterval(() => {
      const out = lines.map((line, li) => {
        if (li < revealed) return line;
        if (line.length === 0) return "";
        return line.split("").map(ch => {
          if (ch === " ") return " ";
          return decode[Math.floor(Math.random() * decode.length)];
        }).join("");
      }).join("\n");

      el.textContent = out;

      revealed += totalLines / steps;
      if (revealed >= totalLines) {
        clearInterval(it);
        el.textContent = text;
        res();
      }
    }, speed);
  });
}

/* ===== Elements ===== */
// 다른 파일(game_video/boot_gate)에서 재사용하는 공용 DOM 핸들.
const skullSpan = document.getElementById("skullSpan");
const logoSpan = document.getElementById("logoSpan");

