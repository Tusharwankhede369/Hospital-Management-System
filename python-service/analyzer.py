from typing import List, Dict, Any
import os
import re

import pytesseract
from pdf2image import convert_from_path


NORMAL_RANGES: Dict[str, Dict[str, Any]] = {
    "hemoglobin": {"label": "Hemoglobin", "min": 12.0, "max": 16.0, "unit": "g/dL"},
    "rbc": {"label": "RBC", "min": 4.0, "max": 5.5, "unit": "millions/µL"},
    "wbc": {"label": "WBC", "min": 4000, "max": 11000, "unit": "/µL"},
    "platelets": {"label": "Platelets", "min": 150000, "max": 450000, "unit": "/µL"},
    "glucose_fasting": {"label": "Glucose (Fasting)", "min": 70, "max": 100, "unit": "mg/dL"},
    "glucose_random": {"label": "Glucose (Random)", "min": 70, "max": 140, "unit": "mg/dL"},
    "cholesterol_total": {"label": "Total Cholesterol", "min": 0, "max": 200, "unit": "mg/dL"},
    "creatinine": {"label": "Creatinine", "min": 0.6, "max": 1.3, "unit": "mg/dL"},
    "uric_acid": {"label": "Uric Acid", "min": 3.5, "max": 7.2, "unit": "mg/dL"},
    "bilirubin_total": {"label": "Total Bilirubin", "min": 0.3, "max": 1.2, "unit": "mg/dL"},
    "vitamin_d": {"label": "Vitamin D", "min": 20, "max": 50, "unit": "ng/mL"},
    "systolic_bp": {"label": "Systolic BP", "min": 90, "max": 120, "unit": "mmHg"},
    "diastolic_bp": {"label": "Diastolic BP", "min": 60, "max": 80, "unit": "mmHg"},
}


