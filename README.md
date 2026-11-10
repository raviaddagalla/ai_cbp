# SignBridge — Indian Sign Language Recognition PWA

> **Academic Prototype** | Computer Vision + Deep Learning | College AI Project

SignBridge translates Indian Sign Language (ISL) gestures into English text and speech using MediaPipe hand landmark detection + a PyTorch GRU sequence model.

---

## 🏗️ Project Structure

```
signbridge-frontend/   ← React + TypeScript + Tailwind CSS PWA
signbridge-backend/    ← FastAPI + PyTorch inference server
  └── training/        ← GRU model training scripts (run on Colab)
```

---

## ⚡ Quick Start

### 1. Run the Backend

```bash
cd signbridge-backend

# Install dependencies
python -m pip install -r requirements.txt

# Start the API server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

> **Note:** The backend works without a trained model — it uses an untrained GRU (random predictions). Train first for real recognition (see `training/README.md`).

---

### 2. Run the Frontend

```bash
cd signbridge-frontend

# Install dependencies
npm install

# Copy env file
copy .env.example .env.local

# Start development server
npm run dev
```

App available at **http://localhost:5173**

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| **Live Translation** | Camera + MediaPipe hand tracking → GRU model → English word |
| **ISL Dictionary** | Browse/search all 35 supported signs with gesture instructions |
| **Text-to-Sign Lookup** | Type English → find matching ISL gesture descriptions |
| **Translation History** | All past translations stored locally (localStorage) |
| **Text-to-Speech** | Web Speech API reads translated text aloud |
| **PWA / Offline** | Installable app; dictionary works without internet |

---

## 🤖 AI Model

### Architecture
```
Input: (1, 30, 42)  ← 30 video frames × 42 hand landmark coords
  ↓
GRU(input=42, hidden=64, layers=2, dropout=0.3)
  ↓
Dropout(0.3) → Linear(64 → 35)
  ↓
Output: 35-class probabilities
```

### Supported Signs (35 total)
**Greetings:** Namaste, Hello, Goodbye, Thank You, Sorry  
**Daily Needs:** Water, Food, Yes, No, Please, More, Stop, Come, Go, Good, Bad  
**Emergency:** Help, Doctor, Police, Hospital, Emergency, Pain  
**People & Family:** I/Me, You, Mother, Father, Friend, Teacher, Student  
**Numbers:** One, Two, Three, Four, Five, Ten

### Training (Google Colab)
```python
# In Colab notebook:
from google.colab import drive
drive.mount('/content/drive')
%cd /content/drive/MyDrive/signbridge-backend

!python -m pip install torch scikit-learn numpy
!python training/train.py --data_dir training/data --epochs 60
```
See [`training/README.md`](signbridge-backend/training/README.md) for full instructions.

---

## 🧰 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Icons | Lucide React |
| Hand Tracking | MediaPipe Tasks Vision (browser WASM) |
| Backend | FastAPI, Python 3.12, Uvicorn |
| ML Model | PyTorch GRU |
| Storage | SQLite (history) + localStorage |
| Deployment | Vercel (frontend) + Hugging Face Spaces (backend) |

---

## 🗂️ API Endpoints

```
GET  /           → Health check + model status
POST /predict    → Run ISL gesture recognition
GET  /signs      → List all 35 supported signs
GET  /signs/{label} → Sign details by label
POST /history    → Save a translation entry
GET  /history    → Retrieve translation history
DELETE /history  → Clear all history
```

---

## 📊 Expected Accuracy

| Training Data | Validation Accuracy |
|--------------|---------------------|
| Synthetic (auto) | ~40–60% |
| 30 real samples/sign | ~70–80% |
| 50+ real samples/sign | ~85–95% |

---

## ⚠️ Academic Scope Disclaimer

This is a **college-level AI prototype**, not a production-grade ISL interpreter.

- Recognizes a fixed vocabulary of **35 ISL signs** only
- Does **not** support full ISL grammar or continuous conversation
- Does **not** include facial expression or body pose recognition
- Accuracy depends on lighting conditions, hand visibility, and training data quality

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `signbridge-frontend/src/pages/LiveTranslator.tsx` | Main camera + recognition screen |
| `signbridge-frontend/src/hooks/useMediaPipe.ts` | MediaPipe HandLandmarker wrapper |
| `signbridge-frontend/src/hooks/useGRUModel.ts` | Backend API + demo fallback |
| `signbridge-backend/model.py` | GRU model architecture |
| `signbridge-backend/inference.py` | Landmark → tensor → prediction pipeline |
| `signbridge-backend/training/train.py` | Full training loop with eval metrics |
| `signbridge-backend/training/collect_data.py` | Webcam data collection utility |

