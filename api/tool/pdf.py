from pathlib import Path
import pdfplumber


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extract all text from a text-based PDF file.

    Args:
        pdf_path (Path): Path to the PDF file

    Returns:
        str: Extracted text
    """
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    extracted_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)

    return "\n".join(extracted_text)
