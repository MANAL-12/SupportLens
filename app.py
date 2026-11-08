
import streamlit as st
import pandas as pd
import plotly.express as px

from sqlalchemy import text
from sqlalchemy.orm import Session

from database import (
    engine,
    Complaint,
    Prediction,
    Summary,
    create_user_complaint
)
from src.predict import predict_and_store
from src.summarizer import summarize_and_store


# --------------------------------------------------
# 1. Page configuration
# --------------------------------------------------

st.set_page_config(
    page_title="SupportLens | Complaint Intelligence",
    page_icon="📊",
    layout="wide"
)

st.title("SupportLens")
st.subheader("AI-Powered Customer Complaint Intelligence")

st.caption(
    "Explore customer complaint categories, common issues "
    "and the distribution of complaints in the selected dataset."
)


# --------------------------------------------------
# 2. Load dashboard data from PostgreSQL
# --------------------------------------------------

@st.cache_data(ttl=300)
def load_dashboard_data():

    category_query = """
        SELECT
            product,
            COUNT(*) AS complaint_count
        FROM complaints
        WHERE complaint_id <> 999999999999
        GROUP BY product
        ORDER BY complaint_count DESC;
    """

    issue_query = """
        SELECT
            issue,
            COUNT(*) AS complaint_count
        FROM complaints
        WHERE complaint_id <> 999999999999
        GROUP BY issue
        ORDER BY complaint_count DESC
        LIMIT 10;
    """

    daily_query = """
        SELECT
            complaint_date,
            COUNT(*) AS complaint_count
        FROM complaints
        WHERE complaint_id <> 999999999999
        GROUP BY complaint_date
        ORDER BY complaint_date;
    """

    total_query = """
        SELECT COUNT(*)
        FROM complaints
        WHERE complaint_id <> 999999999999;
    """

    issue_count_query = """
        SELECT COUNT(DISTINCT issue)
        FROM complaints
        WHERE complaint_id <> 999999999999;
    """

    categories = pd.read_sql(
        text(category_query), engine
    )

    issues = pd.read_sql(
        text(issue_query), engine
    )

    daily = pd.read_sql(
        text(daily_query), engine
    )

    with engine.connect() as connection:

        total = connection.execute(
            text(total_query)
        ).scalar()

        issue_count = connection.execute(
            text(issue_count_query)
        ).scalar()

    return total, categories, issues, daily, issue_count


# --------------------------------------------------
# 3. Complaint Explorer database functions
# --------------------------------------------------

@st.cache_data(ttl=300)
def load_explorer_options():

    date_query = """
        SELECT
            MIN(complaint_date) AS min_date,
            MAX(complaint_date) AS max_date
        FROM complaints
        WHERE complaint_id <> 999999999999;
    """

    products_query = """
        SELECT DISTINCT product
        FROM complaints
        WHERE complaint_id <> 999999999999
        ORDER BY product;
    """

    issues_query = """
        SELECT DISTINCT issue
        FROM complaints
        WHERE complaint_id <> 999999999999
        ORDER BY issue;
    """

    with engine.connect() as connection:

        date_range = pd.read_sql(
            text(date_query), connection
        )

        products = pd.read_sql(
            text(products_query), connection
        )

        issues = pd.read_sql(
            text(issues_query), connection
        )

    return (
        date_range.iloc[0]["min_date"],
        date_range.iloc[0]["max_date"],
        products["product"].dropna().tolist(),
        issues["issue"].dropna().tolist()
    )


def load_filtered_complaints(
    product,
    issue,
    start_date,
    end_date,
    keyword
):

    filters = """
        FROM complaints
        WHERE complaint_id <> 999999999999
          AND complaint_date BETWEEN :start_date AND :end_date
          AND (:product = 'All' OR product = :product)
          AND (:issue = 'All' OR issue = :issue)
          AND (
              :keyword = ''
              OR complaint_text ILIKE '%' || :keyword || '%'
          )
    """

    params = {
        "start_date": start_date,
        "end_date": end_date,
        "product": product,
        "issue": issue,
        "keyword": keyword
    }

    count_query = text(
        "SELECT COUNT(*) " + filters
    )

    records_query = text(
        """
        SELECT
            complaint_id,
            complaint_date,
            product,
            issue,
            company
        """ + filters + """
        ORDER BY complaint_date DESC
        LIMIT 500;
        """
    )

    with engine.connect() as connection:

        total_matches = connection.execute(
            count_query, params
        ).scalar()

        records = pd.read_sql(
            records_query,
            connection,
            params=params
        )

    return records, total_matches


# --------------------------------------------------
# 4. Handle dashboard database errors
# --------------------------------------------------

try:

    (
        total,
        categories,
        issues,
        daily,
        issue_count
    ) = load_dashboard_data()

except Exception as error:

    st.error(
        "Could not load dashboard data from PostgreSQL."
    )

    st.exception(error)
    st.stop()


