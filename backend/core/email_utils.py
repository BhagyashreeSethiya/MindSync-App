import resend
from pydantic import EmailStr
from core.config import settings

resend.api_key = settings.RESEND_API_KEY

SENDER_EMAIL = "MindSync <noreply@vmate.space>"

async def send_verification_email(email_to: EmailStr, user_name: str, token:str):

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    html_content = f"""
    <h2>Hello {user_name},</h2>
    <p>Please verify your account by clicking the link below:</p>
    <a href = "{verify_url}" style = "background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
    <br><br>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  
"""
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email_to],
        "subject": "Welcome to MindSync - Verify Your Account",
        "html" : html_content,
        "text": f"Please verify your account using this link: {verify_url}"
    }

    try:
        email_response = resend.Emails.send(params)
        print(f"VERIFICATION EMAIL SENT TO: {email_to} |ID: {email_response.get('id')}")
        return True
    except Exception as e:
        print(f"RESEND FAILED for {email_to}: {e}")
        return False

async def send_password_reset_email(email_to: EmailStr, token: str):
    
    
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html_content = f"""
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href = "{reset_url}" style = "background-color: #f44336; color:white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    """

    params = {
        "from" : SENDER_EMAIL,
        "to" : [email_to],
        "subject": "MindSync | Reset Password",
        "html": html_content,
        "text": f"Please reset your password using this link: {reset_url}"
    }

    try:
        email_response = resend.Emails.send(params)
        print(f"RESET EMAIL SENT TO: {email_to} | ID: {email_response.get('id')}")
        return True
    except Exception as e:
        print(f"RESEND FAILED for {email_to}: {e}")
        return False


async def send_invite_email(email_to: EmailStr, invite_link: str):

    html_content = f"""
    <h2>You've been invited to MindSync!</h2>
    <p>Your caretaker/doctor has invited you to join MindSync to securely track and manage your mood logs.</p>
    <p>Click the button below to create your account. You will automatically be linked to your doctor.</p>
    <a href="{invite_link}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation & Sign Up</a>
    <br><br>
    <p>If you were not expecting this invitation, you can safely ignore this email.</p>
    
    """

    params = {
        "from":SENDER_EMAIL,
        "to": [email_to],
        "subject": "MindSync | You have been invited by your Doctor",
        "html": html_content,
        "text": f"Please join MindSync using this link: {invite_link}"
    }

    try:
        email_response = resend.Emails.send(params)
        print(f"INVITATION EMAIL SENT TO: {email_to} | ID: {email_response.get('id')}")
        return True
    except Exception as e:
        print(f"RESEND FAILED for {email_to}: {e}")
        return False