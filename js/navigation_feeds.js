/**
 * navigation_feeds.js
 * 역할: 메뉴/모달 열고 닫기, 포커스 트랩(접근성), 피드/태그 필터 렌더링을 담당합니다.
 * 참고: `openPage`, `closePage`, `renderFeedSection` 같은 핵심 전역 함수가 여기서 정의됩니다.
 */
/* ===== Menu logic ===== */
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const menuPanel = document.getElementById('menuPanel');
const menuClose = document.getElementById('menuClose');
const menuItems = [...document.querySelectorAll('.menu-item')];

let menuEnabled = false;
let lastMenuFocusedElement = null;

// 메뉴를 열 때 마지막 포커스를 저장해 두면, 닫을 때 원래 위치로 복귀시킬 수 있습니다.
function openMenu(key = 'wtfis') {
  if (!menuEnabled) return;
  if (!document.body.classList.contains("menu-open")) {
    lastMenuFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  document.body.classList.add('menu-open');
  menuOverlay.hidden = false;
  menuPanel.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuItems.forEach(b => b.classList.toggle('active', b.dataset.key === key));
  requestAnimationFrame(() => focusFirstElement(menuPanel));
}
function closeMenu(restoreFocus = true) {
  document.body.classList.remove('menu-open');
  menuOverlay.hidden = true;
  menuPanel.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  if (
    restoreFocus
    && lastMenuFocusedElement
    && typeof lastMenuFocusedElement.focus === "function"
  ) {
    lastMenuFocusedElement.focus();
  }
  lastMenuFocusedElement = null;
}
function enableMenu() {
  if (menuEnabled) return;
  menuEnabled = true;
  document.body.classList.add('menu-ready');
}

function toggleMenu() {
  if (document.body.classList.contains('menu-open')) closeMenu();
  else openMenu('wtfis');
}

if (menuBtn) {
  menuBtn.addEventListener('click', toggleMenu);
}

if (menuClose) {
  menuClose.addEventListener('click', closeMenu);
}

if (menuOverlay) {
  menuOverlay.addEventListener('click', closeMenu);
}

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

const videoModalPanel = document.querySelector(".video-modal-panel");
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let lastPageFocusedElement = null;
let lastVideoFocusedElement = null;

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter(el => !el.hasAttribute("hidden") && el.offsetParent !== null);
}

function focusFirstElement(container) {
  const focusables = getFocusableElements(container);
  if (focusables.length > 0) {
    focusables[0].focus();
  }
}

