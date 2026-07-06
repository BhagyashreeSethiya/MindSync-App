from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY:str
    SECRET_KEY: str
    DATABASE_URL: str 
    # FRONTEND_URL: str = "http://localhost:5173"

    
    ALGORITHM: str = "HS256" 

    REDIS_HOST:str ='localhost'
    REDIS_PORT:int= 6379

    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM:str
    MAIL_PORT:int
    MAIL_SERVER:str


    class Config:
        env_file = ".env"

settings = Settings()