/**
 * game_video.js
 * 역할: Skull Dice 게임, 페이지 오픈 연결, 비디오 모달/플레이리스트 로직을 담당합니다.
 * 참고: `sections`, `content`, `FEED_KEYS` 등은 navigation_feeds.js에서 먼저 초기화되어야 합니다.
 */
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
  // 중복 클릭으로 여러 interval이 겹치지 않게 잠금.
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
    // 주사위 결과에 맞는 코멘트만 서버에 요청.
    const response = await fetch('/dice-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance: distance })
    });

    if (!response.ok) {
      const errorMessage = await buildApiErrorMessage(
        response,
        `Server error: ${response.status}`
      );
      throw new Error(errorMessage);
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
    if (commentEl) commentEl.textContent = err?.message || "당장 뛰어! 지옥이 기다린다. (API 오류)";
  }

  isRolling = false;
}

function openPage(key) {
  const sec = sections[key];
  if (!sec) return;

  lastPageFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    skullgame: "🎲 Skull DIce",
    devilcoach: "Devil Coach (AI)",
  };
  contentTitle.textContent = titleMap[key] || "DEVILTOWN";

  if (FEED_KEYS.has(key)) {
    renderFeedSection(key);
  }

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  closeMenu(false);
  // 페이지 오버레이가 열리면 첫 포커스 가능한 요소로 이동(키보드 접근성).
  requestAnimationFrame(() => focusFirstElement(content));
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
      link.rel = "noopener noreferrer";
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
  lastVideoFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  videoModalTitle.textContent = title || "Video";
  currentVideoList = videoIds;
  currentTitleList = videoTitles || [];
  currentInstaList = videoInstagrams || [];
  currentVideoIndex = 0;

  updateVideoPlayer();

  document.body.classList.add("video-open");
  videoModal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => focusFirstElement(videoModalPanel));
}

function closeVideoModal() {
  document.body.classList.remove("video-open");
  videoModal.setAttribute("aria-hidden", "true");
  videoModalFrame.src = ""; // stop playback
  currentVideoList = [];
  currentTitleList = [];
  currentInstaList = [];
  currentVideoIndex = 0;
  if (lastVideoFocusedElement && typeof lastVideoFocusedElement.focus === "function") {
    // 닫았을 때 이전 버튼으로 포커스 복귀.
    lastVideoFocusedElement.focus();
  }
  lastVideoFocusedElement = null;
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

if (videoModalClose) videoModalClose.addEventListener("click", closeVideoModal);
if (videoModalBg) videoModalBg.addEventListener("click", closeVideoModal);

function closePage() {
  if (document.body.classList.contains("video-open")) closeVideoModal();
  document.body.classList.remove("page-open");
  pageOverlay.hidden = true;
  content.setAttribute("aria-hidden", "true");
  Object.values(sections).forEach(s => s.classList.remove("active"));
  if (lastPageFocusedElement && typeof lastPageFocusedElement.focus === "function") {
    lastPageFocusedElement.focus();
  }
  lastPageFocusedElement = null;
}

function handlePageClosePress(e) {
  e.preventDefault();
  e.stopPropagation();
  closePage();
}

if (pageClose) {
  pageClose.addEventListener("click", handlePageClosePress);
  pageClose.addEventListener("pointerup", handlePageClosePress);
}
if (pageOverlay) pageOverlay.addEventListener("click", closePage);

function activateMenuItem(btn) {
  openPage(btn.dataset.key);
}

menuItems.forEach(btn => {
  btn.addEventListener('click', () => {
    activateMenuItem(btn);
  });
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    if (document.body.classList.contains("video-open")) {
      trapFocus(videoModalPanel, e);
      return;
    }
    if (document.body.classList.contains("page-open")) {
      trapFocus(content, e);
      return;
    }
    if (document.body.classList.contains("menu-open")) {
      trapFocus(menuPanel, e);
      return;
    }
  }

  if (e.key === "Escape") {
    if (document.body.classList.contains("video-open")) closeVideoModal();
    closeMenu();
    closePage();
  }
});

function openPlaylistFromButton(btn) {
  const title = btn.getAttribute("data-title") || "Playlist";
  const videosStr = btn.getAttribute("data-videos");
  const titlesStr = btn.getAttribute("data-titles");
  const instasStr = btn.getAttribute("data-instagrams");

  let videoList = [];
  let titleList = [];
  let instaList = [];

  if (videosStr) {
    videoList = videosStr.split(",").map(s => s.trim()).filter(s => s.length > 0);
  } else {
    const pid = btn.getAttribute("data-playlist");
    if (pid) videoList = [pid];
  }

  if (titlesStr) {
    titleList = titlesStr.split(",").map(s => s.trim());
  }
  if (instasStr) {
    instaList = instasStr.split(",").map(s => s.trim());
  }

  if (videoList.length === 0) return;
  if (!document.body.classList.contains("page-open")) {
    openPage("archive");
  }
  openVideoCarousel(title, videoList, titleList, instaList);
}

document.addEventListener("click", (e) => {
  const playlistButton = e.target.closest(".playlist-open");
  if (!playlistButton || playlistButton.disabled) return;
  e.preventDefault();
  e.stopPropagation();
  openPlaylistFromButton(playlistButton);
});
