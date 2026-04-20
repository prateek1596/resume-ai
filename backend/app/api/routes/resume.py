from __future__ import annotations

import asyncio
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.routes.auth import get_current_user
from app.models.resume import GenerateRequest, GenerateResponse, ImproveRequest, ImproveResponse
from app.services import ats, generator

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_resume(req: GenerateRequest, current_user: str = Depends(get_current_user)):
    """Generate resume HTML and run ATS analysis in parallel."""
    try:
        html_task = asyncio.create_task(
            generator.generate(req.resume_data, req.template_id, req.color_scheme, req.job_description)
        )
        ats_task = asyncio.create_task(
            ats.analyze(req.resume_data, req.job_description)
        )
        html, ats_result = await asyncio.gather(html_task, ats_task)
        return GenerateResponse(html=html, ats=ats_result)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@router.post("/improve", response_model=ImproveResponse)
async def improve_content(req: ImproveRequest, current_user: str = Depends(get_current_user)):
    """AI-improve a piece of resume content."""
    try:
        improved, changes = await generator.improve_content(
            req.content, req.context, req.job_description, req.mode
        )
        return ImproveResponse(improved=improved, changes_made=changes)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@router.post("/ats")
async def analyze_ats(req: GenerateRequest, current_user: str = Depends(get_current_user)):
    """Run ATS analysis only (faster than full generate)."""
    try:
        result = await ats.analyze(req.resume_data, req.job_description)
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@router.post("/keywords")
async def analyze_keywords(req: GenerateRequest, current_user: str = Depends(get_current_user)):
    """Run NLP keyword matching for inline highlighting and target tracking."""
    try:
        result = await ats.analyze_keywords(req.resume_data, req.job_description)
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@router.post("/export/docx")
async def export_docx(req: GenerateRequest, current_user: str = Depends(get_current_user)):
    """Export the current resume data as a DOCX file."""
    try:
        payload = generator.build_docx_resume(req.resume_data)
        filename = f"{req.resume_data.contact.name or 'resume'}.docx".replace('/', '_')
        return StreamingResponse(
            BytesIO(payload),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
