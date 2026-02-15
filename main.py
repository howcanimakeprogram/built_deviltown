import os
import uvicorn
import logging
import time
import uuid
import threading
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from urllib.parse import urlparse
from urllib.request import Request as URLRequest, urlopen
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Load .env before logger/config initialization so env-driven settings are applied at boot.
load_dotenv()


def _env_int_early(name: str, default: int, minimum: int = 1) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        parsed = int(raw)
    except (TypeError, ValueError):
        return default
    if parsed < minimum:
        return minimum
    return parsed


"""
Devil Town Backend (main.py)
역할: 메인 사이트 서빙, AI 코치 채팅 API, 주사위 게임 코멘트 API 제공
호출 관계: Frontend (index.html + js/*.js) -> Backend API
수정 시 주의사항: .env 파일에 GOOGLE_API_KEY 필수, Logs/ 폴더 권한 확인 필요
"""

# --- Logging Setup ---
LOG_DIR = os.path.join(os.getcwd(), "Logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "server.log")
LOG_MAX_BYTES = _env_int_early("LOG_MAX_BYTES", 5 * 1024 * 1024, minimum=1024)
LOG_BACKUP_COUNT = _env_int_early("LOG_BACKUP_COUNT", 10, minimum=1)

# Global Rules 기반 로그 포맷 표준화 (job_id, step, status 등 포함)
LOG_FORMAT = '[%(levelname)s] job_id=%(job_id)s step=%(step)s %(message)s status=%(status)s duration_ms=%(duration_ms)s'

class CustomFormatter(logging.Formatter):
    def format(self, record):
        if not hasattr(record, 'job_id'): record.job_id = "SYSTEM"
        if not hasattr(record, 'step'): record.step = "CORE"
        if not hasattr(record, 'status'): record.status = "SUCCESS"
        if not hasattr(record, 'duration_ms'): record.duration_ms = 0
        return super().format(record)

# 로그 파일이 무한히 커지는 것을 방지하기 위해 용량 기준으로 롤링합니다.
handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=LOG_MAX_BYTES,
    backupCount=LOG_BACKUP_COUNT,
    encoding='utf-8'
)
handler.setFormatter(CustomFormatter(LOG_FORMAT))
console = logging.StreamHandler()
console.setFormatter(CustomFormatter(LOG_FORMAT))

logging.basicConfig(level=logging.INFO, handlers=[handler, console])
logger = logging.getLogger("DevilTown")

logger.info("Initializing Devil Town Backend...", extra={"step": "INIT", "status": "START"})

app = FastAPI()

APP_STARTED_AT = datetime.now(timezone.utc).isoformat()
APP_VERSION_FILE = os.path.join(os.getcwd(), "VERSION")


def _load_app_version() -> str:
    """
    버전 우선순위:
    1) APP_VERSION 환경변수
    2) VERSION 파일
    3) fallback: dev
    """
    env_version = os.getenv("APP_VERSION", "").strip()
    if env_version:
        return env_version

    try:
        with open(APP_VERSION_FILE, "r", encoding="utf-8") as f:
            file_version = f.read().strip()
            if file_version:
                return file_version
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.warning(
            f"Failed to read VERSION file: {e}",
            extra={"step": "VERSION_LOAD", "status": "WARN"},
        )

    return "dev"

def _env_csv(name: str, default: str):
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _normalize_origin(origin_like: str) -> str:
    raw = (origin_like or "").strip()
    if not raw:
        return ""

    parsed = urlparse(raw)
    if not parsed.scheme or not parsed.netloc:
        # 운영 중 오타로 스킴 없이 넣는 경우를 보정.
        parsed = urlparse(f"https://{raw}")

    if not parsed.scheme or not parsed.netloc:
        return ""

    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"


