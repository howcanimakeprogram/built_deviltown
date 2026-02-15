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
const skullSpan = document.getElementById("skullSpan");
const logoSpan = document.getElementById("logoSpan");

/* ===== Menu logic ===== */
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const menuPanel = document.getElementById('menuPanel');
const menuClose = document.getElementById('menuClose');
const menuItems = [...document.querySelectorAll('.menu-item')];

let menuEnabled = false;

function openMenu(key = 'wtfis') {
  if (!menuEnabled) return;
  document.body.classList.add('menu-open');
  menuOverlay.hidden = false;
  menuPanel.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuItems.forEach(b => b.classList.toggle('active', b.dataset.key === key));
}
function closeMenu() {
  document.body.classList.remove('menu-open');
  menuOverlay.hidden = true;
  menuPanel.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
}
function enableMenu() {
  if (menuEnabled) return;
  menuEnabled = true;
  document.body.classList.add('menu-ready');
}

menuBtn.addEventListener('click', () => {
  if (document.body.classList.contains('menu-open')) closeMenu();
  else openMenu('wtfis');
});
menuClose.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

/* ===== Page overlay logic ===== */
const pageOverlay = document.getElementById("pageOverlay");
const content = document.getElementById("content");
const contentTitle = document.getElementById("contentTitle");
const pageClose = document.getElementById("pageClose");
const sections = {
  wtfis: document.getElementById("sec-wtfis"),
  schedule: document.getElementById("sec-schedule"),
  archive: document.getElementById("sec-archive"),
  mixes: document.getElementById("sec-mixes"),
  marathoner: document.getElementById("sec-marathoner"),
  skullgame: document.getElementById("sec-skullgame"),
  devilcoach: document.getElementById("sec-devilcoach"),
};

/* ===== Skull Game ===== */
let isRolling = false;

const skullGameBtn = document.getElementById("skullGameBtn");
if (skullGameBtn) {
  skullGameBtn.addEventListener("click", () => {
    if (isRolling) return;
    runSkullGame();
  });
}

async function runSkullGame() {
  if (isRolling) return;
  isRolling = true;

  const miniResult = document.getElementById("miniGameResult");
  if (!miniResult) return;

  // Clear previous results and show rolling state
  miniResult.style.display = "flex";
  miniResult.innerHTML = '<div style="font-size: 1.2rem; color: #ff0000; font-weight: bold; animation: pulse 0.5s infinite;">운명을 결정하는 중...</div>';

  if (typeof skullSpan !== 'undefined' && skullSpan) {
    skullSpan.classList.add("burst");
  }

  let steps = 0;
  const maxSteps = 25;
  const interval = setInterval(() => {
    steps++;
    const tmp = Math.floor(Math.random() * 42);
    miniResult.innerHTML = `<div style="font-size: 3.5rem; font-weight: 900; color: #ff0000; text-shadow: 0 0 15px rgba(255,0,0,0.5);">${tmp}km...</div>`;

    if (steps > maxSteps) {
      clearInterval(interval);
      finalizeGameResult(miniResult);
    }
  }, 70);
}

