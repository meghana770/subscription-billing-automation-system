"""User registration and login endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import UserSignup, UserLogin, UserOut, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    email = str(payload.email).lower()

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = User(
        name=payload.name,
        email=email,
        hashed_password=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/signin", response_model=TokenResponse)
def signin(payload: UserLogin, db: Session = Depends(get_db)):
    email = str(payload.email).lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        payload.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user