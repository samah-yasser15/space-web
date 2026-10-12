'use client';

import React from 'react';
import { MissionMeta, ChannelMeta } from '../types';
import { Orbit, Activity, ShieldCheck, Compass, Zap } from 'lucide-react';

interface MissionSelectorProps {
  missions: MissionMeta[];
  selectedMissionId: string;
  selectedChannelId: string;
  onSelectMission: (missionId: string) => void;
  onSelectChannel: (channelId: string) => void;
  channelMeta?: ChannelMeta;
}

export const MissionSelector: React.FC<MissionSelectorProps> = ({
  missions,
  selectedMissionId,
  selectedChannelId,
  onSelectMission,
  onSelectChannel,
  channelMeta
}) => {
  const currentMission = missions.find(m => m.id === selectedMissionId) || missions[0];

  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full">
      {/* Top row: Mission selection buttons and orbit badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-space-700/50">
        <div>
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
            <Orbit className="w-3.5 h-3.5" />
            <span>Target Spacecraft Platform</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missions.map(mission => {
              const isSelected = mission.id === selectedMissionId;
              return (
                <button
                  key={mission.id}
                  onClick={() => onSelectMission(mission.id)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/60'
                      : 'bg-space-850/70 border border-space-700 text-slate-400 hover:text-slate-200 hover:border-space-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  <span>{mission.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacecraft details badge */}
        <div className="bg-space-900/80 border border-space-700/70 rounded-lg p-2.5 px-3.5 text-right font-mono text-xs hidden sm:block">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider">Mission Orbit / Deployment</div>
          <div className="text-cyan-300 font-medium truncate max-w-xs">{currentMission.orbit}</div>
        </div>
      </div>

      {/* Channel selector row */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetry Bus Channels ({currentMission.channels.length} Available)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Sampling: 1 Hz Standard Packet
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {currentMission.channels.map(channel => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`p-3 rounded-lg text-left transition-all border font-mono ${
                  isSelected
                    ? 'bg-space-800/90 border-cyan-400/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                    : 'bg-space-900/60 border-space-700/60 hover:border-space-600 hover:bg-space-850/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-space-800 text-slate-400'}`}>
                    {channel.id}
                  </span>
                  <span className="text-[10px] text-slate-400">[{channel.unit}]</span>
                </div>
                <div className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {channel.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  {channel.subsystem}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current channel meta summary */}
        {channelMeta && (
          <div className="mt-4 p-3 bg-space-950/60 border border-space-800 rounded-lg flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Subsystem:</span>
              <span className="text-slate-200">{channelMeta.subsystem}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Nominal Operating Range:</span>
              <span className="text-emerald-400 font-semibold">{channelMeta.nominal}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Known Signature:</span>
              <span className="text-amber-400">{channelMeta.anomaly_type || 'Unspecified'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

