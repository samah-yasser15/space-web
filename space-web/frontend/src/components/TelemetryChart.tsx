'use client';

import React, { useState, useRef, useMemo } from 'react';
import { TelemetryChannelData } from '../types';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, Maximize2 } from 'lucide-react';

interface TelemetryChartProps {
  data: TelemetryChannelData;
  playbackIndex: number | null;
  onSelectSample?: (index: number) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  playbackIndex,
  onSelectSample
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [viewRange, setViewRange] = useState<'ALL' | 'ANOMALY_1' | 'FIRST_HALF'>('ALL');

  const { values, meta, detection } = data;
  const nPoints = values.length;

  // Compute view bounds
  const sliceRange = useMemo(() => {
    if (viewRange === 'FIRST_HALF') {
      return { start: 0, end: Math.floor(nPoints / 2) };
    }
    if (viewRange === 'ANOMALY_1' && detection.anomaly_segments.length > 0) {
      const seg = detection.anomaly_segments[0];
      const pad = 120;
      return {
        start: Math.max(0, seg.start - pad),
        end: Math.min(nPoints - 1, seg.end + pad)
      };
    }
    return { start: 0, end: nPoints - 1 };
  }, [viewRange, nPoints, detection.anomaly_segments]);

  const visibleValues = useMemo(() => {
    return values.slice(sliceRange.start, sliceRange.end + 1);
  }, [values, sliceRange]);

  const minVal = useMemo(() => Math.min(...visibleValues), [visibleValues]);
  const maxVal = useMemo(() => Math.max(...visibleValues), [visibleValues]);
  const valRange = maxVal - minVal || 1;

