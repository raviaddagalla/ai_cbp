"""
SignBridge Inference Pipeline
==============================
Converts raw MediaPipe landmark data → flattened feature tensor → model prediction.

Supports two model modes:
  - ISL (35-class):  hand x,y only → 42 features
  - ASL Citizen (200-class): full 150-landmark vector → 450 features (zeros for
    non-hand landmarks, since we only have hand data at inference time)
"""

import numpy as np
import torch
from typing import List, Tuple

from model import SignGRU, SEQUENCE_LEN, NUM_FEATURES


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


def landmarks_to_features_full(frame_landmarks: List[dict],
                                 out_size: int = 450) -> np.ndarray:
    """
    Convert 21 MediaPipe hand landmarks to a 225-element position vector
    matching the ASL Citizen landmark layout:
      - Pose (0..98): 33 landmarks × 3
      - Left Hand (99..161): 21 landmarks × 3
      - Right Hand (162..224): 21 landmarks × 3
    """
    pos = np.zeros(225, dtype=np.float32)

    # Normalize hand coordinates around wrist (landmark 0)
    w_x = float(frame_landmarks[0].get("x", 0.5)) if frame_landmarks else 0.5
    w_y = float(frame_landmarks[0].get("y", 0.5)) if frame_landmarks else 0.5
    w_z = float(frame_landmarks[0].get("z", 0.0)) if frame_landmarks else 0.0

    for j, lm in enumerate(frame_landmarks[:21]):
        lx = float(lm.get("x", w_x)) - w_x
        ly = float(lm.get("y", w_y)) - w_y
        lz = float(lm.get("z", w_z)) - w_z

        # Right hand (indices 162..224)
        pos[162 + j * 3]     = lx
        pos[162 + j * 3 + 1] = ly
        pos[162 + j * 3 + 2] = lz

        # Left hand mirror / fallback (indices 99..161)
        pos[99 + j * 3]      = -lx
        pos[99 + j * 3 + 1]  = ly
        pos[99 + j * 3 + 2]  = lz

    return pos


def sequence_to_tensor(frames: List[List[dict]],
                        feature_size: int = NUM_FEATURES) -> torch.Tensor:
    """
    Convert a sequence of frames to a model-ready tensor.
    Shape: (1, SEQUENCE_LEN, feature_size)
    """
    seq = np.zeros((SEQUENCE_LEN, feature_size), dtype=np.float32)

    if feature_size == 42:
        for i, frame in enumerate(frames[:SEQUENCE_LEN]):
            seq[i] = landmarks_to_features(frame)
    else:
        # Full 450-feature layout: 225 positions + 225 velocities
        for i, frame in enumerate(frames[:SEQUENCE_LEN]):
            seq[i, :225] = landmarks_to_features_full(frame, out_size=feature_size)
        # Compute velocity features: vel[t] = pos[t] - pos[t-1]
        for t in range(1, SEQUENCE_LEN):
            seq[t, 225:450] = seq[t, :225] - seq[t - 1, :225]

    return torch.from_numpy(seq).unsqueeze(0)  # (1, 30, feature_size)


class ISLInferenceEngine:
    """
    Wraps the GRU model and exposes a simple predict() method.
    Automatically handles both ISL (42-feature) and ASL Citizen (450-feature)
    model checkpoints.
    """

    def __init__(self, model, label_names: List[str]):
        self.model       = model
        self.label_names = label_names
        self.model.eval()

        # Detect input feature size from first linear layer of GRU
        try:
            self.feature_size = model.gru.input_size
        except AttributeError:
            self.feature_size = NUM_FEATURES  # fallback to 42

    def predict(self, frames: List[List[dict]]) -> Tuple[str, float, list]:
        """
        Run inference on a sequence of frames.

        Returns
        -------
        (predicted_sign, confidence, top_k_list)
        """
        tensor = sequence_to_tensor(frames, feature_size=self.feature_size)

        with torch.no_grad():
            logits = self.model(tensor)
            probs  = torch.softmax(logits, dim=-1).squeeze()

        k = min(3, len(self.label_names))
        top_indices = torch.argsort(probs, descending=True)[:k].tolist()
        top_k = [
            {"sign": self.label_names[i], "confidence": round(probs[i].item(), 4)}
            for i in top_indices
        ]

        best_idx  = top_indices[0]
        best_sign = self.label_names[best_idx]
        best_conf = round(probs[best_idx].item(), 4)

        return best_sign, best_conf, top_k


