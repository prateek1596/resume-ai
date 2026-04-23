# ResumeAI

AI-powered resume builder. Upload your LinkedIn profile, pick a template, and get a polished ATS-optimised resume in seconds.

## Stack

| Layer     | Technology                              |
|-----------|------------------------------------------|
| Backend   | FastAPI · Python 3.11 · Anthropic SDK   |
| Frontend  | React 18 · Vite · TypeScript · Zustand  |
| Styling   | Tailwind CSS v3 · DM Sans / DM Serif    |
| AI        | Claude (claude-sonnet-4-20250514)        |
| Container | Docker Compose                           |

## Features

- **Import** LinkedIn PDF/ZIP export, existing resume PDF/DOCX, or fill manually
- **19 templates** — modern/classic/creative/minimal/ATS variants with optional photo layouts
- **6 colour schemes** — Classic, Navy, Emerald, Crimson, Slate, Gold
- **ATS analysis** — score 0-100, section-level breakdown, keyword matching, actionable suggestions
- **AI bullet improver** — rewrite experience bullets with strong action verbs and quantification
- **AI summary improver** — tailors your summary to a target job description
- **Resume insights endpoint** — deterministic completeness, section coverage, and recommendation engine
- **Template catalog endpoint** — backend-driven template/color metadata for frontend sync
- **Job target manager UI** — save/switch role descriptions for tailored applications
- **Profile workspace panel** — save/load/delete full resume workspaces
- **Insights panel** — run structural quality checks without consuming AI tokens
- **Live preview** — zoom in/out, instant refresh on template change
- **PDF download** — browser print dialog, print-to-PDF

## Quick Start

### Without Docker

```bash
# 1. Clone
git clone https://github.com/yourname/resumeai
cd resumeai

# 2. Set up env files
make env
# Edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Install dependencies
make install

# 4. Run both servers
make dev
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

### With Docker

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set ANTHROPIC_API_KEY

docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
resumeai/
├── backend/
│   ├── app/
│   │   ├── main.py               FastAPI app entry point
│   │   ├── core/config.py        Pydantic settings (reads .env)
│   │   ├── models/resume.py      All Pydantic request/response models
│   │   ├── services/
│   │   │   ├── extractor.py      File → ResumeData via Claude vision
│   │   │   ├── generator.py      ResumeData → resume HTML via Claude
│   │   │   └── ats.py            ATS scoring and suggestions via Claude
│   │   └── api/routes/
│   │       ├── resume.py         POST /generate /improve /ats /keywords /insights + GET /templates
│   │       └── extract.py        POST /extract/upload
│   ├── tests/test_api.py
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── types/resume.ts       TypeScript types + template/colour data
│   │   ├── lib/api.ts            Axios API client
│   │   ├── stores/resumeStore.ts Zustand store (localStorage persisted)
│   │   ├── components/
│   │   │   ├── ui/               Input, Textarea, Tabs, TagInput, Badge…
│   │   │   ├── editor/           UploadPanel, EditorPanel (4 tabs)
│   │   │   ├── templates/        TemplatesPanel (grid + colour picker)
│   │   │   └── resume/           ATSPanel, ResumePreview
│   │   ├── App.tsx               3-column shell layout
│   │   └── main.tsx
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── Makefile
└── README.md
```

## API Reference

### `POST /api/v1/resume/generate`

Generate HTML resume and ATS analysis in parallel.

```json
{
  "resume_data": { ... },
  "template_id": "executive",
  "color_scheme": "classic",
  "job_description": "optional JD text"
}
```

Returns `{ html, ats }`.

### `POST /api/v1/resume/improve`

AI-improve a piece of resume content.

```json
{
  "content": "worked on stuff",
  "context": "Senior Engineer role",
  "job_description": "",
  "mode": "bullets"
}
```

Modes: `bullets` | `summary` | `general`

### `POST /api/v1/resume/keywords`

Run keyword-focused NLP matching between resume text and target job description.

Returns `{ score, matched_keywords, missing_keywords, highlight_terms, suggested_focus }`.

### `POST /api/v1/resume/insights`

Run deterministic structure/completeness checks (no LLM required).

```json
{
  "resume_data": { ... },
  "job_description": "optional JD text"
}
```

Returns `{ overall_completeness, section_word_counts, strengths, gaps, recommendations }`.

### `GET /api/v1/resume/templates`

Returns backend template + color scheme catalog:

`{ templates: [...], color_schemes: [...] }`

### `POST /api/v1/extract/upload`

Upload a file and extract structured resume data. Accepts PDF, DOCX, TXT, or LinkedIn ZIP.

Returns `{ resume_data, source }`.

### `GET /health`

Returns `{ status: "ok", version }`.

## Templates

| ID          | Name         | Photo | Style            |
|-------------|--------------|-------|------------------|
| `executive` | Executive    | ✓     | Bold header      |
| `minimal`   | Minimal      | ✗     | Accent bar       |
| `split`     | Modern Split | ✓     | Two-column       |
| `classic`   | Classic Pro  | ✗     | Traditional      |
| `creative`  | Creative     | ✓     | Sidebar          |
| `tech`      | Tech         | ✗     | Dark header      |
| `elegant`   | Elegant      | ✓     | Centered serif   |
| `sharp`     | Sharp        | ✗     | Angled header    |
| `timeline`  | Timeline     | ✓     | Dot timeline     |
| `ats_pure`  | ATS Pure     | ✗     | Text only        |
| `bento`     | Bento        | ✓     | Card grid        |
| `monograph` | Monograph    | ✗     | Editorial serif  |
| `duo`       | Duo          | ✓     | Split rail       |
| `finance`   | Finance      | ✗     | Metric-forward   |
| `product`   | Product      | ✓     | Outcome-led      |
| `portfolio` | Portfolio    | ✓     | Project-first    |
| `impact`    | Impact       | ✗     | KPI-first        |
| `consulting`| Consulting   | ✗     | Structured case  |
| `founder`   | Founder      | ✓     | Leadership story |

## Frontend Sections

- Import Profile
- Edit Content
- Job Targets
- Templates
- ATS Score
- Insights
- Profiles

## Development

```bash
make lint      # ruff (backend) + tsc (frontend)
make test      # pytest
make build     # vite build
make clean     # remove caches/artifacts
```

## Env Variables

### Backend (`backend/.env`)

| Variable             | Default                        | Description           |
|----------------------|--------------------------------|-----------------------|
| `ANTHROPIC_API_KEY`  | —                              | **Required**          |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-20250514`     | Claude model to use   |
| `DEBUG`              | `false`                        | Enable debug mode     |
| `MAX_UPLOAD_MB`      | `10`                           | Max upload file size  |
| `CORS_ORIGINS`       | `["http://localhost:5173"]`    | Allowed origins       |

### Frontend (`frontend/.env`)

| Variable        | Default                          | Description       |
|-----------------|----------------------------------|-------------------|
| `VITE_API_URL`  | `http://localhost:8000/api/v1`   | Backend API URL   |
