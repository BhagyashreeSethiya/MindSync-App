from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime,timedelta,timezone
from core.config import settings
import uuid


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


ACCESS_TOKEN_EXPIRE_MINUTES = 15 
REFRESH_TOKEN_EXPIRE_DAYS = 7

def get_password_hash(password:str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password:str, hashed_password:str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

#1. Create access token
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())

    to_encode.update({
        "type": "access",
        "jti":jti,
        "exp": expire
        })
    
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return token,jti

#2. Create refresh token
def create_refresh_token(user_id:int):
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    jti = str(uuid.uuid4())

    payload = {
        "sub": str(user_id),
        "type":"refresh",
        "jti":jti,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return token, jti

def create_email_verification_token(email:str):
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_email_token(token:str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms =[settings.ALGORITHM])
        email:str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None