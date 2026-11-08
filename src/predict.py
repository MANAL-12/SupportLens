
import re
import joblib

from pathlib import Path
from sqlalchemy.orm import Session

from database import engine, Complaint, Prediction


# --------------------------------------------------
# 1. Load the trained model
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = PROJECT_DIR / "models" / "supportlens_svm.joblib"

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# 2. Clean complaint text
# --------------------------------------------------

def clean_text(text):
    """Clean complaint text before classification."""

    text = text.lower()

    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    text = re.sub(
        r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b",
        " EMAIL ",
        text
    )

    text = re.sub(
        r"\b(?:\+?\d[\d\s().-]{7,}\d)\b",
        " PHONE ",
        text
    )

    text = re.sub(r"\bx{2,}\b", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


# --------------------------------------------------
# 3. Predict complaint category
# --------------------------------------------------

def predict_complaint(complaint_text):
    """Predict the product category of a complaint."""

    if not isinstance(complaint_text, str):
        raise ValueError("Complaint text must be a string.")

    cleaned_text = clean_text(complaint_text)

    if not cleaned_text:
        raise ValueError("Complaint text cannot be empty.")

    prediction = model.predict([cleaned_text])[0]

    return prediction


# --------------------------------------------------
# 4. Predict and store result in PostgreSQL
# --------------------------------------------------

def predict_and_store(complaint_id):
    """
    Retrieve a complaint from PostgreSQL,
    predict its category, and store the result.
    """

    with Session(engine) as session:

        # Retrieve complaint
        complaint = session.get(Complaint, complaint_id)

        if complaint is None:
            raise ValueError(
                f"Complaint ID {complaint_id} was not found."
            )

        if not complaint.complaint_text:
            raise ValueError(
                f"Complaint ID {complaint_id} has no complaint text."
            )

        # Generate prediction
        predicted_category = predict_complaint(
            complaint.complaint_text
        )

        # Check for an existing prediction
        existing_prediction = (
            session.query(Prediction)
            .filter_by(complaint_id=complaint_id)
            .first()
        )

        if existing_prediction:

            existing_prediction.predicted_category = (
                predicted_category
            )

            existing_prediction.actual_category = complaint.product

            existing_prediction.prediction_confidence = None

            print("Existing prediction updated.")

        else:

            new_prediction = Prediction(
                complaint_id=complaint_id,
                predicted_category=predicted_category,
                actual_category=complaint.product,
                prediction_confidence=None
            )

            session.add(new_prediction)

            print("New prediction stored.")

        session.commit()

        return predicted_category
