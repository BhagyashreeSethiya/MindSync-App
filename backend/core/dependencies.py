from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session


from db.database import SessionLocal
from core.config import settings
from models.user import User
from core.redis_client import is_access_jti_blacklisted

from core.exceptions import UnauthorizedException, ForbiddenException

#1. Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#2. HTTPBearer ka instance banaya
security = HTTPBearer()


#3. current user dependency
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    
    try:
        #1. Token nikalo
        token = credentials.credentials

        #2. Token ko decode karo
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        #3. Payload s data nikalo
        user_id: str = payload.get("sub")
        token_type:str = payload.get("type")
        jti: str = payload.get("jti")

        #4. Basic checks
        if user_id is None or token_type != "access":
            raise UnauthorizedException("Could not validate credentials")
        #5. CRITICAL CHECK: REDIS BLACKLIST Guard
        #Agar jti maujood h aur redis bolta h k yeh blacklisted h, toh ...
        if jti and is_access_jti_blacklisted(jti):
            raise UnauthorizedException("Token has been revoked/logged out. Please log in again")
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")
    
    #6. Database s user uthao
    user = db.query(User).filter(User.id == (int)(user_id)).first()
    if user is None:
        raise UnauthorizedException("User no longer exists in our system")
    
    return user

#RABC
def require_role(role: str):
    def role_checker(current_user:User = Depends(get_current_user)):

        if current_user.role!=role:
            raise ForbiddenException("Access denied. You do not have the required permissions.")
        
        return current_user
    
    return role_checker