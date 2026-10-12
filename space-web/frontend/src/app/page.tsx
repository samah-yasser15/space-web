'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { MissionSelector } from '../components/MissionSelector';
import { TelemetryChart } from '../components/TelemetryChart';
import { AnomalyGauge } from '../components/AnomalyGauge';
import { FeatureExtractorView } from '../components/FeatureExtractorView';
import { TelemetryPlaybackControl } from '../components/TelemetryPlaybackControl';
import { IncidentsLog } from '../components/IncidentsLog';
import { ThresholdTuner } from '../components/ThresholdTuner';
import { TelemetryUploader } from '../components/TelemetryUploader';
import { SystemSpecsModal } from '../components/SystemSpecsModal';
import { TelemetryChannelData, MissionMeta } from '../types';
import { MISSIONS_DATA, generateClientTelemetryData, extractWindowFeatures } from '../lib/sampleTelemetry';
import { checkBackendHealth, fetchChannelTelemetry } from '../lib/api';

export default function SpaceWebDashboard() {
  const [missions] = useState<MissionMeta[]>(MISSIONS_DATA);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('SMAP');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('P-1');
  const [threshold, setThreshold] = useState<number>(0.45);

  const [telemetryData, setTelemetryData] = useState<TelemetryChannelData>(() =>
    generateClientTelemetryData('SMAP', 'P-1', 0.45, 100, 5, 1200)
  );

  const [backendStatus, setBackendStatus] = useState<{ isOnline: boolean; statusText: string }>({
    isOnline: false,
    statusText: 'Connecting to Ground Node...'
  });

  // Playback state
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2);

  // Active inspected sample/window
  const [inspectedSample, setInspectedSample] = useState<number>(0);

  // Modals
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Check backend status on mount
  useEffect(() => {
    checkBackendHealth().then(status => {
      setBackendStatus(status);
    });
  }, []);

  // Update telemetry when mission, channel, or threshold changes
  const loadChannel = useCallback(async (missionId: string, channelId: string, thresh: number) => {
    const data = await fetchChannelTelemetry(missionId, channelId, thresh, 100, 5);
    setTelemetryData(data);
    setPlaybackIndex(0);
    setInspectedSample(0);
  }, []);

  const handleSelectMission = (missionId: string) => {
    setSelectedMissionId(missionId);
    const mission = missions.find(m => m.id === missionId);
    if (mission && mission.channels.length > 0) {
      const firstChannel = mission.channels[0].id;
      setSelectedChannelId(firstChannel);
      loadChannel(missionId, firstChannel, threshold);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    loadChannel(selectedMissionId, channelId, threshold);
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    // Recalculate with new threshold
    const updated = generateClientTelemetryData(
      selectedMissionId,
      selectedChannelId,
      newThreshold,
      telemetryData.detection.window_size,
      telemetryData.detection.stride,
      telemetryData.values.length
    );
    // Keep custom values if custom
    if (telemetryData.meta.id === 'CUSTOM') {
      updated.values = telemetryData.values;
      updated.meta = telemetryData.meta;
    }
    setTelemetryData(updated);
  };

  // Playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(20, Math.floor(100 / playbackSpeed));
    const interval = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= telemetryData.values.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setInspectedSample(next);
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, telemetryData.values.length]);

  // Compute active window features around inspected sample
  const currentWindowFeatures = React.useMemo(() => {
    const winSize = telemetryData.detection.window_size || 100;
    const start = Math.max(0, inspectedSample - Math.floor(winSize / 2));
    const end = Math.min(telemetryData.values.length, start + winSize);
    const slice = telemetryData.values.slice(start, end);
    return extractWindowFeatures(slice);
  }, [telemetryData.values, inspectedSample, telemetryData.detection.window_size]);

  const currentSampleAnomalyProb = React.useMemo(() => {
    if (inspectedSample >= 0 && inspectedSample < telemetryData.detection.point_scores.length) {
      return telemetryData.detection.point_scores[inspectedSample];
    }
    return telemetryData.detection.max_probability;
  }, [telemetryData.detection, inspectedSample]);

  const isCurrentSampleAnomalous = React.useMemo(() => {
    if (inspectedSample >= 0 && inspectedSample < telemetryData.detection.point_anomalies.length) {
      return telemetryData.detection.point_anomalies[inspectedSample] === 1;
    }
    return false;
  }, [telemetryData.detection, inspectedSample]);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans">
      {/* Aerospace Navigation Bar */}
      <Navbar
        backendStatus={backendStatus}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        activeMission={selectedMissionId}
      />

      {/* Main Mission Control Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Spacecraft Mission & Channel Selector */}
        <MissionSelector
          missions={missions}
          selectedMissionId={selectedMissionId}
          selectedChannelId={selectedChannelId}
          onSelectMission={handleSelectMission}
          onSelectChannel={handleSelectChannel}
          channelMeta={telemetryData.meta}
        />

        {/* Telemetry Stream Replay Toolbar */}
        <TelemetryPlaybackControl
          totalPoints={telemetryData.values.length}
          currentIndex={playbackIndex}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={() => {
            setIsPlaying(false);
            setPlaybackIndex(0);
            setInspectedSample(0);
          }}
          onStep={() => {
            if (playbackIndex < telemetryData.values.length - 1) {
              const next = playbackIndex + 1;
              setPlaybackIndex(next);
              setInspectedSample(next);
            }
          }}
          onSpeedChange={(speed) => setPlaybackSpeed(speed)}
          onScrub={(index) => {
            setPlaybackIndex(index);
            setInspectedSample(index);
          }}
        />

        {/* Primary Telemetry Visualizer Chart */}
        <TelemetryChart
          data={telemetryData}
          playbackIndex={isPlaying ? playbackIndex : null}
          onSelectSample={(idx) => setInspectedSample(idx)}
        />

        {/* Grid: Threat Index Gauge & Calibration Tuner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AnomalyGauge
              detection={telemetryData.detection}
              currentProbability={currentSampleAnomalyProb}
            />
          </div>

          <div className="lg:col-span-2">
            <ThresholdTuner
              threshold={threshold}
              onThresholdChange={handleThresholdChange}
              anomalyPointsCount={telemetryData.detection.anomaly_points_count}
              totalPoints={telemetryData.values.length}
            />
          </div>
        </div>

        {/* 10-Feature Statistical Extraction Matrix View */}
        <FeatureExtractorView
          features={currentWindowFeatures}
          windowIndex={Math.floor(inspectedSample / (telemetryData.detection.stride || 5))}
          isAnomaly={isCurrentSampleAnomalous}
        />

        {/* Incidents Log Table & Export Report */}
        <IncidentsLog
          segments={telemetryData.detection.anomaly_segments}
          onSelectInterval={(startSample) => {
            setPlaybackIndex(startSample);
            setInspectedSample(startSample);
          }}
          channelName={telemetryData.meta.name}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-space-800/80 bg-[#060A14] py-4 text-center font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>space-web • Spacecraft Telemetry Monitoring Ground Station</span>
          <span className="text-[11px] text-slate-600">NASA SMAP / MSL Supervised Classification Pipeline</span>
          <span>Ready for Vercel Deployment</span>
        </div>
      </footer>

      {/* Modals */}
      <SystemSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />

      <TelemetryUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTelemetryLoaded={(customData) => {
          setTelemetryData(customData);
          setSelectedChannelId('CUSTOM');
          setPlaybackIndex(0);
          setInspectedSample(0);
        }}
      />
    </div>
  );
}

