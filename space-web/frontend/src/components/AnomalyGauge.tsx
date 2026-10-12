'use client';

import React from 'react';
import { Gauge, ShieldAlert, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { DetectionResult } from '../types';

interface AnomalyGaugeProps {
  detection: DetectionResult;
  currentProbability?: number | null;
}

export const AnomalyGauge: React.FC<AnomalyGaugeProps> = ({
  detection,
  currentProbability
}) => {
  const prob = currentProbability !== undefined && currentProbability !== null
    ? currentProbability
    : detection.max_probability;

  const percent = Math.min(100, Math.max(0, Math.round(prob * 100)));
  const isAnomalous = prob >= detection.threshold;

  // Gauge colors
  const strokeColor = isAnomalous
    ? '#EF4444'
    : prob > 0.3
    ? '#F59E0B'
    : '#10B981';

  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-space-700/50">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            Anomaly Threat Index
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
            isAnomalous
              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}
        >
          {isAnomalous ? 'FAULT TRIGGERED' : 'NOMINAL ENVELOPE'}
        </span>
      </div>

      {/* Radial Gauge Centerpiece */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
            {/* Background ring */}
            <circle
              cx="55"
              cy="55"
              r="46"
              fill="transparent"
              stroke="#0E172B"
              strokeWidth="9"
            />
            {/* Colored progress ring */}
            <circle
              cx="55"
              cy="55"
              r="46"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Center text readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {percent}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Probability
            </span>
          </div>
        </div>

        {/* Severity Label */}
        <div className="mt-3 flex items-center space-x-2">
          {isAnomalous ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            {isAnomalous
              ? 'Critical Anomaly Detected'
              : prob > 0.3
              ? 'Elevated Subsystem Variance'
              : 'Subsystem Behavior Nominal'}
          </span>
        </div>
      </div>

      {/* Diagnostic Threshold Bounds */}
      <div className="space-y-2 pt-3 border-t border-space-700/50 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Decision Threshold:</span>
          <span className="text-cyan-300 font-bold">{detection.threshold} ({(detection.threshold * 100).toFixed(0)}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Sliding Window:</span>
          <span className="text-slate-200">{detection.window_size} Samples</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Sampling Stride:</span>
          <span className="text-slate-200">{detection.stride} Samples</span>
        </div>
      </div>
    </div>
  );
};

