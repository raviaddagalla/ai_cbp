"""
SignBridge — ASL Citizen Training Script (v2)
==============================================
Uses the Microsoft ASL Citizen community-processed dataset from HuggingFace:
  SharoonArshad/asl-citizen-processed-200

Data format:  .npy shards of shape (N, 200, 450)
  N   = samples per shard (256)
  200 = frames (temporal dimension)
  450 = 150 body landmarks × 3 coords (x, y, z)

This script:
  1. Downloads all feature + label shards from HuggingFace Hub
  2. Loads the manifest CSV to get sign labels
  3. Resamples each clip from 200 → 30 frames (to match SignBridge's SEQUENCE_LEN)
  4. Optionally uses the full 450-feature input OR extracts only hand landmarks (42)
  5. Trains a 3-layer GRU on the 200-class ASL vocabulary
  6. Saves the best checkpoint to <output>

Usage:
    cd signbridge-backend
    python training/train_asl_citizen.py --epochs 60 --output models/sign_gru_asl.pt

After training, copy to models/sign_gru.pt and restart the backend.
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from model import SEQUENCE_LEN   # 30

# ── Config ─────────────────────────────────────────────────────────────────────
HF_REPO_ID     = "SharoonArshad/asl-citizen-processed-200"
LOCAL_DIR      = os.path.join(os.path.dirname(__file__), "data_asl_citizen")
MANIFEST_DIR   = os.path.join(LOCAL_DIR, "metadata")
SHARD_DIR      = os.path.join(LOCAL_DIR, "shards")

# Full 450-feature input (better accuracy); set False to use only hand x,y (42)
USE_FULL_FEATURES = True
IN_FEATURES    = 450 if USE_FULL_FEATURES else 42

# Source data constants
SRC_FRAMES     = 200    # frames per clip in the dataset
SRC_FEATURES   = 450    # features per frame in the .npy shards
N_CLASSES      = 200    # number of sign classes


# ── Model ──────────────────────────────────────────────────────────────────────
class ASLGRUModel(nn.Module):
    """3-layer GRU for ASL Citizen 200-class recognition."""

    def __init__(self, input_size=IN_FEATURES, hidden_size=256,
                 num_layers=3, num_classes=N_CLASSES, dropout=0.4):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout,
        )
        self.dropout    = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        out, _ = self.gru(x)           # (B, T, hidden)
        out     = self.dropout(out[:, -1, :])  # last step
        return self.classifier(out)


# ── Dataset ─────────────────────────────────────────────────────────────────────
class ShardDataset(Dataset):
    """Lazily loads shards as needed (memory-efficient)."""

    def __init__(self, manifest_df, split_name, shard_dir,
                 target_frames=SEQUENCE_LEN, full_features=USE_FULL_FEATURES):
        self.df            = manifest_df[manifest_df["split"] == split_name].reset_index(drop=True)
        self.shard_dir     = shard_dir
        self.target_frames = target_frames
        self.full_features = full_features
        self._shard_cache  = {}     # cache loaded shards in RAM

        print(f"[Dataset] Split '{split_name}': {len(self.df)} samples")

    def __len__(self):
        return len(self.df)

    def _load_shard(self, shard_path: str) -> np.ndarray:
        if shard_path not in self._shard_cache:
            full_path = os.path.join(self.shard_dir,
                                     os.path.basename(shard_path))
            self._shard_cache[shard_path] = np.load(full_path)
        return self._shard_cache[shard_path]

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        feat_shard = self._load_shard(row["feature_shard"])  # (N, 200, 450)
        lbl_shard  = self._load_shard(row["label_shard"])    # (N,)

        seq   = feat_shard[row["row_in_shard"]]  # (200, 450)
        label = int(lbl_shard[row["row_in_shard"]])

        # Optionally extract only hand x,y features (cols 0–41)
        if not self.full_features:
            seq = seq[:, :42]

        # Resample from 200 → target_frames (30)
        seq = resample_sequence(seq, self.target_frames)

        return torch.from_numpy(seq).float(), label


def resample_sequence(seq: np.ndarray, target_len: int) -> np.ndarray:
    """Resample (or pad) a (T, F) array to (target_len, F)."""
    T = len(seq)
    if T == target_len:
        return seq.astype(np.float32)
    idx = np.linspace(0, T - 1, target_len)
    lo  = np.floor(idx).astype(int)
    hi  = np.minimum(lo + 1, T - 1)
    alpha = (idx - lo)[:, None]
    out = (1 - alpha) * seq[lo] + alpha * seq[hi]
    return out.astype(np.float32)


# ── Download ────────────────────────────────────────────────────────────────────
def download_all_shards():
    """Ensure all shard .npy files and manifest CSVs exist locally."""
    os.makedirs(SHARD_DIR,    exist_ok=True)
    os.makedirs(MANIFEST_DIR, exist_ok=True)

    existing_shards = [f for f in os.listdir(SHARD_DIR) if f.endswith(".npy")]
    if len(existing_shards) >= 82:
        print(f"[Download] ✅ All {len(existing_shards)} shards already downloaded and cached.")
        return

    from huggingface_hub import hf_hub_download, list_repo_files

    token = os.environ.get("HF_TOKEN")  # Set HF_TOKEN env var before running
    print(f"[Download] Checking files in {HF_REPO_ID} …")
    all_files = list(list_repo_files(HF_REPO_ID, repo_type="dataset", token=token))

    to_download = [f for f in all_files
                   if f.startswith("shards/") or f.startswith("metadata/")]

    for i, fname in enumerate(to_download):
        dest_dir  = SHARD_DIR if fname.startswith("shards/") else MANIFEST_DIR
        dest_file = os.path.join(dest_dir, os.path.basename(fname))
        if os.path.exists(dest_file):
            continue   # already cached
        print(f"  Downloading missing: {fname} …")
        hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=fname,
            repo_type="dataset",
            local_dir=LOCAL_DIR,
            token=token,
        )

    print("[Download] ✅ All shards verified")


def load_manifests():
    """Load all manifest CSVs and combine into one DataFrame."""
    dfs = []
    for split in ("train", "val", "test"):
        mf = os.path.join(MANIFEST_DIR, f"{split}_manifest.csv")
        if os.path.exists(mf):
            df = pd.read_csv(mf)
            df["split"] = split
            dfs.append(df)
    combined = pd.concat(dfs, ignore_index=True)
    print(f"[Manifest] Total rows: {len(combined)} | splits: {combined['split'].value_counts().to_dict()}")
    return combined


def get_label_names(manifest_df: pd.DataFrame) -> list:
    """Return list of label names ordered by label_id."""
    label_map = manifest_df[["label", "label_id"]].drop_duplicates()
    label_map = label_map.sort_values("label_id")
    return label_map["label"].tolist()


# ── Training ────────────────────────────────────────────────────────────────────
def train(epochs: int, output_path: str, batch_size: int = 32, lr: float = 1e-3):
    # 1. Download data
    download_all_shards()

    # 2. Load manifests
    manifest = load_manifests()
    label_names = get_label_names(manifest)
    print(f"[Train] {len(label_names)} sign classes: {label_names[:5]} …")

    # Save label map next to model
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    label_path = output_path.replace(".pt", "_labels.json")
    with open(label_path, "w") as f:
        json.dump(label_names, f, indent=2)
    print(f"[Train] Label map → {label_path}")

    # 3. Build datasets
    train_ds = ShardDataset(manifest, "train", SHARD_DIR)
    val_ds   = ShardDataset(manifest, "val",   SHARD_DIR)

    if len(val_ds) == 0:
        # Fallback: carve 15% from train
        print("[Train] No val split found — using 15% of train as validation")
        all_idx = list(range(len(train_ds)))
        all_lbl = manifest[manifest["split"] == "train"]["label_id"].tolist()
        tr_idx, va_idx = train_test_split(all_idx, test_size=0.15,
                                          stratify=all_lbl, random_state=42)
        from torch.utils.data import Subset
        val_ds   = Subset(train_ds, va_idx)
        train_ds = Subset(train_ds, tr_idx)

    train_loader = DataLoader(train_ds, batch_size=batch_size,
                              shuffle=True, num_workers=0, pin_memory=False)
    val_loader   = DataLoader(val_ds, batch_size=batch_size,
                              shuffle=False, num_workers=0, pin_memory=False)

    # 4. Model & optimizer
    device    = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Train] Device: {device}")
    model     = ASLGRUModel(input_size=IN_FEATURES, num_classes=len(label_names)).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_val_acc = 0.0
    best_preds, best_tgts = [], []

    print(f"\n[Train] Starting {epochs}-epoch training …")
    print(f"        Train samples: {len(train_ds)} | Val samples: {len(val_ds)}")
    print(f"        Input features: {IN_FEATURES} | Classes: {len(label_names)}")

    for epoch in range(1, epochs + 1):
        # ── Train ──
        model.train()
        t_loss, t_correct, t_total = 0.0, 0, 0
        for seqs, tgts in train_loader:
            seqs, tgts = seqs.to(device), tgts.to(device)
            optimizer.zero_grad()
            logits = model(seqs)
            loss   = criterion(logits, tgts)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            t_loss    += loss.item()
            t_correct += (logits.argmax(-1) == tgts).sum().item()
            t_total   += tgts.size(0)

        train_acc = t_correct / t_total * 100 if t_total else 0.0

        # ── Validate ──
        model.eval()
        v_correct, v_total = 0, 0
        ep_preds, ep_tgts  = [], []
        with torch.no_grad():
            for seqs, tgts in val_loader:
                seqs, tgts = seqs.to(device), tgts.to(device)
                preds       = model(seqs).argmax(-1)
                v_correct  += (preds == tgts).sum().item()
                v_total    += tgts.size(0)
                ep_preds.extend(preds.cpu().tolist())
                ep_tgts.extend(tgts.cpu().tolist())

        val_acc = v_correct / v_total * 100 if v_total else 0.0
        scheduler.step()

        # Save best checkpoint
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_preds, best_tgts = ep_preds, ep_tgts
            ckpt = {
                "state_dict":   model.state_dict(),
                "label_names":  label_names,
                "num_classes":  len(label_names),
                "hidden_size":  256,
                "num_layers":   3,
                "input_size":   IN_FEATURES,
            }
            torch.save(ckpt, output_path)
            # Also save directly as sign_gru.pt for FastAPI backend to load
            default_path = os.path.join(os.path.dirname(os.path.abspath(output_path)), "sign_gru.pt")
            torch.save(ckpt, default_path)
            # Save companion label JSON for default path
            default_label_path = os.path.join(os.path.dirname(os.path.abspath(output_path)), "sign_gru_labels.json")
            with open(default_label_path, "w") as f:
                json.dump(label_names, f, indent=2)

        avg_loss = t_loss / len(train_loader) if len(train_loader) else 0
        star = " ★ (Best)" if val_acc >= best_val_acc else ""
        print(f"  Epoch {epoch:2d}/{epochs} | Loss: {avg_loss:.4f} | "
              f"Train: {train_acc:.1f}% | Val: {val_acc:.1f}%{star}", flush=True)

    # ── Report ──
    if best_preds:
        print("\n[Train] Final Validation Report (best checkpoint):", flush=True)
        seen = sorted(set(best_tgts))
        tnames = [label_names[i] for i in seen]
        print(classification_report(best_tgts, best_preds,
                                    labels=seen, target_names=tnames,
                                    zero_division=0), flush=True)

    print(f"\n[Train] ✅ Best checkpoint saved → {output_path}", flush=True)
    print(f"[Train] ✅ Also deployed directly to models/sign_gru.pt", flush=True)
    print(f"[Train] Best Val Accuracy: {best_val_acc:.1f}%", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train SignBridge GRU on Microsoft ASL Citizen dataset"
    )
    parser.add_argument("--epochs",  type=int,   default=30)
    parser.add_argument("--batch",   type=int,   default=64)
    parser.add_argument("--lr",      type=float, default=1e-3)
    parser.add_argument("--output",  default="models/sign_gru_asl.pt")
    args = parser.parse_args()

    train(args.epochs, args.output, args.batch, args.lr)
