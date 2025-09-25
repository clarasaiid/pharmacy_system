import os
from datetime import datetime, timedelta
from typing import Optional, AsyncGenerator
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
    CookieTransport,
)
from fastapi_users.authentication.strategy.db import DatabaseStrategy
from fastapi_users.db import SQLAlchemyUserDatabase
from passlib.context import CryptContext
from dotenv import load_dotenv

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import HumanName, ContactPoint, Address

# Load environment variables
load_dotenv()

# Constants
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RESET_PASSWORD_TOKEN_EXPIRE_MINUTES = 60

# --- Password hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def send_verification_email(email: str, token: str):
    msg = MIMEMultipart()
    msg['From'] = settings.EMAIL_USER
    msg['To'] = email
    msg['Subject'] = "Verify your email address"
    
    body = f"""
    Hello,
    
    Please use the following code to verify your email address:
    
    {token}
    
    This code will expire in 24 hours.
    
    If you didn't request this verification, please ignore this email.
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Verification email sent to {email}")
    except Exception as e:
        print(f"Failed to send verification email: {e}")

# --- Async user database dependency ---
async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)

# --- User Manager ---
class UserManager(UUIDIDMixin, BaseUserManager[User, str]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")
        # Request verification after registration
        await self.request_verify(user, request)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")
        # TODO: Send email with reset token

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")
        # Send verification email
        send_verification_email(user.email, token)

    async def on_after_verify(
        self, user: User, request: Optional[Request] = None
    ):
        print(f"User {user.id} has been verified")

    async def create(self, user_create, safe: bool = False, request: Optional[Request] = None):
        # Validate password first
        await self.validate_password(user_create.password, user_create)
        user_dict = user_create.create_update_dict()
        # Transform flat fields to FHIR fields
        first_name = user_dict.pop('first_name', None)
        second_name = user_dict.pop('second_name', None)
        phone_number = user_dict.pop('phone_number', None)
        gender = user_dict.get('gender', None)
        address_str = user_dict.pop('address', None)
        birthdate = user_dict.pop('birthdate', None)
        email = user_dict.get('email', None)

        # Build FHIR fields
        user_dict['name'] = [HumanName(family=second_name, given=[first_name]).dict()]
        user_dict['telecom'] = [
            ContactPoint(system="email", value=email).dict(),
            ContactPoint(system="phone", value=phone_number).dict()
        ]
        user_dict['address'] = [Address(text=address_str).dict()]
        user_dict['gender'] = gender
        user_dict['birth_date'] = birthdate
        user_dict['identifier'] = [{
            "system": "http://yourdomain.com/practitioner-id",
            "value": email
        }]
        user_dict['username'] = email  # Set username to email

        # Set required fields
        user_dict['hashed_password'] = get_password_hash(user_create.password)
        user_dict['is_active'] = True
        user_dict['is_superuser'] = False
        user_dict['is_verified'] = False

        # Remove password from dict if present
        user_dict.pop('password', None)

        created_user = await self.user_db.create(user_dict)
        return created_user

# --- Async user manager dependency ---
async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

# --- JWT strategy setup ---
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")
cookie_transport = CookieTransport(cookie_name="refresh_token", cookie_max_age=60 * 60 * 24 * 7)  # 7 days

def get_jwt_strategy():
    return JWTStrategy(secret=settings.SECRET_KEY, lifetime_seconds=3600)  # 1 hour

def get_refresh_token_strategy():
    return DatabaseStrategy(
        database=SQLAlchemyUserDatabase,
        lifetime_seconds=60 * 60 * 24 * 7  # 7 days
    )

jwt_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

refresh_backend = AuthenticationBackend(
    name="refresh",
    transport=cookie_transport,
    get_strategy=get_refresh_token_strategy,
)

# --- FastAPI Users setup ---
fastapi_users = FastAPIUsers[User, str](
    get_user_manager,
    [jwt_backend, refresh_backend],
)

# Add refresh token routes
auth_router = fastapi_users.get_auth_router(jwt_backend)
refresh_router = fastapi_users.get_auth_router(refresh_backend)

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
