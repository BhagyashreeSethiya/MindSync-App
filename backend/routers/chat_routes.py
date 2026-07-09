from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session
from schemas.chat import ChatRequest, ChatResponse, FeedbackRequest, QuickReliefRequest
from services.llm import get_ai_response

from core.dependencies import get_db, require_role, get_current_user
from models.user import User
from models.mood_logs import MoodLog

from core.exceptions import NotFoundException

router = APIRouter(
    prefix = "/chat",
    tags=["Chat Intelligence"]
)


@router.post("/", response_model= ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role("patient"))):
    
    #User ka message fetch kiya
    user_msg = request.user_message

    #1. LLM service call kiya
    ai_data = await get_ai_response(user_msg) 

    #2. Database m save krna
    new_chat_log = MoodLog(
        user_id = current_user.id,
        user_message = user_msg,
        ai_reply=ai_data["ai_reply"],
        emotion_detected=ai_data["emotion"],
        alert_triggered=ai_data["is_emergency"]
    )

    db.add(new_chat_log)
    db.commit()
    db.refresh(new_chat_log)

    #3. Frontend ko pydantic schema k format m return krna
    return ai_data

@router.patch("/feedback")
def update_chat_feedback(feedback_data: FeedbackRequest, db: Session = Depends(get_db)):
    
    chat_log = db.query(MoodLog).filter(MoodLog.id == feedback_data.log_id).first()

    if not chat_log:
        raise NotFoundException("Chat log not found")
    
    chat_log.is_helpful = feedback_data.is_helpful
    chat_log.skipped_medicine = feedback_data.skipped_medicine

    db.commit()

    return {"message": "Feedback safely recorded. Great job!"}

@router.post("/quick-relief")
def log_quick_relief(data: QuickReliefRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    #naya log banayenge
    new_log = MoodLog(
        user_id=current_user.id,

        # Kyunki is path mein koi chat nahi hogi isliye default text daala
        user_message="[USED QUICK RELIEF FEATURE]",
        ai_reply=f"[SYSTEM: Patient engaged in Sensory Therapy -> {data.therapy_used}]",

        emotion_detected=data.emotion,
        alert_triggered=False,# Music sun raha hai toh emergency nahi hai

        #Feedback abhi nahi aaya h toh null rendete h (baad m feedback API hit hogi)
        is_helpful = None,
        skipped_medicine=None
    )

    db.add(new_log)
    db.commit()

    return {"log_id": new_log.id,"message": "Sensory therapy session safely logged for the doctor."}