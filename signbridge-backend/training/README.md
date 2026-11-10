# SignBridge Model Training Guide

## Overview
The GRU model is trained on hand landmark sequences extracted by MediaPipe.
Training is designed to run on **Google Colab** (free GPU) or locally on CPU.

---

## Option A: Google Colab (Recommended)

1. Upload the entire `signbridge-backend/` folder to your Google Drive.
2. Open a new Colab notebook and run:

```python
from google.colab import drive
drive.mount('/content/drive')

%cd /content/drive/MyDrive/signbridge-backend

# Install dependencies
!pip install torch scikit-learn numpy

# Generate synthetic training data (if no real webcam data collected yet)
import sys; sys.path.insert(0, '.')
from training.train import generate_synthetic_data
generate_synthetic_data('./training/data', samples_per_class=50)

# Train the model (50 epochs on synthetic data)
!python training/train.py --data_dir ./training/data --epochs 50 --output sign_gru.pt
```

3. Download `sign_gru.pt` and place it at `signbridge-backend/models/sign_gru.pt`.
4. Restart the FastAPI backend — it will automatically load the trained model.

---

## Option B: Collect Real Webcam Data (Best Results)

```bash
# Install webcam + MediaPipe dependencies
pip install opencv-python mediapipe numpy

# Collect 50 samples per sign (press SPACE to record each sample)
cd signbridge-backend/training
python collect_data.py --sign "Namaste"    --samples 50
python collect_data.py --sign "Hello"      --samples 50
python collect_data.py --sign "Thank You"  --samples 50
python collect_data.py --sign "Water"      --samples 50
python collect_data.py --sign "Help"       --samples 50
# ... repeat for each of the 35 signs in signs_meta.py

# Train on collected data
python train.py --data_dir ./data --epochs 60 --output sign_gru.pt

# Move model into place
cp sign_gru.pt ../models/sign_gru.pt
```

---

## Accuracy Expectations

| Data Type              | Expected Validation Accuracy |
|------------------------|------------------------------|
| Synthetic data (auto)  | ~40–60%                      |
| 30 real samples/sign   | ~70–80%                      |
| 50+ real samples/sign  | ~85–95%                      |

---

## Model Architecture

```
Input:  (batch=1, seq=30, features=42)
          ↓
GRU (input=42, hidden=64, layers=2, dropout=0.3)
          ↓
Last timestep output: (batch, 64)
          ↓
Dropout(0.3)
          ↓
Linear(64 → 35)
          ↓
Output: 35-class logits → softmax → predicted sign
```

**Input features (42):** 21 MediaPipe hand landmarks × (x, y) = 42 values per frame  
**Sequence length:** 30 frames (~1 second at 30 FPS)  
**Classes:** 35 ISL signs

---

## Deployment Notes

- Backend loads `models/sign_gru.pt` automatically on startup.
- If the file is missing, the API still runs using an **untrained** model (random predictions).
- Check `GET /` → `model_loaded: true` to confirm the model is active.
- For Hugging Face Spaces deployment, upload `sign_gru.pt` to the Space's model directory.

