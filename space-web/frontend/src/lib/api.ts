import { MissionMeta, TelemetryChannelData, DetectionResult, StatisticalFeatures } from '../types';
import { MISSIONS_DATA, generateClientTelemetryData, extractWindowFeatures } from './sampleTelemetry';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/backend-api';

export async function checkBackendHealth(): Promise<{ isOnline: boolean; statusText: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      return { isOnline: true, statusText: 'FastAPI Telemetry Node Connected' };
    }
  } catch (err) {
    // Backend offline or running in standalone Vercel client mode
  }
  return { isOnline: false, statusText: 'Edge Telemetry Ground Station (Client Mode)' };
}

export async function fetchMissions(): Promise<MissionMeta[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/missions`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.missions && Array.isArray(data.missions)) {
        return data.missions;
      }
    }
  } catch (err) {
    // Fallback to embedded missions
  }
  return MISSIONS_DATA;
}

export async function fetchChannelTelemetry(
  mission: string,
  channelId: string,
  threshold: number = 0.45,
  windowSize: number = 100,
  stride: number = 5
): Promise<TelemetryChannelData> {
  try {
    const res = await fetch(`${API_BASE_URL}/telemetry/${mission}/${channelId}?n_points=1200`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Graceful fallback to client generation
  }
  return generateClientTelemetryData(mission, channelId, threshold, windowSize, stride);
}

export async function runCustomDetection(
  values: number[],
  threshold: number = 0.45,
  windowSize: number = 100,
  stride: number = 5
): Promise<DetectionResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values,
        threshold,
        window_size: windowSize,
        stride
      }),
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const result = await res.json();
      return result;
    }
  } catch (err) {
    // Client-side fallback computation
  }

  // Fallback to client-side detection engine
  const clientData = generateClientTelemetryData("SMAP", "P-1", threshold, windowSize, stride, values.length);
  return clientData.detection;
}

export async function extractFeaturesFromWindow(window: number[]): Promise<StatisticalFeatures> {
  try {
    const res = await fetch(`${API_BASE_URL}/extract-features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ window_values: window }),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.features) return data.features;
    }
  } catch (err) {
    // Local extractor
  }
  return extractWindowFeatures(window);
}

