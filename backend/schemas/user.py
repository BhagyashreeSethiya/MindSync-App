from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class MoodLogNested(BaseModel):
    id:int
    user_message:str
    ai_reply:str
    emotion_detected:str
    alert_triggered:bool
    timestamp:datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str
    role:str = "patient"
    invite_code: Optional[str] = None

class UserResponse(BaseModel):
    id:int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

#Doctor jab patient k detail mangega toh ye return krega
class UserWithLogsResponse(UserResponse):
    logs: List[MoodLogNested] = [] #User k profile k ander h unke saare chats!