  // Chart dimensions
  const svgWidth = 1000;
  const svgHeight = 360;
  const padding = { top: 25, right: 35, bottom: 40, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Coordinate projection
  const getX = (idx: number) => {
    const fraction = (idx - sliceRange.start) / Math.max(1, (sliceRange.end - sliceRange.start));
    return padding.left + fraction * plotWidth;
  };

  const getY = (val: number) => {
    const fraction = (val - minVal) / valRange;
    return padding.top + plotHeight - fraction * plotHeight;
  };

  // Generate SVG path for telemetry line
  const linePath = useMemo(() => {
    if (visibleValues.length === 0) return '';
    let d = '';
    for (let i = 0; i < visibleValues.length; i++) {
      const globalIdx = sliceRange.start + i;
      const x = getX(globalIdx);
      const y = getY(visibleValues[i]);
      if (i === 0) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return d;
  }, [visibleValues, sliceRange, minVal, maxVal]);

  // Compute anomaly shaded rectangles
  const anomalyBoxes = useMemo(() => {
    const boxes: { x: number; width: number; score: number }[] = [];
    let inSeg = false;
    let segStart = 0;

    for (let idx = sliceRange.start; idx <= sliceRange.end; idx++) {
      const isAnom = detection.point_anomalies[idx] === 1;
      if (isAnom && !inSeg) {
        inSeg = true;
        segStart = idx;
      } else if (!isAnom && inSeg) {
        inSeg = false;
        const segEnd = idx - 1;
        const x1 = getX(segStart);
        const x2 = getX(segEnd);
        boxes.push({
          x: x1,
          width: Math.max(2, x2 - x1),
          score: detection.point_scores[segStart] || 0.8
        });
      }
    }
    if (inSeg) {
      const x1 = getX(segStart);
      const x2 = getX(sliceRange.end);
      boxes.push({
        x: x1,
        width: Math.max(2, x2 - x1),
        score: detection.point_scores[segStart] || 0.8
      });
    }
    return boxes;
  }, [sliceRange, detection.point_anomalies, detection.point_scores]);

  // Mouse hover event handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgRelX = (mouseX / rect.width) * svgWidth;

    if (svgRelX >= padding.left && svgRelX <= svgWidth - padding.right) {
      const frac = (svgRelX - padding.left) / plotWidth;
      const calcIdx = Math.round(sliceRange.start + frac * (sliceRange.end - sliceRange.start));
      const clampedIdx = Math.max(sliceRange.start, Math.min(sliceRange.end, calcIdx));
      setHoverIndex(clampedIdx);
      if (onSelectSample) onSelectSample(clampedIdx);
    }
  };

  const activeIdx = playbackIndex !== null ? playbackIndex : hoverIndex;
  const activeVal = activeIdx !== null && activeIdx >= 0 && activeIdx < nPoints ? values[activeIdx] : null;
  const activeScore = activeIdx !== null && activeIdx >= 0 && activeIdx < nPoints ? detection.point_scores[activeIdx] : null;
  const isCurrentAnomalous = activeIdx !== null && detection.point_anomalies[activeIdx] === 1;

  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full flex flex-col">
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-700/50 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/80 flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-mono font-bold text-slate-100 tracking-wide">
                TELEMETRY SIGNAL & ANOMALY INTERVALS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-cyan-300 border border-space-700">
                {meta.name}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Red shaded regions mark supervised anomaly detection intervals (Threshold &gt;= {detection.threshold})
            </p>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setViewRange('ALL')}
            className={`px-2.5 py-1 rounded transition-all ${
              viewRange === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'bg-space-900 text-slate-400 border border-space-800 hover:text-slate-200'
            }`}
          >
            Full Series
          </button>
          <button
            onClick={() => setViewRange('ANOMALY_1')}
            className={`px-2.5 py-1 rounded transition-all ${
              viewRange === 'ANOMALY_1'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'bg-space-900 text-slate-400 border border-space-800 hover:text-slate-200'
            }`}
          >
            Zoom Anomaly
          </button>
          <button
            onClick={() => setViewRange('FIRST_HALF')}
            className={`px-2.5 py-1 rounded transition-all ${
              viewRange === 'FIRST_HALF'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                : 'bg-space-900 text-slate-400 border border-space-800 hover:text-slate-200'
            }`}
          >
            1st Half
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[21/9] sm:aspect-[21/8] bg-[#070B16] rounded-lg border border-space-800/80 my-3 overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Subtle Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const y = padding.top + frac * plotHeight;
            const valLabel = (maxVal - frac * valRange).toFixed(1);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(39, 61, 107, 0.25)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Time axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const x = padding.left + frac * plotWidth;
            const idxLabel = Math.round(sliceRange.start + frac * (sliceRange.end - sliceRange.start));
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={svgHeight - padding.bottom}
                  stroke="rgba(39, 61, 107, 0.25)"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  t = {idxLabel}
                </text>
              </g>
            );
          })}

          {/* Anomaly Highlight Shaded Rectangles */}
          {anomalyBoxes.map((box, i) => (
            <rect
              key={`box-${i}`}
              x={box.x}
              y={padding.top}
              width={box.width}
              height={plotHeight}
              fill="rgba(239, 68, 68, 0.25)"
              stroke="rgba(239, 68, 68, 0.75)"
              strokeWidth="1"
            />
          ))}

          {/* Telemetry Signal Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]"
          />

          {/* Live Playback / Hover Cursor */}
          {activeIdx !== null && activeIdx >= sliceRange.start && activeIdx <= sliceRange.end && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padding.top}
                x2={getX(activeIdx)}
                y2={svgHeight - padding.bottom}
                stroke={isCurrentAnomalous ? '#EF4444' : '#00F0FF'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {activeVal !== null && (
                <circle
                  cx={getX(activeIdx)}
                  cy={getY(activeVal)}
                  r="5"
                  fill={isCurrentAnomalous ? '#EF4444' : '#00F0FF'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className={isCurrentAnomalous ? 'animate-ping' : ''}
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover / Playback Real-time Readout HUD */}
        {activeIdx !== null && activeVal !== null && (
          <div className="absolute top-3 right-3 bg-space-950/90 border border-space-700/80 rounded-lg p-2.5 px-3.5 backdrop-blur-md font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between space-x-3 mb-1">
              <span className="text-slate-400">SAMPLE #{activeIdx}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isCurrentAnomalous
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isCurrentAnomalous ? 'ANOMALY DETECTED' : 'NOMINAL TELEMETRY'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-slate-300">
              <div>
                <span className="text-slate-500 mr-1.5">Value:</span>
                <span className="text-cyan-300 font-bold">{activeVal.toFixed(3)} {meta.unit}</span>
              </div>
              {activeScore !== null && (
                <div>
                  <span className="text-slate-500 mr-1.5">Anomaly Prob:</span>
                  <span className={`font-bold ${activeScore >= detection.threshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(activeScore * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
        <div className="bg-space-900/60 p-2.5 rounded-lg border border-space-800">
          <div className="text-slate-500 text-[10px]">TOTAL SAMPLES</div>
          <div className="text-slate-200 font-semibold">{nPoints} Time Samples</div>
        </div>
        <div className="bg-space-900/60 p-2.5 rounded-lg border border-space-800">
          <div className="text-slate-500 text-[10px]">ANOMALOUS SAMPLES</div>
          <div className="text-rose-400 font-semibold">
            {detection.anomaly_points_count} ({((detection.anomaly_ratio) * 100).toFixed(1)}%)
          </div>
        </div>
        <div className="bg-space-900/60 p-2.5 rounded-lg border border-space-800">
          <div className="text-slate-500 text-[10px]">PEAK ANOMALY PROBABILITY</div>
          <div className="text-amber-400 font-semibold">
            {(detection.max_probability * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-space-900/60 p-2.5 rounded-lg border border-space-800">
          <div className="text-slate-500 text-[10px]">ACTIVE INTERVALS</div>
          <div className="text-cyan-300 font-semibold">
            {detection.anomaly_segments.length} Contiguous Events
          </div>
        </div>
      </div>
    </div>
  );
};

