import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("Warning: GOOGLE_API_KEY not found in environment variables.")

# Model configuration
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
    except FileNotFoundError:
        return "You are a helpful assistant."

class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not API_KEY:
         raise HTTPException(status_code=500, detail="API Key not configured")
    
    genai.configure(api_key=API_KEY)
    
    system_instruction = get_system_prompt()
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        generation_config=generation_config,
        system_instruction=system_instruction,
    )

    # Convert history into the format Gemini expects (if needed)
    # For simplicity in this demo, we might just append history to the context or use start_chat
    # Let's use start_chat with history
    
    formatted_history = []
    for msg in request.history:
        role = "user" if msg['role'] == 'user' else "model"
        formatted_history.append({"role": role, "parts": [msg['content']]})

    chat_session = model.start_chat(
        history=formatted_history
    )

    try:
        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Note: Static files (index.html, css/, js/) are served from root directory
# No separate static folder needed - integrated with existing Devil Town website

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
