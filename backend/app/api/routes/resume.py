from __future__ import annotations

import asyncio
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.routes.auth import get_current_user
from app.models.resume import (
    ColorSchemeMeta,
    GenerateRequest,
    GenerateResponse,
    ImproveRequest,
    ImproveResponse,
    ResumeInsightsRequest,
    ResumeInsightsResponse,
    TemplateCatalogResponse,
    TemplateMeta,
)
from app.services import ats, generator

router = APIRouter(prefix="/resume", tags=["resume"])

TEMPLATE_CATALOG = [
    TemplateMeta(id="executive", name="Executive", description="Bold header · Photo · Classic", has_photo=True, category="modern"),
    TemplateMeta(id="minimal", name="Minimal", description="Clean · No photo · Accent bar", has_photo=False, category="minimal"),
    TemplateMeta(id="split", name="Modern Split", description="Sidebar · Photo · Two-column", has_photo=True, category="modern"),
    TemplateMeta(id="classic", name="Classic Pro", description="Traditional · No photo · Rules", has_photo=False, category="classic"),
    TemplateMeta(id="creative", name="Creative", description="Sidebar · Photo · Contemporary", has_photo=True, category="creative"),
    TemplateMeta(id="tech", name="Tech", description="Dark header · No photo · Dev", has_photo=False, category="modern"),
    TemplateMeta(id="elegant", name="Elegant", description="Centered · Photo · Refined", has_photo=True, category="classic"),
    TemplateMeta(id="sharp", name="Sharp", description="Angled · No photo · Bold", has_photo=False, category="creative"),
    TemplateMeta(id="timeline", name="Timeline", description="Dots · Photo · Chronological", has_photo=True, category="modern"),
    TemplateMeta(id="ats_pure", name="ATS Pure", description="Text-only · No photo · Max ATS", has_photo=False, category="ats"),
    TemplateMeta(id="bento", name="Bento", description="Card grid · Photo · Modern", has_photo=True, category="modern"),
    TemplateMeta(id="monograph", name="Monograph", description="Editorial · No photo · Serif", has_photo=False, category="classic"),
    TemplateMeta(id="duo", name="Duo", description="Split rail · Photo · Compact", has_photo=True, category="modern"),
    TemplateMeta(id="finance", name="Finance", description="Sharp metrics · No photo · Premium", has_photo=False, category="classic"),
    TemplateMeta(id="product", name="Product", description="Outcome-led · Photo · Strategy", has_photo=True, category="modern"),
    TemplateMeta(id="portfolio", name="Portfolio", description="Creative · Photo · Project-first", has_photo=True, category="creative"),
    TemplateMeta(id="impact", name="Impact", description="Bold KPIs · No photo · Results-first", has_photo=False, category="modern"),
    TemplateMeta(id="consulting", name="Consulting", description="Structured cases · No photo · Executive", has_photo=False, category="classic"),
    TemplateMeta(id="founder", name="Founder", description="Narrative-led · Photo · Leadership", has_photo=True, category="creative"),
]

COLOR_SCHEME_CATALOG = [
    ColorSchemeMeta(id="classic", label="Classic", swatch="#6c63ff"),
    ColorSchemeMeta(id="navy", label="Navy", swatch="#3b82f6"),
    ColorSchemeMeta(id="emerald", label="Emerald", swatch="#10b981"),
    ColorSchemeMeta(id="crimson", label="Crimson", swatch="#dc2626"),
    ColorSchemeMeta(id="slate", label="Slate", swatch="#475569"),
    ColorSchemeMeta(id="gold", label="Gold", swatch="#b45309"),
]


def _count_words(value: str) -> int:
    return len([token for token in value.split() if token.strip()])


def _build_resume_insights(req: ResumeInsightsRequest) -> ResumeInsightsResponse:
    resume = req.resume_data
    summary_words = _count_words(resume.summary)
    experience_words = sum(_count_words(" ".join(item.bullets)) for item in resume.experiences)
    project_words = sum(_count_words(f"{item.description} {' '.join(item.bullets)}") for item in resume.projects)
    skills_words = len(resume.skills.technical) + len(resume.skills.soft)

    section_word_counts = {
        "summary": summary_words,
        "experience": experience_words,
        "projects": project_words,
        "skills": skills_words,
    }

    completeness_points = 0
    if resume.contact.name.strip():
        completeness_points += 10
    if resume.contact.email.strip():
        completeness_points += 10
    if resume.summary.strip():
        completeness_points += 20
    if resume.experiences:
        completeness_points += 25
    if resume.skills.technical:
        completeness_points += 15
    if resume.educations:
        completeness_points += 10
    if resume.projects:
        completeness_points += 10

    strengths: list[str] = []
    if len(resume.experiences) >= 2:
        strengths.append("Solid experience depth with multiple roles.")
    if len(resume.skills.technical) >= 8:
        strengths.append("Strong technical breadth across tools and platforms.")
    if any(any(char.isdigit() for char in bullet) for exp in resume.experiences for bullet in exp.bullets):
        strengths.append("Experience bullets include measurable outcomes.")
    if req.job_description.strip() and resume.summary.strip():
        strengths.append("Job target provided, enabling ATS and keyword alignment.")

    gaps: list[str] = []
    if summary_words < 20:
        gaps.append("Summary is light; expand to 2-3 focused sentences.")
    if not resume.experiences:
        gaps.append("Add at least one experience entry to improve ATS ranking.")
    if not resume.projects:
        gaps.append("Project section is empty; add at least one proof-of-work project.")
    if not req.job_description.strip():
        gaps.append("No job description provided; optimization is less targeted.")

    recommendations: list[str] = []
    if not any(any(char.isdigit() for char in bullet) for exp in resume.experiences for bullet in exp.bullets):
        recommendations.append("Quantify impact in bullets (%, $, time saved) for stronger credibility.")
    if len(resume.skills.technical) < 6:
        recommendations.append("Add role-relevant technical keywords to improve keyword matching.")
    if summary_words < 35:
        recommendations.append("Refine summary to include domain, years of experience, and key outcomes.")
    if req.job_description.strip():
        recommendations.append("Mirror language from the job description in summary and top bullets.")

    return ResumeInsightsResponse(
        overall_completeness=min(completeness_points, 100),
        section_word_counts=section_word_counts,
        strengths=strengths[:4],
        gaps=gaps[:4],
        recommendations=recommendations[:4],
    )


@router.get("/templates", response_model=TemplateCatalogResponse)
async def get_template_catalog(current_user: str = Depends(get_current_user)):
    """Return supported template and color scheme metadata."""
    return TemplateCatalogResponse(templates=TEMPLATE_CATALOG, color_schemes=COLOR_SCHEME_CATALOG)


@router.post("/insights", response_model=ResumeInsightsResponse)
async def get_resume_insights(req: ResumeInsightsRequest, current_user: str = Depends(get_current_user)):
    """Compute deterministic resume quality insights without calling AI providers."""
    return _build_resume_insights(req)


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