async function finalizeGameResult(target) {
  if (typeof skullSpan !== 'undefined' && skullSpan) {
    skullSpan.classList.remove("burst");
  }

  const rand = Math.random() * 100;
  let distance = "";
  if (rand < 1) distance = "0km";
  else if (rand < 2) distance = "42.195km";
  else if (rand < 7) distance = "30km LSD";
  else distance = `${Math.floor(Math.random() * 19) + 3}km`;

  target.innerHTML = `
    <div style="font-size: 4rem; font-weight: 900; color: #ff0000; text-shadow: 0 0 20px rgba(255,0,0,0.6); line-height: 1; margin: 0;">${distance}</div>
    <div id="diceComment" style="font-size: 1.1rem; color: #fff; font-weight: bold; margin-top: 15px; text-align: center; opacity: 0.8;">
      <span class="blink">악마가 코멘트를 생각하는 중...</span>
    </div>
  `;

  try {
    const response = await fetch('/dice-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance: distance })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const commentEl = document.getElementById("diceComment");
    if (commentEl) {
      commentEl.textContent = data.comment;
      commentEl.style.opacity = "1";
    }
  } catch (err) {
    console.error("Dice comment error:", err);
    const commentEl = document.getElementById("diceComment");
    if (commentEl) commentEl.textContent = "당장 뛰어! 지옥이 기다린다. (API 오류)";
  }

  isRolling = false;
}

function openPage(key) {
  const sec = sections[key];
  if (!sec) return;

  document.body.classList.add("page-open");
  pageOverlay.hidden = false;
  content.setAttribute("aria-hidden", "false");

  Object.values(sections).forEach(s => s.classList.remove("active"));
  sec.classList.add("active");

  const titleMap = {
    wtfis: "whatthefuckisdeviltown",
    schedule: "Schedule",
    archive: "Archive (Photo/Video)",
    mixes: "Mixes",
    marathoner: "Marathoner",
    skullgame: "🎲 SKULL Dice",
    devilcoach: "Devil Coach (AI)",
  };
  contentTitle.textContent = titleMap[key] || "DEVILTOWN";

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  closeMenu();
}

/* ===== Video Modal logic (Modified for Carousel) ===== */
const videoModal = document.getElementById("videoModal");
const videoModalBg = document.getElementById("videoModalBg");
const videoModalClose = document.getElementById("videoModalClose");
const videoModalTitle = document.getElementById("videoModalTitle");
const videoModalFrame = document.getElementById("videoModalFrame");
const videoCounter = document.getElementById("videoCounter");
const btnPrevVideo = document.getElementById("btnPrevVideo");
const btnNextVideo = document.getElementById("btnNextVideo");
const videoPlaylist = document.getElementById("videoPlaylist");

let currentVideoList = [];
let currentTitleList = [];
let currentInstaList = [];
let currentVideoIndex = 0;

function updateVideoPlayer() {
  const vid = currentVideoList[currentVideoIndex];
  if (!vid) return;

  // check playlist vs single video
  if (vid.startsWith("PL")) {
    videoModalFrame.src = `https://www.youtube.com/embed/videoseries?list=${vid}&rel=0&modestbranding=1&autoplay=1`;
  } else {
    videoModalFrame.src = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1&autoplay=1`;
  }

  // Update counter text
  if (currentVideoList.length > 1) {
    videoCounter.textContent = `${currentVideoIndex + 1} / ${currentVideoList.length}`;
    btnPrevVideo.style.display = "flex";
    btnNextVideo.style.display = "flex";
    videoPlaylist.style.display = "flex";
  } else {
    videoCounter.textContent = "";
    btnPrevVideo.style.display = "none";
    btnNextVideo.style.display = "none";
    videoPlaylist.style.display = "none";
  }

  // Update playlist active state
  renderPlaylist();
}

function renderPlaylist() {
  if (!videoPlaylist) return;
  videoPlaylist.innerHTML = "";

  if (currentVideoList.length <= 1) return;

  currentVideoList.forEach((vid, idx) => {
    const item = document.createElement("div"); // Changed to div to contain button + link
    item.className = "playlist-item";
    if (idx === currentVideoIndex) item.classList.add("active");

    // Grid layout for handling click on name vs link
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";

    // Name part (Clickable to change video)
    const nameSpan = document.createElement("span");
    const title = currentTitleList[idx] || `Track #${idx + 1}`;
    nameSpan.textContent = `${idx + 1}. ${title}`;
    // nameSpan.style.flexGrow = "1"; // No longer stretch, to keep username close
    nameSpan.style.marginRight = "8px";

    // Allow clicking the name to change video
    nameSpan.onclick = () => {
      currentVideoIndex = idx;
      updateVideoPlayer();
    };

    const container = document.createElement("div");
    container.style.flexGrow = "1";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.appendChild(nameSpan);

    // Instagram Link as @username
    const instaUrl = currentInstaList[idx];
    if (instaUrl) {
      // Extract username from URL (remove trailing slash first)
      const cleanUrl = instaUrl.replace(/\/$/, "");
      const username = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);

      const link = document.createElement("a");
      link.href = instaUrl;
      link.target = "_blank";
      link.textContent = `@${username}`;
      link.style.fontSize = "12px";
      link.style.color = "#aaa"; // Default color
      link.style.textDecoration = "none";
      link.style.opacity = "0.7";
      link.style.transition = "opacity 0.2s, color 0.2s";

      link.onmouseover = () => {
        link.style.opacity = "1";
        link.style.color = "#fff";
        link.style.textDecoration = "underline";
      };
      link.onmouseout = () => {
        link.style.opacity = "0.7";
        link.style.color = "#aaa";
        link.style.textDecoration = "none";
      };

      // Stop propagation
      link.onclick = (e) => e.stopPropagation();

      container.appendChild(link);
    }

    // Add container to item, and make the whole item background clickable for video change?
    // Actually, making the whole row clickable except the link is better UX.
    item.addEventListener("click", (e) => {
      // Only change video if not clicking the link (handled by loop logic or bubbling check)
      // But link has stopPropagation, so this fits.
      currentVideoIndex = idx;
      updateVideoPlayer();
    });

    item.appendChild(container);

    videoPlaylist.appendChild(item);
  });
}

function openVideoCarousel(title, videoIds, videoTitles, videoInstagrams) {
  videoModalTitle.textContent = title || "Video";
  currentVideoList = videoIds;
  currentTitleList = videoTitles || [];
  currentInstaList = videoInstagrams || [];
  currentVideoIndex = 0;

  updateVideoPlayer();

  document.body.classList.add("video-open");
  videoModal.setAttribute("aria-hidden", "false");
}

function closeVideoModal() {
  document.body.classList.remove("video-open");
  videoModal.setAttribute("aria-hidden", "true");
  videoModalFrame.src = ""; // stop playback
  currentVideoList = [];
  currentTitleList = [];
  currentInstaList = [];
  currentVideoIndex = 0;
}

