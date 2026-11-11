"""
SignBridge FastAPI Backend
===========================
Endpoints:
  GET  /                       → health check
  POST /predict                → run GRU model inference
  GET  /signs                  → list all supported sign metadata
  GET  /signs/{label}          → get a single sign's details
  POST /history                → save a translation entry
  GET  /history                → retrieve history
  DELETE /history              → clear all history

Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import PredictRequest, PredictResponse, HistoryEntry, HistorySaveRequest
from database import init_db, save_translation, get_history, clear_history
from signs_meta import SIGN_LABELS, SIGN_CATEGORIES, SIGN_DESCRIPTIONS

# ── Load model (trained or untrained fallback) ──────────────────────────────
engine       = None
MODEL_LOADED = False
_label_names = SIGN_LABELS   # default to ISL labels until model is loaded

try:
    from model import load_model, SignGRU
    from inference import ISLInferenceEngine

    MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "sign_gru.pt")

    if os.path.exists(MODEL_PATH):
        _model, _label_names = load_model(MODEL_PATH)
        engine       = ISLInferenceEngine(_model, _label_names)
        MODEL_LOADED = True
        print(f"[SignBridge] ✅ Trained model loaded from {MODEL_PATH}")
        print(f"[SignBridge]    Classes: {len(_label_names)}  |  Input features: {_model.gru.input_size}")
    else:
        # Untrained model — predictions will be random until training is complete
        _model  = SignGRU()
        engine  = ISLInferenceEngine(_model, SIGN_LABELS)
        _label_names = SIGN_LABELS
        MODEL_LOADED = False
        print("[SignBridge] ⚠️  No trained model found — using untrained GRU (random predictions).")
        print(f"[SignBridge]    Train first: see training/README.md")
        print(f"[SignBridge]    Then copy model to: {MODEL_PATH}")

except Exception as e:
    engine       = None
    MODEL_LOADED = False
    print(f"[SignBridge] ❌ Could not load model: {e}")


# ── App lifespan (replaces deprecated @app.on_event) ───────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup; nothing to clean up on shutdown."""
    init_db()
    os.makedirs(os.path.join(os.path.dirname(__file__), "models"), exist_ok=True)
    yield


# ---------------------------------------------------------------------------
app = FastAPI(
    title="SignBridge API",
    description="Sign Language Recognition Backend — supports ISL (35 signs) and ASL Citizen (200 signs)",
    version="2.0.0",
    lifespan=lifespan,
)

# Allow CORS from the React dev server and production Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "app": "SignBridge API",
        "status": "running",
        "model_loaded": MODEL_LOADED,
        "num_classes": len(_label_names),   # BUG-FIX: was len(SIGN_LABELS) — always 35, ignoring loaded model
        "version": "2.0.0",
    }


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict(req: PredictRequest):
    """
    Run sign gesture recognition on a sequence of hand landmark frames.
    Accepts up to 30 frames of 21 MediaPipe hand landmarks per frame.
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="Model not available")

    # Convert Pydantic objects to plain dicts for the inference pipeline
    frames = [
        [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in frame]
        for frame in req.landmarks
    ]

    sign, confidence, top_k = engine.predict(frames)
    return PredictResponse(sign=sign, confidence=confidence, top_k=top_k)


@app.get("/signs", tags=["Dictionary"])
def list_signs():
    """Return metadata for all supported signs (ISL dictionary)."""
    return [
        {
            "id": i,
            "label": label,
            "category": SIGN_CATEGORIES.get(label, "general"),
            "description": SIGN_DESCRIPTIONS.get(label, ""),
        }
        for i, label in enumerate(SIGN_LABELS)
    ]


@app.get("/signs/{label}", tags=["Dictionary"])
def get_sign(label: str):
    """Return details for a single sign by its label."""
    match = next((s for s in SIGN_LABELS if s.lower() == label.lower()), None)
    if match is None:
        raise HTTPException(status_code=404, detail=f"Sign '{label}' not found")
    return {
        "label": match,
        "category": SIGN_CATEGORIES.get(match, "general"),
        "description": SIGN_DESCRIPTIONS.get(match, ""),
    }


@app.post("/history", response_model=HistoryEntry, tags=["History"])
def add_history(req: HistorySaveRequest):
    """Save a translation session to the history log."""
    new_id = save_translation(req.sign_sequence, req.confidence)
    from database import get_connection
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM history WHERE id = ?", (new_id,)).fetchone()
    return dict(row)


@app.get("/history", response_model=list[HistoryEntry], tags=["History"])
def read_history(limit: int = 50):
    """Retrieve the most recent translation history entries."""
    return get_history(limit)


@app.delete("/history", tags=["History"])
def delete_history():
    """Clear all translation history from the database."""
    clear_history()
    return {"message": "History cleared"}


