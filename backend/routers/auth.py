import time
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.dependencies import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse
from schemas.auth import LoginRequest, RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from core.config import settings
from core.dependencies import security
from core.redis_client import store_refresh_jti, is_refresh_jti_valid, revoke_refresh_jti, blacklist_access_jti
from core.limiter import limiter
from core.email_utils import send_verification_email, send_password_reset_email
from core.security import create_email_verification_token, verify_email_token

from core.exceptions import BadRequestException, UnauthorizedException, NotFoundException

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
@limiter.limit("5/minute")
async def signup(request:Request, user_data: UserCreate, 
                 background_tasks: BackgroundTasks,db:Session = Depends(get_db)):
    #check agr email pehel se exist krta h
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        if existing_user.is_verified:
            raise BadRequestException("Email already registered and verified. Please login.")
        else:
            existing_user.hashed_password = get_password_hash(user_data.password)
            existing_user.name = user_data.name
            existing_user.role = user_data.role
            db.commit()

            verification_token = create_email_verification_token(existing_user.email)
            background_tasks.add_task(send_verification_email, existing_user.email, existing_user.name, verification_token)

            return {"message": "Unverified account found. A fresh verification link has been sent to your email!"}
    
    #naya user banana (password hash krke)
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pwd,
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_token = create_email_verification_token(user_data.email)

    background_tasks.add_task(send_verification_email, user_data.email, user_data.name, verification_token)

    return {"message" : "Registration successful! Please check your email to verify your account."}

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