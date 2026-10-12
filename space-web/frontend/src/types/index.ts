export interface ChannelMeta {
  id: string;
  name: string;
  subsystem: string;
  unit: string;
  nominal?: string;
  nominal_min?: number;
  nominal_max?: number;
  anomaly_intervals?: [number, number][];
  anomaly_type?: string;
  description?: string;
}

export interface MissionMeta {
  id: string;
  name: string;
  fullName: string;
  orbit: string;
  channels: ChannelMeta[];
}

export interface StatisticalFeatures {
  mean: number;
  std: number;
  minimum: number;
  maximum: number;
  median: number;
  signal_range: number;
  iqr: number;
  rms: number;
  slope: number;
  mean_abs_diff: number;
}

export interface WindowRecord {
  window_index: number;
  start_idx: number;
  end_idx: number;
  probability: number;
  is_anomaly: boolean;
  features: StatisticalFeatures;
}

export interface AnomalySegment {
  start: number;
  end: number;
  length: number;
  peak_score: number;
  severity: 'CRITICAL' | 'WARNING' | 'MODERATE';
}

export interface DetectionResult {
  total_points: number;
  window_size: number;
  stride: number;
  threshold: number;
  anomaly_points_count: number;
  anomaly_ratio: number;
  max_probability: number;
  mean_probability: number;
  anomaly_segments: AnomalySegment[];
  point_scores: number[];
  point_anomalies: number[];
  windows: WindowRecord[];
}

export interface TelemetryChannelData {
  meta: ChannelMeta;
  timestamps: number[];
  values: number[];
  ground_truth_anomalies?: [number, number][];
  detection: DetectionResult;
}