# --------------------------------------------------
# 5. Dataset overview
# --------------------------------------------------

st.markdown("### Dataset Overview")

col1, col2, col3 = st.columns(3)

col1.metric(
    "Total Complaints",
    f"{total:,}"
)

col2.metric(
    "Product Categories",
    len(categories)
)

col3.metric(
    "Distinct Issues",
    issue_count
)

st.divider()


# --------------------------------------------------
# 6. Product Category Distribution
# --------------------------------------------------

st.markdown("### Complaints by Product Category")

category_chart = px.bar(
    categories,
    x="complaint_count",
    y="product",
    orientation="h",
    labels={
        "complaint_count": "Number of Complaints",
        "product": "Product Category"
    },
    text="complaint_count"
)

category_chart.update_layout(
    yaxis={"categoryorder": "total ascending"},
    showlegend=False
)

st.plotly_chart(
    category_chart,
    use_container_width=True
)


# --------------------------------------------------
# 7. Top 10 Complaint Issues
# --------------------------------------------------

st.markdown("### Top 10 Complaint Issues")

issue_chart = px.bar(
    issues.sort_values("complaint_count"),
    x="complaint_count",
    y="issue",
    orientation="h",
    labels={
        "complaint_count": "Number of Complaints",
        "issue": "Complaint Issue"
    },
    text="complaint_count"
)

issue_chart.update_layout(
    showlegend=False
)

st.plotly_chart(
    issue_chart,
    use_container_width=True
)


# --------------------------------------------------
# 8. Daily Complaint Distribution
# --------------------------------------------------

st.markdown(
    "### Daily Distribution of Selected Complaints"
)

daily["complaint_date"] = pd.to_datetime(
    daily["complaint_date"]
)

daily_chart = px.line(
    daily,
    x="complaint_date",
    y="complaint_count",
    markers=True,
    labels={
        "complaint_date": "Date",
        "complaint_count": "Number of Complaints"
    }
)

st.plotly_chart(
    daily_chart,
    use_container_width=True
)

st.warning(
    "Sampling limitation: These 5,000 records were selected "
    "from the first 50,000 rows scanned in the source export. "
    "Daily counts may reflect the selection process and should "
    "not be interpreted as actual changes in consumer complaint "
    "activity."
)


# --------------------------------------------------
# New Complaint Analysis
# --------------------------------------------------

st.divider()

st.markdown("## Analyse a New Complaint")

st.write(
    "Submit a customer complaint to automatically classify "
    "it using Machine Learning and generate an AI-powered summary."
)

with st.form("new_complaint_form"):

    complaint_text = st.text_area(
        "Customer Complaint",
        placeholder=(
            "Describe the customer's problem, "
            "actions already taken, and requested resolution..."
        ),
        height=180
    )

    company_name = st.text_input(
        "Company Name (Optional)",
        placeholder="Enter the company name"
    )

    allow_gemini = st.checkbox(
        "I have reviewed this complaint and confirm it is "
        "safe to send to Google Gemini for summarisation. "
        "I understand that automatic redaction may not remove "
        "all personal information."
    )

    submitted = st.form_submit_button(
        "Analyse Complaint",
        type="primary"
    )


if submitted:

    if not complaint_text.strip():

        st.error("Please enter a complaint before submitting.")

    else:

        try:

            with st.spinner("Saving complaint to PostgreSQL..."):

                new_complaint_id = create_user_complaint(
                    complaint_text=complaint_text,
                    company=company_name
                )

            st.success(
                f"Complaint saved successfully. "
                f"Complaint ID: {new_complaint_id}"
            )

            # ------------------------------------------
            # Machine Learning Classification
            # ------------------------------------------

            with st.spinner("Classifying complaint..."):

                predicted_category = predict_and_store(
                    new_complaint_id
                )

            st.markdown("### Classification Result")

            st.metric(
                "Predicted Complaint Category",
                predicted_category
            )

            st.caption(
                "Classification performed using the trained "
                "TF-IDF + Linear SVM model."
            )

            # ------------------------------------------
            # Google Gemini Summarisation
            # ------------------------------------------

            if allow_gemini:

                try:

                    with st.spinner(
                        "Generating summary using Google Gemini..."
                    ):

                        generated_summary = summarize_and_store(
                            new_complaint_id,
                            allow_external_processing=True
                        )

                    st.markdown("### AI-Generated Summary")

                    st.info(generated_summary)

                except Exception as gemini_error:

                    st.warning(
                        "The complaint and ML prediction were saved, "
                        "but Gemini summarisation could not be completed."
                    )

                    st.error(str(gemini_error))

            else:

                st.info(
                    "Gemini summarisation was skipped because "
                    "external processing was not enabled."
                )

        except Exception as error:

            st.error("Complaint analysis could not be completed.")
            st.exception(error)

# --------------------------------------------------
# 9. Complaint Explorer
# --------------------------------------------------

