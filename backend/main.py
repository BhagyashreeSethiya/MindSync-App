from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

#Custom core modules
from core.middlewares import LoggingMiddleware, RequestIDMiddleware, SimpleASGIMiddleware
from core.exceptions import AppException
from core.exception_handlers import app_exception_handler, generic_exception_handler
from core.limiter import limiter

#routers and db
from routers import doctor_routes, chat_routes, auth
from db.database import engine, Base
from models import mood_logs, user

#Database tables ko automatically generate krna
Base.metadata.create_all(bind=engine)


app = FastAPI(title="AI Wellness API")

#1. Limiter ko fastapi k state m attach krna
app.state.limiter = limiter

#exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Custom rate limit handler
def custom_rate_limit_handler(request:Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code = 429,
        content={"detail" : "Too many requests, Please try again after a minute."}
    )
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler
                          )

#Middlewares Registration (Order is CRITICAL)

#2. Yeh app logic k sabse kareeb chalenge (Inner Layers)
app.add_middleware(SimpleASGIMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)



#3. Slowapi middleware add kiya (Bouncer at the gate)
#rate limiter: ye pta lagata h k user limit cross toh nhi kr rah
app.add_middleware(SlowAPIMiddleware)


#4.CORS: React (port 5173) ko FastAPI (port 8000) se baat krne k permission dena
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["https://mind-sync-app.vercel.app","http://localhost:5173","http://localhost:3000" ],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#5. Trusted Host: Security Gate (outer Layer - Sabse pehle chalega)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "mind-sync-app.vercel.app", "*.choreoapis.dev"]
)

#routers inclusion
app.include_router(auth.router)
app.include_router(chat_routes.router)
app.include_router(doctor_routes.router)




