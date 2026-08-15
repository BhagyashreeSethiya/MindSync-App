import time
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from core.dependencies import get_db

from models.user import User
from models.patient_invite import PatientInvite
from schemas.user import UserCreate, UserResponse, SendInviteRequest, AcceptInviteRequest
from schemas.auth import LoginRequest, RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, create_email_verification_token, verify_email_token
from core.config import settings
from core.dependencies import security
from core.redis_client import store_refresh_jti, is_refresh_jti_valid, revoke_refresh_jti, blacklist_access_jti
from core.limiter import limiter
from core.email_utils import send_verification_email, send_password_reset_email,send_invite_email

from core.exceptions import BadRequestException, UnauthorizedException, NotFoundException

router = APIRouter(prefix="/auth", tags=["Authentication"])

#Allowlisted Doctor/Caretaker Emails
AUTHORIZED_CARETAKER_EMAILS = [
    "bhagyashreesethiya@gmail.com",
]

@router.post("/signup")
@limiter.limit("5/minute")
async def signup(
    request: Request, 
    user_data: UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Email clean & lowercase standardisation
    clean_email = user_data.email.lower().strip()

    # 1. Caretaker security check (Allowlist)
    if user_data.role == "caretaker" and clean_email not in [e.lower() for e in AUTHORIZED_CARETAKER_EMAILS]:
        raise BadRequestException("You are not authorized to register as a Caretaker/Doctor.")

    # 2. Token based patient invite processing
    assigned_caretaker_id = None
    invite = None

    if user_data.invite_token:
        invite = db.query(PatientInvite).filter(
            PatientInvite.token == user_data.invite_token,
            PatientInvite.is_used == False
        ).first()

        # FIXED: Ab ye check SIRF tab chalega jab invite_token diya gaya ho
        if not invite:
            raise BadRequestException("Invalid or expired invitation token.")

        assigned_caretaker_id = invite.caretaker_id
        user_data.role = "patient" # Force role to patient if signing up via invite link

    # 3. Check if email already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        if existing_user.is_verified:
            raise BadRequestException("Email already registered and verified. Please login.")
        else:
            # Unverified account updates
            existing_user.hashed_password = get_password_hash(user_data.password)
            existing_user.name = user_data.name
            existing_user.role = user_data.role
            if assigned_caretaker_id:
                existing_user.caretaker_id = assigned_caretaker_id
            
            if invite:
                invite.is_used = True

            db.commit()

            verification_token = create_email_verification_token(existing_user.email)
            background_tasks.add_task(send_verification_email, existing_user.email, existing_user.name, verification_token)

            return {"message": "Unverified account found. A fresh verification link has been sent to your email!"}
    
    # 4. Naya user create karna
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=clean_email,
        hashed_password=hashed_pwd,
        role=user_data.role,
        caretaker_id=assigned_caretaker_id
    )

    db.add(new_user)

    # Mark invite as used if token was present
    if invite:
        invite.is_used = True

    db.commit()
    db.refresh(new_user)

    verification_token = create_email_verification_token(clean_email)
    background_tasks.add_task(send_verification_email, clean_email, user_data.name, verification_token)

    return {"message": "Registration successful! Please check your email to verify your account."}