# 프로덕션 기본값은 공식 도메인 2개만 허용. (로컬 테스트는 .env에서 추가)
CORS_ALLOWED_ORIGINS_RAW = _env_csv(
    "CORS_ALLOWED_ORIGINS",
    "https://welcometodeviltown.com,https://www.welcometodeviltown.com",
)
_normalized_origins = [_normalize_origin(item) for item in CORS_ALLOWED_ORIGINS_RAW]
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([item for item in _normalized_origins if item]))
if not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        "https://welcometodeviltown.com",
        "https://www.welcometodeviltown.com",
    ]
ALLOWED_ORIGIN_SET = set(CORS_ALLOWED_ORIGINS)
API_ORIGIN_RESTRICTED_PATHS = {"/chat", "/dice-comment", "/calendar/events"}
APP_VERSION = _load_app_version()

logger.info(
    f"Boot config loaded version={APP_VERSION} cors_origins={len(CORS_ALLOWED_ORIGINS)} "
    f"log_max_bytes={LOG_MAX_BYTES} log_backup_count={LOG_BACKUP_COUNT}",
    extra={"step": "BOOT_CONFIG", "status": "SUCCESS"},
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def _is_allowed_site_request(request: Request) -> bool:
    """
    브라우저 기반 API 호출은 Origin/Referer를 검사해서
    허용된 사이트에서 들어온 요청만 통과시킨다.
    """
    origin = _normalize_origin(request.headers.get("origin", ""))
    if origin:
        return origin in ALLOWED_ORIGIN_SET

    referer = _normalize_origin(request.headers.get("referer", ""))
    if referer:
        return referer in ALLOWED_ORIGIN_SET

    # Origin/Referer가 모두 없는 요청은 서버 간 직접 호출로 보고 차단.
    return False


@app.middleware("http")
async def enforce_api_origin(request: Request, call_next):
    if request.method != "OPTIONS" and request.url.path in API_ORIGIN_RESTRICTED_PATHS:
        if not _is_allowed_site_request(request):
            job_id = getattr(request.state, "job_id", "SYSTEM")
            logger.warning(
                f"Blocked API request by origin guard path={request.url.path}",
                extra={"job_id": job_id, "step": "ORIGIN_GUARD", "status": "FAIL", "duration_ms": 0},
            )
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden origin. This API is only available from the official site."},
            )
    return await call_next(request)

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY")
if genai is None:
    logger.warning("google-generativeai package is not installed. AI endpoints will run in fallback mode.",
                   extra={"step": "GEMINI_CONFIG", "status": "WARN"})
elif not API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables!", extra={"step": "GEMINI_CONFIG", "status": "FAIL"})
else:
    logger.info("GOOGLE_API_KEY loaded from environment.", extra={"step": "GEMINI_CONFIG"})

generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

def _env_int(name: str, default: int, minimum: int = 1) -> int:
    raw = os.getenv(name, str(default))
    try:
        parsed = int(raw)
    except (TypeError, ValueError):
        logger.warning(
            f"Invalid env int for {name}: {raw}. fallback={default}",
            extra={"step": "ENV_PARSE", "status": "WARN"},
        )
        return default
    if parsed < minimum:
        logger.warning(
            f"Env int below minimum for {name}: {parsed}. min={minimum}",
            extra={"step": "ENV_PARSE", "status": "WARN"},
        )
        return minimum
    return parsed


RATE_LIMIT_WINDOW_SECONDS = _env_int("RATE_LIMIT_WINDOW_SECONDS", 60)
CHAT_RATE_LIMIT_PER_WINDOW = _env_int("CHAT_RATE_LIMIT_PER_WINDOW", 60)
DICE_RATE_LIMIT_PER_WINDOW = _env_int("DICE_RATE_LIMIT_PER_WINDOW", 120)
CALENDAR_RATE_LIMIT_PER_WINDOW = _env_int("CALENDAR_RATE_LIMIT_PER_WINDOW", 30)
RATE_LIMIT_TRACKER_MAX_KEYS = _env_int("RATE_LIMIT_TRACKER_MAX_KEYS", 10000)
MAX_CHAT_MESSAGE_LENGTH = _env_int("MAX_CHAT_MESSAGE_LENGTH", 500)
MAX_CHAT_HISTORY_ITEMS = _env_int("MAX_CHAT_HISTORY_ITEMS", 24)
CALENDAR_CACHE_TTL_SECONDS = _env_int("CALENDAR_CACHE_TTL_SECONDS", 120)

