'use client';

import React from 'react';
import { Activity, Upload, CheckCircle2, Sliders } from 'lucide-react';

interface NavbarProps {
  backendStatus: { isOnline: boolean; statusText: string };
  onOpenUpload: () => void;
  activeMission: string;
  onSelectMission: (missionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendStatus,
  onOpenUpload,
  activeMission,
  onSelectMission,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 text-base tracking-tight">
                SpaceWeb
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Spacecraft Telemetry Anomaly Detection
            </p>
          </div>
        </div>

        {/* Center: Simple Mission Switcher Pills */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onSelectMission('SMAP')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMission === 'SMAP'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NASA SMAP (Satellite)
          </button>
          <button
            onClick={() => onSelectMission('MSL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMission === 'MSL'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NASA MSL (Curiosity Rover)
          </button>
        </div>

        {/* Right: Upload & Status */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Data</span>
          </button>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus.isOnline ? 'bg-emerald-500' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Ready
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
