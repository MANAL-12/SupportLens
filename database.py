
import os
from datetime import date
from sqlalchemy.orm import Session

from dotenv import load_dotenv
from sqlalchemy import (
    create_engine,
    URL,
    BigInteger,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Float,
    ForeignKey,
    func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Load environment variables
load_dotenv()

# Database configuration
database_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("PG_USER"),
    password=os.getenv("PG_PASSWORD"),
    host=os.getenv("PG_HOST"),
    port=int(os.getenv("PG_PORT")),
    database=os.getenv("PG_DATABASE")
)

# Create database engine
engine = create_engine(database_url)


# Base class for database models
class Base(DeclarativeBase):
    pass


# Table 1: Complaints
class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )
    product: Mapped[str | None] = mapped_column(String(255))
    issue: Mapped[str | None] = mapped_column(String(500))
    company: Mapped[str | None] = mapped_column(String(500))
    complaint_date: Mapped[object | None] = mapped_column(Date)
    complaint_text: Mapped[str | None] = mapped_column(Text)
    company_response: Mapped[str | None] = mapped_column(String(255))
    company_public_response: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(
    String(30),
    nullable=False,
    default="CFPB"
    )

# Table 2: Predictions
class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    complaint_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("complaints.complaint_id", ondelete="CASCADE"),
        nullable=False
    )
    predicted_category: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    prediction_confidence: Mapped[float | None] = mapped_column(Float)
    actual_category: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# Table 3: Summaries
class Summary(Base):
    __tablename__ = "summaries"

    summary_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    complaint_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("complaints.complaint_id", ondelete="CASCADE"),
        nullable=False
    )
    generated_summary: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    model_provider: Mapped[str] = mapped_column(
        String(100), default="Google Gemini"
    )
    generated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


def create_user_complaint(complaint_text, company=None):

    if not isinstance(complaint_text, str) or not complaint_text.strip():
        raise ValueError("Complaint text cannot be empty.")

    with Session(engine) as session:

        new_complaint = Complaint(
            complaint_text=complaint_text.strip(),
            company=company.strip() if company and company.strip() else None,
            complaint_date=date.today(),
            product=None,
            issue=None,
            source="User submitted"
        )

        session.add(new_complaint)

        # Generate and retrieve the PostgreSQL ID
        session.flush()

        complaint_id = new_complaint.complaint_id

        session.commit()

        return complaint_id

# Create all database tables
def create_tables():
    try:
        Base.metadata.create_all(engine)
        print("All database tables created successfully!")

    except Exception as error:
        print("Table creation failed!")
        print(error)


# Test database connection
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                func.version().select()
            )
            print("Database connection successful!")
            print(result.scalar())

    except Exception as error:
        print("Database connection failed!")
        print(error)


if __name__ == "__main__":
    test_connection()
    create_tables()
