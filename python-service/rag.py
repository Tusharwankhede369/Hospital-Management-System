import os
import re
from pathlib import Path
from typing import Dict, List, Tuple

import faiss
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load .env from python-service directory (works regardless of cwd)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
# NOTE: We lazy-load the embedder and FAISS index.
# On platforms like Render, downloading the embedding model during module import
# can delay server startup and cause port-scan timeouts.
_embedder: SentenceTransformer | None = None
_INDEX: faiss.IndexFlatL2 | None = None
_DOCS: List[str] | None = None


# --------- Structured sample hospital knowledge (you can edit/replace) ---------

HOSPITAL_INFO: Dict[str, str] = {
    "name": "CityCare Multispeciality Hospital",
    "address": "123 Health Avenue, Midtown, Pune",
    "contact": "+91-98765-00000",
    "emergency_contact": "+91-98765-11111",
    "visiting_hours": "10:00 AM to 1:00 PM and 5:00 PM to 8:00 PM on all days except public holidays.",
    "emergency": "Emergency / casualty services are available 24/7 with on-call specialists.",
}

DEPARTMENTS: List[Dict[str, str]] = [
    {
        "name": "Cardiology",
        "description": "Diagnosis and treatment of heart-related conditions such as chest pain, hypertension, and heart failure.",
    },
    {
        "name": "Orthopedics",
        "description": "Bone, joint, and spine related problems including fractures, arthritis, and sports injuries.",
    },
    {
        "name": "Nephrology",
        "description": "Kidney-related problems such as chronic kidney disease, dialysis, and electrolyte imbalance.",
    },
    {
        "name": "Pathology & Laboratory",
        "description": "Comprehensive blood tests, biochemistry, hematology, and clinical pathology services.",
    },
]

DOCTORS: List[Dict[str, str]] = [
    {
        "name": "Dr. Tushar Kulkarni",
        "short_name": "tushar",
        "department": "Cardiology",
        "qualification": "MBBS, MD (Medicine), DM (Cardiology)",
        "opd_timing": "Mon–Sat, 10:00 AM – 1:00 PM",
        "room": "OPD Room 201",
        "fee": "₹700",
    },
    {
        "name": "Dr. Sneha Deshmukh",
        "short_name": "sneha",
        "department": "Orthopedics",
        "qualification": "MBBS, MS (Ortho)",
        "opd_timing": "Mon–Sat, 5:00 PM – 8:00 PM",
        "room": "OPD Room 105",
        "fee": "₹600",
    },
    {
        "name": "Dr. Rahul Patil",
        "short_name": "rahul",
        "department": "Nephrology",
        "qualification": "MBBS, MD (Medicine), DM (Nephrology)",
        "opd_timing": "Tue, Thu, Sat – 11:00 AM – 2:00 PM",
        "room": "OPD Room 210",
        "fee": "₹800",
    },
]

LAB_PARAMETERS: List[Dict[str, object]] = [
    {
        "name": "Hemoglobin",
        "aliases": ["hb", "hemoglobin"],
        "unit": "g/dL",
        "min": 12.0,
        "max": 16.0,
        "info": "Hemoglobin is the protein in red blood cells that carries oxygen. Low hemoglobin may indicate anemia.",
    },
    {
        "name": "WBC",
        "aliases": ["wbc", "white blood cell"],
        "unit": "cells/µL",
        "min": 4000,
        "max": 11000,
        "info": "WBC or white blood cell count reflects the immune system; high WBC may suggest infection or inflammation.",
    },
    {
        "name": "Fasting Glucose",
        "aliases": ["fasting sugar", "fasting glucose"],
        "unit": "mg/dL",
        "min": 70,
        "max": 100,
        "info": "Fasting blood glucose helps in diagnosing diabetes. Levels above normal may indicate impaired glucose tolerance or diabetes.",
    },
    {
        "name": "Sodium",
        "aliases": ["sodium", "na", "na+"],
        "unit": "mmol/L",
        "min": 135,
        "max": 145,
        "info": "Sodium is an important electrolyte that helps maintain fluid balance and nerve and muscle function. Very low or very high sodium levels can be serious and should be discussed with a doctor.",
    },
]

GENERAL_RULES: List[str] = [
    "Patients must carry their hospital ID card when visiting the hospital or lab.",
    "For most fasting blood tests (like fasting glucose or lipid profile), 8–12 hours of fasting is recommended. Only plain water is allowed.",
    "Outpatient appointments are scheduled in 30 minute slots during each doctor's OPD hours.",
]




