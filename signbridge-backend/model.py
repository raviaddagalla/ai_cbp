"""
SignBridge GRU Model
====================
A simple Gated Recurrent Unit (GRU) network for ISL gesture recognition.

Input:  (batch, 30, 42) — 30 frames of 42 hand landmark features per frame
Output: (batch, N_CLASSES) — raw logits for each supported sign class

Why GRU?
  - Signs are temporal sequences (a "wave" is not one frozen frame).
  - GRU captures motion patterns across 30 consecutive frames.
  - Simpler and faster than LSTM; ideal for mobile edge inference.
"""

import torch
import torch.nn as nn


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SEQUENCE_LEN = 30       # Number of frames per sample
NUM_FEATURES = 42       # 21 hand landmarks × 2 coords (x, y) per hand
GRU_HIDDEN   = 64       # Number of GRU hidden units
DROPOUT_RATE = 0.3      # Dropout for regularization
NUM_CLASSES  = 35       # Number of ISL signs in the vocabulary


class SignGRU(nn.Module):
    """
    A lightweight GRU classifier for Indian Sign Language gesture sequences.

    Architecture:
      Input (30, 42)
        → GRU(input=42, hidden=64, layers=2, batch_first=True)
        → Dropout(0.3)
        → Linear(64 → 35)
      Output: logit vector of length 35
    """

    def __init__(self, num_classes: int = NUM_CLASSES):
        super().__init__()

        self.gru = nn.GRU(
            input_size=NUM_FEATURES,
            hidden_size=GRU_HIDDEN,
            num_layers=2,
            batch_first=True,       # input shape: (batch, seq_len, features)
            dropout=DROPOUT_RATE,   # dropout between GRU layers
        )
        self.dropout = nn.Dropout(DROPOUT_RATE)
        self.classifier = nn.Linear(GRU_HIDDEN, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        x: shape (batch_size, SEQUENCE_LEN, NUM_FEATURES)
        returns: shape (batch_size, num_classes)  — raw logits
        """
        # GRU output: all hidden states + final hidden state
        gru_out, _ = self.gru(x)        # (batch, 30, 64)

        # Take only the last time-step output
        last_step = gru_out[:, -1, :]  # (batch, 64)

        # Regularize and classify
        dropped = self.dropout(last_step)
        logits  = self.classifier(dropped)   # (batch, 35)
        return logits


def load_model(weights_path: str, device: str = "cpu"):
    """
    Load a SignGRU (or SignGRUDynamic) model from a .pt checkpoint file.

    Supports two checkpoint formats:
      1. Legacy: raw state_dict (original 35-class ISL model)
      2. Extended: dict with keys 'state_dict', 'label_names', 'num_classes',
                   'hidden_size', 'num_layers'  (ASL Citizen / multi-class)

    Returns (model, label_names) where label_names is a list of sign strings.
    """
    import os, sys

    checkpoint = torch.load(weights_path, map_location=device,
                            weights_only=False)

    # ── Extended checkpoint (dict with metadata) ──
    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        num_classes  = checkpoint.get("num_classes",  200)
        hidden_size  = checkpoint.get("hidden_size",  128)
        num_layers   = checkpoint.get("num_layers",   3)
        input_size   = checkpoint.get("input_size",   NUM_FEATURES)   # BUG-FIX: was hardcoded to NUM_FEATURES (42)
        label_names  = checkpoint.get("label_names",  None)

        model = SignGRU.__new__(SignGRU)
        nn.Module.__init__(model)
        model.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=DROPOUT_RATE if num_layers > 1 else 0.0,
        )
        model.dropout    = nn.Dropout(DROPOUT_RATE)
        model.classifier = nn.Linear(hidden_size, num_classes)
        model.load_state_dict(checkpoint["state_dict"])

        # Fallback: load label names from companion JSON
        if label_names is None:
            label_json = weights_path.replace(".pt", "_labels.json")
            if os.path.exists(label_json):
                import json
                with open(label_json) as f:
                    label_names = json.load(f)

        # Final fallback: original ISL 35-class labels
        if label_names is None:
            try:
                sys.path.insert(0, os.path.dirname(weights_path))
                from signs_meta import SIGN_LABELS
                label_names = SIGN_LABELS
            except ImportError:
                label_names = [str(i) for i in range(num_classes)]

    # ── Legacy checkpoint (raw state_dict) ──
    else:
        from signs_meta import SIGN_LABELS
        model = SignGRU(num_classes=len(SIGN_LABELS))
        model.load_state_dict(checkpoint)
        label_names = SIGN_LABELS

    model.eval()
    return model, label_names

