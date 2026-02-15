import google.generativeai as genai
import os

key = os.environ.get('GOOGLE_API_KEY')
print(f"Loaded Key: {key[:5]}... (Length: {len(key) if key else 0})")

try:
    genai.configure(api_key=key)
    print("Listing available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print("\nFAILED!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
