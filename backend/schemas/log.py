from typing import Optional
from pydantic import BaseModel
from datetime import datetime

#History route k liye schema
class CaretakerLogResponse(BaseModel):
    id: int
    user_id:int
    user_message:str
    ai_reply:str
    emotion:str
    alert:bool
    patient_name: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


#Active Alerts route k liye schema
class CaretakerAlertResponse(BaseModel):
    id: int
    user_id: int
    emotion: str
    message: str
    patient_name: str
    timestamp: datetime

    class Config:
        from_attributes = True