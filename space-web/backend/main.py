from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import io
import csv
import json

from model import SpacecraftAnomalyDetector, StatisticalFeatureExtractor
from telemetry_generator import generate_nasa_channel_data, get_available_missions_meta

app = FastAPI(
    title="space-web Telemetry Anomaly Detection API",
    description="Mission-critical spacecraft telemetry anomaly detection backend powered by statistical feature extraction and XGBoost",
    version="1.0.0"
)

# CORS middleware to allow Next.js frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
detector = SpacecraftAnomalyDetector(threshold=0.45, window_size=100, stride=5)


class DetectRequest(BaseModel):
    values: List[float] = Field(..., description="1D telemetry series values")
    threshold: Optional[float] = Field(0.45, ge=0.05, le=0.95, description="Decision threshold")
    window_size: Optional[int] = Field(100, ge=10, le=500, description="Sliding window size")
    stride: Optional[int] = Field(5, ge=1, le=50, description="Sliding window stride")


class FeatureExtractRequest(BaseModel):
    window_values: List[float] = Field(..., description="Window of telemetry samples (e.g. 50-100 values)")


@app.get("/")
def root():
    return {
        "system": "space-web Telemetry Ground Station API",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "telemetry_stream": "ACTIVE",
        "detector_loaded": True,
        "default_threshold": detector.threshold,
        "window_size": detector.window_size,
        "stride": detector.stride
    }


@app.get("/api/missions")
def get_missions():
    """List supported NASA spacecraft missions and telemetry channels."""
    return {
        "missions": get_available_missions_meta()
    }


@app.get("/api/telemetry/{mission}/{channel_id}")
def get_channel_telemetry(
    mission: str,
    channel_id: str,
    n_points: int = Query(1200, ge=100, le=5000)
):
    """
    Fetch synthesized or NASA ground-truth telemetry time-series for a specific channel.
    """
    valid_missions = ["SMAP", "MSL"]
    if mission.upper() not in valid_missions:
        raise HTTPException(status_code=404, detail=f"Mission {mission} not found. Must be one of {valid_missions}")

    data = generate_nasa_channel_data(mission.upper(), channel_id.upper(), n_points=n_points)
    
    # Run immediate baseline detection
    series_np = np.array(data["values"])
    detection_res = detector.detect_series(series_np)

    return {
        "meta": data["meta"],
        "timestamps": data["timestamps"],
        "values": data["values"],
        "ground_truth_anomalies": data["ground_truth_anomalies"],
        "detection": detection_res
    }


@app.post("/api/detect")
def detect_anomalies(payload: DetectRequest):
    """
    Run the anomaly detection pipeline on an arbitrary 1D telemetry stream.
    """
    if len(payload.values) < 10:
        raise HTTPException(status_code=400, detail="Telemetry series must contain at least 10 samples.")

    # Temporarily update detector params if customized
    current_detector = detector
    if payload.window_size != detector.window_size or payload.stride != detector.stride:
        current_detector = SpacecraftAnomalyDetector(
            threshold=payload.threshold,
            window_size=payload.window_size,
            stride=payload.stride
        )
    else:
        current_detector.set_threshold(payload.threshold)

    series_np = np.array(payload.values, dtype=float)
    results = current_detector.detect_series(series_np, threshold=payload.threshold)
    return results


@app.post("/api/extract-features")
def extract_window_features(payload: FeatureExtractRequest):
    """
    Extract the 10 NASA statistical features for a specific window.
    """
    arr = np.array(payload.window_values, dtype=float)
    if arr.ndim == 1:
        arr = arr[None, :, None]
    
    extractor = StatisticalFeatureExtractor()
    features = extractor.transform(arr)[0]

    feature_dict = {}
    for name, val in zip(StatisticalFeatureExtractor.FEATURE_NAMES, features):
        feature_dict[name] = round(float(val), 5)

    return {
        "window_length": len(payload.window_values),
        "features": feature_dict
    }


@app.post("/api/upload-telemetry")
async def upload_telemetry(
    file: UploadFile = File(...),
    threshold: float = Query(0.45, ge=0.05, le=0.95),
    window_size: int = Query(100, ge=10, le=500),
    stride: int = Query(5, ge=1, le=50)
):
    """
    Upload custom telemetry file (.csv or .json) and run anomaly detection.
    """
    contents = await file.read()
    filename = file.filename.lower()
    values: List[float] = []

    try:
        if filename.endswith(".csv"):
            text = contents.decode("utf-8")
            reader = csv.reader(io.StringIO(text))
            for row in reader:
                if not row:
                    continue
                # Try first numeric value in row
                for item in row:
                    try:
                        v = float(item.strip())
                        values.append(v)
                        break
                    except ValueError:
                        continue
        elif filename.endswith(".json"):
            data = json.loads(contents.decode("utf-8"))
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, (int, float)):
                        values.append(float(item))
                    elif isinstance(item, dict) and "value" in item:
                        values.append(float(item["value"]))
            elif isinstance(data, dict) and "values" in data:
                values = [float(v) for v in data["values"]]
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv or .json file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if len(values) < 20:
        raise HTTPException(status_code=400, detail="Parsed telemetry has fewer than 20 valid numeric samples.")

    custom_detector = SpacecraftAnomalyDetector(
        threshold=threshold,
        window_size=min(window_size, len(values)),
        stride=stride
    )
    series_np = np.array(values, dtype=float)
    results = custom_detector.detect_series(series_np, threshold=threshold)

    return {
        "filename": file.filename,
        "sample_count": len(values),
        "values": values[:2000],  # Return up to first 2000 for preview
        "detection": results
    }

