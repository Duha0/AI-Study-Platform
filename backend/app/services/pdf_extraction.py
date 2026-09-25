"""PDF text extraction using pypdf.

Handles the real-world failure modes without pretending success:
- scanned/image-only PDFs  -> empty text, reported as such
- malformed/corrupt PDFs   -> ExtractionError
- empty PDFs               -> empty text, reported as such

The public surface is deliberately tiny (`extract_pdf_text`) so an OCR stage
can be inserted later without touching callers.
"""

import io

from pypdf import PdfReader


class ExtractionError(Exception):
    """Raised when the PDF cannot be read at all (malformed, corrupt, ...)."""


class EmptyExtractionError(Exception):
    """Raised when the PDF reads but contains no extractable text layer
    (scanned/image-only or genuinely empty)."""


MAX_CHARS = 400_000  # keep extracted text bounded for DB/AI use


def extract_pdf_text(content: bytes) -> str:
    """Return cleaned text extracted from PDF bytes.

    Raises ExtractionError for unreadable PDFs and EmptyExtractionError when
    the PDF has no text layer.
    """
    if not content or not content.lstrip().startswith(b"%PDF"):
        raise ExtractionError("Not a valid PDF file.")

    try:
        reader = PdfReader(io.BytesIO(content))
        page_texts = []
        for page in reader.pages:
            page_texts.append(page.extract_text() or "")
    except Exception as exc:  # pypdf raises various internal errors
        raise ExtractionError(f"Failed to read PDF: {exc}") from exc

    text = "\n\n".join(t for t in page_texts if t and t.strip())
    text = _clean_text(text)

    if not text.strip():
        raise EmptyExtractionError(
            "No text layer found. This PDF is likely scanned or image-only."
        )
    return text[:MAX_CHARS]


def _clean_text(text: str) -> str:
    """Normalize whitespace: collapse 3+ blank lines, strip trailing spaces."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.splitlines()]
    cleaned: list[str] = []
    blanks = 0
    for line in lines:
        if not line.strip():
            blanks += 1
            if blanks > 2:
                continue
        else:
            blanks = 0
        cleaned.append(line)
    return "\n".join(cleaned).strip()