_rate_limit_store = {}
_rate_limit_lock = threading.Lock()

_calendar_cache = {"payload": None, "expires_at": 0.0}
_calendar_cache_lock = threading.Lock()


def _extract_client_ip(request: Request) -> str:
    for header in ("cf-connecting-ip", "x-real-ip", "x-forwarded-for"):
        raw = request.headers.get(header, "").strip()
        if not raw:
            continue
        if header == "x-forwarded-for":
            raw = raw.split(",")[0].strip()
        if raw:
            return raw
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _cleanup_rate_limit_store(now_ts: float):
    if len(_rate_limit_store) <= RATE_LIMIT_TRACKER_MAX_KEYS:
        return

    stale_seconds = RATE_LIMIT_WINDOW_SECONDS * 2
    for key, (window_start, _) in list(_rate_limit_store.items()):
        if now_ts - window_start > stale_seconds:
            _rate_limit_store.pop(key, None)

    if len(_rate_limit_store) > RATE_LIMIT_TRACKER_MAX_KEYS:
        overflow = len(_rate_limit_store) - RATE_LIMIT_TRACKER_MAX_KEYS
        for key in list(_rate_limit_store.keys())[:overflow]:
            _rate_limit_store.pop(key, None)


def enforce_rate_limit(request: Request, scope: str, max_requests: int):
    if max_requests <= 0:
        return

    ip = _extract_client_ip(request)
    bucket_key = f"{scope}:{ip}"
    now_ts = time.time()

    with _rate_limit_lock:
        _cleanup_rate_limit_store(now_ts)
        window_start, count = _rate_limit_store.get(bucket_key, (now_ts, 0))

        if now_ts - window_start >= RATE_LIMIT_WINDOW_SECONDS:
            window_start, count = now_ts, 0

        if count >= max_requests:
            retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now_ts - window_start)))
            job_id = getattr(request.state, "job_id", "SYSTEM")
            logger.warning(
                f"Rate limit exceeded scope={scope} ip={ip}",
                extra={"job_id": job_id, "step": "RATE_LIMIT", "status": "FAIL", "duration_ms": 0},
            )
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Retry in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        _rate_limit_store[bucket_key] = (window_start, count + 1)


def sanitize_chat_history(history):
    if not isinstance(history, list):
        return []

    normalized = []
    for msg in history[-MAX_CHAT_HISTORY_ITEMS:]:
        if not isinstance(msg, dict):
            continue
        role = msg.get("role")
        content = msg.get("content")
        if role not in ("user", "assistant"):
            continue
        text = str(content or "").strip()
        if not text:
            continue
        normalized.append({"role": role, "content": text[:MAX_CHAT_MESSAGE_LENGTH]})
    return normalized

