from fastapi import APIRouter, HTTPException
from app.models.resume import GenerateRequest, GenerateResponse, ImproveRequest, ImproveResponse
from app.services import generator, ats

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/generate", response_model=GenerateResponse)
async def generate_resume(req: GenerateRequest):
    """Generate resume HTML and run ATS analysis in parallel."""
    try:
        import asyncio
        html_task = asyncio.create_task(
            generator.generate(req.resume_data, req.template_id, req.color_scheme, req.job_description)
        )
        ats_task = asyncio.create_task(
            ats.analyze(req.resume_data, req.job_description)
        )
        html, ats_result = await asyncio.gather(html_task, ats_task)
        return GenerateResponse(html=html, ats=ats_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/improve", response_model=ImproveResponse)
async def improve_content(req: ImproveRequest):
    """AI-improve a piece of resume content."""
    try:
        improved, changes = await generator.improve_content(
            req.content, req.context, req.job_description, req.mode
        )
        return ImproveResponse(improved=improved, changes_made=changes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ats")
async def analyze_ats(req: GenerateRequest):
    """Run ATS analysis only (faster than full generate)."""
    try:
        result = await ats.analyze(req.resume_data, req.job_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
