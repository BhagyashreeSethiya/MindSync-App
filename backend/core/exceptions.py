class AppException(Exception):
    def __init__(self, message:str, status_code:int = 400):
        self.message = message
        self.status_code = status_code

class NotFoundException(AppException):
    def __init__(self, message = "Resorce not found"):
        super().__init__(message, 404)

class UnauthorizedException(AppException):
    def __init__(self, message="Unauthorized access"):
        super().__init__(message,401)

class ForbiddenException(AppException):
    def __init__(self, message="Access denied"):
        super().__init__(message, 403)

class BadRequestException(AppException):
    def __init__(self, message = "Bad request"):
        super().__init__(message, 400)