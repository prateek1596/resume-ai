from __future__ import annotations

import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/auth", tags=["auth"])

# Lightweight in-memory auth store for local/dev usage.
_users: dict[str, str] = {}
_sessions: dict[str, str] = {}


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


class CurrentUserResponse(BaseModel):
    ok: bool = True
    email: EmailStr


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _issue_token(email: str) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = email
    return token


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    token = authorization.removeprefix("Bearer ").strip()
    email = _sessions.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return email


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    email = req.email.lower()
    if email in _users:
        raise HTTPException(status_code=409, detail="User already exists")

    _users[email] = _hash_password(req.password)
    return AuthResponse(access_token=_issue_token(email), email=email)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    email = req.email.lower()
    saved = _users.get(email)
    if saved is None:
        raise HTTPException(status_code=404, detail="User not found")
    if saved != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return AuthResponse(access_token=_issue_token(email), email=email)


@router.get("/me", response_model=CurrentUserResponse)
async def current_user(email: str = Depends(get_current_user)):
    return CurrentUserResponse(email=email)


@router.post("/logout")
async def logout(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")
    token = authorization.removeprefix("Bearer ").strip()
    _sessions.pop(token, None)
    return {"ok": True}
