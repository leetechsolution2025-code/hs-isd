"use client";

import React, { useState, useRef } from 'react';
import ParametricModule from './ParametricModule';
import TerrainCrossSectionView from './TerrainCrossSectionView';
import { Upload } from 'lucide-react';

export interface CrossSectionPoint {
  offset: number;
  elevation: number;
}

export interface CrossSectionStake {
  name: string;
  chainage: number;
  centerOffset: number;
  centerElevation: number;
  datum?: number;
  points: CrossSectionPoint[];
}

const parseTerrainFile = (text: string): CrossSectionStake[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const stakes: CrossSectionStake[] = [];
  let currentStake: CrossSectionStake | null = null;

  for (const line of lines) {
    if (line.startsWith('MC')) {
      if (currentStake) stakes.push(currentStake);
      const parts = line.split(/\s+/);
      const name = parts[1] || '';
      const chainage = parseFloat(parts[2]) || 0;
      const datum = parseFloat(parts[3]) || undefined;
      const centerOffset = parseFloat(parts[4]) || 10.0;
      const centerElevation = parseFloat(parts[5]) || 0.0;
      currentStake = { name, chainage, centerOffset, centerElevation, datum, points: [] };
    } else if (currentStake) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const offset = parseFloat(parts[0]);
        const elevation = parseFloat(parts[1]);
        if (!isNaN(offset) && !isNaN(elevation)) {
          currentStake.points.push({ offset, elevation });
        }
      }
    }
  }
  if (currentStake) stakes.push(currentStake);
  return stakes;
};

interface CrossSectionDesignWorkspaceProps {
  computedSegments: any[];
  segmentHydraulicResults: Record<number, any>;
  flowNodes: any[];
  nodeElevations: any;
  project: any;
  crossSectionParams: Record<number, any>;
  setCrossSectionParams: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  terrainStakes: CrossSectionStake[];
  setTerrainStakes: React.Dispatch<React.SetStateAction<CrossSectionStake[]>>;
}

export default function CrossSectionDesignWorkspace({
  computedSegments,
  segmentHydraulicResults,
  flowNodes,
  nodeElevations,
  project,
  crossSectionParams,
  setCrossSectionParams,
  terrainStakes,
  setTerrainStakes
}: CrossSectionDesignWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'parametric' | 'terrain'>('parametric');
  const [selectedStakeIdx, setSelectedStakeIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseTerrainFile(text);
      if (parsed.length > 0) {
        setTerrainStakes(parsed);
        setSelectedStakeIdx(0);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={() => setActiveTab('parametric')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${activeTab === 'parametric'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
          <i className="bi bi-bounding-box-circles mr-2"></i>
          1. Cấu tạo mặt cắt chi tiết
        </button>
        <button
          onClick={() => setActiveTab('terrain')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${activeTab === 'terrain'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
          <i className="bi bi-mountain mr-2"></i>
          2. Khớp nối địa hình & Khối lượng
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden h-full flex flex-col">
        {activeTab === 'parametric' && (
          <ParametricModule
            computedSegments={computedSegments}
            segmentHydraulicResults={segmentHydraulicResults}
            flowNodes={flowNodes}
            project={project}
            crossSectionParams={crossSectionParams}
            setCrossSectionParams={setCrossSectionParams}
          />
        )}

        {activeTab === 'terrain' && (
          <div className="flex w-full h-full bg-slate-50">
            {/* Main View */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg relative overflow-hidden flex items-center justify-center">
                <svg width="100%" height="100%" className="absolute inset-0 z-0">
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
                {terrainStakes.length === 0 ? (
                  <div className="text-center text-slate-400 z-10">
                    <i className="bi bi-map text-4xl mb-3 block opacity-20"></i>
                    <p>Chưa có dữ liệu địa hình mặt cắt ngang</p>
                    <p className="text-xs mt-1">Vui lòng tải lên file (.txt) ở menu bên phải</p>
                  </div>
                ) : (
                  <TerrainCrossSectionView
                    stake={terrainStakes[selectedStakeIdx]}
                    computedSegments={computedSegments}
                    segmentHydraulicResults={segmentHydraulicResults}
                    flowNodes={flowNodes}
                    nodeElevations={nodeElevations}
                    crossSectionParams={crossSectionParams}
                  />
                )}
              </div>
            </div>

            {/* Right Sidebar (Settings) */}
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0">
              <div className="p-3 border-b border-slate-200 font-semibold text-sm text-slate-800 bg-slate-50">
                <span>Cấu hình khớp nối</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">

                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Dữ liệu cọc địa hình</h4>

                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 py-2 rounded text-sm font-medium transition-colors"
                  >
                    <Upload size={16} />
                    Tải lên file dữ liệu (.txt)
                  </button>

                  {terrainStakes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-[12px] text-slate-500">Đã tải: {terrainStakes.length} cọc</label>
                      <select
                        value={selectedStakeIdx}
                        onChange={(e) => setSelectedStakeIdx(Number(e.target.value))}
                        className="w-full bg-slate-100 border border-slate-300 text-slate-700 text-[13px] rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold cursor-pointer"
                      >
                        {terrainStakes.map((stake, idx) => (
                          <option key={idx} value={idx}>
                            Cọc {stake.name} (Lý trình: {stake.chainage.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
