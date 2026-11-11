# SignBridge — Real-Time Sign Language Recognition & Translation PWA

> **AI / Deep Learning Project** | MediaPipe Hand Tracking + PyTorch GRU Recurrent Sequence Model | PWA

SignBridge translates sign language gestures into English text and speech in real time. It captures continuous hand and body landmarks using MediaPipe in the browser, processes temporal sequence windows, and runs sequence inference against a PyTorch GRU model to produce real-time predictions, sentence synthesis, and text-to-speech feedback.

---

## 🏗️ Project Architecture & Structure

```
ai_cbp/
├── signbridge-backend/                # Python / FastAPI + PyTorch Backend
│   ├── main.py                        # FastAPI REST API endpoints
│   ├── model.py                       # PyTorch GRU model architecture & checkpoint loaders
│   ├── inference.py                   # Landmark sequence feature processing & inference pipeline
│   ├── schemas.py                     # Pydantic request / response schemas
│   ├── database.py                    # SQLite translation history persistence
│   ├── signs_meta.py                  # Default ISL sign vocabulary metadata
│   ├── requirements.txt               # Backend Python dependencies
│   ├── models/                        # Serialized PyTorch models (.pt) and label mappings (.json)
│   │   ├── sign_gru.pt                # Active model weights loaded by FastAPI
│   │   ├── sign_gru_asl.pt            # ASL Citizen 200-class trained model
│   │   └── sign_gru_labels.json       # Active model class labels mapping
│   └── training/                      # Training scripts & datasets
│       ├── train_asl_citizen.py       # ASL Citizen (200 signs) training script
│       ├── fast_download.py           # Multi-threaded Hugging Face shard downloader
│       ├── train.py                   # ISL (35 signs) training script with synthetic generator
│       └── collect_data.py            # Local webcam data collection utility
│
├── signbridge-frontend/               # React + TypeScript + Vite + Tailwind CSS PWA
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useMediaPipe.ts        # MediaPipe HandLandmarker wrapper & canvas overlay renderer
│   │   │   ├── useGRUModel.ts         # Backend API client with auto-reconnecting fallback
│   │   │   └── useHistory.ts          # Local translation history store (localStorage)
│   │   ├── pages/
│   │   │   ├── LiveTranslator.tsx     # Live webcam translation interface
│   │   │   ├── Dictionary.tsx         # Sign dictionary & gesture instructions
│   │   │   ├── TextToSign.tsx         # English to gesture lookup
│   │   │   ├── History.tsx            # Translation log & audio replay
│   │   │   └── Home.tsx               # Landing & quick navigation
│   │   └── components/                # Modular UI components
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                          # Project documentation
```

---

## ⚡ Quick Start: Running the Project

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.11)
- **Node.js**: v18+ or v20+ (with npm)
- **Git**
- A working webcam / front-facing camera

---

### Step 1: Start the Backend Server

Open a terminal and navigate to `signbridge-backend`:

```powershell
# 1. Navigate to backend directory
cd signbridge-backend

# 2. (Optional but recommended) Create & activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
python -m pip install -r requirements.txt
python -m pip install datasets huggingface_hub

# 4. Start the FastAPI server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/](http://localhost:8000/)

---

### Step 2: Start the Frontend Application

Open a **separate** terminal window and navigate to `signbridge-frontend`:

```powershell
# 1. Navigate to frontend directory
cd signbridge-frontend

# 2. Install Node dependencies
npm install

# 3. Configure environment variable (if not already present)
# Ensure .env.local contains: VITE_API_URL=http://localhost:8000
Copy-Item .env.example .env.local

# 4. Start Vite development server
npm run dev -- --host 0.0.0.0
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- Click **"Start Camera"** on the Live Translator page to begin real-time gesture recognition.

---

## 🤖 Model Training

SignBridge supports two datasets:
1. **Microsoft ASL Citizen Community Dataset** (200 American Sign Language signs, ~10,000 video sequences)
2. **ISL 35-Sign Dataset** (Indian Sign Language vocabulary with synthetic and webcam collection support)

### Training on the Microsoft ASL Citizen Dataset (200 Signs)

The dataset (`SharoonArshad/asl-citizen-processed-200`) contains MediaPipe Holistic landmarks (Pose + Left Hand + Right Hand + Velocities = 450 features per frame).

```powershell
cd signbridge-backend

# Set your Hugging Face token (optional, for fast downloads)
$env:HF_TOKEN = "your_hf_token_here"

# Fast multi-threaded shard downloader
python training/fast_download.py

# Run training (3-layer GRU, 256 hidden units, 200 classes)
python training/train_asl_citizen.py --epochs 30 --batch 64 --output models/sign_gru_asl.pt
```

The script automatically:
- Caches all feature & label shards under `training/data_asl_citizen/`
- Trains the GRU network with temporal resampling (200 → 30 frames)
- Automatically saves the best checkpoint to `models/sign_gru_asl.pt` and copies it to `models/sign_gru.pt` so FastAPI immediately serves it.

### Training on ISL 35 Signs (Synthetic / Custom Webcam)

```powershell
cd signbridge-backend
python training/train.py --data_dir training/data --epochs 50 --output models/sign_gru.pt
```

---

## 🔧 Camera & Coordinate Mapping Fix

A common issue in browser-based computer vision overlays is a coordinate offset between the video element and the landmark canvas.

**Cause**:
- Video elements styled with CSS `object-cover` crop and scale the video feed relative to its native aspect ratio. Sizing the overlay canvas to `video.videoWidth` caused landmark points to drift away from the real hand.
- CSS mirroring (`transform: scaleX(-1)`) on the canvas flipped the drawn graphics in reverse relative to the camera frame.

**Solution implemented in `useMediaPipe.ts`**:
1. Sized the canvas dynamically using `canvas.getBoundingClientRect()` to strictly match the rendered pixel dimensions on screen.
2. Handled selfie/front-camera mirroring directly in JavaScript (`toX = (1 - nx) * width`) rather than applying CSS `scaleX(-1)` to the canvas.
3. Automatically synchronized landmark coordinates with the user's active viewport on every frame.

---

## 🗂️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status, model loaded state, class count |
| `POST` | `/predict` | Ingests 30 frames of landmarks and outputs predicted sign + top-k confidences |
| `GET` | `/signs` | Returns dictionary metadata for supported vocabulary |
| `GET` | `/signs/{label}` | Returns details and instructions for a specific sign |
| `POST` | `/history` | Saves a translation session to the SQLite database |
| `GET` | `/history` | Retrieves recent translation history records |
| `DELETE` | `/history` | Clears all translation records |

---

## 🛠️ Tech Stack Summary

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, MediaPipe Tasks Vision (WASM)
- **Backend**: FastAPI, Uvicorn, PyTorch (GRU), NumPy, Scikit-Learn, SQLite
- **Deployment**: Vercel (Frontend) / Hugging Face Spaces or Render (Backend)
