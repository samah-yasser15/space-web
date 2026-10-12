'use client';

import React from 'react';
import { DetectionResult } from '../types';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

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

  return (
    <div className="clean-card p-5 w-full flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">
          Anomaly Risk Level
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isAnomalous
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isAnomalous ? 'Anomaly Detected' : 'Normal'}
        </span>
      </div>

      {/* Main Score Display */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="10"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={isAnomalous ? '#EF4444' : percent > 30 ? '#F59E0B' : '#10B981'}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - percent / 100)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">
              {percent}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Risk Score</span>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-1.5 text-xs">
          {isAnomalous ? (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-rose-700">Subsystem Warning</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700">Operating Within Envelope</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
        <span>Detection Threshold:</span>
        <span className="font-semibold text-slate-800">{(detection.threshold * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