@router.post("/send-invite")
def send_patient_invite(
    invite_data: SendInviteRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # Authenticate caretaker
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or role != "caretaker":
            raise UnauthorizedException("Only caretakers can send patient invitations.")
    except JWTError:
        raise UnauthorizedException("Invalid authorization token")

    #Generate unique secure token
    invite_token = secrets.token_urlsafe(32)

    #store invite in DB 
    new_invite = PatientInvite(
        email = invite_data.patient_email,
        token=invite_token,
        caretaker_id = int (user_id)
    )
    db.add(new_invite)
    db.commit()

    invite_link = f"{settings.FRONTEND_URL}/signup?invite_token={invite_token}"

    background_tasks.add_task(send_invite_email, invite_data.patient_email, invite_link)

    return {
        "message": f"Invitation link generated and sent to {invite_data.patient_email}",
        
    }

@router.post("/accept-invite")
def accept_invite(request: AcceptInviteRequest, db: Session = Depends(get_db)):
    # 1. Invite token find karo database mein
    invite = db.query(PatientInvite).filter(
        PatientInvite.token == request.token, 
        PatientInvite.is_used == False
    ).first()
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token.")

    # 2. Patient ko email se find karo (kyunki email toh invite table mein hai hi)
    patient = db.query(User).filter(User.email == invite.email).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient account not found. Pehle sign up karein.")

    # 3. Patient ko Caretaker assign karo aur invite ko 'used' mark kardo
    patient.caretaker_id = invite.caretaker_id
    invite.is_used = True
    
    # 4. Changes save karo
    db.commit()

    return {"success": True, "message": "Successfully linked with Doctor!"}

@router.get("/verify-email")
def verify_email(token:str, db: Session = Depends(get_db)):
    #1. token check 
    email = verify_email_token(token)
    if not email:
        raise BadRequestException("Invalid or expired token")
    
    #2. Database m user dhundo
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise NotFoundException("User not found")
    
    if user.is_verified:
        return {"message": "Account is already verified. You can login now."}
    
    #3. User ko verify krdo
    user.is_verified = True
    db.commit()

    return {"message": "Account successfully verified! You can now close this window and login."}

@router.post("/login")
@limiter.limit("5/minute")
def login(request:Request, user_data:LoginRequest, db: Session = Depends(get_db)):
    #user ko db m dhundo
    db_user = db.query(User).filter(User.email == user_data.email).first()

    if not db_user:
        raise UnauthorizedException("This user is not registered in our database")
    
    if not db_user.is_active:
        raise UnauthorizedException("Account is deactivated")
    if not db_user.is_verified:
        raise UnauthorizedException("Please verify your email before logging in")
    if not verify_password(user_data.password, db_user.hashed_password):
        raise UnauthorizedException("Invalid credentials")
    
    access_token, access_jti = create_access_token({"sub":str(db_user.id), "role" : db_user.role})
    refresh_token, refresh_jti = create_refresh_token(db_user.id)

    store_refresh_jti(refresh_jti, db_user.id, expires_seconds=7*24*3600)
   


    return {
        "access_token":access_token,
        "refresh_token":refresh_token,
        "token_type":"bearer",
        
        "role":db_user.role
    }

#REFRESH (With Token Rotation)
@router.post("/refresh")
def refresh(data:RefreshRequest, db:Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")
        
        user_id = payload.get("sub")
        jti = payload.get("jti")

        if not user_id or not jti:
            raise UnauthorizedException("Invalid token payload")
    except JWTError:
        raise UnauthorizedException("Invalid refresh token")
    
    db_user = db.query(User).filter(User.id == int(user_id)).first()
    if not db_user:
        raise UnauthorizedException("User no longer exists")
    if not is_refresh_jti_valid(jti):
        raise UnauthorizedException("Refresh token expired or revoked")
    
    #Purana token Redis se uda do
    revoke_refresh_jti(jti)

    #New tokens banao
    new_access_token, new_access_jti = create_access_token({"sub": str(db_user.id), "role": db_user.role})
    new_refresh_token, new_refresh_jti = create_refresh_token(db_user.id)

    store_refresh_jti(new_refresh_jti, db_user.id, expires_seconds=7*24*3600)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

#LOGOUT (Merged Revoke + Blacklist)
@router.post("/logout")
def logout(data: LogoutRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    #1. Access token ko blacklist karo
    access_token = credentials.credentials
    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")

        if jti and exp:
            ttl = exp-int(time.time())
            if ttl > 0:
                blacklist_access_jti(jti, ttl)

    except JWTError:
        pass # Ignore agar already invalid hai

    #2. Refresh token ko revoke karna
    try:
        refresh_payload = jwt.decode(data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        refresh_jti = refresh_payload.get("jti")
        if refresh_jti:
            revoke_refresh_jti(refresh_jti)

    except JWTError:
        pass

    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request_data.email).first()

    if user:
        reset_token = create_email_verification_token(user.email) #same token logic use kr sakte h
        background_tasks.add_task(send_password_reset_email, user.email, reset_token)

        return {"message": "If that email is registered, a password reset link has been sent."}
    
@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    #1. token check kr
    email = verify_email_token(request_data.token)
    if not email:
        raise BadRequestException("Invalid or expired token")
    
    #2. user dhundo
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise NotFoundException("User not found")
    
    #3. Naya password hash krke save krna
    user.hashed_password = get_password_hash(request_data.new_password)
    db.commit()

    return {"message": "Password updated successfully!"}