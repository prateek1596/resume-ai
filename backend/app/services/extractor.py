"""Extract structured resume data from uploaded files."""
from __future__ import annotations
import base64
import io
import json
import re

try:
    import anthropic
except ImportError:  # pragma: no cover - depends on local environment
    anthropic = None

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - depends on local environment
    PdfReader = None

from app.core.config import get_settings
from app.models.resume import ResumeData, ContactInfo, ExperienceItem, EducationItem, Skills, CertificationItem, LanguageItem, ProjectItem

settings = get_settings()
client = anthropic.Anthropic(api_key=settings.anthropic_api_key) if anthropic else None

EXTRACT_SYSTEM = """You are a resume data extraction expert. Extract ALL information from the provided document into structured JSON. Be thorough — capture every job, education, skill, project, and certification mentioned.

Return ONLY valid JSON matching this exact schema (no markdown, no preamble):
{
  "contact": {"name":"","title":"","email":"","phone":"","location":"","linkedin":"","portfolio":"","website":""},
  "summary": "",
  "experiences": [{"company":"","role":"","start":"","end":"","bullets":["..."]}],
  "educations": [{"school":"","degree":"","field":"","year":"","gpa":""}],
  "skills": {"technical":["..."],"soft":["..."]},
  "certifications": [{"name":"","issuer":"","year":"","url":""}],
  "languages": [{"language":"","level":""}],
  "projects": [{"name":"","description":"","technologies":"","url":"","bullets":[]}]
}"""


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    if PdfReader is None:
        return ""
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""


def _parse_ai_json(raw: str) -> dict:
    clean = re.sub(r"```json|```", "", raw).strip()
    return json.loads(clean)


