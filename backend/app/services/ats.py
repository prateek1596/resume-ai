"""ATS scoring and suggestion engine."""
from __future__ import annotations

import json
import re

try:
    import anthropic
except ImportError:  # pragma: no cover - depends on local environment
    anthropic = None

from app.core.config import get_settings
from app.models.resume import ATSAnalysis, ATSSuggestion, ResumeData

settings = get_settings()
client = anthropic.Anthropic(api_key=settings.anthropic_api_key) if anthropic else None

ATS_SYSTEM = """You are a senior ATS (Applicant Tracking System) optimization expert with 10+ years of experience. Analyze resume data and return a detailed JSON ATS report.

Return ONLY valid JSON (no markdown):
{
  "score": 78,
  "breakdown": {
    "keywords": 80,
    "formatting": 90,
    "content_quality": 70,
    "quantification": 60,
    "completeness": 85
  },
  "suggestions": [
    {"type": "add", "category": "keywords", "text": "...", "priority": "high"},
    {"type": "remove", "category": "content", "text": "...", "priority": "medium"},
    {"type": "improve", "category": "format", "text": "...", "priority": "high"}
  ],
  "matched_keywords": ["Python", "React"],
  "missing_keywords": ["Docker", "CI/CD"]
}

Types: "add" | "remove" | "improve"
Categories: "keywords" | "format" | "content" | "length" | "structure"
Priority: "high" | "medium" | "low"
Provide 6-10 actionable, specific suggestions. Score 0-100."""


async def analyze(resume: ResumeData, job_description: str = "") -> ATSAnalysis:
    payload = {
        "contact": resume.contact.model_dump(),
        "summary": resume.summary,
        "experience_roles": [{"role": e.role, "company": e.company, "bullets": e.bullets} for e in resume.experiences],
        "skills_technical": resume.skills.technical,
        "skills_soft": resume.skills.soft,
        "educations": [e.model_dump() for e in resume.educations],
        "certifications": [c.name for c in resume.certifications],
        "has_photo": bool(resume.photo_base64),
        "total_bullets": sum(len(e.bullets) for e in resume.experiences),
    }

    jd_text = f"\nJob Description:\n{job_description[:2000]}" if job_description else "\n(No job description provided — use general best practices)"

    if client is None:
        return ATSAnalysis(
            score=70,
            breakdown={
                "keywords": 70,
                "formatting": 75,
                "content_quality": 70,
                "quantification": 65,
                "completeness": 70,
            },
            suggestions=[
                ATSSuggestion(
                    type="improve",
                    category="content",
                    text="Add role-specific achievements with measurable impact.",
                    priority="high",
                ),
                ATSSuggestion(
                    type="add",
                    category="keywords",
                    text="Include keywords from the target job description.",
                    priority="high",
                ),
            ],
            matched_keywords=[],
            missing_keywords=[],
        )

    try:
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1500,
            system=ATS_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this resume for ATS optimization:{jd_text}\n\nResume data:\n{json.dumps(payload, indent=2)}",
                }
            ],
        )

        raw = response.content[0].text
        clean = re.sub(r"```json|```", "", raw).strip()
        data = json.loads(clean)

        return ATSAnalysis(
            score=data.get("score", 70),
            breakdown=data.get("breakdown", {}),
            suggestions=[ATSSuggestion(**s) for s in data.get("suggestions", [])],
            matched_keywords=data.get("matched_keywords", []),
            missing_keywords=data.get("missing_keywords", []),
        )
    except Exception:
        return ATSAnalysis(
            score=70,
            breakdown={
                "keywords": 70,
                "formatting": 75,
                "content_quality": 70,
                "quantification": 65,
                "completeness": 70,
            },
            suggestions=[
                ATSSuggestion(
                    type="improve",
                    category="content",
                    text="Strengthen bullets with action verbs and outcomes.",
                    priority="high",
                ),
                ATSSuggestion(
                    type="add",
                    category="keywords",
                    text="Align skills and summary with the target role.",
                    priority="high",
                ),
            ],
            matched_keywords=[],
            missing_keywords=[],
        )
