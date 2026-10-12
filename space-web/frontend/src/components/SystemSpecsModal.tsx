'use client';

import React from 'react';
import { Terminal, Satellite, Layers, Database, X, ShieldCheck, Activity } from 'lucide-react';

interface SystemSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemSpecsModal: React.FC<SystemSpecsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
      <div className="hud-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl p-6 bg-[#080E1E] border border-cyan-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-space-700 mb-5">
          <div className="p-2 rounded bg-cyan-950 border border-cyan-800">
            <Satellite className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              NASA Telemetry Pipeline & Architecture Specifications
            </h2>
            <p className="text-xs text-slate-400">
              Ground Station Engineering Standards / SMAP & MSL Mission Anomaly Detection
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-xs text-slate-300">
          {/* Section 1: Spacecraft Overview */}
          <div className="bg-space-900/60 p-4 rounded-lg border border-space-800">
            <h3 className="text-cyan-300 font-bold uppercase mb-2 flex items-center space-x-2">
              <Satellite className="w-4 h-4" />
              <span>1. Supported Spacecraft Platforms</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
              <div className="p-2.5 bg-space-950 rounded border border-space-800">
                <span className="font-bold text-slate-200 block mb-1">NASA SMAP (Soil Moisture Active Passive)</span>
                Polar Sun-synchronous orbit at 685 km altitude. Measures soil moisture through radiometric and radar telemetry channels. High susceptibility to power bus transients and solar array gimbal friction.
              </div>
              <div className="p-2.5 bg-space-950 rounded border border-space-800">
                <span className="font-bold text-slate-200 block mb-1">NASA MSL (Curiosity Rover)</span>
                Surface rover operations in Gale Crater, Mars. Powered by Multi-Mission Radioisotope Thermoelectric Generator (MMRTG). Critical channels include mobility rocker-bogie actuator torque and coolant heat pipe loops.
              </div>
            </div>
          </div>

          {/* Section 2: Mathematical Feature Engineering */}
          <div className="bg-space-900/60 p-4 rounded-lg border border-space-800">
            <h3 className="text-cyan-300 font-bold uppercase mb-2 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>2. 10-Dimensional Statistical Feature Extractor</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Each 100-sample sliding telemetry window is projected into 10 deterministic statistical moments:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">1. Mean (μ)</div>
                <div className="text-slate-500">Central Level</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">2. Std Dev (σ)</div>
                <div className="text-slate-500">Dispersion</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">3. Minimum</div>
                <div className="text-slate-500">Floor Level</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">4. Maximum</div>
                <div className="text-slate-500">Ceiling Level</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">5. Median</div>
                <div className="text-slate-500">50th Percentile</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">6. Range (Δ)</div>
                <div className="text-slate-500">Max - Min</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">7. IQR</div>
                <div className="text-slate-500">Q75 - Q25</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">8. RMS</div>
                <div className="text-slate-500">Signal Power</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">9. Slope (β)</div>
                <div className="text-slate-500">Linear Drift</div>
              </div>
              <div className="p-2 bg-space-950 rounded border border-space-800 text-center">
                <div className="text-cyan-400 font-bold">10. Abs Diff</div>
                <div className="text-slate-500">High-Freq Rate</div>
              </div>
            </div>
          </div>

          {/* Section 3: Detection Model & Calibration */}
          <div className="bg-space-900/60 p-4 rounded-lg border border-space-800">
            <h3 className="text-cyan-300 font-bold uppercase mb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Supervised Classification Pipeline</span>
            </h3>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-space-800/60 pb-1">
                <span>Model Architecture:</span>
                <span className="text-slate-200">XGBoost Gradient Boosting Classifier + Threshold Gate</span>
              </div>
              <div className="flex justify-between border-b border-space-800/60 pb-1">
                <span>Default Threshold (θ):</span>
                <span className="text-cyan-400">0.45 (Optimal F1 cross-validation balance)</span>
              </div>
              <div className="flex justify-between border-b border-space-800/60 pb-1">
                <span>Window Configuration:</span>
                <span className="text-slate-200">100 Samples Window, 5 Samples Stride (95% overlap)</span>
              </div>
              <div className="flex justify-between">
                <span>Deployment Target:</span>
                <span className="text-slate-200">FastAPI Telemetry Engine / Next.js Vercel Production</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-space-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

