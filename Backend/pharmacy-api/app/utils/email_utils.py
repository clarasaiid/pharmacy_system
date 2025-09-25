import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Debug print
print(f"Email Configuration:")
print(f"Host: {EMAIL_HOST}")
print(f"Port: {EMAIL_PORT}")
print(f"User: {EMAIL_USER}")
print(f"Password: {'*' * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else 'None'}")

def send_email(to_email: str, subject: str, html: str):
    print(f"Attempting to send email to: {to_email}")
    print(f"Using SMTP server: {EMAIL_HOST}:{EMAIL_PORT}")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    part = MIMEText(html, "html")
    msg.attach(part)

    try:
        print("Connecting to SMTP server...")
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            print("Starting TLS...")
            server.starttls()
            print("Logging in...")
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            print("Sending email...")
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
            print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        print(f"Error type: {type(e)}")
        raise

    return True
