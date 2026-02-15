/**
 * boot_gate.js
 * 역할: 인트로 재생(play), 글리치 이펙트, 입장 게이트/부팅 초기화를 담당합니다.
 * 참고: 제일 마지막에 로드되어 초기화(`resize`, `drawNoise`)를 안전하게 실행합니다.
 */
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

  try {
    await scramble(skullSpan, SKULL, 22, 55);
    await scramble(logoSpan, LOGO, 18, 55);
  } catch (err) {
    console.error("Intro animation error:", err);
  } finally {
    enableMenu();
  }

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
window.addEventListener("touchstart", (e) => {
  // 버튼/입력창 터치는 제외하고 빈 화면 탭만 인트로 재생으로 사용.
  const interactive = e.target.closest(
    "#gateOverlay, #menuPanel, #content, #videoModal, button, input, a, textarea, select, label"
  );
  if (interactive) return;
  play();
}, { passive: true });

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

// Entrance Gate Logic (User's Original)
const enterBtn = document.getElementById('enterBtn');
const devilCheck = document.getElementById('devilCheck');
const gateOverlay = document.getElementById('gateOverlay');

if (enterBtn) {
  enterBtn.addEventListener('click', () => {
    if (devilCheck && devilCheck.checked) {
      // 게이트를 닫고 본 화면 초기 애니메이션으로 진입.
      // Fade out and enter
      gateOverlay.style.opacity = '0';
      gateOverlay.style.transition = 'opacity 0.6s ease';

      setTimeout(() => {
        gateOverlay.style.display = 'none';
        rainTargetTextAlpha = 0.18;
        rainTargetClearAlpha = 0.18;
        enableMenu();
        play();
      }, 600);
    } else {
      alert('Access denied. Humanity detected.');
    }
  });
}

// Enter key support
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && gateOverlay && gateOverlay.style.display !== 'none') {
    if (enterBtn) enterBtn.click();
  }
});
