from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

from analyzer import analyze_text, extract_text_from_pdf
from gemini_client import chat_with_gemini
from rag import get_context_snippets

app = FastAPI(title="HMS Python Service", version="0.1.0")


# ====== Schemas ======

class Parameter(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None
    status: str  # LOW / NORMAL / HIGH / UNKNOWN
    min: Optional[float] = None
    max: Optional[float] = None


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    file_path: Optional[str] = None


class AnalyzeResponse(BaseModel):
    parameters: List[Parameter]
    analysis: List[Parameter]
    summary: str


class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    answer: str


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Full analyzer endpoint.
    Node backend sends extracted PDF text here.
    """
    # Prefer OCR from file path when available; fall back to provided text
    text = ""
    if req.file_path:
        text = extract_text_from_pdf(req.file_path)
    if not text:
        text = req.text or ""
    raw_results, summary = analyze_text(text)
    params = [
        Parameter(
            name=r["name"],
            value=r["value"],
            unit=r.get("unit") or None,
            status=r.get("status", "UNKNOWN"),
            min=r.get("min"),
            max=r.get("max"),
        )
        for r in raw_results
    ]
    return AnalyzeResponse(parameters=params, analysis=params, summary=summary)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """
    HMS chatbot endpoint using Gemini + small hospital knowledge base.
    """
    question = req.message.strip()
    if not question:
        return ChatResponse(answer="Please enter a question about the hospital or lab reports.")

    try:
        context = get_context_snippets(question, k=5)
        ans = chat_with_gemini(question, extra_context=context)
        return ChatResponse(answer=ans)
    except Exception as exc:
        # Temporary: expose underlying error text to help debug Gemini issues
        return ChatResponse(
            answer=f"AI service error: {type(exc).__name__}: {str(exc)}"
        )


@app.get("/health")
def health():
    return {"status": "ok"}

