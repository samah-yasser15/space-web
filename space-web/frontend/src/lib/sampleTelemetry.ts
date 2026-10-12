import { MissionMeta, TelemetryChannelData, DetectionResult, StatisticalFeatures, WindowRecord, AnomalySegment } from '../types';

export const MISSIONS_DATA: MissionMeta[] = [
  {
    id: "SMAP",
    name: "NASA SMAP",
    fullName: "Soil Moisture Active Passive Satellite",
    orbit: "Sun-Synchronous Low Earth Orbit (685 km)",
    channels: [
      {
        id: "P-1",
        name: "EPS Primary Bus Voltage",
        subsystem: "Electrical Power Subsystem (EPS)",
        unit: "V",
        nominal: "27.5 - 28.5 V",
        nominal_min: 27.5,
        nominal_max: 28.5,
        anomaly_intervals: [[320, 410], [780, 840]],
        anomaly_type: "Bus Under-Voltage & Transients",
        description: "Regulated main spacecraft power bus voltage. Critical for all payload instruments."
      },
      {
        id: "S-1",
        name: "Solar Array Gimbal Current",
        subsystem: "Solar Array Articulation (SADM)",
        unit: "A",
        nominal: "1.8 - 2.6 A",
        nominal_min: 1.8,
        nominal_max: 2.6,
        anomaly_intervals: [[450, 560]],
        anomaly_type: "Gimbal Motor Friction Spike",
        description: "Drive motor current drawn during solar tracking azimuth rotation."
      },
      {
        id: "E-1",
        name: "Transponder Carrier Power",
        subsystem: "RF Telecommunications & Transponder",
        unit: "dBm",
        nominal: "35.0 - 38.5 dBm",
        nominal_min: 35.0,
        nominal_max: 38.5,
        anomaly_intervals: [[620, 710]],
        anomaly_type: "Carrier Lock Fluctuation",
        description: "X-Band high-gain forward link transmitted telemetry carrier power."
      }
    ]
  },
  {
    id: "MSL",
    name: "NASA MSL",
    fullName: "Mars Science Laboratory (Curiosity Rover)",
    orbit: "Gale Crater Surface Operations (Mars)",
    channels: [
      {
        id: "C-1",
        name: "Drive Wheel Motor Torque",
        subsystem: "Surface Mobility (Rocker-Bogie)",
        unit: "Nm",
        nominal: "12.0 - 18.0 Nm",
        nominal_min: 12.0,
        nominal_max: 18.0,
        anomaly_intervals: [[280, 390], [820, 910]],
        anomaly_type: "Rough Terrain Obstacle Jam",
        description: "Front-right rocker-bogie wheel actuator drive motor torque."
      },
      {
        id: "D-1",
        name: "MMRTG Coolant Loop Temp",
        subsystem: "MMRTG Thermal Rejection System",
        unit: "°C",
        nominal: "45.0 - 65.0 °C",
        nominal_min: 45.0,
        nominal_max: 65.0,
        anomaly_intervals: [[510, 640]],
        anomaly_type: "Coolant Heat Pipe Thermal Drift",
        description: "Thermal transfer fluid temperature downstream of radioisotope generator."
      },
      {
        id: "T-1",
        name: "Inertial Gyro Yaw Rate",
        subsystem: "Guidance, Navigation & Control (GNC)",
        unit: "deg/s",
        nominal: "-0.5 - +0.5 deg/s",
        nominal_min: -0.5,
        nominal_max: 0.5,
        anomaly_intervals: [[350, 440]],
        anomaly_type: "Gyro High-Frequency Vibration",
        description: "Three-axis ring laser gyro angular rate around rover z-axis."
      }
    ]
  }
];

