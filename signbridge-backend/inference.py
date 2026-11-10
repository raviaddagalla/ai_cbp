"""
SignBridge Inference Pipeline
==============================
Converts raw MediaPipe landmark data → flattened feature tensor → model prediction.
"""

import numpy as np
import torch
from typing import List, Tuple

from model import SignGRU, SEQUENCE_LEN, NUM_FEATURES
from signs_meta import SIGN_LABELS


def landmarks_to_features(frame_landmarks: List[dict]) -> np.ndarray:
    """
    Convert one frame of 21 MediaPipe hand landmarks into a 42-element
    feature vector [x0, y0, x1, y1, ..., x20, y20].
    """
    while len(frame_landmarks) < 21:
        frame_landmarks.append({"x": 0.0, "y": 0.0, "z": 0.0})
    frame_landmarks = frame_landmarks[:21]

    features = []
    for lm in frame_landmarks:
        features.append(lm.get("x", 0.0))
        features.append(lm.get("y", 0.0))

    return np.array(features, dtype=np.float32)  # (42,)


def sequence_to_tensor(frames: List[List[dict]]) -> torch.Tensor:
    """
    Convert a sequence of frames to a model-ready tensor of shape (1, 30, 42).
    """
    seq = np.zeros((SEQUENCE_LEN, NUM_FEATURES), dtype=np.float32)
    for i, frame in enumerate(frames[:SEQUENCE_LEN]):
        seq[i] = landmarks_to_features(frame)
    return torch.from_numpy(seq).unsqueeze(0)  # (1, 30, 42)


class ISLInferenceEngine:
    """
    Wraps the GRU model and exposes a simple predict() method.
    """

    def __init__(self, model: SignGRU):
        self.model = model
        self.model.eval()

    def predict(self, frames: List[List[dict]]) -> Tuple[str, float, list]:
        """
        Run inference on a sequence of frames.

        Returns
        -------
        (predicted_sign, confidence, top_k_list)
        """
        tensor = sequence_to_tensor(frames)

        with torch.no_grad():
            logits = self.model(tensor)                      # (1, 35)
            probs  = torch.softmax(logits, dim=-1).squeeze() # (35,)

        top_indices = torch.argsort(probs, descending=True)[:3].tolist()
        top_k = [
            {"sign": SIGN_LABELS[i], "confidence": round(probs[i].item(), 4)}
            for i in top_indices
        ]

        best_idx  = top_indices[0]
        best_sign = SIGN_LABELS[best_idx]
        best_conf = round(probs[best_idx].item(), 4)

        return best_sign, best_conf, top_k

