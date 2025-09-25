import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

def send_verification_email(to_email: str, code: str):
    subject = "Your Verification Code"
    body = f"Your verification code is: {code}"
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USER, [to_email], msg.as_string())
    except Exception as e:
        print(f"Failed to send verification email: {e}") 