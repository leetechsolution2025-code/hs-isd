"use client";

import React, { useState, useRef } from 'react';
import ParametricModule from './ParametricModule';
import TerrainCrossSectionView from './TerrainCrossSectionView';
import { Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import ExportSettingsOffcanvas, { ExportSettings } from '../ExportSettingsOffcanvas';
import { unicodeToTCVN3 } from '@/lib/tcvn3';
import { calculateCrossSectionGeometry } from '@/lib/crossSectionGeometry';

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
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showCanal, setShowCanal] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find which segment the selected stake belongs to
  let selectedSegmentIdx = 0;
  if (terrainStakes && terrainStakes.length > 0 && computedSegments && computedSegments.length > 0) {
    const selectedStake = terrainStakes[selectedStakeIdx];
    if (selectedStake) {
      const stakeChainage = selectedStake.chainage;
      for (let i = 0; i < computedSegments.length; i++) {
        const seg = computedSegments[i];
        const startNode = flowNodes ? flowNodes[seg.startIdx] : null;
        const endNode = seg.endIdx !== null && flowNodes ? flowNodes[seg.endIdx] : (flowNodes ? flowNodes[flowNodes.length - 1] : null);
        const startC = startNode?.chainage || 0;
        const endC = endNode?.chainage || Infinity;
        if (stakeChainage >= startC && stakeChainage <= endC) {
          selectedSegmentIdx = i;
          break;
        }
      }
    }
  }

  const handleParamChange = (key: string, val: any, isNumeric = false) => {
    const updated = {
      ...crossSectionParams,
      [selectedSegmentIdx]: {
        ...(crossSectionParams[selectedSegmentIdx] || {}),
        [key]: isNumeric ? parseFloat(val) : val
      }
    };
    setCrossSectionParams(updated);
  };

  const segParams = crossSectionParams?.[selectedSegmentIdx] || {};
  const bankCutOption = segParams.bankCutOption || 'dap_bo';
  const coRanhThoatNuocMai = segParams.coRanhThoatNuocMai || false;

  // Call geometry helper for the selected stake to know isLeftCut/isRightCut
  let isLeftCut = false;
  let isRightCut = false;
  if (terrainStakes && terrainStakes[selectedStakeIdx]) {
    const selectedStake = terrainStakes[selectedStakeIdx];
    try {
      const geom = calculateCrossSectionGeometry(
        selectedStake,
        computedSegments,
        segmentHydraulicResults,
        flowNodes,
        nodeElevations,
        crossSectionParams
      );
      isLeftCut = geom.isLeftCut;
      isRightCut = geom.isRightCut;
    } catch (e) {
      // Fallback if geometry calc fails
    }
  }
  const hasCutSide = isLeftCut || isRightCut;

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
                    showOverlay={showOverlay}
                    showCanal={showCanal}
                    showPoints={showPoints}
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

                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 py-2 rounded text-sm font-medium transition-colors mt-2"
                  >
                    <Download size={16} />
                    Xuất bản vẽ
                  </button>

                  {terrainStakes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-[12px] text-slate-500">Đã tải: {terrainStakes.length} cọc</label>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedStakeIdx(prev => Math.max(0, prev - 1))}
                          disabled={selectedStakeIdx === 0}
                          className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <select
                          value={selectedStakeIdx}
                          onChange={(e) => setSelectedStakeIdx(Number(e.target.value))}
                          className="flex-1 bg-slate-100 border border-slate-300 text-slate-700 text-[13px] rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold cursor-pointer min-w-0"
                        >
                          {terrainStakes.map((stake, idx) => (
                            <option key={idx} value={idx}>
                              Cọc {stake.name} (Lý trình: {stake.chainage.toFixed(2)})
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setSelectedStakeIdx(prev => Math.min(terrainStakes.length - 1, prev + 1))}
                          disabled={selectedStakeIdx === terrainStakes.length - 1}
                          className="p-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Tùy chọn hiển thị</h4>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium text-slate-700">Hiển thị vùng màu (Đất đắp)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showOverlay}
                        onChange={(e) => setShowOverlay(e.target.checked)}
                      />
                      <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium text-slate-700">Hiển thị mặt cắt kênh</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showCanal}
                        onChange={(e) => setShowCanal(e.target.checked)}
                      />
                      <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium text-slate-700">Hiển thị điểm</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showPoints}
                        onChange={(e) => setShowPoints(e.target.checked)}
                      />
                      <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className={`text-[12px] font-bold uppercase tracking-wider ${!hasCutSide ? 'text-slate-300' : 'text-slate-400'}`}>
                    Cấu hình mái dốc & Rãnh biên
                  </h4>
                  
                  <div className="space-y-1">
                    <span className={`text-xs font-medium ${!hasCutSide ? 'text-slate-400' : 'text-slate-600'}`}>Mái dốc bên Đào</span>
                    <select
                      disabled={!hasCutSide}
                      value={bankCutOption}
                      onChange={(e) => handleParamChange('bankCutOption', e.target.value)}
                      className={`w-full text-xs border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500 bg-white ${
                        !hasCutSide ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
                      }`}
                    >
                      <option value="dap_bo">Đắp bờ dốc xuống (mặc định)</option>
                      <option value="mo_rong_bo">Mở rộng thềm bờ nằm ngang</option>
                    </select>
                  </div>

                  {bankCutOption === 'mo_rong_bo' && (
                    <div className="flex items-center justify-between py-1">
                      <span className={`text-xs font-medium ${!hasCutSide ? 'text-slate-400' : 'text-slate-700'}`}>
                        Có rãnh thoát nước mái (rãnh biên)
                      </span>
                      <label className={`relative inline-flex items-center ${!hasCutSide ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!hasCutSide}
                          className="sr-only peer"
                          checked={coRanhThoatNuocMai}
                          onChange={(e) => handleParamChange('coRanhThoatNuocMai', e.target.checked)}
                        />
                        <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )}

                  {!hasCutSide && (
                    <div className="text-[11px] text-slate-400 mt-1 italic leading-snug">
                      *(Chỉ khả dụng đối với mặt cắt có bờ bên Đào)
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      <ExportSettingsOffcanvas
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultSettings={{ horizontalScale: 100, verticalScale: 100 }}
        onExportLISP={(settings) => {
          const stakesToExport = terrainStakes.length > 0 ? terrainStakes : [];
          const { horizontalScale = 1000, verticalScale = 100 } = settings;
          
          let scr = `;;========================================================================\n`;
          scr += `(command)\n`;
          scr += `(setvar "FILEDIA" 0)\n`;
          scr += `(setvar "OSMODE" 0)\n`;
          scr += `(setvar "LTSCALE" 5)\n`;
          scr += `;; AUTOCAD SCRIPT TO DRAW DRAWING BORDERS, DATUM LINES AND RULER\n`;
          scr += `;;========================================================================\n`;
          scr += `(defun createlay (lay col ltp)\n`;
          scr += `  (if (not (tblsearch "LAYER" lay))\n`;
          scr += `    (entmake\n`;
          scr += `      (list\n`;
          scr += `        '(0 . "LAYER")\n`;
          scr += `        '(100 . "AcDbSymbolTableRecord")\n`;
          scr += `        '(100 . "AcDbLayerTableRecord")\n`;
          scr += `        (cons 2 lay)\n`;
          scr += `        '(70 . 0)\n`;
          scr += `        (cons 62 col)\n`;
          scr += `        (cons 6 "Continuous")\n`;
          scr += `      )\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(createlay "KhungBao" 1 "Continuous")\n`;
          scr += `(createlay "KhungBang" 7 "Continuous")\n`;
          scr += `(createlay "TextBang" 7 "Continuous")\n`;
          scr += `(if (not (tblsearch "LTYPE" "HIDDEN"))\n`;
          scr += `  (entmake\n`;
          scr += `    '(\n`;
          scr += `      (0 . "LTYPE")\n`;
          scr += `      (100 . "AcDbSymbolTableRecord")\n`;
          scr += `      (100 . "AcDbLinetypeTableRecord")\n`;
          scr += `      (2 . "HIDDEN")\n`;
          scr += `      (70 . 0)\n`;
          scr += `      (3 . "Hidden")\n`;
          scr += `      (72 . 65)\n`;
          scr += `      (73 . 2)\n`;
          scr += `      (40 . 0.375)\n`;
          scr += `      (49 . 0.25)\n`;
          scr += `      (74 . 0)\n`;
          scr += `      (49 . -0.125)\n`;
          scr += `      (74 . 0)\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(createlay "TuNhien" 8 "Continuous")\n(createlay "TimKenh" 2 "Continuous")\n(createlay "MucNuoc" 5 "Continuous")\n(createlay "MatKenh_BeTong" 3 "Continuous")\n(createlay "BeTongLot" 1 "Continuous")\n(createlay "MaiDap" 2 "Continuous")\n(createlay "MaiDao" 6 "Continuous")\n(createlay "RanhThoatNuoc" 4 "Continuous")\n`;
          scr += `(if (not (tblsearch "STYLE" "VnTimeH"))\n`;
          scr += `  (entmake\n`;
          scr += `    '(\n`;
          scr += `      (0 . "STYLE")\n`;
          scr += `      (100 . "AcDbSymbolTableRecord")\n`;
          scr += `      (100 . "AcDbTextStyleTableRecord")\n`;
          scr += `      (2 . "VnTimeH")\n`;
          scr += `      (70 . 0)\n`;
          scr += `      (40 . 0.0)\n`;
          scr += `      (41 . 1.0)\n`;
          scr += `      (50 . 0.0)\n`;
          scr += `      (71 . 0)\n`;
          scr += `      (42 . 2.5)\n`;
          scr += `      (3 . "vntimeh.shx")\n`;
          scr += `      (4 . "")\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(if (not (tblsearch "STYLE" "VNArialH"))\n`;
          scr += `  (entmake\n`;
          scr += `    '(\n`;
          scr += `      (0 . "STYLE")\n`;
          scr += `      (100 . "AcDbSymbolTableRecord")\n`;
          scr += `      (100 . "AcDbTextStyleTableRecord")\n`;
          scr += `      (2 . "VNArialH")\n`;
          scr += `      (70 . 0)\n`;
          scr += `      (40 . 0.0)\n`;
          scr += `      (41 . 1.0)\n`;
          scr += `      (50 . 0.0)\n`;
          scr += `      (71 . 0)\n`;
          scr += `      (42 . 3.0)\n`;
          scr += `      (3 . ".VnArialH")\n`;
          scr += `      (4 . "")\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(createlay "TextTitle" 4 "Continuous")\n`;
          scr += `(defun to3d (p)\n`;
          scr += `  (list (car p) (cadr p) (if (caddr p) (caddr p) 0.0))\n`;
          scr += `)\n`;
          scr += `(defun drawpoly (pts lay col cls ltp)\n`;
          scr += `  (setvar "CLAYER" lay)\n`;
          scr += `  (setvar "CECOLOR" (itoa col))\n`;
          scr += `  (setvar "CELTYPE"\n`;
          scr += `    (if (or (= (strcase ltp) "BYLAYER") (= (strcase ltp) "BYBLOCK") (tblsearch "LTYPE" ltp))\n`;
          scr += `      (strcase ltp)\n`;
          scr += `      "BYLAYER"\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `  (command "_.PLINE")\n`;
          scr += `  (foreach pt pts (command pt))\n`;
          scr += `  (if (= cls 1) (command "c") (command ""))\n`;
          scr += `)\n`;
          scr += `(defun drawline (p1 p2 lay col ltp)\n`;
          scr += `  (setvar "CLAYER" lay)\n`;
          scr += `  (setvar "CECOLOR" (itoa col))\n`;
          scr += `  (setvar "CELTYPE"\n`;
          scr += `    (if (or (= (strcase ltp) "BYLAYER") (= (strcase ltp) "BYBLOCK") (tblsearch "LTYPE" ltp))\n`;
          scr += `      (strcase ltp)\n`;
          scr += `      "BYLAYER"\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `  (command "_.LINE" p1 p2 "")\n`;
          scr += `)\n`;
          scr += `(defun drawtext (pt txt h rot lay sty col)\n`;
          scr += `  (entmake\n`;
          scr += `    (list\n`;
          scr += `      '(0 . "TEXT")\n`;
          scr += `      '(100 . "AcDbEntity")\n`;
          scr += `      (cons 8 lay)\n`;
          scr += `      (cons 62 col)\n`;
          scr += `      '(100 . "AcDbText")\n`;
          scr += `      (cons 10 (to3d pt))\n`;
          scr += `      (cons 40 h)\n`;
          scr += `      (cons 1 txt)\n`;
          scr += `      (cons 50 (* rot (/ pi 180.0)))\n`;
          scr += `      (cons 7 (if (tblsearch "STYLE" sty) sty "Standard"))\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(defun drawtextcenter (pt txt h rot lay sty col)\n`;
          scr += `  (entmake\n`;
          scr += `    (list\n`;
          scr += `      '(0 . "TEXT")\n`;
          scr += `      '(100 . "AcDbEntity")\n`;
          scr += `      (cons 8 lay)\n`;
          scr += `      (cons 62 col)\n`;
          scr += `      '(100 . "AcDbText")\n`;
          scr += `      (cons 10 (to3d pt))\n`;
          scr += `      (cons 40 h)\n`;
          scr += `      (cons 1 txt)\n`;
          scr += `      (cons 50 (* rot (/ pi 180.0)))\n`;
          scr += `      (cons 7 (if (tblsearch "STYLE" sty) sty "Standard"))\n`;
          scr += `      '(72 . 1)\n`;
          scr += `      '(73 . 2)\n`;
          scr += `      (cons 11 (to3d pt))\n`;
          scr += `    )\n`;
          scr += `  )\n`;
          scr += `)\n`;
          scr += `(defun drawsolid (p1 p2 p3 p4 lay col)\n`;
          scr += `  (setvar "CLAYER" lay)\n`;
          scr += `  (setvar "CECOLOR" (itoa col))\n`;
          scr += `  (setvar "CELTYPE" "Continuous")\n`;
          scr += `  (command "_.SOLID" p1 p2 p3 p4 "")\n`;
          scr += `)\n`;

          interface SheetStake {
            stake: CrossSectionStake;
            idxInSheet: number;
            heights: {
              H_profile: number;
              H_total: number;
              gDatum: number;
            };
          }
          interface SheetLayout {
            sheetIdx: number;
            stakes: SheetStake[];
            totalHeightOccupied: number;
          }

          const sheets: SheetLayout[] = [];
          let currentSheet: SheetLayout = { sheetIdx: 0, stakes: [], totalHeightOccupied: 0 };

          stakesToExport.forEach((stake) => {
            const pts = stake.points && stake.points.length > 0 ? stake.points : [{ offset: 0.0, elevation: 0.0 }];
            const minTerrainY = Math.min(...pts.map(p => p.elevation));
            const maxTerrainY = Math.max(...pts.map(p => p.elevation));
            
            const geom = calculateCrossSectionGeometry(
              stake,
              computedSegments,
              segmentHydraulicResults,
              flowNodes,
              nodeElevations,
              crossSectionParams
            );
            const gDatum = isNaN(geom.stakeDatum) ? Math.floor(minTerrainY) - 2.0 : geom.stakeDatum;
            const yRulerMax = maxTerrainY + 2.0;
            const H_profile = (yRulerMax - gDatum) * (1000 / verticalScale);
            const H_total = H_profile + 12.0; // profile height + 12mm table
            
            const stakeInfo: SheetStake = {
              stake,
              idxInSheet: 0,
              heights: { H_profile, H_total, gDatum }
            };

            if (currentSheet.stakes.length === 0) {
              stakeInfo.idxInSheet = 0;
              currentSheet.stakes.push(stakeInfo);
              currentSheet.totalHeightOccupied = H_total;
            } else {
              const H1 = currentSheet.stakes[0].heights.H_total;
              const H2 = H_total;
              // If combined height of both cross sections exceeds 250mm, start a new sheet
              if (H1 + H2 <= 250.0) {
                stakeInfo.idxInSheet = 1;
                currentSheet.stakes.push(stakeInfo);
                currentSheet.totalHeightOccupied += H_total;
                sheets.push(currentSheet);
                currentSheet = { sheetIdx: sheets.length, stakes: [], totalHeightOccupied: 0 };
              } else {
                sheets.push(currentSheet);
                currentSheet = { sheetIdx: sheets.length, stakes: [], totalHeightOccupied: 0 };
                
                stakeInfo.idxInSheet = 0;
                currentSheet.stakes.push(stakeInfo);
                currentSheet.totalHeightOccupied = H_total;
              }
            }
          });

          if (currentSheet.stakes.length > 0) {
            sheets.push(currentSheet);
          }

          const totalSheets = sheets.length;
          for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
            const rowIdx = Math.floor(sheetIdx / 50);
            const colIdx = sheetIdx % 50;
            const sheetX = colIdx * 385.0;
            const sheetY = -rowIdx * 327.0;
            scr += `(drawpoly (list (list ${sheetX} ${sheetY}) (list ${sheetX + 385.0} ${sheetY}) (list ${sheetX + 385.0} ${sheetY + 277.0}) (list ${sheetX} ${sheetY + 277.0})) "KhungBao" 1 1 "BYLAYER")\n`;
          }
          scr += "ZOOM\nE\n";

          sheets.forEach((sheet) => {
            const sheetIdx = sheet.sheetIdx;
            const rowIdx = Math.floor(sheetIdx / 50);
            const colIdx = sheetIdx % 50;
            const Y_offset = -rowIdx * 327.0;

            const hasSecond = sheet.stakes.length === 2;
            const H1 = sheet.stakes[0].heights.H_total;
            const H2 = hasSecond ? sheet.stakes[1].heights.H_total : 0;
            
            let gap = 0;
            if (hasSecond) {
              gap = (277.0 - H1 - H2) / 3;
            } else {
              gap = (277.0 - H1) / 2;
            }

            sheet.stakes.forEach((stakeItem) => {
              const stake = stakeItem.stake;
              const idxInSheet = stakeItem.idxInSheet;
              const { H_profile, H_total, gDatum } = stakeItem.heights;

              const geom = calculateCrossSectionGeometry(
                stake,
                computedSegments,
                segmentHydraulicResults,
                flowNodes,
                nodeElevations,
                crossSectionParams
              );

              let Y_datum = 0;
              if (hasSecond) {
                if (idxInSheet === 0) {
                  Y_datum = Y_offset + (2 * gap + H2 + 12.0);
                } else {
                  Y_datum = Y_offset + (gap + 12.0);
                }
              } else {
                Y_datum = Y_offset + (gap + 12.0);
              }

              const pts = stake.points && stake.points.length > 0 ? stake.points : [{ offset: 0.0, elevation: 0.0 }];
              const minOff = Math.min(...pts.map(p => p.offset));
              const maxOff = Math.max(...pts.map(p => p.offset));

              const scaleFactor = 1000 / horizontalScale;
              const leftBound = minOff - 3.5;
              const rightBound = maxOff;
              const centerM = (leftBound + rightBound) / 2;
              const X0 = colIdx * 385.0 + 192.5 - centerM * scaleFactor;

              const mapX = (off: number) => {
                const val = X0 + (isNaN(off) ? 0 : off) * (1000 / horizontalScale);
                return Number((isNaN(val) ? X0 : val).toFixed(3));
              };

              const mapY = (elev: number) => {
                const val = Y_datum + (elev - gDatum) * (1000 / verticalScale);
                return Number((isNaN(val) ? Y_datum : val).toFixed(3));
              };

              const makeLispList = (points: { x: number; y: number }[]) => {
                let res = `  (list\n`;
                points.forEach(p => {
                  res += `    (list ${mapX(p.x)} ${mapY(p.y)})\n`;
                });
                res += `  )`;
                return res;
              };

              const makeLispListFromPts = (points: { offset: number; elevation: number }[]) => {
                let res = `  (list\n`;
                points.forEach(p => {
                  res += `    (list ${mapX(p.offset)} ${mapY(p.elevation)})\n`;
                });
                res += `  )`;
                return res;
              };

              const minTerrainY = Math.min(...pts.map(p => p.elevation));
              const maxTerrainY = Math.max(...pts.map(p => p.elevation));

              // Draw Datum Line (White/Color 7)
              scr += `(drawline (list ${mapX(minOff - 3.5)} ${Y_datum}) (list ${mapX(maxOff)} ${Y_datum}) "KhungBang" 7 "BYLAYER")\n`;

              // Draw Datum Label ("MỨC SO SÁNH: [gDatum]")
              scr += `(drawtext (list ${mapX(minOff - 3.2)} ${Y_datum + 0.5}) "${unicodeToTCVN3(`MỨC SO SÁNH: ${gDatum.toFixed(2)}`)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;

              // Draw Elevation Ruler (aligned at X_ruler = minOff)
              const X_ruler = minOff;
              const w = 0.2;
              const yRulerMax = maxTerrainY + 2.0;

              scr += `(drawline (list ${mapX(X_ruler - w)} ${mapY(gDatum)}) (list ${mapX(X_ruler - w)} ${mapY(yRulerMax)}) "KhungBang" 7 "BYLAYER")\n`;
              scr += `(drawline (list ${mapX(X_ruler)} ${mapY(gDatum)}) (list ${mapX(X_ruler)} ${mapY(yRulerMax)}) "KhungBang" 7 "BYLAYER")\n`;

              for (let yElev = Math.floor(gDatum); yElev <= Math.ceil(yRulerMax); yElev += 1.0) {
                if (yElev < gDatum - 0.01) continue;
                scr += `(drawline (list ${mapX(X_ruler - w)} ${mapY(yElev)}) (list ${mapX(X_ruler)} ${mapY(yElev)}) "KhungBang" 7 "BYLAYER")\n`;
                scr += `(drawline (list ${mapX(X_ruler - w)} ${mapY(yElev)}) (list ${mapX(X_ruler - w - 0.3)} ${mapY(yElev)}) "KhungBang" 7 "BYLAYER")\n`;
                
                if (Math.abs(yElev - gDatum) > 0.01) {
                  scr += `(drawtext (list ${mapX(X_ruler - w - 1.4)} ${mapY(yElev - 0.2)}) "${yElev.toFixed(2)}" 1.6 0 "TextBang" "VnTimeH" 7)\n`;
                }

                if (yElev < Math.ceil(yRulerMax) && (yElev - Math.floor(gDatum)) % 2 === 0) {
                  scr += `(drawsolid (list ${mapX(X_ruler - w)} ${mapY(yElev)}) (list ${mapX(X_ruler)} ${mapY(yElev)}) (list ${mapX(X_ruler - w)} ${mapY(yElev + 1.0)}) (list ${mapX(X_ruler)} ${mapY(yElev + 1.0)}) "KhungBang" 7)\n`;
                }
              }

              // Draw Table Grid Frame below Datum Line (2 rows: CAO DO TU NHIEN, KHOANG CACH LE)
              const yRow0 = Y_datum;
              const yRow1 = Y_datum - 6.0;
              const yRow2 = Y_datum - 12.0;

              scr += `(drawline (list ${mapX(minOff - 3.5)} ${yRow1}) (list ${mapX(maxOff)} ${yRow1}) "KhungBang" 7 "BYLAYER")\n`;
              scr += `(drawline (list ${mapX(minOff - 3.5)} ${yRow2}) (list ${mapX(maxOff)} ${yRow2}) "KhungBang" 7 "BYLAYER")\n`;
              scr += `(drawline (list ${mapX(minOff - 3.5)} ${yRow0}) (list ${mapX(minOff - 3.5)} ${yRow2}) "KhungBang" 7 "BYLAYER")\n`;
              scr += `(drawline (list ${mapX(minOff)} ${yRow0}) (list ${mapX(minOff)} ${yRow2}) "KhungBang" 7 "BYLAYER")\n`;
              scr += `(drawline (list ${mapX(maxOff)} ${yRow0}) (list ${mapX(maxOff)} ${yRow2}) "KhungBang" 7 "BYLAYER")\n`;

              // Row Title Texts inside the header box
              scr += `(drawtext (list ${mapX(minOff - 3.2)} ${yRow1 + 2.2}) "${unicodeToTCVN3("CAO ĐỘ TỰ NHIÊN (M)")}" 1.6 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${mapX(minOff - 3.2)} ${yRow2 + 2.2}) "${unicodeToTCVN3("KHOẢNG CÁCH LẺ (M)")}" 1.6 0 "TextBang" "VnTimeH" 7)\n`;

              // Draw vertical column dividers inside the table grid and fill elevation & distance values
              if (pts && pts.length > 0) {
                pts.forEach((p, pIdx) => {
                  // Draw vertical projection line from terrain point to datum line (using color 8)
                  scr += `(drawline (list ${mapX(p.offset)} ${mapY(p.elevation)}) (list ${mapX(p.offset)} ${Y_datum}) "KhungBang" 8 "BYLAYER")\n`;

                  // Draw vertical divider in Row 2 (Khoảng cách lẻ) only (skip if last point), using white (color 7)
                  if (p.offset < maxOff - 0.01) {
                    scr += `(drawline (list ${mapX(p.offset)} ${yRow1}) (list ${mapX(p.offset)} ${yRow2}) "KhungBang" 7 "BYLAYER")\n`;
                  }
                  
                  // Draw elevation text (vertical, rounded to 2 decimals, center-aligned on the divider)
                  scr += `(drawtextcenter (list ${mapX(p.offset)} ${Y_datum - 3.0}) "${p.elevation.toFixed(2)}" 1.5 90 "TextBang" "VnTimeH" 7)\n`;

                  // Draw distance text (horizontal, rounded to 2 decimals, center-aligned in the middle of segment)
                  if (pIdx > 0) {
                    const prevOffset = pts[pIdx - 1].offset;
                    const dx = p.offset - prevOffset;
                    const midOffset = (p.offset + prevOffset) / 2;
                    scr += `(drawtextcenter (list ${mapX(midOffset)} ${Y_datum - 9.0}) "${dx.toFixed(2)}" 1.5 0 "TextBang" "VnTimeH" 7)\n`;
                  }
                });
              }

              // Draw split Terrain Line (solid left/right in red, dashed hidden in middle)
              const getTerrainElev = (x: number) => {
                if (!pts || pts.length === 0) return 0;
                if (x <= pts[0].offset) return pts[0].elevation;
                if (x >= pts[pts.length - 1].offset) return pts[pts.length - 1].elevation;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  if (x >= p1.offset && x <= p2.offset) {
                    const t = (x - p1.offset) / (p2.offset - p1.offset);
                    return p1.elevation + t * (p2.elevation - p1.elevation);
                  }
                }
                return pts[0].elevation;
              };

               const hasLeftSolidTerrainFill = Boolean(
                 geom.point5 && geom.point5_terrain && Math.abs(geom.point5.x - geom.point5_terrain.x) < 0.01 && (!geom.intersectA || geom.point5.x < geom.intersectA.x)
               );

               const hasRightSolidTerrainFill = Boolean(
                 geom.point6 && geom.point6_terrain && Math.abs(geom.point6.x - geom.point6_terrain.x) < 0.01 && (!geom.intersectB || geom.point6.x > geom.intersectB.x)
               );

               const leftCutX = (hasLeftSolidTerrainFill && geom.point5_terrain)
                 ? geom.point5_terrain.x
                 : (geom.intersectA ? geom.intersectA.x : (geom.point5 ? geom.point5.x : null));

               const rightCutX = (hasRightSolidTerrainFill && geom.point6_terrain)
                 ? geom.point6_terrain.x
                 : (geom.intersectB ? geom.intersectB.x : (geom.point6 ? geom.point6.x : null));

              if (leftCutX !== null && rightCutX !== null && leftCutX < rightCutX) {
                const leftCutElev = getTerrainElev(leftCutX);
                const rightCutElev = getTerrainElev(rightCutX);

                // Left Segment (Solid, color 1 / Red)
                const leftPts = pts.filter(p => p.offset < leftCutX);
                leftPts.push({ offset: leftCutX, elevation: leftCutElev });
                if (leftPts.length > 1) {
                  scr += `(drawpoly\n${makeLispListFromPts(leftPts)}\n  "TuNhien" 1 0 "BYLAYER"\n)\n`;
                }

                // Middle Segment (Dashed, color 8 / Gray, hidden linetype)
                const midPts = [];
                midPts.push({ offset: leftCutX, elevation: leftCutElev });
                pts.filter(p => p.offset > leftCutX && p.offset < rightCutX).forEach(p => midPts.push(p));
                midPts.push({ offset: rightCutX, elevation: rightCutElev });
                if (midPts.length > 1) {
                  scr += `(drawpoly\n${makeLispListFromPts(midPts)}\n  "TuNhien" 8 0 "HIDDEN"\n)\n`;
                }

                // Right Segment (Solid, color 1 / Red)
                const rightPts = [{ offset: rightCutX, elevation: rightCutElev }];
                pts.filter(p => p.offset > rightCutX).forEach(p => rightPts.push(p));
                if (rightPts.length > 1) {
                  scr += `(drawpoly\n${makeLispListFromPts(rightPts)}\n  "TuNhien" 1 0 "BYLAYER"\n)\n`;
                }
              } else {
                // Entire Terrain Segment (Solid, color 1 / Red)
                if (pts && pts.length > 0) {
                  scr += `(drawpoly\n${makeLispListFromPts(pts)}\n  "TuNhien" 1 0 "BYLAYER"\n)\n`;
                }
              }

              // 1. Tim Kenh Centerline Axis (Yellow/Color 2)
              scr += `(drawline (list ${mapX(geom.cx)} ${yRow2}) (list ${mapX(geom.cx)} ${mapY(geom.cy + geom.H_total + 2.5)}) "TimKenh" 2 "BYLAYER")\n`;

              // 2. Water Level Line (MNTK - Blue/Color 5)
              scr += `(drawline (list ${mapX(geom.cx - geom.b/2 - 1.0)} ${mapY(geom.waterLevelAtStake)}) (list ${mapX(geom.cx + geom.b/2 + 1.0)} ${mapY(geom.waterLevelAtStake)}) "MucNuoc" 5 "BYLAYER")\n`;
              scr += `(drawtext (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.waterLevelAtStake + 0.1)}) "+ MNTK: ${geom.waterLevelAtStake.toFixed(2)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.cy + geom.H_total + 0.1)}) "+ Z_dinh: ${geom.topLevelAtStake.toFixed(2)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.cy - 0.2)}) "+ Z_day: ${geom.dayKenhAtStake.toFixed(2)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;

              // 3. Concrete Canal Box (Green/Color 3)
              const concBoxPts = [
                geom.outerLeftTop, geom.p0, geom.p1_top, geom.p1_right,
                geom.p2_left, geom.p2_top, geom.p3, geom.outerRightTop,
                geom.outerRightBottom, geom.concRightTop, geom.concRightBottom,
                geom.concLeftBottom, geom.concLeftTop, geom.outerLeftBottom
              ];
              if (concBoxPts.filter(Boolean).length > 2) {
                scr += `(drawpoly\n${makeLispList(concBoxPts.filter(Boolean))}\n  "MatKenh_BeTong" 3 1 "BYLAYER"\n)\n`;
              }

              // 4. Lean Concrete Layer (Red/Color 1)
              const dlotPts = [
                geom.dlotLeftTop, geom.dlotRightTop, geom.dlotRightBottom, geom.dlotLeftBottom
              ];
              if (dlotPts.filter(Boolean).length > 2) {
                scr += `(drawpoly\n${makeLispList(dlotPts.filter(Boolean))}\n  "BeTongLot" 1 1 "BYLAYER"\n)\n`;
              }

              // 5. Embankment Slopes & Bank Tops (Yellow/Color 2)
              if (geom.point5) {
                const ptsList = [geom.point5, geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop].filter(Boolean);
                scr += `(drawpoly\n${makeLispList(ptsList)}\n  "MaiDap" 2 0 "BYLAYER"\n)\n`;
              } else {
                const ptsList = [geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop].filter(Boolean);
                scr += `(drawpoly\n${makeLispList(ptsList)}\n  "MaiDap" 2 0 "BYLAYER"\n)\n`;
              }

              if (geom.point6) {
                const ptsList = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight, geom.point6].filter(Boolean);
                scr += `(drawpoly\n${makeLispList(ptsList)}\n  "MaiDap" 2 0 "BYLAYER"\n)\n`;
              } else {
                const ptsList = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight].filter(Boolean);
                scr += `(drawpoly\n${makeLispList(ptsList)}\n  "MaiDap" 2 0 "BYLAYER"\n)\n`;
              }

              // 6. Excavation Slopes (Magenta/Color 6)
              if (geom.isALowerThanTerrain && geom.intersectA) {
                scr += `(drawline (list ${mapX(geom.pointA.x)} ${mapY(geom.pointA.y)}) (list ${mapX(geom.intersectA.x)} ${mapY(geom.intersectA.y)}) "MaiDao" 6 "BYLAYER")\n`;
              }
              if (geom.isBLowerThanTerrain && geom.intersectB) {
                scr += `(drawline (list ${mapX(geom.pointB.x)} ${mapY(geom.pointB.y)}) (list ${mapX(geom.intersectB.x)} ${mapY(geom.intersectB.y)}) "MaiDao" 6 "BYLAYER")\n`;
              }
              if (geom.isLeftCut && geom.cutLeftFinal) {
                scr += `(drawline (list ${mapX(geom.ditchTopLeft.x)} ${mapY(geom.ditchTopLeft.y)}) (list ${mapX(geom.cutLeftFinal.x)} ${mapY(geom.cutLeftFinal.y)}) "MaiDao" 6 "BYLAYER")\n`;
              }
              if (geom.isRightCut && geom.fillRight) {
                scr += `(drawline (list ${mapX(geom.ditchTopRightRight.x)} ${mapY(geom.ditchTopRightRight.y)}) (list ${mapX(geom.fillRight.x)} ${mapY(geom.fillRight.y)}) "MaiDao" 6 "BYLAYER")\n`;
              }

              // 7. Drainage Ditches (Cyan/Color 4)
              if (geom.hasDitchLeft && geom.ditchPolysLeft) {
                scr += `(drawpoly\n${makeLispList(geom.ditchPolysLeft)}\n  "RanhThoatNuoc" 4 1 "BYLAYER"\n)\n`;
              }
              if (geom.hasDitchRight && geom.ditchPolysRight) {
                scr += `(drawpoly\n${makeLispList(geom.ditchPolysRight)}\n  "RanhThoatNuoc" 4 1 "BYLAYER"\n)\n`;
              }

              const formatChainage = (ch: number) => {
                const km = Math.floor(ch / 1000);
                const m = (ch % 1000).toFixed(2);
                return `K${km}+${m}`;
              };
              const Y_top_of_profile = Y_datum + (yRulerMax - gDatum) * (1000 / verticalScale);
              const Y_title_3 = Y_top_of_profile + 4.0;
              const Y_title_2 = Y_top_of_profile + 8.5;
              const Y_title_1 = Y_top_of_profile + 13.5;

              // 8. Quantity Legend Card (aligned to the right side of the sheet, paper space Y)
              const X_card = colIdx * 385.0 + 385.0 - 80.0;
              const Y_card = Y_top_of_profile + 15.0;
              scr += `(drawpoly\n  (list (list ${X_card} ${Y_card}) (list ${X_card + 75.0} ${Y_card}) (list ${X_card + 75.0} ${Y_card - 20.0}) (list ${X_card} ${Y_card - 20.0}))\n  "KhungBang" 8 1 "BYLAYER"\n)\n`;
              scr += `(drawtext (list ${X_card + 3.0} ${Y_card - 4.0}) "${unicodeToTCVN3(`S đào đất: ${geom.S_dao_trang.toFixed(2)} m2`)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${X_card + 3.0} ${Y_card - 9.0}) "${unicodeToTCVN3(`S đắp đất: ${geom.S_dap.toFixed(2)} m2`)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${X_card + 3.0} ${Y_card - 14.0}) "${unicodeToTCVN3(`S bóc hữu cơ: ${geom.S_boc_thao_moc.toFixed(2)} m2`)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;
              scr += `(drawtext (list ${X_card + 3.0} ${Y_card - 19.0}) "${unicodeToTCVN3(`L trồng cỏ: ${geom.L_trong_co.toFixed(2)} m`)}" 1.8 0 "TextBang" "VnTimeH" 7)\n`;

              // Draw Cross Section Title (3 lines: Cọc name, mileage, and scale)
              // Line 1: CỌC: [Name] (color 4/Cyan, height 3.0, style VNArialH)
              scr += `(drawtextcenter (list ${colIdx * 385.0 + 192.5} ${Y_title_1}) "${unicodeToTCVN3(`CỌC: ${stake.name.toUpperCase()}`)}" 3.0 0 "TextTitle" "VNArialH" 4)\n`;
              
              // Line 2: Mileage (color 7/White, height 1.5, style VnTimeH)
              scr += `(drawtextcenter (list ${colIdx * 385.0 + 192.5} ${Y_title_2}) "${formatChainage(stake.chainage)}" 1.5 0 "TextBang" "VnTimeH" 7)\n`;
              
              // Line 3: Scale (color 7/White, height 1.5, style VnTimeH)
              scr += `(drawtextcenter (list ${colIdx * 385.0 + 192.5} ${Y_title_3}) "${unicodeToTCVN3(`TỈ LỆ 1:${verticalScale}`)}" 1.5 0 "TextBang" "VnTimeH" 7)\n`;
            });
          });

          scr += `(setvar "CELTYPE" "BYLAYER")\n`;
          scr += `(setvar "CECOLOR" "BYLAYER")\n`;
          scr += `(setvar "FILEDIA" 1)\n`;
          scr += "ZOOM\nE\n";

          const formattedScr = scr.replace(/\r?\n/g, '\r\n');
          const blob = new Blob([formattedScr], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Khung_SoSanh_Thuoc_${stakesToExport.length}Coc.scr`;
          a.click();
          URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
        }}
        onExportDXF={(settings) => {
          // Cleared for redesign
          setIsExportModalOpen(false);
        }}
        onExportCSV={() => {
          const stakesToExport = terrainStakes.length > 0 ? terrainStakes : [];
          
          let csv = "\uFEFFBẢNG TỔNG HỢP KHỐI LƯỢNG MẶT CẮT NGANG (PHƯƠNG PHÁP BÌNH QUÂN KHOẢNG CÁCH)\n";
          csv += "Cọc,Lý trình (m),Khoảng cách lẻ (m),S đào (m2),S đắp (m2),S bóc TM (m2),L trồng cỏ (m),V đào (m3),V đắp (m3),V bóc TM (m3),S cỏ (m2)\n";
          
          // Pre-calculate all stake geometries
          const stakeGeometries = stakesToExport.map((stake) => {
            const geom = calculateCrossSectionGeometry(
              stake,
              computedSegments,
              segmentHydraulicResults,
              flowNodes,
              nodeElevations,
              crossSectionParams
            );
            return {
              name: stake.name,
              chainage: stake.chainage,
              S_dao: geom.S_dao_trang || 0,
              S_dap: geom.S_dap || 0,
              S_boc: geom.S_boc_thao_moc || 0,
              L_co: geom.L_trong_co || 0,
            };
          });

          let totalV_dao = 0;
          let totalV_dap = 0;
          let totalV_boc = 0;
          let totalS_co = 0;
          let totalDist = 0;

          stakeGeometries.forEach((curr, idx) => {
            let dist = 0;
            let V_dao = 0;
            let V_dap = 0;
            let V_boc = 0;
            let S_co = 0;

            if (idx > 0) {
              const prev = stakeGeometries[idx - 1];
              dist = curr.chainage - prev.chainage;
              if (dist < 0) dist = 0;

              V_dao = ((curr.S_dao + prev.S_dao) / 2) * dist;
              V_dap = ((curr.S_dap + prev.S_dap) / 2) * dist;
              V_boc = ((curr.S_boc + prev.S_boc) / 2) * dist;
              S_co = ((curr.L_co + prev.L_co) / 2) * dist;

              totalV_dao += V_dao;
              totalV_dap += V_dap;
              totalV_boc += V_boc;
              totalS_co += S_co;
              totalDist += dist;
            }

            const distStr = idx === 0 ? "0.00" : dist.toFixed(2);
            const V_daoStr = idx === 0 ? "0.00" : V_dao.toFixed(2);
            const V_dapStr = idx === 0 ? "0.00" : V_dap.toFixed(2);
            const V_bocStr = idx === 0 ? "0.00" : V_boc.toFixed(2);
            const S_coStr = idx === 0 ? "0.00" : S_co.toFixed(2);

            csv += `${curr.name},${curr.chainage.toFixed(2)},${distStr},${curr.S_dao.toFixed(2)},${curr.S_dap.toFixed(2)},${curr.S_boc.toFixed(2)},${curr.L_co.toFixed(2)},${V_daoStr},${V_dapStr},${V_bocStr},${S_coStr}\n`;
          });

          // Add Total row
          csv += `TỔNG CỘNG,,${totalDist.toFixed(2)},,,,${totalV_dao.toFixed(2)},${totalV_dap.toFixed(2)},${totalV_boc.toFixed(2)},${totalS_co.toFixed(2)}\n`;

          csv += "\n\nBẢNG TỌA ĐỘ TỰ NHIÊN CHI TIẾT\n";
          csv += "Cọc,Lý trình (m),Khoảng cách lẻ (m),Cao độ (m)\n";
          
          stakesToExport.forEach(stake => {
            (stake.points || []).forEach(p => {
              csv += `${stake.name},${stake.chainage.toFixed(2)},${p.offset.toFixed(2)},${p.elevation.toFixed(2)}\n`;
            });
          });

          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `KhoiLuong_va_ToaDo_MatCatNgang_${stakesToExport.length}Coc.csv`;
          a.click();
          URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
        }}
      />
    </div>
  );
}