def _build_knowledge() -> Tuple[faiss.IndexFlatL2, List[str]]:
    """
    Build a simple in-memory knowledge base for semantic search.
    This uses the textual descriptions from the structured data above.
    """
    docs: List[str] = []

    # Hospital basics
    docs.append(
        f"{HOSPITAL_INFO['name']} is located at {HOSPITAL_INFO['address']}. "
        f"Visiting hours are {HOSPITAL_INFO['visiting_hours']} "
        f"and emergency services are available 24/7."
    )
    docs.append(
        f"For emergencies you can contact {HOSPITAL_INFO['emergency_contact']}."
    )

    # Departments
    for dept in DEPARTMENTS:
        docs.append(f"{dept['name']}: {dept['description']}")

    # Doctors
    for doc in DOCTORS:
        docs.append(
            f"{doc['name']} is a {doc['department']} consultant ({doc['qualification']}). "
            f"OPD timing: {doc['opd_timing']}. Consultation fee: {doc['fee']}."
        )

    # Lab parameters
    for p in LAB_PARAMETERS:
        docs.append(
            f"{p['name']} normal range is {p['min']} to {p['max']} {p['unit']}. {p['info']}"
        )

    # General rules
    docs.extend(GENERAL_RULES)


    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(_MODEL_NAME)

    embeddings = _embedder.encode(docs, convert_to_numpy=True)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    return index, docs


def _ensure_kb() -> tuple[faiss.IndexFlatL2, List[str], SentenceTransformer]:
    """
    Ensure the embedding model + FAISS index are initialized.
    This is intentionally lazy to keep FastAPI startup fast on Render.
    """
    global _INDEX, _DOCS, _embedder
    if _INDEX is None or _DOCS is None or _embedder is None:
        idx, docs = _build_knowledge()
        _INDEX, _DOCS = idx, docs
    # mypy/typing: _embedder is guaranteed not None here
    return _INDEX, _DOCS, _embedder  # type: ignore[return-value]


def _search(question: str, k: int = 5) -> List[str]:
    if not question.strip():
        return []
    index, docs, embedder = _ensure_kb()
    q_emb = embedder.encode([question], convert_to_numpy=True)
    D, I = index.search(q_emb, k)
    indices = I[0]
    return [docs[i] for i in indices if 0 <= i < len(docs)]


def get_context_snippets(question: str, k: int = 5) -> str:
    """
    Return top-k relevant knowledge snippets as a single context string.
    Used to provide hospital-specific context to the Gemini chatbot.
    """
    snippets = _search(question, k=k)
    return "\n\n".join(snippets)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _find_doctor_by_name(question: str):
    q = _normalize(question)
    for doc in DOCTORS:
        name_tokens = [t.lower() for t in re.split(r"[ .]", doc["name"]) if t]
        if any(t in q for t in name_tokens) or doc["short_name"].lower() in q:
            return doc
    return None


def _find_lab_parameter(question: str):
    q = _normalize(question)
    for p in LAB_PARAMETERS:
        if any(alias in q for alias in p["aliases"]):
            return p
    return None


def _extract_first_number(question: str):
    match = re.search(r"[-+]?\d*\.?\d+", question)
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def answer(question: str) -> str:
    """
    Local, self-hosted hospital assistant.
    Uses simple rules + semantic search over the structured knowledge above.
    No external AI or paid API is used.
    """
    if not question or not question.strip():
        return "Please enter a question about the hospital, doctors, or lab reports."

    q_norm = _normalize(question)

    # 1) Doctor-specific questions (details / fee / timings)
    doc = _find_doctor_by_name(q_norm)
    if doc is not None:
        parts = [
            f"{doc['name']} is a {doc['department']} specialist ({doc['qualification']}).",
            f"OPD timing: {doc['opd_timing']} in {doc['room']}.",
        ]
        if "fee" in q_norm or "fees" in q_norm or "charges" in q_norm:
            parts.append(f"Consultation fee: {doc['fee']}.")
        else:
            parts.append(f"Standard consultation fee is {doc['fee']}.")
        return " ".join(parts)

    # 2) Visiting hours / timings / emergency
    if "visiting" in q_norm or "timing" in q_norm or "time" in q_norm or "opd" in q_norm:
        base = (
            f"Visiting hours at {HOSPITAL_INFO['name']} are "
            f"{HOSPITAL_INFO['visiting_hours']}"
        )
        if "emergency" in q_norm or "24/7" in q_norm:
            return (
                base
                + f" Emergency services are available 24/7. For emergencies call {HOSPITAL_INFO['emergency_contact']}."
            )
        return base

    # 3) Lab parameter ranges and interpretation
    param = _find_lab_parameter(q_norm)
    if param is not None:
        value = _extract_first_number(q_norm)
        if value is None:
            return (
                f"{param['name']} normal range for adults is {param['min']} to {param['max']} {param['unit']}. "
                f"{param['info']}"
            )

        status = "within the normal range"
        if value < float(param["min"]):
            status = "below the normal range (low)"
        elif value > float(param["max"]):
            status = "above the normal range (high)"

        return (
            f"For {param['name']}, the normal range for adults is {param['min']} to {param['max']} {param['unit']}. "
            f"A value of {value} {param['unit']} is {status}. "
            f"{param['info']} Please correlate with your doctor for clinical interpretation."
        )

    # 4) General hospital info / departments / rules via semantic search
    context_chunks = _search(question, k=3)
    if context_chunks:
        return " ".join(context_chunks)

    # 5) Fallback
    return (
        "I could not find an exact answer in the hospital information I have. "
        "Please contact the hospital reception or your doctor for more details."
    )