// Nav buttons
if (btnPrevVideo && btnNextVideo) {
  btnPrevVideo.addEventListener("click", () => {
    if (currentVideoList.length <= 1) return;
    currentVideoIndex--;
    if (currentVideoIndex < 0) currentVideoIndex = currentVideoList.length - 1;
    updateVideoPlayer();
  });

  btnNextVideo.addEventListener("click", () => {
    if (currentVideoList.length <= 1) return;
    currentVideoIndex++;
    if (currentVideoIndex >= currentVideoList.length) currentVideoIndex = 0;
    updateVideoPlayer();
  });
}

videoModalClose.addEventListener("click", closeVideoModal);
videoModalBg.addEventListener("click", closeVideoModal);

function closePage() {
  if (document.body.classList.contains("video-open")) closeVideoModal();
  document.body.classList.remove("page-open");
  pageOverlay.hidden = true;
  content.setAttribute("aria-hidden", "true");
  Object.values(sections).forEach(s => s.classList.remove("active"));
}

pageClose.addEventListener("click", closePage);
pageOverlay.addEventListener("click", closePage);

menuItems.forEach(btn => {
  btn.addEventListener('click', () => openPage(btn.dataset.key));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains("video-open")) closeVideoModal();
    closeMenu();
    closePage();
  }
});

// bind playlist cards -> modal
document.querySelectorAll(".playlist-open").forEach(btn => {
  btn.addEventListener("click", () => {
    const title = btn.getAttribute("data-title") || "Playlist";

    // Check for 'data-videos' (comma separated list) first
    const videosStr = btn.getAttribute("data-videos");
    const titlesStr = btn.getAttribute("data-titles");
    const instasStr = btn.getAttribute("data-instagrams");

    let videoList = [];
    let titleList = [];
    let instaList = [];

    if (videosStr) {
      videoList = videosStr.split(",").map(s => s.trim()).filter(s => s.length > 0);
    } else {
      // Fallback for old data-playlist
      const pid = btn.getAttribute("data-playlist");
      if (pid) videoList = [pid];
    }

    if (titlesStr) {
      titleList = titlesStr.split(",").map(s => s.trim());
    }

    if (instasStr) {
      instaList = instasStr.split(",").map(s => s.trim());
    }

    if (videoList.length > 0) {
      openPage("archive");
      openVideoCarousel(title, videoList, titleList, instaList);
    }
  });
});

/* ===== Glitch burst ===== */
let glitchTimer = null;

/* ===== Sequence ===== */
async function play() {
  skullSpan.textContent = "";
  logoSpan.textContent = reserveBlock(LOGO);

  skullSpan.classList.remove("glitch", "burst");
  logoSpan.classList.remove("glitch", "burst");
  if (glitchTimer) clearInterval(glitchTimer);
  glitchTimer = null;

  await scramble(skullSpan, SKULL, 22, 55);
  await scramble(logoSpan, LOGO, 18, 55);

  enableMenu();

  skullSpan.classList.add("glitch");
  logoSpan.classList.add("glitch");

  glitchTimer = setInterval(() => {
    if (Math.random() < 0.22) {
      skullSpan.classList.add("burst");
      logoSpan.classList.add("burst");
      setTimeout(() => {
        skullSpan.classList.remove("burst");
        logoSpan.classList.remove("burst");
      }, 140);
    }
  }, 360);
}

// replay
window.addEventListener("keydown", e => { if (e.code === "Space") play(); });
window.addEventListener("touchstart", () => play(), { passive: true });

/* ===== Boot ===== */
function seedMarathonerSkulls() {
  document.querySelectorAll(".runSkull").forEach(el => {
    el.textContent = SKULL.trim();
  });
}

window.addEventListener("resize", resize);
resize();
drawNoise();
seedMarathonerSkulls();

// start strong rain then fade + intro start
rainTextAlpha = 0.34;
rainTargetTextAlpha = 0.34;
rainClearAlpha = 0.08;
rainTargetClearAlpha = 0.08;

// Entrance Gate Logic (Simple 666 Version)
const gateOverlay = document.getElementById('gateOverlay');
const enterBtn = document.getElementById('enterBtn');
const devilCheck = document.getElementById('devilCheck');
const rayIdDisplay = document.getElementById('rayId');

// Generate Hellfire Ray ID
if (rayIdDisplay) {
  rayIdDisplay.textContent = '666-DEVIL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Enter button click handler
if (enterBtn && gateOverlay) {
  enterBtn.addEventListener('click', () => {
    if (devilCheck && devilCheck.checked) {
      // Fade out overlay
      gateOverlay.style.opacity = '0';
      gateOverlay.style.pointerEvents = 'none';

      // Start main site intro
      setTimeout(() => {
        gateOverlay.style.display = 'none';
        rainTargetTextAlpha = 0.18;
        rainTargetClearAlpha = 0.18;
        play();
      }, 600);
    } else {
      alert('Access denied. Humanity detected.');
    }
  });
}

// Enter key support
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && gateOverlay.style.display !== 'none') {
    if (enterBtn) enterBtn.click();
  }
});
