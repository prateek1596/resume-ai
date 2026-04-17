"""Basic integration tests for the ResumeAI API."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_generate_missing_name():
    """Should return 422 if resume_data is structurally invalid."""
    res = client.post("/api/v1/resume/generate", json={})
    assert res.status_code == 422


SAMPLE_RESUME = {
    "resume_data": {
        "contact": {
            "name": "Jane Smith", "title": "Software Engineer",
            "email": "jane@test.com", "phone": "+1 555 0100",
            "location": "SF, CA", "linkedin": "", "portfolio": "", "website": ""
        },
        "summary": "Experienced engineer with 5 years in full-stack development.",
        "experiences": [
            {
                "id": "abc123", "company": "Acme Corp", "role": "Senior Engineer",
                "start": "2021", "end": "Present",
                "bullets": ["Led team of 5", "Improved performance by 40%"]
            }
        ],
        "educations": [{"id": "edu1", "school": "MIT", "degree": "BS", "field": "CS", "year": "2019", "gpa": "3.8"}],
        "skills": {"technical": ["Python", "React", "Docker"], "soft": ["Leadership"]},
        "certifications": [],
        "languages": [],
        "projects": [],
        "photo_base64": None,
    },
    "template_id": "minimal",
    "color_scheme": "classic",
    "job_description": "",
}


@patch("app.services.generator.client")
@patch("app.services.ats.client")
def test_generate_resume(mock_ats_client, mock_gen_client):
    """Generate endpoint calls Claude and returns html + ats."""
    mock_gen_client.messages.create.return_value = MagicMock(
        content=[MagicMock(text="<div>Mock Resume HTML</div>")]
    )
    mock_ats_client.messages.create.return_value = MagicMock(
        content=[MagicMock(text='{"score":78,"breakdown":{"keywords":80},"suggestions":[{"type":"add","category":"keywords","text":"Add more keywords","priority":"high"}],"matched_keywords":["Python"],"missing_keywords":["Docker"]}')]
    )

    res = client.post("/api/v1/resume/generate", json=SAMPLE_RESUME)
    assert res.status_code == 200
    data = res.json()
    assert "html" in data
    assert "ats" in data
    assert data["ats"]["score"] == 78
    assert "Mock Resume HTML" in data["html"]


@patch("app.services.generator.client")
def test_improve_endpoint(mock_client):
    mock_client.messages.create.return_value = MagicMock(
        content=[MagicMock(text="Improved bullet text")]
    )
    # Second call for changes list
    mock_client.messages.create.side_effect = [
        MagicMock(content=[MagicMock(text="Improved bullet text")]),
        MagicMock(content=[MagicMock(text='["Added action verb", "Quantified impact"]')]),
    ]

    res = client.post("/api/v1/resume/improve", json={
        "content": "worked on stuff",
        "context": "Senior Engineer",
        "job_description": "",
        "mode": "bullets"
    })
    assert res.status_code == 200
    data = res.json()
    assert "improved" in data
    assert "changes_made" in data


def test_extract_unsupported_type():
    """Upload an unsupported file type."""
    res = client.post(
        "/api/v1/extract/upload",
        files={"file": ("test.xyz", b"content", "application/octet-stream")}
    )
    assert res.status_code == 415
