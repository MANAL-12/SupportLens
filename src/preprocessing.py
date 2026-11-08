
import pandas as pd
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = PROJECT_DIR / "data" / "raw" / "complaints_june_2026.csv"

OUTPUT_PATH = PROJECT_DIR / "data" / "processed" / "narrative_sample_june_2026.csv"

CHUNK_SIZE = 50000
MAX_RECORDS = 5000


def collect_narratives():

    print("Scanning CFPB dataset for complaint narratives...\n")

    collected_data = []
    rows_scanned = 0

    for chunk in pd.read_csv(
        DATA_PATH,
        chunksize=CHUNK_SIZE,
        encoding="utf-8",
        dtype={"Consumer complaint narrative": "string"}
    ):

        rows_scanned += len(chunk)

        narrative_column = "Consumer complaint narrative"

        # Keep records with non-empty narratives
        valid = chunk[
            chunk[narrative_column].notna()
        ].copy()

        valid[narrative_column] = (
            valid[narrative_column].astype(str).str.strip()
        )

        valid = valid[
            valid[narrative_column] != ""
        ]

        if not valid.empty:
            collected_data.append(valid)

        total_collected = sum(
            len(df) for df in collected_data
        )

        print(
            f"Scanned: {rows_scanned:,} | "
            f"Narratives found: {total_collected:,}"
        )

        if total_collected >= MAX_RECORDS:
            break

    if not collected_data:
        print("\nNo complaint narratives found in the scanned dataset.")
        return

    result = pd.concat(
        collected_data,
        ignore_index=True
    ).head(MAX_RECORDS)

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    result.to_csv(OUTPUT_PATH, index=False)

    print("\nScan completed!")
    print(f"Rows scanned: {rows_scanned:,}")
    print(f"Narrative records collected: {len(result):,}")

    print("\nProduct distribution:")
    print(result["Product"].value_counts())

    print("\nIssue distribution:")
    print(result["Issue"].value_counts().head(10))

    print(f"\nSaved sample to: {OUTPUT_PATH}")


if __name__ == "__main__":
    collect_narratives()
