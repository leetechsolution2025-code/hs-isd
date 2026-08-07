"use client";

import React, { useState } from 'react';
import ParametricModule from './ParametricModule';

interface CrossSectionDesignWorkspaceProps {
  computedSegments: any[];
  segmentHydraulicResults: Record<number, any>;
  flowNodes: any[];
  project: any;
  crossSectionParams: Record<number, any>;
  setCrossSectionParams: React.Dispatch<React.SetStateAction<Record<number, any>>>;
}

export default function CrossSectionDesignWorkspace({ 
  computedSegments, 
  segmentHydraulicResults, 
  flowNodes, 
  project,
  crossSectionParams,
  setCrossSectionParams
}: CrossSectionDesignWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'parametric' | 'terrain'>('parametric');

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={() => setActiveTab('parametric')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            activeTab === 'parametric' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="bi bi-bounding-box-circles mr-2"></i>
          1. Cấu tạo mặt cắt chi tiết
        </button>
        <button
          onClick={() => setActiveTab('terrain')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            activeTab === 'terrain' 
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
                <div className="text-center text-slate-400 z-10">
                  <i className="bi bi-map text-4xl mb-3 block opacity-20"></i>
                  <p>Module 2: Hình vẽ mặt cắt ngang và địa hình (Đang phát triển)</p>
                </div>
              </div>
            </div>

            {/* Right Sidebar (Settings) */}
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0">
              <div className="p-3 border-b border-slate-200 font-semibold text-sm text-slate-800 bg-slate-50">
                <span>Cấu hình khớp nối</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="text-sm text-slate-400 text-center italic mt-10">
                  Phần cấu hình sẽ được thiết kế chi tiết sau...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
