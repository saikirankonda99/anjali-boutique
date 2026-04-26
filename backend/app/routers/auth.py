from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.schemas import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": payload.email},
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and insert
    hashed = hash_password(payload.password)
    result = db.execute(
        text(
            """
            INSERT INTO users (email, password_hash, name, phone, role)
            VALUES (:email, :pw, :name, :phone, 'customer')
            RETURNING id, email, name, phone, role
            """
        ),
        {
            "email": payload.email,
            "pw": hashed,
            "name": payload.name,
            "phone": payload.phone,
        },
    )
    user = result.mappings().first()
    db.commit()

    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": dict(user),
    }


def _authenticate_user(email: str, password: str, db: Session) -> dict:
    """Shared auth logic for both login flows."""
    result = db.execute(
        text(
            "SELECT id, email, name, phone, role, password_hash "
            "FROM users WHERE email = :email"
        ),
        {"email": email},
    )
    user = result.mappings().first()

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return dict(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """JSON-based login - for our web/mobile frontends."""
    user = _authenticate_user(payload.email, payload.password, db)
    user_dict = {k: v for k, v in user.items() if k != "password_hash"}
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict,
    }


@router.post("/token", response_model=TokenResponse)
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2-compatible login - for Swagger UI's Authorize button.
    Uses 'username' (which is actually our email) and 'password' as form fields.
    """
    user = _authenticate_user(form_data.username, form_data.password, db)
    user_dict = {k: v for k, v in user.items() if k != "password_hash"}
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict,
    }


@router.get("/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)):
    return current_user