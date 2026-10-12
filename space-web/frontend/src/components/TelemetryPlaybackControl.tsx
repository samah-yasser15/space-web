'use client';

import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Zap } from 'lucide-react';

interface TelemetryPlaybackControlProps {
  totalPoints: number;
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onScrub: (index: number) => void;
}

export const TelemetryPlaybackControl: React.FC<TelemetryPlaybackControlProps> = ({
  totalPoints,
  currentIndex,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onReset,
  onStep,
  onSpeedChange,
  onScrub
}) => {
  return (
    <div className="hud-card rounded-xl p-3 sm:p-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
      {/* Playback action buttons */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
        <button
          onClick={onTogglePlay}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            isPlaying
              ? 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
              : 'bg-cyan-950 text-cyan-300 border border-cyan-600 hover:bg-cyan-900 shadow-sm shadow-cyan-950/50'
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
              <span>Stream</span>
            </>
          )}
        </button>

        <button
          onClick={onStep}
          disabled={isPlaying || currentIndex >= totalPoints - 1}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs bg-space-850 border border-space-700 text-slate-300 hover:text-white disabled:opacity-40"
          title="Advance 1 Time Step"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Step</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs bg-space-850 border border-space-700 text-slate-400 hover:text-rose-300 hover:border-rose-800"
          title="Rewind to Beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Scrubber slider */}
      <div className="flex-1 w-full max-w-xl mx-2 flex items-center space-x-3">
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          t = {currentIndex}
        </span>
        <input
          type="range"
          min={0}
          max={totalPoints - 1}
          value={currentIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full accent-cyan-400 bg-space-800 h-1.5 rounded-lg cursor-pointer"
        />
        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {totalPoints - 1}
        </span>
      </div>

      {/* Speed multiplier selection */}
      <div className="flex items-center space-x-1">
        <span className="text-[10px] text-slate-500 uppercase mr-1 hidden md:inline">Rate:</span>
        {[1, 2, 5, 10].map(speed => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              playbackSpeed === speed
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-space-900 text-slate-400 border border-space-800 hover:text-slate-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
};

