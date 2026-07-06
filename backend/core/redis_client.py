import os
import redis
from core.config import settings

redis_url = os.getenv('REDIS_URL')

if redis_url:
    redis_client = redis.Redis.from_url(redis_url, decode_responses = True)
else:
    redis_client = redis.Redis(
        host = settings.REDIS_HOST,
        port = settings.REDIS_PORT,
        db=1,
        decode_responses=True
    )

#Helper wrappers
def store_refresh_jti(jti:str, user_id:int, expires_seconds:int):
    redis_client.setex(f"refresh:{jti}", expires_seconds, str(user_id))

def is_refresh_jti_valid(jti:str )-> bool :
    return redis_client.exists(f"refresh:{jti}") == 1

def revoke_refresh_jti(jti:str):
    redis_client.delete(f"refresh:{jti}")
                         
def blacklist_access_jti(jti:str, expires_seconds:int):
    redis_client.setex(f"blacklist:access:{jti}", expires_seconds, "1")

def is_access_jti_blacklisted(jti:str) -> bool:
    return redis_client.exists(f"blacklist:access:{jti}") == 1