function trapFocus(container, event) {
  if (!container || event.key !== "Tab") return;
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ===== Feed sections (tag filter + render) ===== */
const TAG_BAR_MIN_COUNT = 2;
const FEED_KEYS = new Set(["wtfis", "schedule", "archive", "mixes", "marathoner"]);
const CALENDAR_SUBSCRIBE_URL = "webcal://p44-caldav.icloud.com/published/2/NDE4ODE1NjY2NDE4ODE1NqDjLwq8GMN_zupBHSe0DAmmz8VvM5LEnkcLBL298CvgpMqp9UnWVYdyl0KkEr3T51GFC-uIzKH_pnozZxt_HFc";

const FEED_DOM = {
  wtfis: {
    list: document.getElementById("wtfisFeed"),
    tagBar: document.getElementById("wtfisTagBar"),
    empty: document.getElementById("wtfisEmpty"),
  },
  schedule: {
    list: document.getElementById("scheduleFeed"),
    tagBar: document.getElementById("scheduleTagBar"),
    empty: document.getElementById("scheduleEmpty"),
  },
  archive: {
    list: document.getElementById("archiveFeed"),
    tagBar: document.getElementById("archiveTagBar"),
    empty: document.getElementById("archiveEmpty"),
  },
  mixes: {
    list: document.getElementById("mixesFeed"),
    tagBar: document.getElementById("mixesTagBar"),
    empty: document.getElementById("mixesEmpty"),
  },
  marathoner: {
    list: document.getElementById("marathonerFeed"),
    tagBar: document.getElementById("marathonerTagBar"),
    empty: document.getElementById("marathonerEmpty"),
  },
};

// activeTag: 현재 선택 태그 / loaded: 최초 데이터 로딩 완료 여부
const FEED_STATE = {
  wtfis: { activeTag: "all", loaded: true },
  schedule: { activeTag: "all", loaded: false, loading: false, error: null },
  archive: { activeTag: "all", loaded: true },
  mixes: { activeTag: "all", loaded: true },
  marathoner: { activeTag: "all", loaded: true },
};

// 각 섹션 카드 데이터 스키마:
// { id, title, subtitle, date, cover, tags[], meta[], action? }
const FEED_DATA = {
  schedule: [],
  wtfis: [
    {
      id: "logo-set",
      title: "DEVILTOWN LOGO SYSTEM",
      subtitle: "Main mark, mono variants, stamp drafts",
      date: "2025.11",
      cover: "LOGO",
      tags: ["logo", "graphics"],
      meta: ["asset kit", "brand core"],
      action: { label: "Preview soon", disabled: true },
    },
    {
      id: "tees-drop",
      title: "TEE GRAPHICS V2",
      subtitle: "Front/back print experiments",
      date: "2025.10",
      cover: "TEES",
      tags: ["tees", "graphics"],
      meta: ["screen print", "drop prep"],
      action: { label: "Lookbook soon", disabled: true },
    },
    {
      id: "poster-lab",
      title: "POSTER LAB CUTS",
      subtitle: "Flyer / poster studies for events",
      date: "2025.09",
      cover: "POSTER",
      tags: ["poster", "event", "graphics"],
      meta: ["A3 / digital", "night campaigns"],
      action: { label: "Archive soon", disabled: true },
    },
    {
      id: "visual-experiment",
      title: "ASCII / NOISE VISUAL EXPERIMENT",
      subtitle: "Live visual fragments and motion tests",
      date: "2025.08",
      cover: "EXPERIMENT",
      tags: ["experiment", "visual", "graphics"],
      meta: ["stage visual", "web adaptation"],
      action: { label: "Details soon", disabled: true },
    },
  ],
  archive: [
    {
      id: "ready2drink",
      title: "READY 2 DRINK SESSION",
      subtitle: "6-track video drop",
      date: "2025.11",
      cover: "VIDEO SET",
      tags: ["video", "event", "night"],
      meta: ["youtube playlist", "live set"],
      action: {
        kind: "playlist",
        label: "Open Playlist ▶",
        title: "ĐɆVłⱠ₮Ø₩₦ ⱤɆ₳ĐɎ 2 ĐⱤł₦₭",
        videos: ["o2_g_GyF1iE", "TzyiGAERKVw", "vbeBVo2jiRY", "_7P7_9RgDQM", "vbeBVo2jiRY", "w35YjgOUaZk"],
        titles: ["CHBS", "tejava_assassins", "VIC_CATLE", "FAACIA", "TENJU", "mhmd"],
        instagrams: [
          "https://www.instagram.com/givemeazerocoke/",
          "https://www.instagram.com/tejava_assassins/",
          "https://www.instagram.com/vic_catle/",
          "https://www.instagram.com/faacia.or0/",
          "https://www.instagram.com/tenjumakes/",
          "https://www.instagram.com/mhmd_muhammmmmad/",
        ],
      },
    },
    {
      id: "anniv-photo",
      title: "2ND ANNIVERSARY SNAPSHOT",
      subtitle: "Crowd / backstage / moments",
      date: "2025.08",
      cover: "PHOTO LOG",
      tags: ["photo", "event"],
      meta: ["night venue", "community"],
      action: { label: "Photo album soon", disabled: true },
    },
    {
      id: "artwork-archive",
      title: "ARTWORK ARCHIVE",
      subtitle: "Poster / tee / visual experiments",
      date: "2025.06",
      cover: "DESIGN DROP",
      tags: ["design", "logo", "poster"],
      meta: ["graphics", "brand study"],
      action: { label: "Design index soon", disabled: true },
    },
    {
      id: "street-cuts",
      title: "AFTER-RUN STREET CUTS",
      subtitle: "City fragments after midnight runs",
      date: "2025.04",
      cover: "PHOTO CUTS",
      tags: ["photo", "night"],
      meta: ["street", "run culture"],
      action: { label: "Archive in progress", disabled: true },
    },
  ],
  mixes: [
    {
      id: "mix-1",
      title: "DEVILTOWN NIGHT BUS 001",
      subtitle: "Fast and dark warm-up run",
      date: "2026.01.12",
      cover: "MIX 001",
      tags: ["techno", "live", "2026"],
      meta: ["platform: soundcloud", "duration: 58m"],
      action: { label: "Drop soon", disabled: true },
    },
    {
      id: "mix-2",
      title: "HELL GATE RADIO CUT",
      subtitle: "Pressure + drive focused set",
      date: "2026.01.03",
      cover: "MIX 002",
      tags: ["hard", "radio", "2026"],
      meta: ["platform: youtube", "duration: 46m"],
      action: { label: "Drop soon", disabled: true },
    },
    {
      id: "mix-3",
      title: "CITY TUNNEL LIVE TAKE",
      subtitle: "Live-room recording",
      date: "2025.12.22",
      cover: "MIX 003",
      tags: ["techno", "live", "hard"],
      meta: ["platform: soundcloud", "duration: 1h 12m"],
      action: { label: "Drop soon", disabled: true },
    },
  ],
  marathoner: [
    {
      id: "run-1",
      title: "Han River Long Run",
      subtitle: "Steady breathing, controlled finish",
      date: "2026-02-14",
      cover: "LONG RUN",
      tags: ["longrun", "raceprep"],
      meta: ["distance: 28.4km", "time: 2:28:10", "pace: 5:13/km", "route: Han Riverside", "mood: focused", "note: finish controlled"],
      action: { label: "Route note", disabled: true },
    },
    {
      id: "run-2",
      title: "Track Intervals 8x1K",
      subtitle: "Sharp but stable recovery",
      date: "2026-02-10",
      cover: "INTERVAL",
      tags: ["interval", "raceprep"],
      meta: ["distance: 14.0km", "time: 1:07:22", "pace: 4:48/km", "route: Track 8x1K", "mood: sharp", "note: stable recovery"],
      action: { label: "Session detail", disabled: true },
    },
    {
      id: "run-3",
      title: "Trail Recovery Loop",
      subtitle: "Light effort on soft ground",
      date: "2026-02-06",
      cover: "TRAIL",
      tags: ["trail", "easy"],
      meta: ["distance: 11.2km", "time: 1:05:41", "pace: 5:51/km", "route: Gwanak trail", "mood: reset", "note: easy effort"],
      action: { label: "Trail note", disabled: true },
    },
  ],
};

function normalizeTag(tag) {
  return (tag || "all").toString().trim().toLowerCase();
}

function escapeHtml(text) {
  return (text || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function itemTags(item) {
  return Array.isArray(item.tags) ? item.tags.map(normalizeTag).filter(Boolean) : [];
}

function filterFeedItems(items, tag) {
  if (tag === "all") return items;
  return items.filter(item => itemTags(item).includes(tag));
}

function collectFeedTags(items) {
  const tagSet = new Set();
  items.forEach(item => itemTags(item).forEach(tag => tagSet.add(tag)));
  return [...tagSet];
}

function renderTagBar(feedKey, tags) {
  const target = FEED_DOM[feedKey];
  if (!target || !target.tagBar) return;
  const uniqueTags = [...new Set(tags.map(normalizeTag).filter(Boolean))];

  if (uniqueTags.length < TAG_BAR_MIN_COUNT) {
    target.tagBar.hidden = true;
    target.tagBar.innerHTML = "";
    return;
  }

  const activeTag = FEED_STATE[feedKey].activeTag;
  const orderedTags = ["all", ...uniqueTags.sort((a, b) => a.localeCompare(b))];

  target.tagBar.innerHTML = orderedTags.map(tag => {
    const active = activeTag === tag ? " active" : "";
    return `<button type="button" class="feed-tag-btn${active}" data-feed-key="${feedKey}" data-tag="${tag}">#${escapeHtml(tag)}</button>`;
  }).join("");
  target.tagBar.hidden = false;
}

function renderFeedBadges(feedKey, tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `
    <div class="feed-badges">
      ${tags.map(tag => `<button type="button" class="feed-badge" data-feed-key="${feedKey}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`).join("")}
    </div>
  `;
}

function renderFeedAction(item) {
  if (!item.action) return "";
  if (item.action.kind === "playlist") {
    const videos = (item.action.videos || []).join(",");
    const titles = (item.action.titles || []).join(",");
    const instagrams = (item.action.instagrams || []).join(",");
    return `
      <button class="btn feed-action playlist-open"
        data-title="${escapeHtml(item.action.title || item.title)}"
        data-videos="${escapeHtml(videos)}"
        data-titles="${escapeHtml(titles)}"
        data-instagrams="${escapeHtml(instagrams)}">
        ${escapeHtml(item.action.label || "Open ▶")}
      </button>
    `;
  }
  const disabledAttr = item.action.disabled ? " disabled" : "";
  return `<button class="btn feed-action"${disabledAttr}>${escapeHtml(item.action.label || "Open")}</button>`;
}

function renderStandardFeedCard(feedKey, item) {
  return `
    <article class="feed-card">
      <div class="feed-card-head">
        <div>
          <h3 class="feed-card-title">${escapeHtml(item.title)}</h3>
          <p class="feed-card-sub">${escapeHtml(item.subtitle || "")}</p>
        </div>
        <span class="feed-card-date">${escapeHtml(item.date || "")}</span>
      </div>
      <div class="feed-cover">${escapeHtml(item.cover || "ITEM")}</div>
      <div class="feed-meta">
        ${(item.meta || []).map(line => `<span>${escapeHtml(line)}</span>`).join("")}
      </div>
      ${renderFeedBadges(feedKey, item.tags)}
      ${renderFeedAction(item)}
    </article>
  `;
}

function setFeedEmpty(feedKey, show, message) {
  const target = FEED_DOM[feedKey];
  if (!target || !target.empty) return;
  if (message) target.empty.textContent = message;
  target.empty.hidden = !show;
}

async function buildApiErrorMessage(response, defaultMessage) {
  const retryAfter = response.headers.get("Retry-After");
  const status = response.status;
  let detail = "";
  try {
    const payload = await response.json();
    if (payload && typeof payload.detail === "string") {
      detail = payload.detail;
    }
  } catch (_) {
    // ignore json parse errors and use fallback
  }

  if (status === 429) {
    const waitText = retryAfter ? `${retryAfter}초` : "잠시";
    return detail || `요청이 너무 많다. ${waitText} 후 다시 시도하거나 새로고침해라.`;
  }

  if (status >= 500) {
    return "서버가 잠깐 불안정하다. 잠시 후 다시 시도하거나 새로고침해라.";
  }

  if (status === 413) {
    return detail || "요청 값이 너무 길다. 입력을 줄여서 다시 시도해라.";
  }

  if (status === 400) {
    return detail || "요청 형식이 잘못됐다. 다시 시도해라.";
  }

  return detail || defaultMessage;
}

function renderStaticFeed(feedKey) {
  const target = FEED_DOM[feedKey];
  if (!target || !target.list) return;

  const sourceItems = FEED_DATA[feedKey] || [];
  renderTagBar(feedKey, collectFeedTags(sourceItems));

  const activeTag = FEED_STATE[feedKey].activeTag;
  const filtered = filterFeedItems(sourceItems, activeTag);
  target.list.innerHTML = filtered.map(item => renderStandardFeedCard(feedKey, item)).join("");
  setFeedEmpty(feedKey, filtered.length === 0, "해당 태그 항목이 없습니다.");
}

function formatScheduleTime(start, end, allDay) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return "-";
  if (allDay) return "All day";
  const timeOpts = { hour: "2-digit", minute: "2-digit", hour12: false };
  const startStr = start.toLocaleTimeString("ko-KR", timeOpts);
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return startStr;
  const endStr = end.toLocaleTimeString("ko-KR", timeOpts);
  return `${startStr} - ${endStr}`;
}

function scheduleBucket(dateObj) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.floor((target - today) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays > 0 && diffDays <= 7) return "This Week";
  if (target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear()) return "This Month";
  return "Upcoming";
}

function mapScheduleEvent(raw, idx) {
  const start = new Date(raw.start || "");
  if (Number.isNaN(start.getTime())) return null;
  const end = raw.end ? new Date(raw.end) : null;
  const validEnd = end && !Number.isNaN(end.getTime()) ? end : null;

  return {
    id: raw.id || `ev-${idx}`,
    title: raw.title || "Untitled",
    location: raw.location || "",
    notes: raw.notes || "",
    categories: Array.isArray(raw.categories) ? raw.categories.map(normalizeTag).filter(Boolean) : [],
    start,
    end: validEnd,
    allDay: Boolean(raw.all_day),
    dateLabel: start.toLocaleDateString("ko-KR"),
  };
}

function renderScheduleFeed() {
  const target = FEED_DOM.schedule;
  if (!target || !target.list) return;

  const events = FEED_DATA.schedule || [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const timelineEvents = events.filter(ev => (ev.end || ev.start) >= todayStart);

  const allTags = collectFeedTags(timelineEvents.map(ev => ({ tags: ev.categories })));
  renderTagBar("schedule", allTags);

  const activeTag = FEED_STATE.schedule.activeTag;
  const filtered = activeTag === "all"
    ? timelineEvents
    : timelineEvents.filter(ev => ev.categories.includes(activeTag));

  if (!FEED_STATE.schedule.loaded && FEED_STATE.schedule.loading) {
    target.list.innerHTML = `
      <div class="schedule-item">
        <div class="schedule-title">Loading schedule...</div>
        <div class="schedule-note">iCloud 캘린더에서 이벤트를 가져오는 중입니다.</div>
      </div>
    `;
    setFeedEmpty("schedule", false);
    return;
  }

  if (filtered.length === 0) {
    target.list.innerHTML = "";
    const message = FEED_STATE.schedule.error
      ? "일정을 불러오지 못했습니다. 서버 로그를 확인하세요."
      : "해당 조건의 일정이 없습니다.";
    setFeedEmpty("schedule", true, message);
    return;
  }

  const grouped = { Today: [], "This Week": [], "This Month": [], Upcoming: [] };
  filtered.forEach(ev => {
    grouped[scheduleBucket(ev.start)].push(ev);
  });

  const order = ["Today", "This Week", "This Month", "Upcoming"];
  const html = order.map(groupName => {
    const groupItems = grouped[groupName];
    if (!groupItems || groupItems.length === 0) return "";
    const cards = groupItems.map(ev => `
      <article class="schedule-item">
        <div class="schedule-time">${escapeHtml(ev.dateLabel)} · ${escapeHtml(formatScheduleTime(ev.start, ev.end, ev.allDay))}</div>
        <div class="schedule-title">${escapeHtml(ev.title)}</div>
      </article>
    `).join("");
    return `<section class="schedule-group"><h4 class="schedule-group-title">${groupName}</h4>${cards}</section>`;
  }).join("");

  const subscribeCard = `
      <article class="schedule-item">
      <div class="schedule-title">iCloud Calendar Subscribe</div>
      <div class="schedule-note">모바일 캘린더 앱에서 실시간으로 동기화할 수 있습니다.</div>
      <a class="btn feed-action" target="_blank" rel="noopener noreferrer" href="${CALENDAR_SUBSCRIBE_URL}">📅 Subscribe</a>
    </article>
  `;

  target.list.innerHTML = html + subscribeCard;
  setFeedEmpty("schedule", false);
}

async function loadScheduleEvents() {
  // 중복 요청 방지: 이미 로드했거나 로딩 중이면 즉시 반환
  if (FEED_STATE.schedule.loaded || FEED_STATE.schedule.loading) return;
  FEED_STATE.schedule.loading = true;
  FEED_STATE.schedule.error = null;
  renderScheduleFeed();

  try {
    const res = await fetch("/calendar/events", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const events = Array.isArray(payload.events) ? payload.events : [];

    FEED_DATA.schedule = events
      .map((ev, idx) => mapScheduleEvent(ev, idx))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    FEED_STATE.schedule.loaded = true;
  } catch (err) {
    FEED_STATE.schedule.error = err;
    FEED_STATE.schedule.loaded = true;
    FEED_DATA.schedule = [];
    console.error("Schedule load error:", err);
  } finally {
    FEED_STATE.schedule.loading = false;
    renderScheduleFeed();
  }
}

function renderFeedSection(feedKey) {
  if (!FEED_KEYS.has(feedKey)) return;
  if (feedKey === "schedule") {
    // Schedule은 서버(API) 데이터를 쓰므로 별도 로딩 플로우를 사용합니다.
    renderScheduleFeed();
    if (!FEED_STATE.schedule.loaded) {
      void loadScheduleEvents();
    }
    return;
  }
  renderStaticFeed(feedKey);
}

function setFeedTag(feedKey, tag) {
  if (!FEED_KEYS.has(feedKey)) return;
  FEED_STATE[feedKey].activeTag = normalizeTag(tag);
  renderFeedSection(feedKey);
}

function initFeeds() {
  FEED_KEYS.forEach(key => renderFeedSection(key));
}

document.addEventListener("click", (e) => {
  const tagBtn = e.target.closest(".feed-tag-btn");
  if (tagBtn) {
    e.preventDefault();
    setFeedTag(tagBtn.dataset.feedKey, tagBtn.dataset.tag);
    return;
  }
  const badgeBtn = e.target.closest(".feed-badge");
  if (badgeBtn) {
    e.preventDefault();
    setFeedTag(badgeBtn.dataset.feedKey, badgeBtn.dataset.tag);
  }
});

initFeeds();
