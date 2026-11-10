"""
SignBridge GRU Training Script
================================
Train the ISL gesture recognition model on collected landmark sequences.

Designed to run on Google Colab (GPU recommended) or locally on CPU.

Usage:
  python train.py --data_dir ./data --epochs 50 --output sign_gru.pt

After training, copy sign_gru.pt to:
  signbridge-backend/models/sign_gru.pt
"""

import os
import json
import argparse
import numpy as np
import sys

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Add parent dir to path so we can import model.py and signs_meta.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from model import SignGRU, SEQUENCE_LEN, NUM_FEATURES
from signs_meta import SIGN_LABELS


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

def get_sign_dir(data_dir: str, label: str) -> str:
    """Return a filesystem-safe directory path for the given sign label."""
    safe_name = label.replace("/", "_").replace(" ", "_")
    return os.path.join(data_dir, safe_name)


class ISLDataset(Dataset):
    """
    Loads collected JSON landmark files and returns tensors.
    """

    def __init__(self, data_dir: str):
        self.samples = []   # list of (tensor, label_index)

        for label_idx, label in enumerate(SIGN_LABELS):
            sign_dir = get_sign_dir(data_dir, label)
            if not os.path.isdir(sign_dir):
                print(f"  [skip] No data folder for: {label}")
                continue

            for fname in os.listdir(sign_dir):
                if not fname.endswith(".json"):
                    continue
                fpath = os.path.join(sign_dir, fname)
                with open(fpath) as f:
                    frames = json.load(f)

                # Build (30, 42) feature array
                seq = np.zeros((SEQUENCE_LEN, NUM_FEATURES), dtype=np.float32)
                for i, frame in enumerate(frames[:SEQUENCE_LEN]):
                    for j, lm in enumerate(frame[:21]):
                        seq[i, j * 2]     = lm.get("x", 0.0)
                        seq[i, j * 2 + 1] = lm.get("y", 0.0)

                self.samples.append((torch.from_numpy(seq), label_idx))

        print(f"[Dataset] Loaded {len(self.samples)} total samples "
              f"across {len(SIGN_LABELS)} sign classes.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        return self.samples[idx]


def generate_synthetic_data(data_dir: str, samples_per_class: int = 30):
    """
    Generate synthetic (random) landmark data for each sign class.
    Use this when real video data is not available.

    Synthetic data accuracy: ~40-60% (useful for demo / development).
    Real collected data:      ~85-95%.
    """
    print(f"[Synthetic] Generating {samples_per_class} samples per class...")
    rng = np.random.default_rng(seed=42)

    for label in SIGN_LABELS:
        sign_dir = get_sign_dir(data_dir, label)
        os.makedirs(sign_dir, exist_ok=True)

        # Give each class a unique mean position to make them distinguishable
        label_idx = SIGN_LABELS.index(label)
        base_x = (label_idx % 7) * 0.12 + 0.2
        base_y = (label_idx // 7) * 0.15 + 0.2

        for s in range(samples_per_class):
            frames = []
            for _ in range(SEQUENCE_LEN):
                frame = []
                for _ in range(21):
                    frame.append({
                        "x": float(rng.normal(base_x, 0.04)),
                        "y": float(rng.normal(base_y, 0.04)),
                        "z": float(rng.normal(0.0, 0.02)),
                    })
                frames.append(frame)

            fname = os.path.join(sign_dir, f"sample_{s:04d}.json")
            with open(fname, "w") as f:
                json.dump(frames, f)

    print(f"[Synthetic] Done. Data saved to: {data_dir}")


# ---------------------------------------------------------------------------
# Training Loop
# ---------------------------------------------------------------------------

def train(data_dir: str, epochs: int, output_path: str, batch_size: int = 32):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Train] Device: {device}")

    dataset = ISLDataset(data_dir)
    if len(dataset) == 0:
        print("[Train] No data found! Generating synthetic data...")
        generate_synthetic_data(data_dir, samples_per_class=50)
        dataset = ISLDataset(data_dir)

    # Split 80% train / 20% validation
    indices = list(range(len(dataset)))
    labels  = [dataset[i][1] for i in indices]
    train_idx, val_idx = train_test_split(
        indices, test_size=0.2, stratify=labels, random_state=42
    )

    train_loader = DataLoader(
        [dataset[i] for i in train_idx], batch_size=batch_size, shuffle=True
    )
    val_loader = DataLoader(
        [dataset[i] for i in val_idx], batch_size=batch_size
    )

    model     = SignGRU(num_classes=len(SIGN_LABELS)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.5)

    print(f"[Train] Starting {epochs} epoch training loop...")
    print(f"        Train samples: {len(train_idx)} | Val samples: {len(val_idx)}")

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        # ── Training ──
        model.train()
        train_loss, correct, total = 0.0, 0, 0

        for sequences, targets in train_loader:
            sequences = sequences.to(device)
            targets   = targets.to(device)

            optimizer.zero_grad()
            logits = model(sequences)
            loss   = criterion(logits, targets)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            preds  = logits.argmax(dim=-1)
            correct += (preds == targets).sum().item()
            total   += targets.size(0)

        train_acc = correct / total * 100

        # ── Validation ──
        model.eval()
        val_correct, val_total = 0, 0
        all_preds, all_targets = [], []

        with torch.no_grad():
            for sequences, targets in val_loader:
                sequences = sequences.to(device)
                targets   = targets.to(device)
                logits    = model(sequences)
                preds     = logits.argmax(dim=-1)
                val_correct += (preds == targets).sum().item()
                val_total   += targets.size(0)
                all_preds.extend(preds.cpu().tolist())
                all_targets.extend(targets.cpu().tolist())

        val_acc = val_correct / val_total * 100
        scheduler.step()

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), output_path)

        if epoch % 5 == 0 or epoch == 1:
            avg_loss = train_loss / len(train_loader)
            print(f"  Epoch {epoch:3d}/{epochs} | Loss: {avg_loss:.4f} | "
                  f"Train: {train_acc:.1f}% | Val: {val_acc:.1f}% "
                  f"{'★' if val_acc >= best_val_acc else ''}")

    print("\n[Train] Final Validation Report:")
    seen_labels = sorted(set(all_targets))
    target_names = [SIGN_LABELS[i] for i in seen_labels]
    print(classification_report(
        all_targets, all_preds,
        labels=seen_labels,
        target_names=target_names,
        zero_division=0
    ))

    print(f"\n[Train] ✅ Best model saved to: {output_path}")
    print(f"[Train] Best Val Accuracy: {best_val_acc:.1f}%")
    print("[Train] Copy model to signbridge-backend/models/sign_gru.pt")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train SignBridge ISL GRU model")
    parser.add_argument("--data_dir", default="./data",      help="Path to collected data")
    parser.add_argument("--epochs",   type=int, default=50,  help="Number of training epochs")
    parser.add_argument("--batch",    type=int, default=32,  help="Batch size")
    parser.add_argument("--output",   default="sign_gru.pt", help="Output .pt model file")
    args = parser.parse_args()

    train(args.data_dir, args.epochs, args.output, args.batch)