def _fallback_resume_from_text(text: str) -> ResumeData:
    """Best-effort parser used when AI extraction is unavailable."""
    raw_lines = [line.rstrip() for line in text.splitlines()]
    lines = [line.strip() for line in raw_lines if line.strip()]

    heading_aliases = {
        "about": "about",
        "summary": "about",
        "experience": "experience",
        "work experience": "experience",
        "education": "education",
        "certifications": "certifications",
        "licenses & certifications": "certifications",
        "skills": "skills",
        "top skills": "skills",
        "projects": "projects",
        "languages": "languages",
        "contact": "contact",
    }

    def is_heading(value: str) -> bool:
        return value.strip().lower().rstrip(":") in heading_aliases

    def looks_like_name(value: str) -> bool:
        if not value or len(value) > 60:
            return False
        lower = value.lower()
        if any(token in lower for token in ("linkedin", "@", "http", "/in/", "page")):
            return False
        if any(token in lower for token in ("certificate", "certified", "certification", "associate", "oracle", "aws", "infrastructure", "solutions", "participation")):
            return False
        if any(char.isdigit() for char in value):
            return False
        words = [word for word in re.split(r"\s+", value) if word]
        return 2 <= len(words) <= 4 and all(word[0].isupper() for word in words if word)

    def looks_like_title(value: str) -> bool:
        if not value or len(value) > 120:
            return False
        lower = value.lower()
        if is_heading(value) or is_location_line(value):
            return False
        if any(token in lower for token in ("linkedin", "@", "http", "page 1", "page 2")):
            return False
        if re.search(r"[|•/]", value):
            return True
        return bool(
            any(token in lower for token in ("intern", "developer", "engineer", "student", "analyst", "trainee", "manager", "consultant", "software", "computer science", "cse", "btech", "mtech", "graduate"))
            and len(value.split()) <= 12
        )

    def is_location_line(value: str) -> bool:
        lower = value.lower()
        if any(token in lower for token in ("linkedin", "http", "page", "skills", "certification", "experience", "education")):
            return False
        return bool(
            re.search(r",\s*(india|united states|usa|canada|uk|australia|germany|france|singapore|remote)\b", lower)
            or ("," in value and len(value.split()) <= 8)
        )

    def looks_like_cert_line(value: str) -> bool:
        lower = value.lower()
        if is_heading(value) or is_location_line(value) or looks_like_name(value):
            return False
        return bool(
            any(token in lower for token in ("certificate", "certified", "certification", "aws", "oracle", "infrastructure", "solutions architect", "participation", "associate"))
            or lower.endswith(("certificate", "associate"))
        )

    def is_date_line(value: str) -> bool:
        lower = value.lower()
        return bool(re.search(r"(19|20)\d{2}", lower) and ("-" in lower or "–" in lower or "to" in lower or "present" in lower))

    def find_heading_index(target: str) -> int:
        target = target.lower()
        for idx, line in enumerate(lines):
            if line.lower().rstrip(":") == target:
                return idx
        return -1

    def find_next_heading_index(start: int, candidates: list[str]) -> int:
        candidate_set = {c.lower() for c in candidates}
        for idx in range(start + 1, len(lines)):
            if lines[idx].lower().rstrip(":") in candidate_set:
                return idx
        return len(lines)

    def line_window(start: int, end: int) -> list[str]:
        return [line for line in lines[start:end] if line and not is_heading(line)]

    def collect_sections() -> dict[str, list[str]]:
        sections = {
            "skills": [],
            "certifications": [],
            "experience": [],
            "education": [],
            "about": [],
            "projects": [],
            "languages": [],
        }
        order = ["skills", "certifications", "experience", "education"]
        indices = {name: find_heading_index(name) for name in order}
        for i, name in enumerate(order):
            start = indices[name]
            if start == -1:
                continue
            next_candidates = order[i + 1 :] if i + 1 < len(order) else []
            end = find_next_heading_index(start, next_candidates) if next_candidates else len(lines)
            sections[name] = line_window(start + 1, end)

        # Split the post-certification block into actual certification items and the profile header.
        cert_idx = indices["certifications"]
        exp_idx = indices["experience"]
        if cert_idx != -1 and exp_idx != -1:
            cert_block = [line for line in lines[cert_idx + 1 : exp_idx] if line and not is_heading(line)]
            cert_lines: list[str] = []
            about_lines: list[str] = []
            in_header = False
            for line in cert_block:
                if not in_header and looks_like_cert_line(line):
                    cert_lines.append(line)
                    continue
                in_header = True
                about_lines.append(line)
            sections["certifications"] = cert_lines or sections["certifications"]
            sections["about"] = about_lines
        return sections

    def split_chunks(section_lines: list[str]) -> list[list[str]]:
        chunks: list[list[str]] = []
        current: list[str] = []
        for line in section_lines:
            if not line:
                continue
            current.append(line)
        if current:
            chunks.append(current)
        return chunks

    def parse_cert_lines(section_lines: list[str]) -> list[str]:
        items: list[str] = []
        pending = ""
        for line in section_lines:
            if not line:
                continue
            lower = line.strip().lower()
            pending_lower = pending.lower()
            should_join = False
            if pending:
                if pending.endswith(("-", "–", ":")) and len(line.split()) <= 3:
                    should_join = True
                elif pending_lower.endswith("participation") and lower == "certificate":
                    should_join = True
                elif pending_lower.endswith("architect") and lower == "associate":
                    should_join = True
                elif lower == "certificate" and pending_lower.endswith(("camp", "training", "workshop")):
                    should_join = True
            if should_join:
                pending = f"{pending} {line.strip()}".strip()
                continue
            if pending:
                items.append(pending.strip())
            pending = line.strip()
        if pending:
            items.append(pending.strip())
        return items

    def looks_like_date_range(value: str) -> bool:
        v = value.lower()
        return bool(re.search(r"(19|20)\d{2}", v)) and ("-" in v or "–" in v or "to" in v or "present" in v)

    def parse_experiences(section_lines: list[str]) -> list[ExperienceItem]:
        items: list[ExperienceItem] = []
        i = 0
        while i < len(section_lines):
            company = section_lines[i]
            role = section_lines[i + 1] if i + 1 < len(section_lines) else ""
            date_line = section_lines[i + 2] if i + 2 < len(section_lines) else ""
            location_line = section_lines[i + 3] if i + 3 < len(section_lines) else ""

            if not company or not role or not is_date_line(date_line):
                i += 1
                continue

            start = ""
            end = "Present"
            parts = re.split(r"\s*(?:-|–|to)\s*", date_line, maxsplit=1)
            if parts:
                start = parts[0].strip()
            if len(parts) > 1:
                end = parts[1].strip() or "Present"

            bullets: list[str] = []
            j = i + 4 if location_line and is_location_line(location_line) else i + 3
            while j < len(section_lines):
                line = section_lines[j]
                if not line:
                    j += 1
                    continue
                if looks_like_name(line) and j + 1 < len(section_lines) and not is_date_line(section_lines[j + 1]):
                    break
                if len(line.split()) <= 3 and looks_like_title(line) and any(tok in line.lower() for tok in ("intern", "engineer", "trainee", "developer", "manager")):
                    break
                if is_date_line(line):
                    break
                if is_location_line(line):
                    j += 1
                    continue
                bullets.append(line.lstrip("•-* ").strip())
                j += 1

            items.append(ExperienceItem(company=company, role=role, start=start, end=end, bullets=bullets[:8]))
            i = j
        return items

    def parse_educations(section_lines: list[str]) -> list[EducationItem]:
        items: list[EducationItem] = []
        for line in section_lines:
            if not line:
                continue
            if line.lower().startswith("page "):
                continue
            school = line[:120]
            year = ""
            m = re.search(r"(19|20)\d{2}", line)
            if m:
                year = m.group(0)
            degree = ""
            items.append(EducationItem(school=school, degree=degree, field="", year=year, gpa=""))
        return items

    def parse_certifications(section_lines: list[str]) -> list[CertificationItem]:
        certs: list[CertificationItem] = []
        for line in parse_cert_lines(section_lines):
            if not line:
                continue
            name = line[:160]
            issuer = ""
            year = ""
            for token in (line,):
                m = re.search(r"(19|20)\d{2}", token)
                if m:
                    year = m.group(0)
                    break
            certs.append(CertificationItem(name=name, issuer=issuer, year=year, url=""))
        return certs

    def parse_projects(section_lines: list[str]) -> list[ProjectItem]:
        projects: list[ProjectItem] = []
        for chunk in split_chunks(section_lines):
            if not chunk:
                continue
            name = chunk[0][:120]
            description_lines = [line for line in chunk[1:] if line and not looks_like_date_range(line)]
            description = " ".join(description_lines[:3])[:500]
            projects.append(ProjectItem(name=name, description=description, technologies="", url="", bullets=[]))
        return projects

    def parse_languages(section_lines: list[str]) -> list[LanguageItem]:
        langs: list[LanguageItem] = []
        for line in section_lines:
            if not line:
                continue
            if ":" in line:
                language, level = line.split(":", 1)
                langs.append(LanguageItem(language=language.strip()[:60], level=level.strip()[:60]))
            else:
                langs.append(LanguageItem(language=line[:60], level=""))
        return langs[:12]

    def parse_skills(section_lines: list[str]) -> Skills:
        tokens: list[str] = []
        for line in section_lines:
            if not line:
                continue
            split = [t.strip() for t in re.split(r"[,|•]", line) if t.strip()]
            if split:
                tokens.extend(split)
            elif len(line) < 60:
                tokens.append(line)

        # If a dedicated skills section is sparse, fall back to global keyword mining.
        if len(tokens) < 6:
            extras = re.findall(
                r"\b(Python|Java|JavaScript|TypeScript|React|Node(?:\.js)?|Django|FastAPI|Flask|SQL|PostgreSQL|MySQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|Git|CI/CD|TensorFlow|PyTorch|Pandas|NumPy|Tableau|Power BI)\b",
                text,
                flags=re.IGNORECASE,
            )
            tokens.extend(extras)

        seen: set[str] = set()
        technical: list[str] = []
        for token in tokens:
            norm = token.strip()
            key = norm.lower()
            if key in seen or len(norm) < 2:
                continue
            seen.add(key)
            technical.append(norm)
        return Skills(technical=technical[:35], soft=[])

    sections = collect_sections()
    name = ""
    title = ""
    header_location = ""
    header_candidates = sections["about"] or lines
    for idx, line in enumerate(header_candidates):
        if looks_like_name(line):
            name = line[:120]
            for next_line in header_candidates[idx + 1 : idx + 4]:
                if looks_like_title(next_line) and not looks_like_cert_line(next_line):
                    title = next_line[:120]
                    continue
                if is_location_line(next_line):
                    header_location = next_line[:120]
                    break
            break

    if not name:
        for line in header_candidates:
            if looks_like_name(line) and not looks_like_cert_line(line):
                name = line[:120]
                break

    if not title:
        for line in header_candidates:
            if looks_like_title(line) and line != name and not looks_like_cert_line(line):
                title = line[:120]
                break

    if not header_location:
        for line in header_candidates:
            if is_location_line(line):
                header_location = line[:120]
                break

    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+?\d[\d\-()\s]{7,}\d)", text)
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/[^\s]+", text, re.IGNORECASE)
    location_match = re.search(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z]{2}|[A-Z][a-z]+,\s?[A-Z][a-z]+)\b", text)

    summary_text = " ".join(line for line in sections["about"] if line and line not in {name, title, header_location})[:900]
    if not summary_text:
        summary_text = "\n".join(line for line in header_candidates if line not in {name, title, header_location})[:600]

    experiences = parse_experiences(sections["experience"])
    educations = parse_educations(sections["education"])
    certifications = parse_certifications(sections["certifications"])
    projects = parse_projects(sections["projects"])
    languages = parse_languages(sections["languages"])
    skills = parse_skills(sections["skills"])

    return ResumeData(
        contact=ContactInfo(
            name=name,
            title=title,
            email=email_match.group(0) if email_match else "",
            phone=phone_match.group(0).strip() if phone_match else "",
            location=header_location or (location_match.group(0) if location_match else ""),
            linkedin=linkedin_match.group(0) if linkedin_match else "",
        ),
        summary=summary_text,
        experiences=experiences,
        educations=educations,
        skills=skills,
        certifications=certifications,
        languages=languages,
        projects=projects,
    )


