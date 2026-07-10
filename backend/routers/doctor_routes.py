from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.dependencies import get_db, require_role
from models.user import User
from models.mood_logs import MoodLog
from schemas.log import CaretakerAlertResponse, CaretakerLogResponse
from typing import List

from core.exceptions import NotFoundException

router = APIRouter(
    prefix="/logs",
    tags=["Caretaker Dashboard"]
)

#1. History wala endpoint (charts and Tables k liye)
@router.get("/history", response_model=List[CaretakerLogResponse])
async def get_mood_history(db: Session = Depends(get_db), current_user: User = Depends(require_role("care_taker"))):
    #Databse s saare logs nikalne(latest wale sabse upar)
    logs = db.query(MoodLog).order_by(MoodLog.timestamp.desc()).all()

    #Data ko frontend k liye list of dictionaries m convert krna
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_message": log.user_message,
            "ai_reply": log.ai_reply,
            "emotion": log.emotion_detected,     
            "alert": log.alert_triggered,
            "timestamp": log.timestamp

        }
        for log in logs
    ]


#2. HTTP Polling endpoint (Active alerts k liye)
#React Dashboard ise har 10 seconds m hit krega
@router.get("/active-alerts", response_model=List[CaretakerAlertResponse])
async def get_active_alerts(db:Session = Depends(get_db), current_user: User = Depends(require_role("care_taker"))):
   
    alerts = db.query(MoodLog).filter(
       
        MoodLog.alert_triggered == True).order_by(MoodLog.timestamp.desc()).all()

    return [
        {
            "id":log.id,
            "user_id":log.user_id,
            "patient_name": log.owner.name, # using FK relationship
            "emotion": log.emotion_detected,
            "message": log.user_message,
            "timestamp": log.timestamp
        }
        for log in alerts
    ]


#3. Specific Patient k history dekhne k liye
@router.get("/patient/{patient_id}", response_model=List[CaretakerLogResponse] )
async def get_patient_mood_history(
    patient_id:int, #URL s patient ka name aajega
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("care_taker"))
):
    
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise NotFoundException(message=f"Patient with ID {patient_id} not found in the system.")
    #sirf us specific patient_id k logs nikalne

    logs = db.query(MoodLog).filter(
        MoodLog.user_id == patient_id
    ).order_by(MoodLog.timestamp.desc()).all()

    #Agar koi log nhi mila
    if not logs:
        return []
    
    return [
        {
            "id":log.id,
            "user_id": log.user_id,
            "user_message": log.user_message,
            "ai_reply": log.ai_reply,
            "emotion": log.emotion_detected,
            "alert": log.alert_triggered,
            "timestamp": log.timestamp,
            "is_helpful": log.is_helpful
        }
        for log in logs
    ]


@router.get("/search-patients")
async def search_patients(
    q:str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("care_taker"))
):
    if not q or len(q) < 2:
        return [] #Agar 2 letter s kam type kiya h toh kuch mat bhejo
    
    patients = db.query(User).filter(
        User.name.ilike(f"%{q}%"),
        User.role == "patient"
    ).all()

    #dropdown k liye list kr rhe h jisme email bhi ho
    return [
        {
            "id":p.id,
            "name":p.name,
            "email":p.email
        }
        for p in patients
    ]



