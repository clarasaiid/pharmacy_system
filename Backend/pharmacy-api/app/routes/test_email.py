from fastapi import APIRouter
from app.utils.email_utils import send_email

router = APIRouter(prefix="/test", tags=["Email"])

@router.get("/send-email")
def test_email():
    send_email(
        to_email="clara.fahim@hotmail.com",  # Change this to the email you want to send to
        subject="Test Email from FastAPI",
        html="""
            <h1>Hello from your Pharmacy App 📦</h1>
            <p>This is a test email sent via SMTP using smtplib and FastAPI.</p>
        """
    )
    return {"message": "Email sent successfully"}