def get_system_prompt():
    """system_prompt.md 파일을 읽어 AI 페르소나 정의를 반환함."""
    try:
        with open("system_prompt.md", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.warning(f"Failed to load system_prompt.md: {e}", extra={"step": "PROMPT_LOAD", "status": "WARN"})
        return "You are a helpful assistant."

class ChatRequest(BaseModel):
    message: str
    history: list = []

class DiceCommentRequest(BaseModel):
    distance: str


DEFAULT_ICLOUD_CALENDAR_URL = (
    "https://p44-caldav.icloud.com/published/2/"
    "NDE4ODE1NjY2NDE4ODE1NqDjLwq8GMN_zupBHSe0DAmmz8VvM5LEnkcLBL298CvgpMqp9UnWVYdyl0KkEr3T51GFC-uIzKH_pnozZxt_HFc"
)


def _unfold_ics_lines(ics_text: str):
    """Folded ICS 라인을 펼쳐 파싱하기 쉬운 형태로 반환."""
    unfolded = []
    for raw_line in ics_text.splitlines():
        if raw_line.startswith((" ", "\t")) and unfolded:
            unfolded[-1] += raw_line[1:]
        else:
            unfolded.append(raw_line.rstrip("\r"))
    return unfolded


def _clean_ics_text(value: str) -> str:
    return (
        (value or "")
        .replace("\\n", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
        .strip()
    )


def _parse_ics_datetime(value: str):
    raw = (value or "").strip()
    if not raw:
        return None, False

    if len(raw) == 8 and raw.isdigit():
        parsed = datetime.strptime(raw, "%Y%m%d")
        return parsed, True

    formats = [
        ("%Y%m%dT%H%M%SZ", True),
        ("%Y%m%dT%H%M%S", False),
        ("%Y%m%dT%H%MZ", True),
        ("%Y%m%dT%H%M", False),
    ]
    for fmt, is_utc in formats:
        try:
            parsed = datetime.strptime(raw, fmt)
            if is_utc:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed, False
        except ValueError:
            continue

    return None, False


def _event_to_payload(raw_event: dict, fallback_id: str):
    summary = _clean_ics_text(raw_event.get("SUMMARY", "Untitled"))
    location = _clean_ics_text(raw_event.get("LOCATION", ""))
    notes = _clean_ics_text(raw_event.get("DESCRIPTION", ""))

    start_raw = raw_event.get("DTSTART")
    start_dt, all_day = _parse_ics_datetime(start_raw)
    if start_dt is None:
        return None

    end_raw = raw_event.get("DTEND")
    end_dt, _ = _parse_ics_datetime(end_raw)

    categories_raw = raw_event.get("CATEGORIES", "")
    if isinstance(categories_raw, list):
        categories_raw = ",".join(categories_raw)
    categories = [
        _clean_ics_text(tag).lower()
        for tag in str(categories_raw).split(",")
        if _clean_ics_text(tag)
    ]

    start_iso = start_dt.isoformat()
    end_iso = end_dt.isoformat() if end_dt else None

    return {
        "id": raw_event.get("UID", fallback_id),
        "title": summary,
        "start": start_iso,
        "end": end_iso,
        "all_day": all_day,
        "location": location,
        "notes": notes,
        "categories": categories,
    }


def parse_ics_events(ics_text: str):
    lines = _unfold_ics_lines(ics_text)
    events = []
    current = None

    for line in lines:
        if line == "BEGIN:VEVENT":
            current = {}
            continue
        if line == "END:VEVENT":
            if current is not None:
                payload = _event_to_payload(current, f"event-{len(events) + 1}")
                if payload:
                    events.append(payload)
            current = None
            continue
        if current is None or ":" not in line:
            continue

        key_part, value = line.split(":", 1)
        prop = key_part.split(";", 1)[0].upper()

        if prop in current:
            if isinstance(current[prop], list):
                current[prop].append(value)
            else:
                current[prop] = [current[prop], value]
        else:
            current[prop] = value

    events.sort(key=lambda ev: ev.get("start", ""))
    return events

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """모든 HTTP 요청에 대해 job_id를 생성하고 처리 시간을 로깅함 (Global Rules 준수)."""
    job_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # 요청 컨텍스트에 job_id 주입
    request.state.job_id = job_id
    
    logger.info(f"Incoming {request.method} to {request.url.path}", 
                extra={"job_id": job_id, "step": "REQUEST", "status": "RECEIVE"})
    
    try:
        response = await call_next(request)
    except Exception:
        duration = int((time.time() - start_time) * 1000)
        logger.exception(
            f"Unhandled exception on {request.url.path}",
            extra={"job_id": job_id, "step": "RESPONSE", "status": "FAIL", "duration_ms": duration},
        )
        raise

    duration = int((time.time() - start_time) * 1000)
    status = "SUCCESS" if response.status_code < 500 else "FAIL"
    logger.info(
        f"Completed {request.url.path} code={response.status_code}",
        extra={"job_id": job_id, "step": "RESPONSE", "status": status, "duration_ms": duration},
    )

    # 클라이언트/운영툴에서 추적하기 쉽도록 요청 ID와 서버 버전을 응답 헤더에 붙입니다.
    response.headers["X-Request-ID"] = job_id
    response.headers["X-App-Version"] = APP_VERSION
    return response

@app.post("/chat")
async def chat_endpoint(request_data: Request, chat_req: ChatRequest):
    """
    AI 코치와 채팅을 수행하는 엔드포인트.
    사용자 메시지와 대화 기록을 받아 Gemini API를 호출함.
    """
    job_id = request_data.state.job_id
    start_time = time.time()

    enforce_rate_limit(request_data, "chat", CHAT_RATE_LIMIT_PER_WINDOW)

    user_message = str(chat_req.message or "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is empty.")
    if len(user_message) > MAX_CHAT_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"Message too long. max={MAX_CHAT_MESSAGE_LENGTH} chars.",
        )

    safe_history = sanitize_chat_history(chat_req.history)

    if genai is None:
        logger.warning("Chat requested but google-generativeai is missing", extra={"job_id": job_id, "step": "CHAT_API", "status": "WARN"})
        return {"response": "AI 모듈이 설치되지 않아 채팅을 사용할 수 없습니다. (google-generativeai 누락)"}

    if not API_KEY:
        logger.error("Chat requested but API Key is missing", extra={"job_id": job_id, "step": "CHAT_API", "status": "FAIL"})
        raise HTTPException(status_code=500, detail="API Key not configured")
    
    try:
        logger.info(
            f"Chat request accepted (chars={len(user_message)} history={len(safe_history)})",
            extra={"job_id": job_id, "step": "CHAT_PROCESS", "status": "SUCCESS"},
        )
        genai.configure(api_key=API_KEY)
        
        system_instruction = get_system_prompt()
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction=system_instruction,
        )

        formatted_history = []
        for msg in safe_history:
            role = "user" if msg['role'] == 'user' else "model"
            formatted_history.append({"role": role, "parts": [msg['content']]})

        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(user_message)
        
        duration = int((time.time() - start_time) * 1000)
        logger.info("AI response generated", extra={"job_id": job_id, "step": "CHAT_SUCCESS", "duration_ms": duration})
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {str(e)}", extra={"job_id": job_id, "step": "CHAT_API", "status": "FAIL"}, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chat request. Please retry.")

