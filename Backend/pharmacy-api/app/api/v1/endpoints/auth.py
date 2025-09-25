from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi_users import FastAPIUsers
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.auth import jwt_backend, get_user_manager
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.core.verification import (
    generate_verification_code, 
    store_verification_code, 
    verify_code,
    load_verification_data,
    save_verification_data
)
from app.utils.email_utils import send_email
from typing import Dict
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import string
import json
import os

router = APIRouter()
fastapi_users = FastAPIUsers[User, str](
    get_user_manager,
    [jwt_backend],
)

# Load verification data from file
verification_codes, pending_registrations = load_verification_data()

class EmailRequest(BaseModel):
    email: str

class VerifyRequest(BaseModel):
    email: str
    code: str

def generate_identifier() -> str:
    """Generate a unique identifier for a practitioner."""
    prefix = "PRAC"
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{timestamp}{random_suffix}"

@router.post("/register")
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    print(f"Starting registration for email: {user_data.email}")
    
    # Check if email already exists in database as a verified user
    stmt = select(User).where(User.email == user_data.email, User.is_verified == True)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered and verified")
    
    # Check if there's already a pending registration
    if user_data.email in pending_registrations:
        raise HTTPException(status_code=400, detail="A verification code has already been sent to this email. Please check your email or request a new code.")
    
    # Generate verification code
    code = generate_verification_code()
    print(f"Generated verification code: {code}")
    
    # Store verification code and user data
    store_verification_code(user_data.email, code, user_data.dict())
    print(f"Stored verification code for: {user_data.email}")
    
    # Send verification email
    print("Adding email sending task to background tasks")
    background_tasks.add_task(
        send_email,
        to_email=user_data.email,
        subject="Your Verification Code",
        html=f"""
            <h1>Welcome to the Pharmacy App!</h1>
            <p>Your verification code is: <strong>{code}</strong></p>
            <p>This code will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
        """
    )
    print("Email task added to background tasks")
    
    return {"message": "Verification code sent to your email"}

@router.post("/verify-code")
async def verify_registration(request: VerifyRequest, db: AsyncSession = Depends(get_db)):
    print(f"Verifying code for email: {request.email}")
    
    # Check if verification code exists and is valid
    if request.email not in verification_codes:
        raise HTTPException(status_code=400, detail="No pending verification found for this email")
    
    stored_code, expiration = verification_codes[request.email]
    print(f"Stored code: {stored_code}, Provided code: {request.code}")
    
    # Check if code has expired
    if datetime.utcnow() > expiration:
        del verification_codes[request.email]
        if request.email in pending_registrations:
            del pending_registrations[request.email]
        save_verification_data(verification_codes, pending_registrations)
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    # Verify code
    if request.code != stored_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    print("Code verified successfully")
    
    # Get user data from pending registrations
    user_data, _ = pending_registrations[request.email]
    
    # Create user in database only after successful verification
    try:
        print("Creating user in database")
        # Filter out fields that we'll set explicitly and fields that don't exist in the User model
        filtered_data = {
            k: v for k, v in user_data.items() 
            if k not in ['email', 'password', 'is_active', 'is_superuser', 'is_verified', 
                        'first_name', 'last_name', 'second_name', 'phone_number', 'birthdate']
        }
        
        # Format telecom data
        telecom = []
        if 'phone_number' in user_data:
            telecom.append({
                'system': 'phone',
                'value': user_data['phone_number'],
                'use': 'mobile'
            })
        
        # Create user directly using SQLAlchemy
        user = User(
            email=user_data['email'],
            hashed_password=user_data['password'],
            is_active=True,
            is_superuser=False,
            is_verified=True,
            name={
                'first': user_data.get('first_name', ''),
                'last': user_data.get('last_name', ''),
                'second': user_data.get('second_name', '')
            },
            telecom=telecom,
            birth_date=user_data.get('birthdate'),  # Map birthdate to birth_date
            identifier=generate_identifier(),  # Generate a unique identifier
            username=user_data['email'],  # Use email as username
            **filtered_data
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"User created with ID: {user.id}")
    except Exception as e:
        print(f"Error creating user: {e}")
        # If there's an error creating the user (e.g., email already exists), clean up verification data
        del verification_codes[request.email]
        del pending_registrations[request.email]
        save_verification_data(verification_codes, pending_registrations)
        raise HTTPException(status_code=400, detail="Failed to create user. Please try registering again.")
    
    # Clean up temporary data
    del verification_codes[request.email]
    del pending_registrations[request.email]
    save_verification_data(verification_codes, pending_registrations)
    
    return {"message": "Registration completed successfully. You can now login."}

@router.post("/request-verification")
async def request_verification(request: EmailRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Check if there's a pending registration
    if request.email not in pending_registrations:
        # Check if email is already registered and verified
        stmt = select(User).where(User.email == request.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            if user.is_verified:
                raise HTTPException(status_code=400, detail="Email already registered and verified")
            # Allow resending code for unverified users
            pass
        else:
            raise HTTPException(status_code=400, detail="No pending registration found for this email")
    
    # Generate new verification code
    code = generate_verification_code()
    
    # Update verification code
    store_verification_code(request.email, code)
    
    # Send new verification email
    background_tasks.add_task(
        send_email,
        to_email=request.email,
        subject="Your New Verification Code",
        html=f"""
            <h1>New Verification Code</h1>
            <p>Your new verification code is: <strong>{code}</strong></p>
            <p>This code will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
        """
    )
    
    return {"message": "New verification code sent. Please check your email."}

# Include FastAPI-Users routers for login and other auth operations
router.include_router(
    fastapi_users.get_auth_router(jwt_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)

router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
) 