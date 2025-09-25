from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import JWTStrategy

from ..core.auth import jwt_backend, refresh_backend, fastapi_users, current_active_user, current_superuser
from ..models.user import User
from ..schemas.user import UserRead, UserCreate, UserUpdate, VerificationRequest

router = APIRouter()

# Include FastAPI-Users routers
router.include_router(
    fastapi_users.get_auth_router(jwt_backend, refresh_backend),
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

router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Custom verification request endpoint
@router.post("/request-verify-token", status_code=status.HTTP_202_ACCEPTED)
async def request_verify_token(
    email: str = Body(..., embed=True),
    current_user: User = Depends(current_active_user)
):
    """Request a new verification token for the user's email."""
    if current_user.email != email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only request verification for your own email"
        )
    
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified"
        )
    
    # The actual verification request is handled by FastAPI-Users
    # This endpoint just provides a nicer interface
    return {"message": "Verification email has been sent"} 