PARAM_PATTERNS = [
    {"key": "hemoglobin", "regex": re.compile(r"hemoglobin[\s:]*([\d.]+)\s*(g\/?dL)?", re.I)},
    {"key": "rbc", "regex": re.compile(r"rbc[\s:]*([\d.]+)\s*(million\/?µ?l|million\/?u?l|10\^6\/µl)?", re.I)},
    {"key": "wbc", "regex": re.compile(r"wbc[\s:]*([\d.]+)\s*(\/µ?l|\/u?l|10\^3\/µl)?", re.I)},
    {"key": "platelets", "regex": re.compile(r"platelets?[\s:]*([\d,]+)\s*(\/µ?l|\/u?l)?", re.I)},
    {
        "key": "glucose_fasting",
        "regex": re.compile(r"(fasting\s+)?blood\s*glucose[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I),
        "valueIndex": 2,
    },
    {
        "key": "glucose_random",
        "regex": re.compile(r"(random\s+)?blood\s*glucose[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I),
        "valueIndex": 2,
    },
    {
        "key": "cholesterol_total",
        "regex": re.compile(r"(total\s+)?cholesterol[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I),
        "valueIndex": 2,
    },
    {"key": "creatinine", "regex": re.compile(r"creatinine[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I)},
    {"key": "uric_acid", "regex": re.compile(r"uric\s+acid[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I)},
    {
        "key": "bilirubin_total",
        "regex": re.compile(r"(total\s+)?bilirubin[\s:]*([\d.]+)\s*(mg\/?dL)?", re.I),
        "valueIndex": 2,
    },
    {"key": "vitamin_d", "regex": re.compile(r"vitamin\s*d[\s:]*([\d.]+)\s*(ng\/?mL)?", re.I)},
    {
        "key": "systolic_bp",
        "regex": re.compile(r"blood\s*pressure[\s:]*([\d]{2,3})\s*\/\s*([\d]{2,3})\s*mmhg?", re.I),
        "valueIndex": 1,
    },
    {
        "key": "diastolic_bp",
        "regex": re.compile(r"blood\s*pressure[\s:]*([\d]{2,3})\s*\/\s*([\d]{2,3})\s*mmhg?", re.I),
        "valueIndex": 2,
    },
]


def _classify(key: str, value: float) -> str:
    r = NORMAL_RANGES.get(key)
    if not r or value is None:
        return "UNKNOWN"
    if value < r["min"]:
        return "LOW"
    if value > r["max"]:
        return "HIGH"
    return "NORMAL"


def _to_range_text(min_v: float | None, max_v: float | None, unit: str | None) -> str:
    if min_v is not None and max_v is not None:
        return f"{min_v}–{max_v}{(' ' + unit) if unit else ''}"
    if max_v is not None:
        return f"< {max_v}{(' ' + unit) if unit else ''}"
    return ""


def _normalize_label(s: str) -> str:
    return re.sub(r"[:\-–]+$", "", " ".join((s or "").strip().split()))


def _should_skip_label(label: str) -> bool:
    l = (label or "").lower()
    return (
        not label
        or "date" in l
        or "time" in l
        or "patient" in l
        or "name" in l
        or "age" in l
        or "gender" in l
        or "phone" in l
        or "address" in l
        or ("ref" in l and "range" in l)
        or len(l) < 2
    )


def analyze_text(text: str) -> tuple[list[dict[str, Any]], str]:
    """
    Full analyzer: extracts many standard lab parameters with statuses.
    Returns (analysis_list, summary_string).
    """
    if not text or not isinstance(text, str):
        return [], "No text to analyze."

    normalized = text.replace("\r", "\n")
    results: list[dict[str, Any]] = []

    # 1) Known parameters via regex patterns
    flat = " ".join(normalized.split())
    for pattern in PARAM_PATTERNS:
        regex = pattern["regex"]
        value_idx = pattern.get("valueIndex", 1)
        key = pattern["key"]
        m = regex.search(flat)
        if not m:
            continue
        raw = (m.group(value_idx) or "").replace(",", "")
        try:
            value = float(raw)
        except ValueError:
            continue
        config = NORMAL_RANGES.get(key, {})
        unit = (m.group(value_idx + 1) or config.get("unit") or "").strip()
        status = _classify(key, value)
        min_v = config.get("min")
        max_v = config.get("max")
        results.append(
            {
                "name": config.get("label", key),
                "value": value,
                "unit": unit,
                "status": status,
                "min": min_v,
                "max": max_v,
            }
        )

    # 2) Generic table-like extraction: "PARAM   value unit   4.0 - 5.5"
    lines = [ln.strip() for ln in normalized.split("\n") if ln.strip()]
    line_regex = re.compile(
        r"^([A-Za-z][A-Za-z0-9 ()/%.,+\-]*?)\s+([0-9]+(?:\.[0-9]+)?)\s*([A-Za-zµ/%^0-9.\-]+)?"
        r"(?:\s+|\s*\(|\s*\[)?([0-9]+(?:\.[0-9]+)?)\s*[-–]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\)|\])?$"
    )

    for line in lines:
        m = line_regex.match(line)
        if not m:
            continue
        label = _normalize_label(m.group(1))
        if _should_skip_label(label):
            continue
        try:
            value = float(m.group(2))
        except ValueError:
            continue
        unit = (m.group(3) or "").strip()
        try:
            min_v = float(m.group(4))
            max_v = float(m.group(5))
            has_range = True
        except (TypeError, ValueError):
            min_v = max_v = None
            has_range = False
        # avoid duplicates of already extracted known params
        if any(r["name"].lower() == label.lower() for r in results):
            continue
        status = (
            "LOW"
            if has_range and value < min_v  # type: ignore[operator]
            else "HIGH"
            if has_range and value > max_v  # type: ignore[operator]
            else "UNKNOWN"
        )
        results.append(
            {
                "name": label,
                "value": value,
                "unit": unit,
                "status": status,
                "min": min_v,
                "max": max_v,
            }
        )

    # Build simple summary from abnormal params
    lows = [r for r in results if r["status"] == "LOW"]
    highs = [r for r in results if r["status"] == "HIGH"]
    if not results:
        summary = "No lab parameters could be detected in this report."
    elif not lows and not highs:
        summary = "All detected lab parameters are within normal ranges."
    else:
        parts: list[str] = []
        if lows:
            low_names = ", ".join(sorted({r["name"] for r in lows}))
            parts.append(f"Low values detected in: {low_names}.")
        if highs:
            high_names = ", ".join(sorted({r["name"] for r in highs}))
            parts.append(f"High values detected in: {high_names}.")
        parts.append("Please correlate with clinical findings and advise follow-up with the doctor.")
        summary = " ".join(parts)

    return results, summary


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Use pdf2image + Tesseract OCR to extract text from a PDF file.
    """
    if not pdf_path or not os.path.exists(pdf_path):
        return ""

    tess_path = os.getenv("TESSERACT_PATH")
    if tess_path and os.path.exists(tess_path):
        pytesseract.pytesseract.tesseract_cmd = tess_path

    poppler_path = os.getenv("POPPLER_PATH")  # optional: path to Poppler bin

    try:
        pages = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)
    except Exception:
        return ""

    texts: list[str] = []
    for img in pages:
        try:
            t = pytesseract.image_to_string(img)
            texts.append(t)
        except Exception:
            continue

    return "\n".join(texts)

