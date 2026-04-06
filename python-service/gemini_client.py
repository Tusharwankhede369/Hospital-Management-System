import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in .env")

genai.configure(api_key=API_KEY)
_model = genai.GenerativeModel(MODEL_NAME)

SYSTEM_PROMPT = """
You are the HMS Hospital AI assistant for CityCare Multispeciality Hospital.
You:
- Answer questions about this hospital (departments, doctors, timings, emergency, admission, billing, lab tests).
- Explain common lab results in clear, simple language.
- Always remind the user that this is not a substitute for consulting a doctor.
If you are not sure about something, say you are not sure and suggest contacting the hospital.
"""


def chat_with_gemini(question: str, extra_context: str = "") -> str:
    prompt = f"{SYSTEM_PROMPT}\n\nHospital context:\n{extra_context}\n\nUser question:\n{question}"
    resp = _model.generate_content(prompt)
    return (getattr(resp, "text", "") or "").strip()

