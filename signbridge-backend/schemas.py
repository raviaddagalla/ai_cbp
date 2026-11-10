"""
Pydantic Schemas for SignBridge API
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class LandmarkPoint(BaseModel):
    """A single hand landmark (x, y, z normalized coordinates)."""
    x: float
    y: float
    z: float = 0.0


class PredictRequest(BaseModel):
    """
    Request body for the /predict endpoint.
    landmarks: a list of up to 30 frames, each with 21 landmark points (one hand).
    """
    landmarks: List[List[LandmarkPoint]] = Field(
        ...,
        description="1-30 frames of 21 hand landmarks each",
    )


class PredictResponse(BaseModel):
    """Response from the /predict endpoint."""
    sign: str               # The predicted ISL sign label
    confidence: float       # Confidence score (0.0 – 1.0)
    top_k: List[dict]       # Top 3 candidate signs with scores


class HistoryEntry(BaseModel):
    """A single translation history record."""
    id: Optional[int] = None
    sign_sequence: str      # Space-joined sign words
    confidence: float
    timestamp: str          # ISO 8601 string


class HistorySaveRequest(BaseModel):
    """Request body to save a translation to history."""
    sign_sequence: str
    confidence: float

