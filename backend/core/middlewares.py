import time
import uuid 
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

#1. Logging Middleware (Performance Tracking)
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request:Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = round((time.time() - start_time) * 1000, 2)

        #Terminal m saaf dikhega k kis route n kitna time liya
        print(
            f" [{request.method}] {request.url.path}"
            f"| Status: {response.status_code}"
            f"| Time: {process_time} ms"
        )
        return response
    
#2. Request ID Middleware (Debugging)
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request:Request, call_next):
        #Har request ko ek uniue ID de rhe h
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)

        #Frontend ko reponse headers m ye ID bhej denge
        response.headers["X-Request-ID"] = request_id
        return response
    
#3. Raw ASGI Middleware (Low-Level control)
class SimpleASGIMiddleware:
    def __init__(self,app):
        self.app = app

    async def __call__(self, scope, recieve, send):
            #Yeh sirf HTTP requests ko intercept karega, Websockets ko nahi
        if scope["type"] == "http":
            print("ASGI Middleware Hit: Incoming HTTP Connection")

        await self.app(scope, recieve, send)