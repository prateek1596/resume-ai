from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field

from app.services.db import get_connection

router = APIRouter(prefix="/auth", tags=["auth"])


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
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO sessions(token, email, created_at) VALUES (?, ?, ?)",
            (token, email, now),
        )
    return token


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    token = authorization.removeprefix("Bearer ").strip()
    with get_connection() as conn:
        row = conn.execute("SELECT email FROM sessions WHERE token = ?", (token,)).fetchone()
    email = row["email"] if row else None
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return email


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    email = req.email.lower()
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        exists = conn.execute("SELECT email FROM users WHERE email = ?", (email,)).fetchone()
        if exists:
            raise HTTPException(status_code=409, detail="User already exists")
        conn.execute(
            "INSERT INTO users(email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, _hash_password(req.password), now),
        )

    return AuthResponse(access_token=_issue_token(email), email=email)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    email = req.email.lower()
    with get_connection() as conn:
        row = conn.execute("SELECT password_hash FROM users WHERE email = ?", (email,)).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    if row["password_hash"] != _hash_password(req.password):
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
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    return {"ok": True}
