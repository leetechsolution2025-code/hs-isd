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
          scr += `(setvar "OSMODE" 0)\n`;
          scr += `;; AUTOCAD SCRIPT TO DRAW ALL CROSS SECTIONS (${stakesToExport.length} COC)\n`;
          scr += `;;========================================================================\n`;
          scr += `(if (not (tblsearch "LTYPE" "DASHED")) (command "_-LINETYPE" "_Load" "DASHED" "acad.lin" ""))\n`;
          scr += `(if (not (tblsearch "STYLE" "VnTimeH")) (command "_-STYLE" "VnTimeH" "vntimeh.shx" "0.0" "1.0" "0.0" "_N" "_N" "_N"))\n`;
          scr += `-LAYER\nMake\nTuNhien\nColor\n8\n\nLtype\nDASHED\n\nMake\nTimKenh\nColor\n5\n\nLtype\nDASHED\n\nMake\nMucNuoc\nColor\n5\n\nLtype\nDASHED\n\nMake\nMatKenh_BeTong\nColor\n3\n\nMake\nBeTongLot\nColor\n1\n\nMake\nMaiDap\nColor\n2\n\nMake\nMaiDao\nColor\n6\n\nMake\nRanhThoatNuoc\nColor\n4\n\nMake\nKhungBao\nColor\n1\n\nMake\nKhungBang\nColor\n8\n\nMake\nTextBang\nColor\n7\n\n\n`;
          const gapX = 65.0 * (1000 / horizontalScale);

          stakesToExport.forEach((stake, idx) => {
            const minOff = stake.points && stake.points.length > 0 ? Math.min(...stake.points.map(p => p.offset)) : 0;
            const maxOff = stake.points && stake.points.length > 0 ? Math.max(...stake.points.map(p => p.offset)) : 20;

            const sheetIdx = Math.floor(idx / 2);
            const scaleFactor = 1000 / horizontalScale;
            const leftBound = minOff - 3.5;
            const rightBound = maxOff + 2.0;
            const centerM = (leftBound + rightBound) / 2;
            const X0 = sheetIdx * 385.0 + 192.5 - centerM * scaleFactor;
            const Y0 = (idx % 2 === 0) ? 185.0 : 60.0;

            const geom = calculateCrossSectionGeometry(
              stake,
              computedSegments,
              segmentHydraulicResults,
              flowNodes,
              nodeElevations,
              crossSectionParams
            );

            const maxTerrainY = stake.points && stake.points.length > 0 ? Math.max(...stake.points.map(p => p.elevation)) : geom.cy + 2.0;

            const mapX = (off: number) => {
              const val = X0 + (isNaN(off) ? 0 : off) * (1000 / horizontalScale);
              return Number((isNaN(val) ? X0 : val).toFixed(3));
            };

            const mapY = (elev: number) => {
              const val = Y0 + ((isNaN(elev) ? geom.cy : elev) - geom.stakeDatum) * (1000 / verticalScale);
              return Number((isNaN(val) ? Y0 : val).toFixed(3));
            };

            const X_ruler = minOff;

            // Draw sheet borders only once per sheet (for the top cross-section)
            if (idx % 2 === 0) {
              const sheetX = sheetIdx * 385.0;
              // Outer border (385mm x 277mm) - Red/Color 1
              scr += `CLAYER\nKhungBao\nPLINE\n`;
              scr += `${sheetX},0\n`;
              scr += `${sheetX + 385.0},0\n`;
              scr += `${sheetX + 385.0},277.0\n`;
              scr += `${sheetX},277.0\n`;
              scr += `c\n`;
            }

            // 1. Vertical Elevation Ruler (KhungBang - White/Color 7, width 0.2, right edge aligned with minOff)
            const w = 0.2;
            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler - w)},${mapY(geom.stakeDatum)}\n`;
            scr += `${mapX(X_ruler - w)},${mapY(maxTerrainY + 2.0)}\n\n`;

            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler)},${mapY(geom.stakeDatum)}\n`;
            scr += `${mapX(X_ruler)},${mapY(maxTerrainY + 2.0)}\n\n`;

            for (let yElev = Math.floor(geom.stakeDatum); yElev <= Math.ceil(maxTerrainY + 2.0); yElev += 1.0) {
              // Horizontal segment inside ruler
              scr += `CLAYER\nKhungBang\nPLINE\n`;
              scr += `${mapX(X_ruler - w)},${mapY(yElev)}\n`;
              scr += `${mapX(X_ruler)},${mapY(yElev)}\n\n`;

              // Left tick mark (length 0.3)
              scr += `CLAYER\nKhungBang\nPLINE\n`;
              scr += `${mapX(X_ruler - w)},${mapY(yElev)}\n`;
              scr += `${mapX(X_ruler - w - 0.3)},${mapY(yElev)}\n\n`;

              // Text label
              scr += `CLAYER\nTextBang\n`;
              scr += `(command "_.TEXT" (list ${mapX(X_ruler - w - 1.4)} ${mapY(yElev - 0.2)}) 1.6 0 "${yElev.toFixed(2)}")\n`;

              // Black/White alternating segments (width 0.2)
              if (yElev < Math.ceil(maxTerrainY + 2.0) && (yElev - Math.floor(geom.stakeDatum)) % 2 === 0) {
                scr += `CLAYER\nKhungBang\n`;
                scr += `(command "_.SOLID" ` +
                       `(list ${mapX(X_ruler - w)} ${mapY(yElev)}) ` +
                       `(list ${mapX(X_ruler)} ${mapY(yElev)}) ` +
                       `(list ${mapX(X_ruler - w)} ${mapY(yElev + 1.0)}) ` +
                       `(list ${mapX(X_ruler)} ${mapY(yElev + 1.0)}) "")\n`;
              }
            }

            // Write MỨC SO SÁNH label above row 0
            scr += `CLAYER\nTextBang\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_ruler - 3.2)} ${mapY(geom.stakeDatum + 0.5)}) 1.8 0 "${unicodeToTCVN3(`MỨC SO SÁNH: Hss = ${geom.stakeDatum.toFixed(2)} m`)}")\n`;

            // 2. Data Table Grid below Datum Line (2 rows: CAO DO TU NHIEN, KHOANG CACH LE)
            const yRow0 = geom.stakeDatum;
            const yRow1 = geom.stakeDatum - 1.5;
            const yRow2 = geom.stakeDatum - 3.0;

            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler - 3.5)},${mapY(yRow0)}\n`;
            scr += `${mapX(maxOff + 2.0)},${mapY(yRow0)}\n\n`;

            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler - 3.5)},${mapY(yRow1)}\n`;
            scr += `${mapX(maxOff + 2.0)},${mapY(yRow1)}\n\n`;

            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler - 3.5)},${mapY(yRow2)}\n`;
            scr += `${mapX(maxOff + 2.0)},${mapY(yRow2)}\n\n`;

            // Vertical boundary line on left of grid
            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_ruler - 3.5)},${mapY(yRow0)}\n`;
            scr += `${mapX(X_ruler - 3.5)},${mapY(yRow2)}\n\n`;

            // Vertical boundary line on right of grid
            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(maxOff + 2.0)},${mapY(yRow0)}\n`;
            scr += `${mapX(maxOff + 2.0)},${mapY(yRow2)}\n\n`;

            // Row Title Texts (Narrow rows height 1.5, column width 3.5)
            scr += `CLAYER\nTextBang\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_ruler - 3.2)} ${mapY(yRow1 + 0.55)}) 1.6 0 "${unicodeToTCVN3("CAO ĐỘ TỰ NHIÊN (M)")}")\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_ruler - 3.2)} ${mapY(yRow2 + 0.55)}) 1.6 0 "${unicodeToTCVN3("KHOẢNG CÁCH LẺ (M)")}")\n`;

            // Title Label Above Cross Section
            scr += `(command "_.TEXT" (list ${mapX(geom.cx - 5.0)} ${mapY(maxTerrainY + 2.5)}) 3.0 0 "COC ${stake.name} (LY TRINH: K${Math.floor(stake.chainage / 1000)}+${(stake.chainage % 1000).toFixed(2)} - MSS: ${geom.stakeDatum.toFixed(2)}M)")\n`;

            // Survey points extension lines and grid data
            if (stake.points && stake.points.length > 0) {
              stake.points.forEach((p, pIdx) => {
                const prevOffset = pIdx > 0 ? stake.points[pIdx - 1].offset : p.offset;
                const dx = p.offset - prevOffset;

                scr += `CLAYER\nKhungBang\nPLINE\n`;
                scr += `${mapX(p.offset)},${mapY(p.elevation)}\n`;
                scr += `${mapX(p.offset)},${mapY(yRow2)}\n\n`;

                scr += `CLAYER\nTextBang\n`;
                scr += `(command "_.TEXT" (list ${mapX(p.offset - 0.25)} ${mapY(yRow1 + 0.15)}) 1.5 90 "${p.elevation.toFixed(2)}")\n`;
                scr += `(command "_.TEXT" (list ${mapX(p.offset - 0.25)} ${mapY(yRow2 + 0.15)}) 1.5 90 "${dx.toFixed(2)}")\n`;
              });
            }

            // 3. Tim Kenh Centerline Axis
            scr += `CLAYER\nTimKenh\nPLINE\n`;
            scr += `${mapX(geom.cx)},${mapY(yRow2)}\n`;
            scr += `${mapX(geom.cx)},${mapY(geom.cy + geom.H_total + 2.5)}\n\n`;

            // 4. Water Level Line (MNTK)
            scr += `CLAYER\nMucNuoc\nPLINE\n`;
            scr += `${mapX(geom.cx - geom.b/2 - 1.0)},${mapY(geom.waterLevelAtStake)}\n`;
            scr += `${mapX(geom.cx + geom.b/2 + 1.0)},${mapY(geom.waterLevelAtStake)}\n\n`;

            scr += `CLAYER\nTextBang\n`;
            scr += `(command "_.TEXT" (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.waterLevelAtStake + 0.1)}) 2.2 0 "+ MNTK: ${geom.waterLevelAtStake.toFixed(2)}")\n`;
            scr += `(command "_.TEXT" (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.cy + geom.H_total + 0.1)}) 2.2 0 "+ Z_dinh: ${geom.topLevelAtStake.toFixed(2)}")\n`;
            scr += `(command "_.TEXT" (list ${mapX(geom.cx + geom.b/2 + 0.8)} ${mapY(geom.cy - 0.2)}) 2.2 0 "+ Z_day: ${geom.dayKenhAtStake.toFixed(2)}")\n`;

            // 5. Natural Terrain Polyline
            if (stake.points && stake.points.length > 0) {
              scr += `CLAYER\nTuNhien\nPLINE\n`;
              stake.points.forEach(p => {
                scr += `${mapX(p.offset)},${mapY(p.elevation)}\n`;
              });
              scr += `\n`;
            }

            // 6. Concrete Canal Box (without p1/p2 sharp corners)
            scr += `CLAYER\nMatKenh_BeTong\nPLINE\n`;
            const concBoxPts = [
              geom.outerLeftTop, geom.p0, geom.p1_top, geom.p1_right,
              geom.p2_left, geom.p2_top, geom.p3, geom.outerRightTop,
              geom.outerRightBottom, geom.concRightTop, geom.concRightBottom,
              geom.concLeftBottom, geom.concLeftTop, geom.outerLeftBottom
            ];
            concBoxPts.forEach(p => {
              scr += `${mapX(p.x)},${mapY(p.y)}\n`;
            });
            scr += `c\n`;

            // 7. Lean Concrete Layer
            scr += `CLAYER\nBeTongLot\nPLINE\n`;
            const dlotPts = [
              geom.dlotLeftTop, geom.dlotRightTop, geom.dlotRightBottom, geom.dlotLeftBottom
            ];
            dlotPts.forEach(p => {
              scr += `${mapX(p.x)},${mapY(p.y)}\n`;
            });
            scr += `c\n`;

            // 8. Embankment Slopes & Bank Tops
            if (geom.point5) {
              scr += `CLAYER\nMaiDap\nPLINE\n`;
              const leftBankPts = [geom.point5, geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop];
              leftBankPts.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `\n`;
            } else {
              scr += `CLAYER\nMaiDap\nPLINE\n`;
              const leftBankPts = [geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop];
              leftBankPts.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `\n`;
            }

            if (geom.point6) {
              scr += `CLAYER\nMaiDap\nPLINE\n`;
              const rightBankPts = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight, geom.point6];
              rightBankPts.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `\n`;
            } else {
              scr += `CLAYER\nMaiDap\nPLINE\n`;
              const rightBankPts = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight];
              rightBankPts.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `\n`;
            }

            // 9. Excavation Slopes (MaiDao)
            if (geom.isALowerThanTerrain && geom.intersectA) {
              scr += `CLAYER\nMaiDao\nPLINE\n`;
              scr += `${mapX(geom.pointA.x)},${mapY(geom.pointA.y)}\n`;
              scr += `${mapX(geom.intersectA.x)},${mapY(geom.intersectA.y)}\n\n`;
            }
            if (geom.isBLowerThanTerrain && geom.intersectB) {
              scr += `CLAYER\nMaiDao\nPLINE\n`;
              scr += `${mapX(geom.pointB.x)},${mapY(geom.pointB.y)}\n`;
              scr += `${mapX(geom.intersectB.x)},${mapY(geom.intersectB.y)}\n\n`;
            }
            if (geom.isLeftCut && geom.cutLeftFinal) {
              scr += `CLAYER\nMaiDao\nPLINE\n`;
              scr += `${mapX(geom.ditchTopLeft.x)},${mapY(geom.ditchTopLeft.y)}\n`;
              scr += `${mapX(geom.cutLeftFinal.x)},${mapY(geom.cutLeftFinal.y)}\n\n`;
            }
            if (geom.isRightCut && geom.fillRight) {
              scr += `CLAYER\nMaiDao\nPLINE\n`;
              scr += `${mapX(geom.ditchTopRightRight.x)},${mapY(geom.ditchTopRightRight.y)}\n`;
              scr += `${mapX(geom.fillRight.x)},${mapY(geom.fillRight.y)}\n\n`;
            }

            // 10. Drainage Ditches
            if (geom.hasDitchLeft && geom.ditchPolysLeft) {
              scr += `CLAYER\nRanhThoatNuoc\nPLINE\n`;
              geom.ditchPolysLeft.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `c\n`;
            }
            if (geom.hasDitchRight && geom.ditchPolysRight) {
              scr += `CLAYER\nRanhThoatNuoc\nPLINE\n`;
              geom.ditchPolysRight.forEach(p => {
                scr += `${mapX(p.x)},${mapY(p.y)}\n`;
              });
              scr += `c\n`;
            }

            // 11. Quantity Legend Card
            const X_card = maxOff - 5.0;
            const Y_card = maxTerrainY + 2.0;
            scr += `CLAYER\nKhungBang\nPLINE\n`;
            scr += `${mapX(X_card)},${mapY(Y_card)}\n`;
            scr += `${mapX(X_card + 7.0)},${mapY(Y_card)}\n`;
            scr += `${mapX(X_card + 7.0)},${mapY(Y_card - 3.5)}\n`;
            scr += `${mapX(X_card)},${mapY(Y_card - 3.5)}\n`;
            scr += `c\n`;

            scr += `CLAYER\nTextBang\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_card + 0.5)} ${mapY(Y_card - 0.8)}) 1.6 0 "${unicodeToTCVN3("S đào:")} ${geom.S_dao_trang.toFixed(2)} m2")\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_card + 0.5)} ${mapY(Y_card - 1.5)}) 1.6 0 "${unicodeToTCVN3("S đắp:")} ${geom.S_dap.toFixed(2)} m2")\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_card + 0.5)} ${mapY(Y_card - 2.2)}) 1.6 0 "${unicodeToTCVN3("S bóc TM:")} ${geom.S_boc_thao_moc.toFixed(2)} m2")\n`;
            scr += `(command "_.TEXT" (list ${mapX(X_card + 0.5)} ${mapY(Y_card - 2.9)}) 1.6 0 "${unicodeToTCVN3("L trồng cỏ:")} ${geom.L_trong_co.toFixed(2)} m")\n`;
            scr += "ZOOM\nE\n";
          });

          const blob = new Blob([scr], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `TatCa_MatCatNgang_${stakesToExport.length}Coc.scr`;
          a.click();
          URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
        }}
        onExportDXF={(settings) => {
          const stakesToExport = terrainStakes.length > 0 ? terrainStakes : [];
          const { horizontalScale = 1000, verticalScale = 100 } = settings;
          
          let dxf = `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLTYPE\n70\n1\n0\nLTYPE\n2\nDASHED\n70\n0\n3\nDashed __ __ __ __ __ __\n72\n65\n73\n2\n40\n0.75\n49\n0.5\n49\n-0.25\n0\nENDTAB\n0\nTABLE\n2\nSTYLE\n70\n1\n0\nSTYLE\n2\nVnTimeH\n70\n0\n40\n0.0\n41\n1.0\n50\n0.0\n71\n0\n42\n1.5\n3\nvntimeh.shx\n4\n\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;

          const gapX = 65.0 * (1000 / horizontalScale);

          const addDxfLine = (x1: number, y1: number, x2: number, y2: number, layer: string, color: number = 7, ltype?: string) => {
            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return;
            dxf += `0\nLINE\n8\n${layer}\n62\n${color}\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0.0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0.0\n`;
            if (ltype) dxf += `6\n${ltype}\n`;
          };

          const addDxfText = (txt: string, x: number, y: number, height: number, rot: number = 0, layer: string = "TextBang", color: number = 7) => {
            if (isNaN(x) || isNaN(y)) return;
            const encTxt = unicodeToTCVN3(txt);
            dxf += `0\nTEXT\n8\n${layer}\n62\n${color}\n10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0.0\n40\n${height.toFixed(3)}\n1\n${encTxt}\n50\n${rot.toFixed(3)}\n7\nVnTimeH\n`;
          };

          const addDxfPolyline = (pts: { x: number; y: number }[], layer: string, color: number = 7, isClosed: boolean = false, ltype?: string) => {
            if (!pts || pts.length === 0) return;
            dxf += `0\nLWPOLYLINE\n100\nAcDbEntity\n8\n${layer}\n62\n${color}\n`;
            if (ltype) dxf += `6\n${ltype}\n`;
            dxf += `100\nAcDbPolyline\n90\n${pts.length}\n70\n${isClosed ? 1 : 0}\n`;
            pts.forEach(p => {
              dxf += `10\n${p.x.toFixed(3)}\n20\n${p.y.toFixed(3)}\n`;
            });
          };

          const addDxfSolid = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, layer: string, color: number = 7) => {
            dxf += `0\nSOLID\n8\n${layer}\n62\n${color}\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0.0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0.0\n12\n${x3.toFixed(3)}\n22\n${y3.toFixed(3)}\n32\n0.0\n13\n${x4.toFixed(3)}\n23\n${y4.toFixed(3)}\n32\n0.0\n`;
          };

          stakesToExport.forEach((stake, idx) => {
            const minOff = stake.points && stake.points.length > 0 ? Math.min(...stake.points.map(p => p.offset)) : 0;
            const maxOff = stake.points && stake.points.length > 0 ? Math.max(...stake.points.map(p => p.offset)) : 20;

            const sheetIdx = Math.floor(idx / 2);
            const scaleFactor = 1000 / horizontalScale;
            const leftBound = minOff - 3.5;
            const rightBound = maxOff + 2.0;
            const centerM = (leftBound + rightBound) / 2;
            const X0 = sheetIdx * 385.0 + 192.5 - centerM * scaleFactor;
            const Y0 = (idx % 2 === 0) ? 185.0 : 60.0;

            const geom = calculateCrossSectionGeometry(
              stake,
              computedSegments,
              segmentHydraulicResults,
              flowNodes,
              nodeElevations,
              crossSectionParams
            );

            const maxTerrainY = stake.points && stake.points.length > 0 ? Math.max(...stake.points.map(p => p.elevation)) : geom.cy + 2.0;

            const mapX = (off: number) => {
              const val = X0 + (isNaN(off) ? 0 : off) * (1000 / horizontalScale);
              return Number((isNaN(val) ? X0 : val).toFixed(3));
            };

            const mapY = (elev: number) => {
              const val = Y0 + ((isNaN(elev) ? geom.cy : elev) - geom.stakeDatum) * (1000 / verticalScale);
              return Number((isNaN(val) ? Y0 : val).toFixed(3));
            };

            const X_ruler = minOff;

            // Draw sheet borders only once per sheet (for the top cross-section)
            if (idx % 2 === 0) {
              const sheetX = sheetIdx * 385.0;
              const outerPts = [
                { x: sheetX, y: 0 },
                { x: sheetX + 385.0, y: 0 },
                { x: sheetX + 385.0, y: 277.0 },
                { x: sheetX, y: 277.0 }
              ];
              addDxfPolyline(outerPts, "KhungBao", 1, true);
            }

            // 1. Elevation Ruler (KhungBang - White/Color 7, width 0.2, right edge aligned with minOff)
            const w = 0.2;
            addDxfLine(mapX(X_ruler - w), mapY(geom.stakeDatum), mapX(X_ruler - w), mapY(maxTerrainY + 2.0), 'KhungBang', 7);
            addDxfLine(mapX(X_ruler), mapY(geom.stakeDatum), mapX(X_ruler), mapY(maxTerrainY + 2.0), 'KhungBang', 7);

            for (let yElev = Math.floor(geom.stakeDatum); yElev <= Math.ceil(maxTerrainY + 2.0); yElev += 1.0) {
              // Horizontal segment inside ruler
              addDxfLine(mapX(X_ruler - w), mapY(yElev), mapX(X_ruler), mapY(yElev), 'KhungBang', 7);

              // Left tick mark (length 0.3)
              addDxfLine(mapX(X_ruler - w), mapY(yElev), mapX(X_ruler - w - 0.3), mapY(yElev), 'KhungBang', 7);

              // Text label
              addDxfText(yElev.toFixed(2), mapX(X_ruler - w - 1.4), mapY(yElev - 0.2), 1.6, 0, 'TextBang', 7);

              // Black/White alternating segments (width 0.2)
              if (yElev < Math.ceil(maxTerrainY + 2.0) && (yElev - Math.floor(geom.stakeDatum)) % 2 === 0) {
                addDxfSolid(
                  mapX(X_ruler - w), mapY(yElev),
                  mapX(X_ruler), mapY(yElev),
                  mapX(X_ruler - w), mapY(yElev + 1.0),
                  mapX(X_ruler), mapY(yElev + 1.0),
                  'KhungBang', 7
                );
              }
            }

            // Write MỨC SO SÁNH label above row 0
            addDxfText(`MỨC SO SÁNH: Hss = ${geom.stakeDatum.toFixed(2)} m`, mapX(X_ruler - 3.2), mapY(geom.stakeDatum + 0.5), 1.8, 0, "TextBang", 7);

            // 2. Data Table Grid below Datum Line (2 rows: CAO DO TU NHIEN, KHOANG CACH LE)
            const yRow0 = geom.stakeDatum;
            const yRow1 = geom.stakeDatum - 1.5;
            const yRow2 = geom.stakeDatum - 3.0;

            addDxfLine(mapX(X_ruler - 3.5), mapY(yRow0), mapX(maxOff + 2.0), mapY(yRow0), 'KhungBang', 7);
            addDxfLine(mapX(X_ruler - 3.5), mapY(yRow1), mapX(maxOff + 2.0), mapY(yRow1), 'KhungBang', 7);
            addDxfLine(mapX(X_ruler - 3.5), mapY(yRow2), mapX(maxOff + 2.0), mapY(yRow2), 'KhungBang', 7);
            addDxfLine(mapX(X_ruler - 3.5), mapY(yRow0), mapX(X_ruler - 3.5), mapY(yRow2), 'KhungBang', 7);
            addDxfLine(mapX(maxOff + 2.0), mapY(yRow0), mapX(maxOff + 2.0), mapY(yRow2), 'KhungBang', 7);

            // Row Title Texts (Narrow rows height 1.5, column width 3.5)
            addDxfText("CAO ĐỘ TỰ NHIÊN (M)", mapX(X_ruler - 3.2), mapY(yRow1 + 0.55), 1.6, 0, "TextBang", 7);
            addDxfText("KHOẢNG CÁCH LẺ (M)", mapX(X_ruler - 3.2), mapY(yRow2 + 0.55), 1.6, 0, "TextBang", 7);

            // Title Label Above Cross Section
            addDxfText(`CỌC ${stake.name} (LÝ TRÌNH: K${Math.floor(stake.chainage / 1000)}+${(stake.chainage % 1000).toFixed(2)} - MSS: ${geom.stakeDatum.toFixed(2)}M)`, mapX(geom.cx - 5.0), mapY(maxTerrainY + 2.5), 2.5, 0, "TextBang", 7);

            if (stake.points && stake.points.length > 0) {
              stake.points.forEach((p, pIdx) => {
                const prevOffset = pIdx > 0 ? stake.points[pIdx - 1].offset : p.offset;
                const dx = p.offset - prevOffset;

                addDxfLine(mapX(p.offset), mapY(p.elevation), mapX(p.offset), mapY(yRow2), 'KhungBang', 8);

                addDxfText(p.elevation.toFixed(2), mapX(p.offset - 0.25), mapY(yRow1 + 0.15), 1.5, 90, "TextBang", 7);
                addDxfText(dx.toFixed(2), mapX(p.offset - 0.25), mapY(yRow2 + 0.15), 1.5, 90, "TextBang", 7);
              });
            }

            // 3. Centerline Axis (TimKenh - Red/Color 1, DASHED)
            addDxfLine(mapX(geom.cx), mapY(yRow2), mapX(geom.cx), mapY(geom.cy + geom.H_total + 2.5), 'TimKenh', 1, 'DASHED');

            // 4. Water Level Line (MucNuoc - Blue/Color 5)
            addDxfLine(mapX(geom.cx - geom.b/2 - 1.0), mapY(geom.waterLevelAtStake), mapX(geom.cx + geom.b/2 + 1.0), mapY(geom.waterLevelAtStake), 'MucNuoc', 5);

            addDxfText(`+ MNTK: ${geom.waterLevelAtStake.toFixed(2)}`, mapX(geom.cx + geom.b/2 + 0.8), mapY(geom.waterLevelAtStake + 0.1), 1.8, 0, "TextBang", 5);
            addDxfText(`+ Z_ĐỈNH: ${geom.topLevelAtStake.toFixed(2)}`, mapX(geom.cx + geom.b/2 + 0.8), mapY(geom.cy + geom.H_total + 0.1), 1.8, 0, "TextBang", 2);
            addDxfText(`+ Z_ĐÁY: ${geom.dayKenhAtStake.toFixed(2)}`, mapX(geom.cx + geom.b/2 + 0.8), mapY(geom.cy - 0.2), 1.8, 0, "TextBang", 1);

            // 5. Natural Terrain Line (TuNhien - Grey/Color 8, DASHED)
            if (stake.points && stake.points.length > 1) {
              const terPts = stake.points.map(p => ({ x: mapX(p.offset), y: mapY(p.elevation) }));
              addDxfPolyline(terPts, "TuNhien", 8, false, 'DASHED');
            }

            // 6. Concrete Canal Box Structure (MatKenh_BeTong - Green/Color 3, without p1/p2 sharp corners)
            const concBoxPts = [
              geom.outerLeftTop, geom.p0, geom.p1_top, geom.p1_right,
              geom.p2_left, geom.p2_top, geom.p3, geom.outerRightTop,
              geom.outerRightBottom, geom.concRightTop, geom.concRightBottom,
              geom.concLeftBottom, geom.concLeftTop, geom.outerLeftBottom
            ].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
            addDxfPolyline(concBoxPts, "MatKenh_BeTong", 3, true);

            // 7. Lean Concrete Base (BeTongLot - Red/Color 1)
            const dlotPts = [
              geom.dlotLeftTop, geom.dlotRightTop, geom.dlotRightBottom, geom.dlotLeftBottom
            ].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
            addDxfPolyline(dlotPts, "BeTongLot", 1, true);

            // 8. Embankment Slopes & Bank Tops (MaiDap - Yellow/Color 2)
            if (geom.point5) {
              const leftBankPts = [geom.point5, geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
              addDxfPolyline(leftBankPts, "MaiDap", 2, false);
            } else {
              const leftBankPts = [geom.bankOuterLeft, geom.bankInnerLeft, geom.outerLeftTop].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
              addDxfPolyline(leftBankPts, "MaiDap", 2, false);
            }

            if (geom.point6) {
              const rightBankPts = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight, geom.point6].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
              addDxfPolyline(rightBankPts, "MaiDap", 2, false);
            } else {
              const rightBankPts = [geom.outerRightTop, geom.bankInnerRight, geom.bankOuterRight].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
              addDxfPolyline(rightBankPts, "MaiDap", 2, false);
            }

            // 9. Excavation Slopes (MaiDao - Magenta/Color 6)
            if (geom.isALowerThanTerrain && geom.intersectA) {
              addDxfLine(mapX(geom.pointA.x), mapY(geom.pointA.y), mapX(geom.intersectA.x), mapY(geom.intersectA.y), 'MaiDao', 6);
            }
            if (geom.isBLowerThanTerrain && geom.intersectB) {
              addDxfLine(mapX(geom.pointB.x), mapY(geom.pointB.y), mapX(geom.intersectB.x), mapY(geom.intersectB.y), 'MaiDao', 6);
            }
            if (geom.isLeftCut && geom.cutLeftFinal) {
              addDxfLine(mapX(geom.ditchTopLeft.x), mapY(geom.ditchTopLeft.y), mapX(geom.cutLeftFinal.x), mapY(geom.cutLeftFinal.y), 'MaiDao', 6);
            }
            if (geom.isRightCut && geom.fillRight) {
              addDxfLine(mapX(geom.ditchTopRightRight.x), mapY(geom.ditchTopRightRight.y), mapX(geom.fillRight.x), mapY(geom.fillRight.y), 'MaiDao', 6);
            }

            // 10. Drainage Ditches (RanhThoatNuoc - Cyan/Color 4)
            if (geom.hasDitchLeft && geom.ditchPolysLeft) {
              addDxfPolyline(geom.ditchPolysLeft.map(p => ({ x: mapX(p.x), y: mapY(p.y) })), "RanhThoatNuoc", 4, true);
            }
            if (geom.hasDitchRight && geom.ditchPolysRight) {
              addDxfPolyline(geom.ditchPolysRight.map(p => ({ x: mapX(p.x), y: mapY(p.y) })), "RanhThoatNuoc", 4, true);
            }

            // 11. Quantity Legend Card
            const X_card = maxOff - 5.0;
            const Y_card = maxTerrainY + 2.0;
            const cardPts = [
              { x: X_card, y: Y_card },
              { x: X_card + 7.0, y: Y_card },
              { x: X_card + 7.0, y: Y_card - 3.5 },
              { x: X_card, y: Y_card - 3.5 }
            ].map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
            addDxfPolyline(cardPts, "KhungBang", 7, true);

            addDxfText(`S đào: ${geom.S_dao_trang.toFixed(2)} m2`, mapX(X_card + 0.5), mapY(Y_card - 0.8), 1.6, 0, "TextBang", 7);
            addDxfText(`S đắp: ${geom.S_dap.toFixed(2)} m2`, mapX(X_card + 0.5), mapY(Y_card - 1.5), 1.6, 0, "TextBang", 7);
            addDxfText(`S bóc TM: ${geom.S_boc_thao_moc.toFixed(2)} m2`, mapX(X_card + 0.5), mapY(Y_card - 2.2), 1.6, 0, "TextBang", 7);
            addDxfText(`L trồng cỏ: ${geom.L_trong_co.toFixed(2)} m`, mapX(X_card + 0.5), mapY(Y_card - 2.9), 1.6, 0, "TextBang", 7);
          });

          dxf += `0\nENDSEC\n0\nEOF\n`;
          const blob = new Blob([dxf], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `TatCa_MatCatNgang_${stakesToExport.length}Coc.dxf`;
          a.click();
          URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
        }}
        onExportCSV={() => {
          const stakesToExport = terrainStakes.length > 0 ? terrainStakes : [];
          
          let csv = "\uFEFFBẢNG TỔNG HỢP KHỐI LƯỢNG MẶT CẮT NGANG\n";
          csv += "Cọc,Lý trình (m),S đào (m2),S đắp (m2),S bóc TM (m2),L trồng cỏ (m)\n";
          
          stakesToExport.forEach(stake => {
            const geom = calculateCrossSectionGeometry(
              stake,
              computedSegments,
              segmentHydraulicResults,
              flowNodes,
              nodeElevations,
              crossSectionParams
            );
            csv += `${stake.name},${stake.chainage.toFixed(2)},${geom.S_dao_trang.toFixed(2)},${geom.S_dap.toFixed(2)},${geom.S_boc_thao_moc.toFixed(2)},${geom.L_trong_co.toFixed(2)}\n`;
          });
          
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
