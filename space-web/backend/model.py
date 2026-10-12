import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.base import BaseEstimator, TransformerMixin, ClassifierMixin
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
import joblib
import os


class StatisticalFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts 10 domain-specific statistical features from time series windows
    as designed in the NASA SMAP / MSL telemetry anomaly detection pipeline.
    """
    FEATURE_NAMES = [
        "mean",
        "std",
        "minimum",
        "maximum",
        "median",
        "signal_range",
        "iqr",
        "rms",
        "slope",
        "mean_abs_diff"
    ]

    def fit(self, X, y=None):
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """
        Transforms windowed telemetry into a 2D feature matrix.
        X shape: (N, window_size) or (N, window_size, n_channels)
        """
        if X.ndim == 2:
            # Reshape to (N, window_size, 1) for uniform handling
            X = X[:, :, None]

        mean = np.mean(X, axis=1)
        std = np.std(X, axis=1)
        minimum = np.min(X, axis=1)
        maximum = np.max(X, axis=1)
        median = np.median(X, axis=1)
        signal_range = maximum - minimum
        q25 = np.percentile(X, 25, axis=1)
        q75 = np.percentile(X, 75, axis=1)
        iqr = q75 - q25
        rms = np.sqrt(np.mean(X ** 2, axis=1))

        t = np.arange(X.shape[1])
        t_centered = t - np.mean(t)
        slope = (
            np.sum(
                t_centered[None, :, None] * (X - mean[:, None, :]),
                axis=1
            )
            / np.sum(t_centered ** 2)
        )

        differences = np.diff(X, axis=1)
        mean_abs_diff = np.mean(np.abs(differences), axis=1)

        features = np.concatenate(
            [
                mean,
                std,
                minimum,
                maximum,
                median,
                signal_range,
                iqr,
                rms,
                slope,
                mean_abs_diff
            ],
            axis=1
        )
        return features


class ThresholdClassifier(BaseEstimator, ClassifierMixin):
    """
    Wraps an estimator with a configurable probability threshold
    for mission safety tuning (Precision vs Recall).
    """
    def __init__(self, model, threshold: float = 0.45):
        self.model = model
        self.threshold = threshold

    def fit(self, X, y):
        self.model.fit(X, y)
        self.classes_ = getattr(self.model, "classes_", np.array([0, 1]))
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if hasattr(self.model, "predict_proba"):
            return self.model.predict_proba(X)
        elif hasattr(self.model, "decision_function"):
            scores = self.model.decision_function(X)
            # Sigmoid normalization
            probs_1 = 1.0 / (1.0 + np.exp(-scores))
            return np.column_stack([1.0 - probs_1, probs_1])
        else:
            preds = self.model.predict(X)
            return np.column_stack([1.0 - preds, preds])

    def predict(self, X: np.ndarray) -> np.ndarray:
        probabilities = self.predict_proba(X)[:, 1]
        return (probabilities >= self.threshold).astype(int)


class SpacecraftAnomalyDetector:
    """
    Full spacecraft telemetry detector pipeline.
    Combines StatisticalFeatureExtractor, StandardScaler, and XGBoost/Ensemble.
    """
    def __init__(self, threshold: float = 0.45, window_size: int = 100, stride: int = 5):
        self.threshold = threshold
        self.window_size = window_size
        self.stride = stride
        self.feature_extractor = StatisticalFeatureExtractor()
        self.scaler = StandardScaler()
        self.model = None
        self._initialize_calibrated_model()

    def _initialize_calibrated_model(self):
        """
        Initializes an XGBoost model trained across NASA SMAP and MSL telemetry channels
        following the exact pipeline in anomaly-detection-for-spacecraft.ipynb.
        """
        from telemetry_generator import generate_nasa_channel_data

        channels_to_train = [
            ("SMAP", "P-1"),
            ("SMAP", "S-1"),
            ("SMAP", "E-1"),
            ("MSL", "C-1"),
            ("MSL", "D-1"),
            ("MSL", "T-1")
        ]

        X_all = []
        y_all = []

        for mission, chan in channels_to_train:
            data = generate_nasa_channel_data(mission, chan, n_points=1200)
            values = np.array(data["values"])
            intervals = data["ground_truth_anomalies"]

            # Sample-level ground truth label
            labels = np.zeros(len(values), dtype=int)
            for start, end in intervals:
                labels[start:min(len(values), end + 1)] = 1

            # Windowing matching notebook: Window is anomalous if it contains at least one anomaly
            for start in range(0, len(values) - self.window_size + 1, self.stride):
                end = start + self.window_size
                win = values[start:end]
                lab = int(np.any(labels[start:end]))
                X_all.append(win)
                y_all.append(lab)

        X_all = np.array(X_all)
        y_all = np.array(y_all)

        feat_all = self.feature_extractor.transform(X_all)
        feat_scaled = self.scaler.fit_transform(feat_all)

        xgb = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            reg_alpha=0.01,
            reg_lambda=1.5,
            eval_metric="logloss",
            random_state=42
        )
        xgb.fit(feat_scaled, y_all)
        self.model = ThresholdClassifier(model=xgb, threshold=self.threshold)

    def set_threshold(self, threshold: float):
        self.threshold = threshold
        if self.model:
            self.model.threshold = threshold

    def create_windows(self, series: np.ndarray) -> Tuple[np.ndarray, List[Tuple[int, int]]]:
        """
        Splits 1D telemetry into overlapping windows.
        Returns: (windows array of shape (N, window_size), list of (start_idx, end_idx))
        """
        if series.ndim > 1:
            series = series[:, 0]

        windows = []
        indices = []
        n_samples = len(series)

        if n_samples < self.window_size:
            # Pad if shorter than window size
            padded = np.pad(series, (0, self.window_size - n_samples), mode='edge')
            windows.append(padded)
            indices.append((0, n_samples - 1))
            return np.array(windows), indices

        for start in range(0, n_samples - self.window_size + 1, self.stride):
            end = start + self.window_size
            windows.append(series[start:end])
            indices.append((start, end - 1))

        return np.array(windows), indices

    def detect_series(self, series: np.ndarray, threshold: float = None) -> Dict[str, Any]:
        """
        Runs full window extraction, feature extraction, and anomaly scoring.
        """
        if threshold is not None:
            self.set_threshold(threshold)

        windows, intervals = self.create_windows(series)
        features = self.feature_extractor.transform(windows)
        features_scaled = self.scaler.transform(features)
        probabilities = self.model.predict_proba(features_scaled)[:, 1]
        predictions = (probabilities >= self.threshold).astype(int)

        # Map window-level predictions back to point-level anomaly flags
        n_points = len(series)
        point_scores = np.zeros(n_points)
        point_counts = np.zeros(n_points)

        window_records = []
        for i, ((start, end), prob, pred) in enumerate(zip(intervals, probabilities, predictions)):
            point_scores[start:end + 1] += prob
            point_counts[start:end + 1] += 1

            # Feature dictionary for this window
            feat_dict = {
                name: round(float(features[i, idx]), 4)
                for idx, name in enumerate(StatisticalFeatureExtractor.FEATURE_NAMES)
            }

            window_records.append({
                "window_index": i,
                "start_idx": start,
                "end_idx": end,
                "probability": round(float(prob), 4),
                "is_anomaly": bool(pred == 1),
                "features": feat_dict
            })

        # Avoid zero division
        point_counts[point_counts == 0] = 1
        avg_point_scores = point_scores / point_counts
        point_anomalies = (avg_point_scores >= self.threshold).astype(int)

        # Extract contiguous anomaly segments
        anomaly_segments = []
        in_segment = False
        seg_start = 0

        for idx, is_anom in enumerate(point_anomalies):
            if is_anom and not in_segment:
                in_segment = True
                seg_start = idx
            elif not is_anom and in_segment:
                in_segment = False
                seg_end = idx - 1
                peak_score = float(np.max(avg_point_scores[seg_start:seg_end + 1]))
                anomaly_segments.append({
                    "start": seg_start,
                    "end": seg_end,
                    "length": seg_end - seg_start + 1,
                    "peak_score": round(peak_score, 4),
                    "severity": "CRITICAL" if peak_score > 0.75 else "WARNING" if peak_score > 0.55 else "MODERATE"
                })

        if in_segment:
            seg_end = n_points - 1
            peak_score = float(np.max(avg_point_scores[seg_start:seg_end + 1]))
            anomaly_segments.append({
                "start": seg_start,
                "end": seg_end,
                "length": seg_end - seg_start + 1,
                "peak_score": round(peak_score, 4),
                "severity": "CRITICAL" if peak_score > 0.75 else "WARNING" if peak_score > 0.55 else "MODERATE"
            })

        total_anomalous_points = int(np.sum(point_anomalies))
        return {
            "total_points": n_points,
            "window_size": self.window_size,
            "stride": self.stride,
            "threshold": self.threshold,
            "anomaly_points_count": total_anomalous_points,
            "anomaly_ratio": round(total_anomalous_points / max(1, n_points), 4),
            "max_probability": round(float(np.max(probabilities)) if len(probabilities) > 0 else 0.0, 4),
            "mean_probability": round(float(np.mean(probabilities)) if len(probabilities) > 0 else 0.0, 4),
            "anomaly_segments": anomaly_segments,
            "point_scores": [round(float(s), 4) for s in avg_point_scores],
            "point_anomalies": [int(a) for a in point_anomalies],
            "windows": window_records[:50]  # First 50 windows for inspection details
        }
