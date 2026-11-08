import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"timeout": 15000}
)

print("Sending request...")

response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents="Summarize: Unauthorized bank transaction.",
    config={
        "max_output_tokens": 50,
        "temperature": 0.2
    }
)

print("Response:", response.text)