export function extractWindowFeatures(window: number[]): StatisticalFeatures {
  const n = window.length;
  if (n === 0) {
    return {
      mean: 0, std: 0, minimum: 0, maximum: 0, median: 0,
      signal_range: 0, iqr: 0, rms: 0, slope: 0, mean_abs_diff: 0
    };
  }

  let sum = 0;
  let min = window[0];
  let max = window[0];
  let sqSum = 0;

  for (let i = 0; i < n; i++) {
    const v = window[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
    sqSum += v * v;
  }

  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = window[i] - mean;
    varSum += diff * diff;
  }
  const std = Math.sqrt(varSum / n);
  const rms = Math.sqrt(sqSum / n);

  const sorted = [...window].sort((a, b) => a - b);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const q25 = sorted[Math.floor(n * 0.25)];
  const q75 = sorted[Math.floor(n * 0.75)];
  const iqr = q75 - q25;
  const signal_range = max - min;

  // Slope calculation matching notebook
  const t_mean = (n - 1) / 2;
  let numer = 0;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    const t_c = i - t_mean;
    numer += t_c * (window[i] - mean);
    denom += t_c * t_c;
  }
  const slope = denom !== 0 ? numer / denom : 0;

  // Mean abs difference
  let absDiffSum = 0;
  for (let i = 1; i < n; i++) {
    absDiffSum += Math.abs(window[i] - window[i - 1]);
  }
  const mean_abs_diff = n > 1 ? absDiffSum / (n - 1) : 0;

  return {
    mean: Number(mean.toFixed(4)),
    std: Number(std.toFixed(4)),
    minimum: Number(min.toFixed(4)),
    maximum: Number(max.toFixed(4)),
    median: Number(median.toFixed(4)),
    signal_range: Number(signal_range.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
    rms: Number(rms.toFixed(4)),
    slope: Number(slope.toFixed(4)),
    mean_abs_diff: Number(mean_abs_diff.toFixed(4))
  };
}