@app.post("/dice-comment")
async def dice_comment_endpoint(request_data: Request, dice_req: DiceCommentRequest):
    """
    주사위 결과에 대해 AI 코치의 독설 코멘트를 생성하는 엔드포인트.
    """
    job_id = request_data.state.job_id
    start_time = time.time()

    enforce_rate_limit(request_data, "dice-comment", DICE_RATE_LIMIT_PER_WINDOW)

    distance_text = str(dice_req.distance or "").strip()
    if not distance_text:
        raise HTTPException(status_code=400, detail="Distance is empty.")
    if len(distance_text) > 40:
        raise HTTPException(status_code=413, detail="Distance is too long.")

    if genai is None:
        return {"comment": f"{distance_text} 뛰어라. (AI 모듈 누락)"}

    if not API_KEY:
        return {"comment": f"{distance_text} 당장 뛰어라! (API 키 없음)"}
    
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = (
            f"너는 'Devil Coach'라는 아주 무례하고 독설을 내뱉는 방구석 여포 겸 코치다. "
            f"사용자가 주사위를 굴려서 '{distance_text}'라는 거리가 나왔다. "
            f"다음 규칙에 따라 아주 짧고 강렬한 한 마디를 반말로 내뱉어라:\n"
            f"1. 마크다운 기호를 절대 사용하지 마라.\n"
            f"2. 만약 거리가 짧으면 조롱(예: '운 좋네 이 새끼'), 길면 육체적 고통 예고(예: '지옥을 맛봐라').\n"
            f"3. 30자 이내로 대답하라."
        )
        
        response = model.generate_content(prompt)
        comment = response.text.replace('*', '').replace('#', '').strip()
        
        duration = int((time.time() - start_time) * 1000)
        logger.info(f"Dice comment generated for {distance_text}", extra={"job_id": job_id, "step": "DICE_SUCCESS", "duration_ms": duration})
        return {"comment": comment}
    except Exception as e:
        logger.error(f"Error in dice_comment: {str(e)}", extra={"job_id": job_id, "step": "DICE_API", "status": "FAIL"})
        return {"comment": "코치가 잠깐 숨 고르는 중이다. 조금 뒤에 다시 굴려."}


