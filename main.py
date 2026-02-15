import os
import uvicorn
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# --- Logging Setup ---
LOG_DIR = os.path.join(os.getcwd(), "Logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "server.log")

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DevilTown")

logger.info("Initializing Devil Town Backend...")

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with specific domains (e.g., ["https://welcometodeviltown.com"]) for better security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables!")
else:
    logger.info(f"API Key loaded. Starts with: {API_KEY[:5]}...")

generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

def get_system_prompt():
    try:
        with open("system_prompt.md", "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.warning(f"Failed to load system_prompt.md: {e}")
        return "You are a helpful assistant."

class ChatRequest(BaseModel):
    message: str
    history: list = []

class DiceCommentRequest(BaseModel):
    distance: str

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming {request.method} request to {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not API_KEY:
        logger.error("Chat requested but API Key is missing")
        raise HTTPException(status_code=500, detail="API Key not configured")
    
    try:
        logger.info(f"User Message: {request.message[:50]}...")
        genai.configure(api_key=API_KEY)
        
        system_instruction = get_system_prompt()
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction=system_instruction,
        )

        formatted_history = []
        for msg in request.history:
            role = "user" if msg['role'] == 'user' else "model"
            formatted_history.append({"role": role, "parts": [msg['content']]})

        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(request.message)
        
        logger.info("AI response generated successfully")
        return {"response": response.text}
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dice-comment")
async def dice_comment_endpoint(request: DiceCommentRequest):
    if not API_KEY:
        return {"comment": f"{request.distance} 당장 뛰어라! (API 키 없음)"}
    
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = (
            f"너는 'Devil Coach'라는 아주 무례하고 독설을 내뱉는 방구석 여포 겸 코치다. "
            f"사용자가 주사위를 굴려서 '{request.distance}'라는 거리가 나왔다. "
            f"다음 규칙에 따라 아주 짧고 강렬한 한 마디를 반말로 내뱉어라:\n"
            f"1. 마크다운 기호를 절대 사용하지 마라.\n"
            f"2. 만약 거리가 짧으면(예: 3~7km, 0km) 운 좋다고 비꼬거나 조롱해라. (예: '운 좋네 이 새끼', '이게 운동이냐? 껌이네' 등)\n"
            f"3. 만약 거리가 길면(예: 21km, 30km, 42.195km) 육체적 고통을 예고하며 비웃어라. (예: '개같이 고생해라 난 쉰다 ㅋㅋ', '지옥을 맛보게 될 거다' 등)\n"
            f"4. 욕설과 비속어를 섞어서 기분 주옥같게 만들어라.\n"
            f"5. 30자 이내로 대답하라."
        )
        
        response = model.generate_content(prompt)
        comment = response.text.replace('*', '').replace('#', '').strip()
        logger.info(f"Dice comment generated for {request.distance}")
        return {"comment": comment}
    except Exception as e:
        logger.error(f"Error in dice_comment: {str(e)}")
        # Temporary: Return error to frontend for debugging
        return {"comment": f"오류 발생: {str(e)}"}

@app.get("/")
async def read_root():
    """
    루트 경로 요청 시 index.html 반환.
    
    Returns:
        FileResponse: index.html 파일
    """
    logger.info("Serving index.html")
    return FileResponse("index.html")

# Static files mapping
try:
    app.mount("/css", StaticFiles(directory="css"), name="css")
    app.mount("/js", StaticFiles(directory="js"), name="js")
    logger.info("Static directories mounted successfully")
except Exception as e:
    logger.error(f"Failed to mount static directories: {e}")

if __name__ == "__main__":
    logger.info("Backend server starting at http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
