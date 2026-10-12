'use client';

import React from 'react';
import { StatisticalFeatures } from '../types';
import { Sliders, Layers, TrendingUp, BarChart3, Activity } from 'lucide-react';

interface FeatureExtractorViewProps {
  features: StatisticalFeatures;
  windowIndex?: number;
  isAnomaly?: boolean;
}

export const FeatureExtractorView: React.FC<FeatureExtractorViewProps> = ({
  features,
  windowIndex = 0,
  isAnomaly = false
}) => {
  const featureList = [
    { key: 'mean', label: 'Mean', value: features.mean, desc: 'Average central baseline level' },
    { key: 'std', label: 'Standard Deviation (σ)', value: features.std, desc: 'Signal dispersion & telemetry variance' },
    { key: 'rms', label: 'RMS (Root Mean Square)', value: features.rms, desc: 'Total signal energy and power' },
    { key: 'slope', label: 'Trend Slope (β)', value: features.slope, desc: 'Linear thermal/voltage drift rate' },
    { key: 'signal_range', label: 'Signal Range (Δ)', value: features.signal_range, desc: 'Peak-to-peak spread (Max - Min)' },
    { key: 'iqr', label: 'Interquartile Range (IQR)', value: features.iqr, desc: '75th to 25th percentile spread' },
    { key: 'median', label: 'Median', value: features.median, desc: 'Outlier-resistant midpoint' },
    { key: 'mean_abs_diff', label: 'Mean Absolute Diff', value: features.mean_abs_diff, desc: 'Point-to-point rate of variation' },
    { key: 'minimum', label: 'Window Minimum', value: features.minimum, desc: 'Lowest observed telemetry value' },
    { key: 'maximum', label: 'Window Maximum', value: features.maximum, desc: 'Highest observed telemetry value' },
  ];

  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-700/50 gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            NASA 10-Feature Statistical Extraction Matrix
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Window #{windowIndex}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isAnomaly
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
            }`}
          >
            {isAnomaly ? 'ANOMALOUS WINDOW' : 'NOMINAL WINDOW'}
          </span>
        </div>
      </div>

      <p className="text-[11px] font-mono text-slate-400 my-3">
        Domain-engineered statistical feature transform applied across 100-sample sliding windows before XGBoost inference.
      </p>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {featureList.map(item => {
          // Highlight high deviation values
          const isSpike = isAnomaly && (item.key === 'std' || item.key === 'signal_range' || item.key === 'slope' || item.key === 'mean_abs_diff');

          return (
            <div
              key={item.key}
              className={`p-2.5 rounded-lg border font-mono transition-all ${
                isSpike
                  ? 'bg-rose-950/40 border-rose-600/70 shadow-sm shadow-rose-950/50'
                  : 'bg-space-900/60 border-space-700/60 hover:border-space-600'
              }`}
            >
              <div className="text-[10px] text-slate-400 truncate uppercase mb-1">
                {item.label}
              </div>
              <div
                className={`text-sm font-bold truncate ${
                  isSpike ? 'text-rose-300' : 'text-cyan-300'
                }`}
              >
                {typeof item.value === 'number' ? item.value.toFixed(3) : item.value}
              </div>
              <div className="text-[9px] text-slate-500 truncate mt-1">
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