@app.get("/calendar/events")
async def calendar_events_endpoint(request_data: Request):
    """
    iCloud 공개 ICS 캘린더를 서버에서 파싱해 이벤트 목록을 반환.
    클라이언트는 ICS URL/자격정보를 직접 다루지 않음.
    """
    job_id = request_data.state.job_id
    start_time = time.time()

    enforce_rate_limit(request_data, "calendar-events", CALENDAR_RATE_LIMIT_PER_WINDOW)

    now_ts = time.time()
    with _calendar_cache_lock:
        cached_payload = _calendar_cache.get("payload")
        cache_expires_at = _calendar_cache.get("expires_at", 0.0)
        if cached_payload is not None and cache_expires_at > now_ts:
            return cached_payload

    raw_url = os.getenv("ICLOUD_CALENDAR_ICS_URL", DEFAULT_ICLOUD_CALENDAR_URL).strip()
    if raw_url.startswith("webcal://"):
        raw_url = "https://" + raw_url[len("webcal://"):]

    try:
        req = URLRequest(raw_url, headers={"User-Agent": "DevilTown/1.0"})
        with urlopen(req, timeout=12) as res:
            ics_text = res.read().decode("utf-8", errors="ignore")

        events = parse_ics_events(ics_text)
        duration = int((time.time() - start_time) * 1000)
        payload = {"source": "icloud", "count": len(events), "events": events}
        with _calendar_cache_lock:
            _calendar_cache["payload"] = payload
            _calendar_cache["expires_at"] = time.time() + CALENDAR_CACHE_TTL_SECONDS

        logger.info(
            f"Calendar events fetched ({len(events)})",
            extra={"job_id": job_id, "step": "CALENDAR_FETCH", "duration_ms": duration},
        )
        return payload
    except Exception as e:
        duration = int((time.time() - start_time) * 1000)
        logger.error(
            f"Calendar fetch failed: {e}",
            extra={"job_id": job_id, "step": "CALENDAR_FETCH", "status": "FAIL", "duration_ms": duration},
        )
        return JSONResponse(
            status_code=503,
            content={"source": "icloud", "count": 0, "events": [], "error": "calendar_unavailable"},
        )


@app.get("/meta/version")
async def meta_version():
    """
    운영 점검용 버전 메타.
    배포 후 실제 반영 버전을 빠르게 확인할 때 사용.
    """
    return {
        "app_version": APP_VERSION,
        "started_at": APP_STARTED_AT,
        "log_file": "Logs/server.log",
    }


@app.get("/")
async def read_root():
    """루트 경로 요청 시 메인 사이트(index.html)를 반환함."""
    logger.info("Serving index.html", extra={"step": "ROOT_PATH"})
    return FileResponse("index.html")

# Static files mapping
try:
    app.mount("/css", StaticFiles(directory="css"), name="css")
    app.mount("/js", StaticFiles(directory="js"), name="js")
    logger.info("Static directories mounted", extra={"step": "STATIC_MOUNT"})
except Exception as e:
    logger.error(f"Failed to mount static: {e}", extra={"step": "STATIC_MOUNT", "status": "FAIL"})

if __name__ == "__main__":
    logger.info(
        f"Backend server starting at http://0.0.0.0:8000 version={APP_VERSION}",
        extra={"step": "STARTUP"},
    )
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