export function generateClientTelemetryData(
  missionId: string,
  channelId: string,
  threshold: number = 0.45,
  windowSize: number = 100,
  stride: number = 5,
  nPoints: number = 1200
): TelemetryChannelData {
  const mission = MISSIONS_DATA.find(m => m.id === missionId) || MISSIONS_DATA[0];
  const channel = mission.channels.find(c => c.id === channelId) || mission.channels[0];

  const min = channel.nominal_min ?? 10;
  const max = channel.nominal_max ?? 20;
  const center = (min + max) / 2;
  const amp = (max - min) * 0.35;

  // Seeded deterministic pseudo-random sequence
  let seed = 42;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function gaussian() {
    const u = 1 - rnd();
    const v = rnd();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const values: number[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < nPoints; i++) {
    timestamps.push(i);
    const t = (i / nPoints) * 100;
    let val = center + amp * Math.sin(2 * Math.PI * 0.05 * t) + (amp * 0.25) * Math.cos(2 * Math.PI * 0.13 * t) + gaussian() * amp * 0.08;
    values.push(val);
  }

  // Inject known anomaly intervals
  const intervals = channel.anomaly_intervals || [[320, 410]];
  intervals.forEach(([start, end]) => {
    if (start < nPoints && end <= nPoints) {
      const dur = end - start;
      const anomType = channel.anomaly_type || "Spike";
      for (let j = start; j < end; j++) {
        const offset = j - start;
        if (anomType.includes("Voltage") || anomType.includes("Torque")) {
          if (offset < dur / 2) {
            values[j] -= (offset / (dur / 2)) * amp * 3.2;
          } else {
            values[j] += gaussian() * amp * 0.9;
          }
        } else if (anomType.includes("Thermal") || anomType.includes("Drift")) {
          values[j] += (offset / dur) * amp * 2.8;
        } else if (anomType.includes("Friction") || anomType.includes("Vibration")) {
          values[j] += amp * 2.2 * Math.sin(2 * Math.PI * 1.5 * offset);
        } else {
          values[j] += gaussian() * amp * 1.8;
        }
      }
    }
  });

  // Calculate sliding windows and statistical anomalies
  const windows: WindowRecord[] = [];
  const pointScores = new Array(nPoints).fill(0);
  const pointCounts = new Array(nPoints).fill(0);

  let winIdx = 0;
  for (let start = 0; start <= nPoints - windowSize; start += stride) {
    const end = start + windowSize;
    const windowSlice = values.slice(start, end);
    const features = extractWindowFeatures(windowSlice);

    // Probability scoring based on extreme deviation in statistical metrics
    let anomalyScore = 0.08; // baseline nominal noise

    // 1. RMS / Extreme variance deviation
    if (features.std > amp * 0.35) {
      anomalyScore += Math.min(0.5, (features.std / (amp * 0.35) - 1.0) * 0.35);
    }
    // 2. High slope / runaway trend
    if (Math.abs(features.slope) > 0.035) {
      anomalyScore += Math.min(0.4, (Math.abs(features.slope) / 0.035) * 0.25);
    }
    // 3. Signal range breach
    if (features.signal_range > amp * 2.2) {
      anomalyScore += Math.min(0.45, (features.signal_range / (amp * 2.2) - 1.0) * 0.3);
    }
    // 4. Mean absolute difference spike (high frequency friction)
    if (features.mean_abs_diff > amp * 0.45) {
      anomalyScore += Math.min(0.4, (features.mean_abs_diff / (amp * 0.45) - 1.0) * 0.25);
    }

    const prob = Math.min(0.98, Math.max(0.04, Number(anomalyScore.toFixed(4))));
    const isAnom = prob >= threshold;

    windows.push({
      window_index: winIdx++,
      start_idx: start,
      end_idx: end - 1,
      probability: prob,
      is_anomaly: isAnom,
      features
    });

    for (let k = start; k < end; k++) {
      pointScores[k] += prob;
      pointCounts[k] += 1;
    }
  }

  const avgPointScores = pointScores.map((score, i) => {
    const count = pointCounts[i] || 1;
    return Number((score / count).toFixed(4));
  });

  const pointAnomalies = avgPointScores.map(score => (score >= threshold ? 1 : 0));

  // Extract anomaly segments
  const anomalySegments: AnomalySegment[] = [];
  let inSegment = false;
  let segStart = 0;

  for (let i = 0; i < nPoints; i++) {
    if (pointAnomalies[i] === 1 && !inSegment) {
      inSegment = true;
      segStart = i;
    } else if (pointAnomalies[i] === 0 && inSegment) {
      inSegment = false;
      const segEnd = i - 1;
      const segScores = avgPointScores.slice(segStart, segEnd + 1);
      const peak = Math.max(...segScores);
      anomalySegments.push({
        start: segStart,
        end: segEnd,
        length: segEnd - segStart + 1,
        peak_score: peak,
        severity: peak > 0.75 ? 'CRITICAL' : peak > 0.55 ? 'WARNING' : 'MODERATE'
      });
    }
  }

  if (inSegment) {
    const segEnd = nPoints - 1;
    const segScores = avgPointScores.slice(segStart, segEnd + 1);
    const peak = Math.max(...segScores);
    anomalySegments.push({
      start: segStart,
      end: segEnd,
      length: segEnd - segStart + 1,
      peak_score: peak,
      severity: peak > 0.75 ? 'CRITICAL' : peak > 0.55 ? 'WARNING' : 'MODERATE'
    });
  }

  const anomCount = (pointAnomalies as number[]).reduce((a: number, b: number) => a + b, 0);

  const detection: DetectionResult = {
    total_points: nPoints,
    window_size: windowSize,
    stride: stride,
    threshold: threshold,
    anomaly_points_count: anomCount,
    anomaly_ratio: Number((anomCount / nPoints).toFixed(4)),
    max_probability: Math.max(...avgPointScores),
    mean_probability: Number((avgPointScores.reduce((a, b) => a + b, 0) / nPoints).toFixed(4)),
    anomaly_segments: anomalySegments,
    point_scores: avgPointScores,
    point_anomalies: pointAnomalies,
    windows: windows.slice(0, 50)
  };

  return {
    meta: channel,
    timestamps,
    values: values.map(v => Number(v.toFixed(3))),
    ground_truth_anomalies: intervals,
    detection
  };
}