def _dict_to_resume_data(d: dict) -> ResumeData:
    c = d.get("contact", {})
    return ResumeData(
        contact=ContactInfo(**{k: v for k, v in c.items() if k in ContactInfo.model_fields}),
        summary=d.get("summary", ""),
        experiences=[
            ExperienceItem(**{k: v for k, v in e.items() if k in ExperienceItem.model_fields})
            for e in d.get("experiences", [])
        ],
        educations=[
            EducationItem(**{k: v for k, v in e.items() if k in EducationItem.model_fields})
            for e in d.get("educations", [])
        ],
        skills=Skills(
            technical=d.get("skills", {}).get("technical", []),
            soft=d.get("skills", {}).get("soft", []),
        ),
        certifications=[
            CertificationItem(**{k: v for k, v in c.items() if k in CertificationItem.model_fields})
            for c in d.get("certifications", [])
        ],
        languages=[
            LanguageItem(**{k: v for k, v in l.items() if k in LanguageItem.model_fields})
            for l in d.get("languages", [])
        ],
        projects=[
            ProjectItem(**{k: v for k, v in p.items() if k in ProjectItem.model_fields})
            for p in d.get("projects", [])
        ],
    )


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def _merge_unique_strings(primary: list[str], secondary: list[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for value in [*primary, *secondary]:
        norm = _norm(value)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        merged.append(value.strip())
    return merged


def _merge_contact(primary: ContactInfo, secondary: ContactInfo) -> ContactInfo:
    data = primary.model_dump()
    for field in ContactInfo.model_fields:
        if not data.get(field):
            data[field] = getattr(secondary, field, "") or ""
    return ContactInfo(**data)


def _merge_experiences(primary: list[ExperienceItem], secondary: list[ExperienceItem]) -> list[ExperienceItem]:
    merged: list[ExperienceItem] = []
    index: dict[tuple[str, str], ExperienceItem] = {}

    def add(item: ExperienceItem) -> None:
        key = (_norm(item.company), _norm(item.role))
        existing = index.get(key)
        if existing is None:
            clone = ExperienceItem(
                company=item.company,
                role=item.role,
                start=item.start,
                end=item.end,
                bullets=list(item.bullets),
                description=item.description,
            )
            index[key] = clone
            merged.append(clone)
            return
        if not existing.company:
            existing.company = item.company
        if not existing.role:
            existing.role = item.role
        if not existing.start:
            existing.start = item.start
        if not existing.end or existing.end == "Present":
            existing.end = item.end or existing.end
        existing.bullets = _merge_unique_strings(existing.bullets, item.bullets)
        if not existing.description and item.description:
            existing.description = item.description

    for item in primary + secondary:
        add(item)
    return merged


def _merge_simple_items(primary, secondary, key_fields: tuple[str, ...]):
    merged = []
    seen: set[tuple[str, ...]] = set()

    def make_key(item) -> tuple[str, ...]:
        return tuple(_norm(getattr(item, field, "")) for field in key_fields)

    for item in [*primary, *secondary]:
        key = make_key(item)
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
    return merged


def _merge_skills(primary: Skills, secondary: Skills) -> Skills:
    return Skills(
        technical=_merge_unique_strings(primary.technical, secondary.technical),
        soft=_merge_unique_strings(primary.soft, secondary.soft),
    )


def _merge_resume_data(primary: ResumeData, secondary: ResumeData) -> ResumeData:
    return ResumeData(
        contact=_merge_contact(primary.contact, secondary.contact),
        summary=primary.summary or secondary.summary,
        experiences=_merge_experiences(primary.experiences, secondary.experiences),
        educations=_merge_simple_items(primary.educations, secondary.educations, ("school", "degree", "field", "year")),
        skills=_merge_skills(primary.skills, secondary.skills),
        certifications=_merge_simple_items(primary.certifications, secondary.certifications, ("name", "issuer", "year")),
        languages=_merge_simple_items(primary.languages, secondary.languages, ("language", "level")),
        projects=_merge_simple_items(primary.projects, secondary.projects, ("name", "description")),
        photo_base64=primary.photo_base64 or secondary.photo_base64,
    )


async def extract_from_pdf(file_bytes: bytes, filename: str) -> tuple[ResumeData, str]:
    """Extract resume data from a PDF file using Claude vision."""
    text = _extract_text_from_pdf(file_bytes)
    return await extract_from_text(text, "pdf")


async def extract_from_docx(file_bytes: bytes) -> tuple[ResumeData, str]:
    text = _extract_text_from_docx(file_bytes)
    return await extract_from_text(text, "docx")


async def extract_from_text(text: str, source: str = "text") -> tuple[ResumeData, str]:
    heuristic = _fallback_resume_from_text(text)

    if client is None:
        return heuristic, source

    try:
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=3500,
            system=EXTRACT_SYSTEM,
            messages=[{"role": "user", "content": f"Extract all resume data from this text. Do not skip any item in experience, projects, certifications, education, or skills:\n\n{text[:20000]}"}],
        )
        raw = response.content[0].text
        data = _parse_ai_json(raw)
        ai_resume = _dict_to_resume_data(data)
        return _merge_resume_data(heuristic, ai_resume), source
    except Exception:
        return heuristic, source
