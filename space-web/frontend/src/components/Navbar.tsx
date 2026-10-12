'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Satellite, Activity, Clock, Database, Terminal, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  backendStatus: { isOnline: boolean; statusText: string };
  onOpenSpecs: () => void;
  onOpenUpload: () => void;
  activeMission: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendStatus,
  onOpenSpecs,
  onOpenUpload,
  activeMission
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-space-700/60 bg-[#070D1C]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Telemetry Station Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Satellite className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-slate-100 text-lg uppercase font-mono">
                space-web
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                v1.0.0-PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
              <span>AEROSPACE TELEMETRY MISSION CONTROL</span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-400">{activeMission}</span>
            </p>
          </div>
        </div>

        {/* Center: Live UTC Mission Clock & Link Health */}
        <div className="hidden md:flex items-center space-x-6 border-x border-space-700/40 px-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-500 tracking-wider">MISSION CLOCK (UTC)</div>
              <div className="text-xs text-slate-200 font-semibold">{utcTime || 'SYNCHRONIZING...'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-500 tracking-wider">DSN DOWNLINK</div>
              <div className="text-xs text-emerald-400 font-semibold">128.0 KBPS / LOCK</div>
            </div>
          </div>
        </div>

        {/* Right: Actions & System Node State */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSpecs}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-300 hover:text-cyan-300 bg-space-850/80 hover:bg-space-800 border border-space-700/70 transition-all"
            title="Inspect 25-Channel Telemetry Architecture & Algorithms"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry Specs</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 transition-all shadow-sm shadow-cyan-950/30"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ingest Stream</span>
          </button>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-space-700/50">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendStatus.isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300 hidden lg:inline">
              {backendStatus.statusText}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

