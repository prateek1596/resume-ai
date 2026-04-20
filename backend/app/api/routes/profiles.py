from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.models.resume import ProfilePayload, ProfileRecord, ProfileSummary
from app.services.db import get_connection

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileSummary])
async def list_profiles(current_user: str = Depends(get_current_user)):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, updated_at FROM profiles WHERE email = ? ORDER BY updated_at DESC",
            (current_user,),
        ).fetchall()
    return [ProfileSummary(id=row["id"], name=row["name"], updated_at=row["updated_at"]) for row in rows]


@router.get("/{profile_id}", response_model=ProfileRecord)
async def get_profile(profile_id: str, current_user: str = Depends(get_current_user)):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, payload, updated_at FROM profiles WHERE id = ? AND email = ?",
            (profile_id, current_user),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    payload = json.loads(row["payload"])
    return ProfileRecord(
        id=row["id"],
        name=row["name"],
        updated_at=row["updated_at"],
        resume_data=payload.get("resume_data", {}),
        template_id=payload.get("template_id", "executive"),
        color_scheme=payload.get("color_scheme", "classic"),
        job_description=payload.get("job_description", ""),
    )


@router.post("", response_model=ProfileSummary)
async def create_profile(req: ProfilePayload, current_user: str = Depends(get_current_user)):
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "resume_data": req.resume_data.model_dump(),
        "template_id": req.template_id,
        "color_scheme": req.color_scheme,
        "job_description": req.job_description,
    }

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO profiles(id, email, name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (profile_id, current_user, req.name, json.dumps(payload), now, now),
        )
    return ProfileSummary(id=profile_id, name=req.name, updated_at=now)


@router.put("/{profile_id}", response_model=ProfileSummary)
async def update_profile(profile_id: str, req: ProfilePayload, current_user: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "resume_data": req.resume_data.model_dump(),
        "template_id": req.template_id,
        "color_scheme": req.color_scheme,
        "job_description": req.job_description,
    }

    with get_connection() as conn:
        result = conn.execute(
            "UPDATE profiles SET name = ?, payload = ?, updated_at = ? WHERE id = ? AND email = ?",
            (req.name, json.dumps(payload), now, profile_id, current_user),
        )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileSummary(id=profile_id, name=req.name, updated_at=now)


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str, current_user: str = Depends(get_current_user)):
    with get_connection() as conn:
        result = conn.execute(
            "DELETE FROM profiles WHERE id = ? AND email = ?",
            (profile_id, current_user),
        )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"ok": True}