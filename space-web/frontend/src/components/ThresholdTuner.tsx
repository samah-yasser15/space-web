'use client';

import React from 'react';
import { Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ThresholdTunerProps {
  threshold: number;
  onThresholdChange: (newThreshold: number) => void;
  anomalyPointsCount: number;
  totalPoints: number;
}

export const ThresholdTuner: React.FC<ThresholdTunerProps> = ({
  threshold,
  onThresholdChange,
  anomalyPointsCount,
  totalPoints
}) => {
  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-space-700/50">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Decision Threshold Calibration
          </h3>
        </div>
        <span className="text-xs font-bold text-cyan-300">
          θ = {threshold.toFixed(2)}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 my-3">
        Adjust decision boundary to trade off between early anomaly warning sensitivity (high recall) and false alarm mitigation (high precision).
      </p>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-slate-500 uppercase">
          <span>High Sensitivity (Recall)</span>
          <span>Balanced (0.45)</span>
          <span>Conservative (Precision)</span>
        </div>
        <input
          type="range"
          min="0.10"
          max="0.80"
          step="0.05"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 bg-space-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* Statistical summary under current threshold */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-space-900/60 rounded border border-space-800">
          <div className="text-[10px] text-slate-500">DETECTED SAMPLES</div>
          <div className="text-rose-400 font-bold">{anomalyPointsCount} / {totalPoints}</div>
        </div>
        <div className="p-2 bg-space-900/60 rounded border border-space-800">
          <div className="text-[10px] text-slate-500">MISSION SAFETY MARGIN</div>
          <div className="text-emerald-400 font-bold">
            {threshold >= 0.4 ? 'HIGH CONFIDENCE' : 'SENSITIVE / EARLY WARNING'}
          </div>
        </div>
      </div>
    </div>
  );
};

