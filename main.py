# Devil Town Running Coach - FastAPI Backend
# This server provides the /chat endpoint for AI coach interactions
# and serves the frontend static files

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
# IMPORTANT: .env contains GOOGLE_API_KEY and should NEVER be committed to Git
load_dotenv()

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
# This allows the frontend (port 8999) to call this API (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, specify exact origins like ["http://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
# Load API key from environment variable (set in .env file)
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("Warning: GOOGLE_API_KEY not found in environment variables.")
    print("Please create a .env file with: GOOGLE_API_KEY=your_key_here")

# Gemini model configuration
# temperature: 1.0 = creative/varied responses
# top_p: 0.95 = nucleus sampling for diversity
# top_k: 40 = consider top 40 tokens
# max_output_tokens: 8192 = maximum response length
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

def get_system_prompt():
    """
    Load the AI persona from system_prompt.md
    This defines the "매미킴 맛 찐친 러닝 코치" personality
    """
    try:
        with open("system_prompt.md", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "You are a helpful assistant."

class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for AI coach interactions
    
    Request body:
        - message: User's message
        - history: Previous conversation history
    
    Returns:
        - response: AI coach's response
    """
    # Check if API key is configured
    if not API_KEY:
         raise HTTPException(status_code=500, detail="API Key not configured")
    
    genai.configure(api_key=API_KEY)
    
    system_instruction = get_system_prompt()
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        generation_config=generation_config,
        system_instruction=system_instruction,
    )

    # Convert chat history to Gemini's format
    # Frontend sends: [{role: 'user'|'assistant', content: 'text'}]
    # Gemini expects: [{role: 'user'|'model', parts: ['text']}]
    formatted_history = []
    for msg in request.history:
        role = "user" if msg['role'] == 'user' else "model"
        formatted_history.append({"role": role, "parts": [msg['content']]})

    chat_session = model.start_chat(
        history=formatted_history
    )

    # Send message to Gemini and get response
    try:
        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception as e:
        # Log error and return 500 status
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint - serve index.html
@app.get("/")
async def read_root():
    """Serve the main index.html page"""
    return FileResponse("index.html")

# Mount static files (CSS, JS, etc.)
# This allows serving frontend from the same port as backend
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

if __name__ == "__main__":
    print("🏃 Devil Town Running Coach Server Starting...")
    print("📍 Frontend: http://127.0.0.1:8000")
    print("📍 API Docs: http://127.0.0.1:8000/docs")
    print("💀 Skull Game & Devil Coach AI ready!")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
