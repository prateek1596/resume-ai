from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.resume import ExtractResponse
from app.services import extractor
from app.core.config import get_settings

router = APIRouter(prefix="/extract", tags=["extract"])
settings = get_settings()

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "text",
}


@router.post("/upload", response_model=ExtractResponse)
async def extract_from_upload(file: UploadFile = File(...)):
    """Extract resume data from uploaded file (PDF, DOCX, TXT)."""
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read()

    if len(content) > max_bytes:
        raise HTTPException(413, f"File too large. Max {settings.max_upload_mb}MB.")

    filename = file.filename or ""
    content_type = file.content_type or ""

    try:
        if filename.endswith(".pdf") or content_type == "application/pdf":
            data, source = await extractor.extract_from_pdf(content, filename)
        elif filename.endswith(".docx") or "wordprocessingml" in content_type:
            data, source = await extractor.extract_from_docx(content)
        elif filename.endswith(".txt") or content_type == "text/plain":
            data, source = await extractor.extract_from_text(content.decode("utf-8", errors="ignore"), "text")
        elif filename.endswith(".zip"):
            # LinkedIn ZIP export — find the profile.csv or resume PDF inside
            import zipfile, io
            zf = zipfile.ZipFile(io.BytesIO(content))
            text_parts = []
            for name in zf.namelist():
                if name.endswith(".csv") or name.endswith(".txt"):
                    text_parts.append(zf.read(name).decode("utf-8", errors="ignore"))
                elif name.endswith(".pdf"):
                    data, source = await extractor.extract_from_pdf(zf.read(name), name)
                    return ExtractResponse(resume_data=data, source="linkedin")
            combined = "\n\n".join(text_parts)
            data, source = await extractor.extract_from_text(combined, "linkedin")
        else:
            raise HTTPException(415, f"Unsupported file type: {content_type}")

        return ExtractResponse(resume_data=data, source=source)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {str(e)}")
