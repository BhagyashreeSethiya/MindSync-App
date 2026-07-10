from pydantic import BaseModel

#React s jo msg aayega uska format
class ChatRequest(BaseModel):
    
    user_message: str

#FastAPI jo reply bhejega, uska format
class ChatResponse(BaseModel):
    ai_reply: str
    emotion:str
    visual_cue:str
    is_emergency: bool 
   

class FeedbackRequest(BaseModel):
    log_id: int
    is_helpful: bool
    

class QuickReliefRequest(BaseModel):
    emotion: str
    therapy_used: str