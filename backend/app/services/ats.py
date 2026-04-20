"""ATS scoring and suggestion engine."""
from __future__ import annotations

import json
import re
from collections import Counter

try:
    import anthropic
except ImportError:  # pragma: no cover - depends on local environment
    anthropic = None

from app.core.config import get_settings
from app.models.resume import ATSAnalysis, ATSSuggestion, NLPAnalysis, ResumeData

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

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "in",
    "into", "is", "it", "of", "on", "or", "our", "that", "the", "their", "this", "to",
    "with", "via", "we", "you", "your", "using", "used", "across", "build", "built", "role",
    "team", "teams", "work", "worked", "working", "experience", "develop", "developed", "developing",
    "lead", "led", "manage", "managed", "managing", "create", "created", "creating",
}


def _flatten_resume_text(resume: ResumeData) -> str:
    sections = [
        resume.contact.name,
        resume.contact.title,
        resume.summary,
        " ".join(resume.skills.technical),
        " ".join(resume.skills.soft),
        " ".join(item.company for item in resume.experiences),
        " ".join(item.role for item in resume.experiences),
        " ".join(" ".join(item.bullets) for item in resume.experiences),
        " ".join(item.name for item in resume.projects),
        " ".join(item.description for item in resume.projects),
        " ".join(item.technologies for item in resume.projects),
        " ".join(item.school for item in resume.educations),
        " ".join(item.degree for item in resume.educations),
        " ".join(item.name for item in resume.certifications),
    ]
    return " ".join(part for part in sections if part).lower()


def _normalize_keyword(value: str) -> str:
    value = re.sub(r"\s+", " ", value.strip().lower())
    return value


def _extract_keyword_candidates(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z0-9+#./-]{2,}", text)
    counts = Counter()
    phrases = []

    for token in tokens:
        normalized = _normalize_keyword(token)
        if normalized in STOPWORDS or normalized.isdigit():
            continue
        counts[normalized] += 1

    line_fragments = re.split(r"[\n,;|/•·]+", text)
    for fragment in line_fragments:
        words = [word for word in re.findall(r"[A-Za-z0-9+#./-]{2,}", fragment) if _normalize_keyword(word) not in STOPWORDS]
        if 1 <= len(words) <= 4:
            phrase = _normalize_keyword(" ".join(words))
            if len(phrase) >= 3:
                phrases.append(phrase)

    ranked = sorted(set(counts), key=lambda key: (-counts[key], -len(key), key))
    combined = phrases + ranked

    deduped: list[str] = []
    seen: set[str] = set()
    for candidate in combined:
        candidate = _normalize_keyword(candidate)
        if candidate and candidate not in seen:
          seen.add(candidate)
          deduped.append(candidate)
    return deduped


def _keyword_match(job_keywords: list[str], resume_text: str) -> tuple[list[str], list[str]]:
    matched: list[str] = []
    missing: list[str] = []
    for keyword in job_keywords:
        needle = _normalize_keyword(keyword)
        if needle and needle in resume_text:
            matched.append(keyword)
        elif keyword not in missing:
            missing.append(keyword)
    return matched[:20], missing[:20]


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


async def analyze_keywords(resume: ResumeData, job_description: str = "") -> NLPAnalysis:
    resume_text = _flatten_resume_text(resume)
    job_keywords = _extract_keyword_candidates(job_description)
    resume_keywords = _extract_keyword_candidates(resume_text)
    matched, missing = _keyword_match(job_keywords, resume_text)

    score = 50
    if job_keywords:
        score = round((len(matched) / max(len(job_keywords), 1)) * 100)
    score = max(35, min(score, 100))

    suggested_focus = missing[:8] or job_keywords[:8]

    return NLPAnalysis(
        score=score,
        job_keywords=job_keywords[:20],
        resume_keywords=resume_keywords[:20],
        matched_keywords=matched,
        missing_keywords=missing,
        highlight_terms=job_keywords[:15],
        suggested_focus=suggested_focus,
    )
