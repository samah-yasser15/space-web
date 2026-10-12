'use client';

import React from 'react';
import { AnomalySegment } from '../types';
import { ShieldAlert, Download, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';

interface IncidentsLogProps {
  segments: AnomalySegment[];
  onSelectInterval: (start: number) => void;
  channelName: string;
}

export const IncidentsLog: React.FC<IncidentsLogProps> = ({
  segments,
  onSelectInterval,
  channelName
}) => {
  const exportLog = () => {
    const jsonStr = JSON.stringify(
      {
        channel: channelName,
        export_time: new Date().toISOString(),
        incident_count: segments.length,
        incidents: segments
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_incidents_${channelName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hud-card rounded-xl p-4 sm:p-5 w-full font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-space-700/50">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Detected Anomaly Incidents Log ({segments.length})
          </h3>
        </div>
        <button
          onClick={exportLog}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-xs text-slate-300 hover:text-cyan-300 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Incident List */}
      <div className="mt-3 overflow-x-auto">
        {segments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active anomalies detected in the current telemetry window. System operating nominally.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-space-800 text-slate-500 text-[10px] uppercase">
                <th className="py-2 px-2">Incident ID</th>
                <th className="py-2 px-2">Interval [t_start - t_end]</th>
                <th className="py-2 px-2">Duration</th>
                <th className="py-2 px-2">Peak Score</th>
                <th className="py-2 px-2">Severity</th>
                <th className="py-2 px-2 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-800/60">
              {segments.map((seg, i) => {
                const id = `INC-${String(i + 1).padStart(3, '0')}`;
                return (
                  <tr key={i} className="hover:bg-space-900/50 transition-colors">
                    <td className="py-2 px-2 font-bold text-cyan-300">{id}</td>
                    <td className="py-2 px-2 text-slate-300">
                      [{seg.start} — {seg.end}]
                    </td>
                    <td className="py-2 px-2 text-slate-400">{seg.length} samples</td>
                    <td className="py-2 px-2 font-bold text-rose-400">
                      {(seg.peak_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          seg.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : seg.severity === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {seg.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => onSelectInterval(seg.start)}
                        className="inline-flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-200 transition-colors"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

