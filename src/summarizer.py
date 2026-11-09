
import os
import re

from pathlib import Path
from dotenv import load_dotenv
from google import genai
from sqlalchemy.orm import Session
from database import engine, Complaint, Summary

# --------------------------------------------------
# 1. Load Gemini API configuration
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parents[1]

load_dotenv(PROJECT_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")

client = (
    genai.Client(
        api_key=api_key,
        http_options={"timeout": 15000}
    )
    if api_key
    else None
)

MODEL_NAME = "gemini-3.5-flash-lite"


# --------------------------------------------------
# 2. Redact common personal identifiers
# --------------------------------------------------

def redact_sensitive_info(text):
    """Redact common structured identifiers from complaint text."""

    text = re.sub(
        r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b",
        "[EMAIL]",
        text
    )

    text = re.sub(
        r"https?://\S+|www\.\S+",
        "[URL]",
        text
    )

    # US Social Security numbers
    text = re.sub(
        r"\b\d{3}-\d{2}-\d{4}\b",
        "[SSN]",
        text
    )

    # Long digit sequences, which may contain account or card numbers
    text = re.sub(
        r"(?<!\w)(?:\d[ -]?){8,19}(?!\w)",
        "[POSSIBLE ACCOUNT NUMBER]",
        text
    )

    # Phone numbers
    text = re.sub(
        r"(?<!\w)\+?\d[\d\s().-]{7,}\d(?!\w)",
        "[PHONE]",
        text
    )

    return text


# --------------------------------------------------
# 3. Generate a complaint summary
# --------------------------------------------------

def summarize_complaint(complaint_text):
    """Generate a concise summary using Google Gemini."""

    if not isinstance(complaint_text, str) or not complaint_text.strip():
        raise ValueError("Complaint text cannot be empty.")

    redacted_text = redact_sensitive_info(complaint_text)

    prompt = f"""
    You are a customer complaint analysis assistant.

    Summarize the following customer complaint in 2-3 concise sentences.

    Focus on:
    - The customer's main problem
    - Any action already taken by the customer
    - The resolution or assistance being requested

    Do not invent information or make assumptions.
    Do not include personal identifiers.

    Complaint:
    {redacted_text}
    """
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config={
            "max_output_tokens": 180,
            "temperature": 0.2
        }
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text.strip()


def summarize_and_store(complaint_id, *, allow_external_processing=False):
    """
    Retrieve a complaint from PostgreSQL,
    generate a Gemini summary, and store it.
    
    External API processing must be explicitly enabled.
    """

    if not allow_external_processing:
        raise PermissionError(
            "External processing is disabled. "
            "Review the complaint and enable it explicitly."
        )

    with Session(engine) as session:

        # Retrieve complaint
        complaint = session.get(Complaint, complaint_id)

        if complaint is None:
            raise ValueError(
                f"Complaint ID {complaint_id} was not found."
            )

        if not complaint.complaint_text:
            raise ValueError(
                f"Complaint ID {complaint_id} has no text."
            )

        # Generate summary
        generated_summary = summarize_complaint(
            complaint.complaint_text
        )

        # Check whether a summary already exists
        existing_summary = (
            session.query(Summary)
            .filter_by(complaint_id=complaint_id)
            .first()
        )

        if existing_summary:

            existing_summary.generated_summary = generated_summary
            existing_summary.model_provider = "Google Gemini"

            print("Existing summary updated.")

        else:

            new_summary = Summary(
                complaint_id=complaint_id,
                generated_summary=generated_summary,
                model_provider="Google Gemini"
            )

            session.add(new_summary)

            print("New summary stored.")

        session.commit()

        return generated_summary
