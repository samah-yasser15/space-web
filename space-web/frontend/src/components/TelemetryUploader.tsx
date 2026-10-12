'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { TelemetryChannelData } from '../types';
import { generateClientTelemetryData } from '../lib/sampleTelemetry';

interface TelemetryUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onTelemetryLoaded: (data: TelemetryChannelData) => void;
}

export const TelemetryUploader: React.FC<TelemetryUploaderProps> = ({
  isOpen,
  onClose,
  onTelemetryLoaded
}) => {
  const [pasteText, setPasteText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>('Custom Stream #1');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        processRawText(text, file.name);
      } catch (err: any) {
        setError(`Failed to read file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const processRawText = (text: string, sourceName?: string) => {
    const lines = text.split(/[\r\n,]+/);
    const nums: number[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        nums.push(parsed);
      }
    }

    if (nums.length < 20) {
      setError('Telemetry stream must contain at least 20 numeric samples.');
      return;
    }

    // Generate custom telemetry structure
    const customData = generateClientTelemetryData(
      'CUSTOM',
      'C-STREAM',
      0.45,
      Math.min(100, Math.floor(nums.length / 2)),
      5,
      nums.length
    );

    // Overwrite with actual uploaded numeric values
    customData.values = nums;
    customData.meta = {
      id: 'CUSTOM',
      name: sourceName || channelName,
      subsystem: 'Custom Telemetry Stream Ingestion',
      unit: 'raw',
      nominal: 'Auto-Calibrated Envelope',
      nominal_min: Math.min(...nums),
      nominal_max: Math.max(...nums),
      anomaly_type: 'Ingested Telemetry Series',
      description: `User-provided telemetry series containing ${nums.length} samples.`
    };

    onTelemetryLoaded(customData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-mono">
      <div className="hud-card w-full max-w-lg rounded-xl p-5 sm:p-6 bg-[#090F20] border border-cyan-800/80 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 pb-3 border-b border-space-700/60 mb-4">
          <Upload className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Ingest Spacecraft Telemetry Stream
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px] uppercase">
              Telemetry Stream Tag
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full bg-space-900 border border-space-700 rounded p-2 text-slate-200 focus:border-cyan-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px] uppercase">
              Upload Telemetry File (.csv / .json)
            </label>
            <input
              type="file"
              accept=".csv,.txt,.json"
              onChange={handleFileUpload}
              className="w-full text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-space-800">
            <label className="block text-slate-400 mb-1 text-[11px] uppercase">
              Or Paste Comma / Newline Separated Values
            </label>
            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="28.1, 28.2, 28.1, 27.9, 28.0, 24.3, 22.1, 28.2..."
              className="w-full bg-space-900 border border-space-700 rounded p-2 text-slate-200 focus:border-cyan-400 outline-none font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => processRawText(pasteText, channelName)}
              disabled={!pasteText.trim()}
              className="px-4 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 font-bold disabled:opacity-40"
            >
              Run Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

