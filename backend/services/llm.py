import json
from google import genai
from google.genai import types
from core.config import settings

#1. Naya Client initialize krna (API key k saath)
client = genai.Client(api_key=settings.GEMINI_API_KEY)


#2. Message bhejne ka function 
async def get_ai_response(user_message: str) -> dict:
    try:

        sys_instruct = """"
        You are a warm, empathetic AI wellness companion for cognitively disabled patients.
        Keep your replies very short (1-2 sentences), conversational, and supportive.
        
        CRITICAL: You MUST respond strictly in JSON format matching this structure:
        {
            "ai_reply": "your comforting short text",
            "emotion": "sad/happy/anxious/angry/neutral",
            "visual_cue": "a single emoji representing an action (e.g., 🫁 for breathing, 🍲 for food, 🎵 for music, 💙 for support)",
            "is_emergency": true or false (Set to true ONLY if there is severe panic, self-harm, or extreme distress)
        }
        
        """
        response = client.models.generate_content(
            model = "gemini-2.5-flash",
            contents = user_message,
            config = types.GenerateContentConfig(
                system_instruction = sys_instruct,
                response_mime_type="application/json"
            )
            )
        #Gemini text (JSON string ko Python Dictionary mein convert kiya)
        return json.loads(response.text)
    
    except Exception as e:
        print(f"Gemini API Error: {e}")
        #Fallback agr API fail ho jaaye
        return{
            "ai_reply":"Oops! Main connect nahi kar paayi. Please try again.",
            "emotion":"neutral",
            "visual_cue": "💙",
            "is_emergency": False
        } 