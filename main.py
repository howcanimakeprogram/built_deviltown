import os
import uvicorn
import logging
import time
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

"""
Devil Town Backend (main.py)
역할: 메인 사이트 서빙, AI 코치 채팅 API, 주사위 게임 코멘트 API 제공
호출 관계: Frontend (index.html, script.js, devil_coach_chat.js) -> Backend API
수정 시 주의사항: .env 파일에 GOOGLE_API_KEY 필수, Logs/ 폴더 권한 확인 필요
"""

# --- Logging Setup ---
LOG_DIR = os.path.join(os.getcwd(), "Logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "server.log")

# Global Rules 기반 로그 포맷 표준화 (job_id, step, status 등 포함)
LOG_FORMAT = '[%(levelname)s] job_id=%(job_id)s step=%(step)s %(message)s status=%(status)s duration_ms=%(duration_ms)s'

class CustomFormatter(logging.Formatter):
    def format(self, record):
        if not hasattr(record, 'job_id'): record.job_id = "SYSTEM"
        if not hasattr(record, 'step'): record.step = "CORE"
        if not hasattr(record, 'status'): record.status = "SUCCESS"
        if not hasattr(record, 'duration_ms'): record.duration_ms = 0
        return super().format(record)

handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
handler.setFormatter(CustomFormatter(LOG_FORMAT))
console = logging.StreamHandler()
console.setFormatter(CustomFormatter(LOG_FORMAT))

logging.basicConfig(level=logging.INFO, handlers=[handler, console])
logger = logging.getLogger("DevilTown")

logger.info("Initializing Devil Town Backend...", extra={"step": "INIT", "status": "START"})

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 보안 규칙(Rule 26)에 따라 프로덕션에서는 ["https://welcometodeviltown.com"] 등 특정 도메인으로 제한 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables!", extra={"step": "GEMINI_CONFIG", "status": "FAIL"})
else:
    logger.info(f"API Key loaded. Starts with: {API_KEY[:5]}...", extra={"step": "GEMINI_CONFIG"})

generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """모든 HTTP 요청에 대해 job_id를 생성하고 처리 시간을 로깅함 (Global Rules 준수)."""
    job_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # 요청 컨텍스트에 job_id 주입
    request.state.job_id = job_id
    
    logger.info(f"Incoming {request.method} to {request.url.path}", 
                extra={"job_id": job_id, "step": "REQUEST", "status": "RECEIVE"})
    
    response = await call_next(request)
    
    duration = int((time.time() - start_time) * 1000)
    logger.info(f"Completed {request.url.path}", 
                extra={"job_id": job_id, "step": "RESPONSE", "status": "SUCCESS", "duration_ms": duration})
    
    return response

@app.post("/chat")
async def chat_endpoint(request_data: Request, chat_req: ChatRequest):
    """
    AI 코치와 채팅을 수행하는 엔드포인트.
    사용자 메시지와 대화 기록을 받아 Gemini API를 호출함.
    """
    job_id = request_data.state.job_id
    start_time = time.time()
    
    if not API_KEY:
        logger.error("Chat requested but API Key is missing", extra={"job_id": job_id, "step": "CHAT_API", "status": "FAIL"})
        raise HTTPException(status_code=500, detail="API Key not configured")
    
    try:
        logger.info(f"User Message: {chat_req.message[:50]}...", extra={"job_id": job_id, "step": "CHAT_PROCESS"})
        genai.configure(api_key=API_KEY)
        
        system_instruction = get_system_prompt()
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction=system_instruction,
        )

        formatted_history = []
        for msg in chat_req.history:
            role = "user" if msg['role'] == 'user' else "model"
            formatted_history.append({"role": role, "parts": [msg['content']]})

        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(chat_req.message)
        
        duration = int((time.time() - start_time) * 1000)
        logger.info("AI response generated", extra={"job_id": job_id, "step": "CHAT_SUCCESS", "duration_ms": duration})
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {str(e)}", extra={"job_id": job_id, "step": "CHAT_API", "status": "FAIL"}, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dice-comment")
async def dice_comment_endpoint(request_data: Request, dice_req: DiceCommentRequest):
    """
    주사위 결과에 대해 AI 코치의 독설 코멘트를 생성하는 엔드포인트.
    """
    job_id = request_data.state.job_id
    start_time = time.time()
    
    if not API_KEY:
        return {"comment": f"{dice_req.distance} 당장 뛰어라! (API 키 없음)"}
    
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = (
            f"너는 'Devil Coach'라는 아주 무례하고 독설을 내뱉는 방구석 여포 겸 코치다. "
            f"사용자가 주사위를 굴려서 '{dice_req.distance}'라는 거리가 나왔다. "
            f"다음 규칙에 따라 아주 짧고 강렬한 한 마디를 반말로 내뱉어라:\n"
            f"1. 마크다운 기호를 절대 사용하지 마라.\n"
            f"2. 만약 거리가 짧으면 조롱(예: '운 좋네 이 새끼'), 길면 육체적 고통 예고(예: '지옥을 맛봐라').\n"
            f"3. 30자 이내로 대답하라."
        )
        
        response = model.generate_content(prompt)
        comment = response.text.replace('*', '').replace('#', '').strip()
        
        duration = int((time.time() - start_time) * 1000)
        logger.info(f"Dice comment generated for {dice_req.distance}", extra={"job_id": job_id, "step": "DICE_SUCCESS", "duration_ms": duration})
        return {"comment": comment}
    except Exception as e:
        logger.error(f"Error in dice_comment: {str(e)}", extra={"job_id": job_id, "step": "DICE_API", "status": "FAIL"})
        return {"comment": f"오류 발생: {str(e)}"}

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
    logger.info("Backend server starting at http://0.0.0.0:8000", extra={"step": "STARTUP"})
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
