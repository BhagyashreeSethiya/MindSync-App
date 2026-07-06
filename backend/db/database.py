from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from core.config import settings

# 1. Direct PostgreSQL URL read krna env. variables s
engine = create_engine(settings.DATABASE_URL)
#2. Session Setup
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#3. Base Model Setup
Base = declarative_base()



