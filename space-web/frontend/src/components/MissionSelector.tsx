'use client';

import React from 'react';
import { MissionMeta, ChannelMeta } from '../types';

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
    <div className="clean-card p-4 sm:p-5">
      {/* Mobile mission switcher (shown only on small screens) */}
      <div className="flex sm:hidden items-center bg-slate-100 p-1 rounded-xl mb-4">
        {missions.map(m => (
          <button
            key={m.id}
            onClick={() => onSelectMission(m.id)}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
              selectedMissionId === m.id
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Select Telemetry Channel
          </h2>
          <p className="text-xs text-slate-500">
            Choose a spacecraft sensor stream to analyze for anomalies
          </p>
        </div>

        {channelMeta && (
          <div className="inline-flex items-center space-x-2 text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-400">Normal Range:</span>
            <span className="font-semibold text-emerald-700">{channelMeta.nominal}</span>
          </div>
        )}
      </div>

      {/* Clean channel button cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {currentMission.channels.map(channel => {
          const isSelected = channel.id === selectedChannelId;
          return (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`p-3.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-500 text-blue-950 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {channel.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">[{channel.unit}]</span>
              </div>
              <div className="text-sm font-semibold truncate mt-1">
                {channel.name}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {channel.subsystem}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