st.divider()

st.markdown("## Complaint Explorer")

st.write(
    "Filter and explore customer complaints from the CFPB dataset."
)

try:

    (
        min_date,
        max_date,
        products_list,
        issues_list
    ) = load_explorer_options()

    col1, col2 = st.columns(2)

    with col1:

        selected_product = st.selectbox(
            "Filter by Product",
            ["All"] + products_list
        )

    with col2:

        selected_issue = st.selectbox(
            "Filter by Issue",
            ["All"] + issues_list
        )

    selected_dates = st.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )

    keyword = st.text_input(
        "Search complaint narratives",
        placeholder="Enter a keyword..."
    )

    if len(selected_dates) == 2:

        start_date, end_date = selected_dates

        if start_date > end_date:

            st.error(
                "Start date cannot be after end date."
            )

        else:

            (
                filtered_complaints,
                total_matches
            ) = load_filtered_complaints(
                selected_product,
                selected_issue,
                start_date,
                end_date,
                keyword.strip()
            )

            st.markdown(
                f"### Matching Complaints: {total_matches:,}"
            )

            st.caption(
                f"Showing {len(filtered_complaints):,} of "
                f"{total_matches:,} matching records "
                "(maximum 500 displayed)."
            )

            if not filtered_complaints.empty:

                st.dataframe(
                    filtered_complaints,
                    use_container_width=True,
                    hide_index=True
                )

                selected_id = st.selectbox(
                    "Select a complaint to inspect",
                    filtered_complaints["complaint_id"].tolist()
                )

                with Session(engine) as session:

                    complaint = session.get(
                        Complaint,
                        int(selected_id)
                    )

                    if complaint:

                        st.markdown("#### Complaint Details")

                        st.write(
                            "**Product:**",
                            complaint.product
                        )

                        st.write(
                            "**Issue:**",
                            complaint.issue
                        )

                        st.write(
                            "**Company:**",
                            complaint.company
                        )

                        with st.expander(
                            "View complaint narrative"
                        ):

                            st.write(
                                complaint.complaint_text
                            )

            else:

                st.info(
                    "No complaints match the selected filters."
                )

    else:

        st.info(
            "Please select both a start date and an end date."
        )

except Exception as error:

    st.error(
        "Could not load the Complaint Explorer."
    )

    st.exception(error)


# --------------------------------------------------
# 10. AI-Powered Complaint Analysis
# --------------------------------------------------

st.divider()

st.markdown("## AI-Powered Complaint Analysis")

st.write(
    "Classify a complaint using the trained Linear SVM model "
    "and generate a summary using Google Gemini."
)

complaint_id = st.number_input(
    "Enter Complaint ID",
    min_value=1,
    value=999999999999,
    step=1
)


# Retrieve and display the selected complaint

with Session(engine) as session:

    selected_complaint = session.get(
        Complaint,
        int(complaint_id)
    )

    if selected_complaint:

        complaint_text = selected_complaint.complaint_text
        actual_category = selected_complaint.product

    else:

        complaint_text = None
        actual_category = None


if complaint_text:

    st.markdown("### Complaint Details")

    st.write(
        "**Actual Category:**",
        actual_category
    )

    with st.expander("View complaint text"):

        st.write(complaint_text)

    allow_gemini = st.checkbox(
        "I have reviewed this complaint and confirm it is "
        "safe to send to Google Gemini. I understand that "
        "automatic redaction is not guaranteed to remove all "
        "personal information."
    )

    if st.button(
        "Analyze Complaint",
        type="primary"
    ):

        try:

            # Local ML prediction and PostgreSQL storage

            with st.spinner("Classifying complaint..."):

                predicted_category = predict_and_store(
                    int(complaint_id)
                )

            st.success(
                "Complaint classification completed."
            )

            col1, col2 = st.columns(2)

            col1.metric(
                "Actual Category",
                actual_category
            )

            col2.metric(
                "Predicted Category",
                predicted_category
            )

            if predicted_category == actual_category:

                st.success(
                    "Prediction matches the actual category."
                )

            else:

                st.warning(
                    "Prediction differs from the actual category."
                )

            # Gemini summarization with explicit permission

            if allow_gemini:

                with st.spinner(
                    "Generating Gemini summary..."
                ):

                    generated_summary = summarize_and_store(
                        int(complaint_id),
                        allow_external_processing=True
                    )

                st.markdown("### Gemini-Generated Summary")

                st.info(generated_summary)

            else:

                st.info(
                    "Classification is complete. Gemini summarization "
                    "was skipped because external processing was not enabled."
                )

        except Exception as error:

            st.error(
                "Complaint analysis failed."
            )

            st.exception(error)

else:

    st.warning(
        "No complaint found with this ID."
    )


# --------------------------------------------------
# 11. Footer
# --------------------------------------------------

st.divider()

st.caption(
    "SupportLens | Data source: CFPB Consumer Complaint Database"
)
