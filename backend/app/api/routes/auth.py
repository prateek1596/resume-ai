from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/auth", tags=["auth"])

# Lightweight in-memory auth store for local/dev usage.
_users: dict[str, str] = {}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    ok: bool = True
    access_token: str
    token_type: str = "bearer"
    email: EmailStr


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    email = req.email.lower()
    if email in _users:
        raise HTTPException(status_code=409, detail="User already exists")

    _users[email] = req.password
    return AuthResponse(access_token=f"dev-token-{email}", email=email)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    email = req.email.lower()
    saved = _users.get(email)
    if saved is None:
        raise HTTPException(status_code=404, detail="User not found")
    if saved != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return AuthResponse(access_token=f"dev-token-{email}", email=email)
