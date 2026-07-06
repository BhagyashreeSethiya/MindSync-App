from fastapi import Request
from fastapi.responses import JSONResponse
from core.exceptions import AppException

def app_exception_handler(request: Request, exc:AppException):
    """"
    Yeh tere custom errors (NotFound, Unauthorized, Forbidden, etc.) ko handle karega
    kyunki wo sab AppException se bane hain.
    """

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message
        }
    )

def generic_exception_handler(request: Request, exc: Exception):
    """
    Yeh Catch-All handler hai. Agar system mein koi aisi gadbad hui jo tune 
    handle nahi ki thi, toh frontend ko 500 status ke sath ek clean message jayega 
    aur tera backend code leak nahi hoga.
    """

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error" : "Internal Server Error"
        }
    )