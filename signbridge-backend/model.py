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


def load_model(weights_path: str, device: str = "cpu") -> "SignGRU":
    """
    Load a saved SignGRU model from a .pt checkpoint file.
    Returns the model in eval mode.
    """
    model = SignGRU()
    state_dict = torch.load(weights_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    return model

