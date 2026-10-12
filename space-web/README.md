# space-web: Spacecraft Telemetry Monitoring & Anomaly Detection System

A mission-critical aerospace telemetry operations console and supervised anomaly detection ground station built for NASA **SMAP** (Soil Moisture Active Passive) and **MSL** (Curiosity Rover) missions.

Designed with an aerospace mission-control HUD aesthetic, high-precision telemetry visualization, real-time statistical feature extraction, and supervised classification.

---

## 🛰️ Architecture Overview

The system is organized into a modular decoupled architecture:

```
space-web/
├── frontend/             # Next.js 14 Web Dashboard (Tailwind CSS, TypeScript, HUD UI)
│   ├── src/
│   │   ├── app/          # App router, page, layout, globals.css, API handlers
│   │   ├── components/   # Telemetry charts, anomaly gauge, playback toolbar, tuner
│   │   ├── lib/          # API client and client-side statistical engine
│   │   └── types/        # TypeScript interfaces for telemetry and features
│   ├── package.json
│   ├── next.config.mjs
│   └── vercel.json       # Ready for Vercel deployment
│
├── backend/              # FastAPI High-Performance Telemetry Engine
│   ├── main.py           # REST API endpoints, CORS, file ingestion
│   ├── model.py          # 10-feature statistical extractor & XGBoost classifier
│   ├── telemetry_generator.py # NASA SMAP & MSL channel telemetry generator
│   └── requirements.txt
│
├── vercel.json           # Root Vercel build configuration
└── README.md
```

---

## ⚡ Key Capabilities

1. **Aerospace Telemetry Visualization**:
   - Interactive SVG telemetry chart with real-time signal plotting.
   - Anomaly interval shading mapped directly to supervised labels.
   - Scrubbing crosshairs with instant value and probability readouts.
   - Zoom modes (Full Series, Focused Anomaly Interval, 1st Half).

2. **NASA 10-Feature Statistical Extraction Matrix**:
   - Computes domain-engineered moments across sliding windows:
     - `Mean (μ)`: Central baseline level
     - `Std Dev (σ)`: Signal dispersion & noise variance
     - `RMS`: Root Mean Square power
     - `Trend Slope (β)`: Linear thermal and voltage drift rate
     - `Signal Range (Δ)`: Peak-to-peak spread (Max - Min)
     - `IQR`: 75th to 25th percentile spread
     - `Median`: Outlier-resistant center
     - `Mean Absolute Difference`: High-frequency change rate
     - `Minimum` & `Maximum`: Window envelope limits

3. **Multi-Mission Coverage**:
   - **NASA SMAP**: Power Bus Voltage (`P-1`), Solar Array Gimbal Current (`S-1`), X-Band Transponder Carrier Power (`E-1`).
   - **NASA MSL (Curiosity)**: Wheel Actuator Torque (`C-1`), MMRTG Coolant Temp (`D-1`), Gyro Yaw Rate (`T-1`).

4. **Telemetry Playback Simulation**:
   - Replay live telemetry streams tick-by-tick (1x, 2x, 5x, 10x rates).
   - Single-step advancement and full rewind controls.

5. **Decision Threshold Calibration**:
   - Dynamic threshold slider (θ ∈ [0.10, 0.80], default 0.45).
   - Real-time recalculation of anomaly intervals and safety margins.

6. **Custom Stream Ingestion**:
   - Upload `.csv` or `.json` telemetry data files or paste numeric streams directly.

---

## 🚀 Running Locally

### 1. Backend (FastAPI)

```bash
cd space-web/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API Server: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend (Next.js)

```bash
cd space-web/frontend
npm install
npm run dev
```

- Web Console: `http://localhost:3000`

---

## 🌐 Deploying to Vercel

The frontend is fully configured for deployment on Vercel with zero required configuration.

### Option A: Via Vercel CLI

```bash
cd space-web/frontend
npx vercel
```

### Option B: Via Vercel Git Dashboard

1. Import your repository into Vercel.
2. In **Project Settings**, configure:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `space-web/frontend`
3. Click **Deploy**.

> **Note on Backend Integration**:
> The frontend features a dual-mode telemetry engine. When deployed on Vercel standalone, it runs using its embedded edge statistical calculation routines. When connected to a hosted FastAPI instance, provide `NEXT_PUBLIC_API_URL=https://your-fastapi-backend.com/api` in Vercel's Environment Variables.

