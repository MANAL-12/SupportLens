
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text

from database import engine, create_user_complaint
from src.predict import predict_and_store
from src.summarizer import summarize_and_store


app = FastAPI(
    title="SupportLens API",
    description="AI-powered customer complaint intelligence system",
    version="1.0.0"
)


# CORS configuration: local frontend + deployed frontend
allowed_origins = ["http://localhost:5173"]

frontend_url = os.getenv("FRONTEND_URL", "")

if frontend_url:
    allowed_origins.extend(
        origin.strip().rstrip("/")
        for origin in frontend_url.split(",")
        if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplaintRequest(BaseModel):
    complaint_text: str = Field(min_length=10, max_length=10000)
    company: str | None = None
    allow_gemini: bool = False


@app.get("/")
def home():
    return {
        "message": "SupportLens API is running",
        "status": "success"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SupportLens Backend"
    }


@app.get("/api/database/health")
def database_health():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT 1")
            ).scalar_one()

        return {
            "status": "connected",
            "database": "supportlens_db",
            "test_query": result
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )


@app.get("/api/dashboard/stats")
def dashboard_stats():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT
                    COUNT(*) AS total_complaints,
                    COUNT(DISTINCT product) AS total_categories,
                    COUNT(DISTINCT issue) AS total_issues
                FROM complaints
                WHERE source = 'CFPB'
                AND complaint_id <> 999999999999
            """)).mappings().one()

        return {
            "total_complaints": result["total_complaints"],
            "total_categories": result["total_categories"],
            "total_issues": result["total_issues"],
            "model_accuracy": 81.9,
            "macro_f1_score": 0.7283,
            "weighted_f1_score": 0.8154
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve dashboard statistics."
        )


@app.get("/api/dashboard/categories")
def dashboard_categories():
    try:
        with engine.connect() as connection:
            results = connection.execute(text("""
                SELECT
                    product AS category,
                    COUNT(*) AS complaint_count
                FROM complaints
                WHERE source = 'CFPB'
                AND complaint_id <> 999999999999
                GROUP BY product
                ORDER BY complaint_count DESC
            """)).mappings().all()

        return [
            {
                "category": row["category"],
                "count": row["complaint_count"]
            }
            for row in results
        ]

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve category statistics."
        )


# --------------------------------------------------
# Complaint Explorer
# --------------------------------------------------

@app.get("/api/complaints")
def get_complaints(
    search: str = Query(default="", max_length=200),
    category: str = Query(default=""),
    source: str = Query(default="All"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100)
):
    try:
        conditions = ["c.complaint_id <> 999999999999"]

        params = {
            "limit": limit,
            "offset": (page - 1) * limit
        }

        if search.strip():
            conditions.append("""
                (
                    c.complaint_text ILIKE :search
                    OR COALESCE(c.company, '') ILIKE :search
                    OR COALESCE(c.issue, '') ILIKE :search
                    OR CAST(c.complaint_id AS TEXT) ILIKE :search
                )
            """)
            params["search"] = f"%{search.strip()}%"

        if category:
            conditions.append(
                "COALESCE(p.predicted_category, c.product) = :category"
            )
            params["category"] = category

        if source != "All":
            conditions.append("c.source = :source")
            params["source"] = source

        where_clause = " AND ".join(conditions)

        with engine.connect() as connection:

            total = connection.execute(
                text(f"""
                    SELECT COUNT(*)
                    FROM complaints c
                    LEFT JOIN predictions p
                        ON c.complaint_id = p.complaint_id
                    WHERE {where_clause}
                """),
                params
            ).scalar_one()

            results = connection.execute(
                text(f"""
                    SELECT
                        c.complaint_id,
                        c.complaint_text,
                        c.company,
                        c.product,
                        c.issue,
                        c.complaint_date,
                        c.source,
                        p.predicted_category,
                        s.generated_summary
                    FROM complaints c
                    LEFT JOIN predictions p
                        ON c.complaint_id = p.complaint_id
                    LEFT JOIN summaries s
                        ON c.complaint_id = s.complaint_id
                    WHERE {where_clause}
                    ORDER BY c.complaint_id DESC
                    LIMIT :limit OFFSET :offset
                """),
                params
            ).mappings().all()

        complaints = [
            {
                "complaint_id": row["complaint_id"],
                "complaint_text": row["complaint_text"],
                "company": row["company"],
                "category": row["predicted_category"] or row["product"],
                "actual_category": row["product"],
                "issue": row["issue"],
                "complaint_date": row["complaint_date"],
                "source": row["source"],
                "summary": row["generated_summary"]
            }
            for row in results
        ]

        return {
            "complaints": complaints,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaints."
        )


@app.get("/api/complaints/categories")
def complaint_categories():
    try:
        with engine.connect() as connection:
            results = connection.execute(text("""
                SELECT DISTINCT category
                FROM (
                    SELECT
                        COALESCE(p.predicted_category, c.product) AS category
                    FROM complaints c
                    LEFT JOIN predictions p
                        ON c.complaint_id = p.complaint_id
                ) categories
                WHERE category IS NOT NULL
                ORDER BY category
            """)).scalars().all()

        return results

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve complaint categories."
        )


# --------------------------------------------------
# Complaint Analysis
# --------------------------------------------------

@app.post("/api/complaints/analyze")
def analyze_complaint(request: ComplaintRequest):

    complaint_text = request.complaint_text.strip()

    if not complaint_text:
        raise HTTPException(
            status_code=400,
            detail="Complaint text cannot be empty."
        )

    try:
        complaint_id = create_user_complaint(
            complaint_text=complaint_text,
            company=request.company
        )

        predicted_category = predict_and_store(complaint_id)

        generated_summary = None
        summary_status = "skipped"

        if request.allow_gemini:
            try:
                generated_summary = summarize_and_store(
                    complaint_id,
                    allow_external_processing=True
                )
                summary_status = "generated"

            except Exception:
                summary_status = "failed"

        return {
            "status": "success",
            "complaint_id": complaint_id,
            "predicted_category": predicted_category,
            "summary": generated_summary,
            "summary_status": summary_status
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to process the complaint."
        )
