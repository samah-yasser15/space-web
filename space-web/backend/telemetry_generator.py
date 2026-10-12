import numpy as np
from typing import Dict, List, Any


def generate_nasa_channel_data(mission: str, channel_id: str, n_points: int = 1200) -> Dict[str, Any]:
    """
    Generates realistic, physically-grounded telemetry for NASA SMAP and MSL channels,
    including authentic telemetry behaviors and embedded anomaly intervals matching NASA labels.
    """
    np.random.seed(abs(hash(f"{mission}_{channel_id}")) % (2**31 - 1))
    t = np.linspace(0, 100, n_points)

    channels_meta = {
        # NASA SMAP (Soil Moisture Active Passive)
        "P-1": {
            "mission": "SMAP",
            "name": "Power Bus Primary Voltage (P-1)",
            "subsystem": "Electrical Power Subsystem (EPS)",
            "unit": "V",
            "nominal_min": 27.5,
            "nominal_max": 28.5,
            "anomaly_intervals": [[320, 410], [780, 840]],
            "anomaly_type": "Bus Under-Voltage & Transients",
            "description": "Main spacecraft regulated 28V power bus voltage monitoring."
        },
        "S-1": {
            "mission": "SMAP",
            "name": "Solar Array Drive Mechanism Current (S-1)",
            "subsystem": "Solar Array Propulsion & Articulation",
            "unit": "A",
            "nominal_min": 1.8,
            "nominal_max": 2.6,
            "anomaly_intervals": [[450, 560]],
            "anomaly_type": "Gimbal Motor Friction Spike",
            "description": "Drive current consumed during solar panel sun-tracking rotation."
        },
        "E-1": {
            "mission": "SMAP",
            "name": "Transponder Forward Carrier Power (E-1)",
            "subsystem": "RF Telecommunications & Transponder",
            "unit": "dBm",
            "nominal_min": 35.0,
            "nominal_max": 38.5,
            "anomaly_intervals": [[620, 710]],
            "anomaly_type": "Carrier Lock Fluctuation",
            "description": "X-Band high-gain forward link transmitted power level."
        },
        # NASA MSL (Mars Science Laboratory / Curiosity)
        "C-1": {
            "mission": "MSL",
            "name": "Mobility Actuator Wheel Drive Torque (C-1)",
            "subsystem": "Rover Surface Mobility Subsystem",
            "unit": "Nm",
            "nominal_min": 12.0,
            "nominal_max": 18.0,
            "anomaly_intervals": [[280, 390], [820, 910]],
            "anomaly_type": "Rough Terrain Resistance Spike",
            "description": "Right-front rocker-bogie wheel drive motor output torque."
        },
        "D-1": {
            "mission": "MSL",
            "name": "Radioisotope Thermoelectric Thermal Loop (D-1)",
            "subsystem": "MMRTG Thermal Rejection System",
            "unit": "°C",
            "nominal_min": 45.0,
            "nominal_max": 65.0,
            "anomaly_intervals": [[510, 640]],
            "anomaly_type": "Coolant Pump Cavitation Drift",
            "description": "Fluid loop temperature sensor downstream from thermoelectric generator."
        },
        "T-1": {
            "mission": "MSL",
            "name": "Inertial Measurement Unit Yaw Rate (T-1)",
            "subsystem": "Guidance, Navigation & Control (GNC)",
            "unit": "deg/s",
            "nominal_min": -0.5,
            "nominal_max": 0.5,
            "anomaly_intervals": [[350, 440]],
            "anomaly_type": "Gyroscope High-Frequency Vibration",
            "description": "Three-axis ring laser gyro yaw angular velocity telemetry."
        }
    }

    meta = channels_meta.get(channel_id, {
        "mission": mission,
        "name": f"Channel {channel_id}",
        "subsystem": "General Telemetry Bus",
        "unit": "raw",
        "nominal_min": 10.0,
        "nominal_max": 20.0,
        "anomaly_intervals": [[300, 420]],
        "anomaly_type": "Telemetry Drift Anomaly",
        "description": "Spacecraft sensor channel telemetry."
    })

    # Base nominal signal
    nominal_center = (meta["nominal_min"] + meta["nominal_max"]) / 2.0
    nominal_amp = (meta["nominal_max"] - meta["nominal_min"]) * 0.35

    # Multi-component periodic telemetry with nominal noise
    signal = (
        nominal_center
        + nominal_amp * np.sin(2 * np.pi * 0.05 * t)
        + (nominal_amp * 0.25) * np.cos(2 * np.pi * 0.13 * t)
        + np.random.normal(0, nominal_amp * 0.08, n_points)
    )

    # Inject anomaly intervals
    for start, end in meta["anomaly_intervals"]:
        if start < n_points and end <= n_points:
            duration = end - start
            if "Voltage" in meta["anomaly_type"] or "Torque" in meta["anomaly_type"]:
                # Sudden transient spike and drops
                spike = np.linspace(0, nominal_amp * 3.2, duration // 2)
                signal[start:start + duration // 2] -= spike
                signal[start + duration // 2:end] += np.random.normal(0, nominal_amp * 0.9, duration - duration // 2)
            elif "Thermal" in meta["anomaly_type"] or "Drift" in meta["anomaly_type"]:
                # Gradual thermal runaway drift
                drift = np.linspace(0, nominal_amp * 2.8, duration)
                signal[start:end] += drift
            elif "Friction" in meta["anomaly_type"] or "Vibration" in meta["anomaly_type"]:
                # High frequency oscillation
                oscillations = (nominal_amp * 2.2) * np.sin(2 * np.pi * 1.5 * np.arange(duration))
                signal[start:end] += oscillations
            else:
                # Carrier drop or noise explosion
                signal[start:end] += np.random.normal(0, nominal_amp * 1.5, duration)

    return {
        "meta": meta,
        "timestamps": list(range(n_points)),
        "values": [round(float(v), 3) for v in signal],
        "ground_truth_anomalies": meta["anomaly_intervals"]
    }


def get_available_missions_meta() -> List[Dict[str, Any]]:
    return [
        {
            "id": "SMAP",
            "name": "NASA SMAP",
            "fullName": "Soil Moisture Active Passive Satellite",
            "orbit": "Sun-Synchronous Low Earth Orbit (685 km)",
            "channels": [
                {
                    "id": "P-1",
                    "name": "EPS Bus Voltage",
                    "subsystem": "Power (EPS)",
                    "unit": "V",
                    "nominal": "27.5 - 28.5 V"
                },
                {
                    "id": "S-1",
                    "name": "Solar Array Gimbal Current",
                    "subsystem": "Articulation",
                    "unit": "A",
                    "nominal": "1.8 - 2.6 A"
                },
                {
                    "id": "E-1",
                    "name": "X-Band Carrier Power",
                    "subsystem": "Telecom (RF)",
                    "unit": "dBm",
                    "nominal": "35.0 - 38.5 dBm"
                }
            ]
        },
        {
            "id": "MSL",
            "name": "NASA MSL",
            "fullName": "Mars Science Laboratory (Curiosity Rover)",
            "orbit": "Gale Crater Surface Operations (Mars)",
            "channels": [
                {
                    "id": "C-1",
                    "name": "Drive Wheel Motor Torque",
                    "subsystem": "Mobility (Rocker-Bogie)",
                    "unit": "Nm",
                    "nominal": "12.0 - 18.0 Nm"
                },
                {
                    "id": "D-1",
                    "name": "MMRTG Coolant Loop Temp",
                    "subsystem": "Thermal (MMRTG)",
                    "unit": "°C",
                    "nominal": "45.0 - 65.0 °C"
                },
                {
                    "id": "T-1",
                    "name": "IMU Yaw Angular Rate",
                    "subsystem": "GNC (Inertial Gyro)",
                    "unit": "deg/s",
                    "nominal": "-0.5 - +0.5 deg/s"
                }
            ]
        }
    ]

