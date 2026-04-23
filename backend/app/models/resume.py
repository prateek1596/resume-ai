from __future__ import annotations

from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    portfolio: str = ""
    website: str = ""


class ExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    start: str = ""
    end: str = "Present"
    bullets: list[str] = Field(default_factory=list)
    description: str = ""


class EducationItem(BaseModel):
    school: str = ""
    degree: str = ""
    field: str = ""
    year: str = ""
    gpa: str = ""


class CertificationItem(BaseModel):
    name: str = ""
    issuer: str = ""
    year: str = ""
    url: str = ""


class LanguageItem(BaseModel):
    language: str = ""
    level: str = ""


class ProjectItem(BaseModel):
    name: str = ""
    description: str = ""
    technologies: str = ""
    url: str = ""
    bullets: list[str] = Field(default_factory=list)


class Skills(BaseModel):
    technical: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)


class ResumeData(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = ""
    experiences: list[ExperienceItem] = Field(default_factory=list)
    educations: list[EducationItem] = Field(default_factory=list)
    skills: Skills = Field(default_factory=Skills)
    certifications: list[CertificationItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    photo_base64: str | None = None


class ATSSuggestion(BaseModel):
    type: str  # "add" | "remove" | "improve"
    category: str  # "keywords" | "format" | "content" | "length"
    text: str
    priority: str = "medium"  # "high" | "medium" | "low"


class ATSAnalysis(BaseModel):
    score: int
    breakdown: dict[str, int]  # section-level scores
    suggestions: list[ATSSuggestion]
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)


class NLPAnalysis(BaseModel):
    score: int
    job_keywords: list[str] = Field(default_factory=list)
    resume_keywords: list[str] = Field(default_factory=list)
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    highlight_terms: list[str] = Field(default_factory=list)
    suggested_focus: list[str] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    resume_data: ResumeData
    template_id: str = "executive"
    color_scheme: str = "classic"
    job_description: str = ""


class GenerateResponse(BaseModel):
    html: str
    ats: ATSAnalysis


class TemplateMeta(BaseModel):
    id: str
    name: str
    description: str
    has_photo: bool
    category: str


class ColorSchemeMeta(BaseModel):
    id: str
    label: str
    swatch: str


class TemplateCatalogResponse(BaseModel):
    templates: list[TemplateMeta]
    color_schemes: list[ColorSchemeMeta]


class ResumeInsightsRequest(BaseModel):
    resume_data: ResumeData
    job_description: str = ""


class ResumeInsightsResponse(BaseModel):
    overall_completeness: int
    section_word_counts: dict[str, int]
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class ExtractResponse(BaseModel):
    resume_data: ResumeData
    source: str  # "linkedin" | "pdf" | "docx"


class ImproveRequest(BaseModel):
    content: str
    context: str = ""  # role / section hint
    job_description: str = ""
    mode: str = "bullets"  # "bullets" | "summary" | "general"


class ImproveResponse(BaseModel):
    improved: str
    changes_made: list[str]


class ProfilePayload(BaseModel):
    name: str
    resume_data: ResumeData
    template_id: str = "executive"
    color_scheme: str = "classic"
    job_description: str = ""


class ProfileSummary(BaseModel):
    id: str
    name: str
    updated_at: str


class ProfileRecord(ProfileSummary):
    resume_data: ResumeData
    template_id: str
    color_scheme: str
    job_description: str
