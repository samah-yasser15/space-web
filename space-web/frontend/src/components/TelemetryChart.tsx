'use client';

import React, { useState, useRef, useMemo } from 'react';
import { TelemetryChannelData } from '../types';
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';

interface TelemetryChartProps {
  data: TelemetryChannelData;
  playbackIndex: number | null;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub: (index: number) => void;
  onSelectSample?: (index: number) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  playbackIndex,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onScrub,
  onSelectSample
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { values, meta, detection } = data;
  const nPoints = values.length;

  const minVal = useMemo(() => Math.min(...values), [values]);
  const maxVal = useMemo(() => Math.max(...values), [values]);
  const valRange = maxVal - minVal || 1;

  // Chart dimensions
  const svgWidth = 1000;
  const svgHeight = 320;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (idx: number) => {
    const fraction = idx / Math.max(1, nPoints - 1);
    return padding.left + fraction * plotWidth;
  };

  const getY = (val: number) => {
    const fraction = (val - minVal) / valRange;
    return padding.top + plotHeight - fraction * plotHeight;
  };

  // Generate SVG path for telemetry line
  const linePath = useMemo(() => {
    if (values.length === 0) return '';
    let d = '';
    for (let i = 0; i < values.length; i++) {
      const x = getX(i);
      const y = getY(values[i]);
      d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [values, minVal, maxVal, nPoints]);

  // Compute anomaly shaded rectangles
  const anomalyBoxes = useMemo(() => {
    const boxes: { x: number; width: number }[] = [];
    let inSeg = false;
    let segStart = 0;

    for (let idx = 0; idx < nPoints; idx++) {
      const isAnom = detection.point_anomalies[idx] === 1;
      if (isAnom && !inSeg) {
        inSeg = true;
        segStart = idx;
      } else if (!isAnom && inSeg) {
        inSeg = false;
        const segEnd = idx - 1;
        const x1 = getX(segStart);
        const x2 = getX(segEnd);
        boxes.push({ x: x1, width: Math.max(3, x2 - x1) });
      }
    }
    if (inSeg) {
      const x1 = getX(segStart);
      const x2 = getX(nPoints - 1);
      boxes.push({ x: x1, width: Math.max(3, x2 - x1) });
    }
    return boxes;
  }, [detection.point_anomalies, nPoints]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgRelX = (mouseX / rect.width) * svgWidth;

    if (svgRelX >= padding.left && svgRelX <= svgWidth - padding.right) {
      const frac = (svgRelX - padding.left) / plotWidth;
      const calcIdx = Math.round(frac * (nPoints - 1));
      const clampedIdx = Math.max(0, Math.min(nPoints - 1, calcIdx));
      setHoverIndex(clampedIdx);
      if (onSelectSample) onSelectSample(clampedIdx);
    }
  };

  const activeIdx = playbackIndex !== null ? playbackIndex : hoverIndex;
  const activeVal = activeIdx !== null && activeIdx >= 0 && activeIdx < nPoints ? values[activeIdx] : null;
  const activeScore = activeIdx !== null && activeIdx >= 0 && activeIdx < nPoints ? detection.point_scores[activeIdx] : null;
  const isCurrentAnomalous = activeIdx !== null && detection.point_anomalies[activeIdx] === 1;

  return (
    <div className="clean-card p-5 w-full flex flex-col">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900">
              Telemetry Stream
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700">
              {meta.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover over the chart to inspect values, or press Play to simulate real-time playback.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
            <span>Normal Signal</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="w-3 h-3 bg-rose-100 border border-rose-400 rounded-sm" />
            <span className="text-rose-700 font-medium">Anomaly Region</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[21/8] bg-slate-50/70 rounded-xl border border-slate-200/70 overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Gridlines */}
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
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Time axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const x = padding.left + frac * plotWidth;
            const idxLabel = Math.round(frac * (nPoints - 1));
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={svgHeight - padding.bottom}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px] font-mono"
                >
                  sample {idxLabel}
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
              fill="rgba(239, 68, 68, 0.12)"
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="1"
            />
          ))}

          {/* Telemetry Signal Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Playback / Hover Cursor */}
          {activeIdx !== null && activeIdx >= 0 && activeIdx < nPoints && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padding.top}
                x2={getX(activeIdx)}
                y2={svgHeight - padding.bottom}
                stroke={isCurrentAnomalous ? '#EF4444' : '#2563EB'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {activeVal !== null && (
                <circle
                  cx={getX(activeIdx)}
                  cy={getY(activeVal)}
                  r="5"
                  fill={isCurrentAnomalous ? '#EF4444' : '#2563EB'}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover / Playback Tooltip Card */}
        {activeIdx !== null && activeVal !== null && (
          <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-xl p-3 shadow-md text-xs">
            <div className="flex items-center justify-between space-x-3 mb-1.5">
              <span className="font-semibold text-slate-700">Sample #{activeIdx}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isCurrentAnomalous
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isCurrentAnomalous ? 'Anomaly' : 'Normal'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-slate-600">
              <div>
                Value: <span className="font-semibold text-slate-900">{activeVal.toFixed(2)} {meta.unit}</span>
              </div>
              {activeScore !== null && (
                <div>
                  Score: <span className={`font-semibold ${activeScore >= detection.threshold ? 'text-rose-600' : 'text-slate-800'}`}>
                    {(activeScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clean Playback Controls Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Play / Reset buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isPlaying
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Reset to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Scrubber */}
        <div className="flex-1 max-w-md w-full flex items-center space-x-3">
          <span className="text-slate-500 font-mono text-[11px] w-12 text-right">
            {playbackIndex !== null ? playbackIndex : 0}
          </span>
          <input
            type="range"
            min={0}
            max={nPoints - 1}
            value={playbackIndex !== null ? playbackIndex : 0}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-slate-400 font-mono text-[11px] w-12">
            {nPoints - 1}
          </span>
        </div>

        {/* Speed buttons */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 mr-1">Speed:</span>
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                playbackSpeed === speed
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
