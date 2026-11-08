
from src.summarizer import summarize_complaint

sample_complaint = """
I noticed an unauthorized transaction in my bank account.
I contacted my bank several times, but the issue has not
been resolved. I am requesting an investigation and a refund
for the unauthorized transaction.
"""

print("Generating complaint summary...\n")

summary = summarize_complaint(sample_complaint)

print("Generated Summary:")
print(summary)
