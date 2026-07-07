import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

#.env file s details load krna
load_dotenv()

#Email Server ki Configuration
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = 587,
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_verification_email(email_to: EmailStr, user_name: str, token:str):

    verify_url = f"http://localhost:5173/verify-email?token={token}"
    
    html_content = f"""
    <h2>Hello {user_name},</h2>
    <p>Please verify your account by clicking the link below:</p>
    <a href = "{verify_url}" style = "background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
    <br><br>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  
"""
    
    message = MessageSchema(
        subject = "Welcome to AI Wellness API",
        recipients = [email_to],
        body = html_content,
        subtype = MessageType.html

    )

    fm = FastMail(conf)
    await fm.send_message(message)
    print(f"Email successfully sent to {email_to}")

async def send_password_reset_email(email_to: EmailStr, token: str):
    reset_url = f"http://localhost:5173/reset-password?token={token}"

    html_content = f"""
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href = "{reset_url}" style = "background-color: #f44336; color:white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    """

    message = MessageSchema(
        subject = "Reset Your Password",
        recipients=[email_to],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)