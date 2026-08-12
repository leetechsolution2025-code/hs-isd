"use client";

import React, { useState, useMemo } from 'react';

interface ParametricModuleProps {
  computedSegments: any[];
  segmentHydraulicResults: Record<number, any>;
  flowNodes: any[];
  project: any;
  crossSectionParams: Record<number, any>;
  setCrossSectionParams: React.Dispatch<React.SetStateAction<Record<number, any>>>;
}

export default function ParametricModule({
  computedSegments,
  segmentHydraulicResults,
  flowNodes,
  project,
  crossSectionParams,
  setCrossSectionParams
}: ParametricModuleProps) {
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(0);

  const defaultParams = {
    B1: 0.2,
    B2: 0.25,
    B3: 0.4,
    VAT: 0.1,
    DDAY: 0.2,
    DLOT: 0.1,
    DBO: 0.3,

    BT_trai: 1.5,
    BT_phai: 1.5,

    MDAO1: 1.5,
    MDAO2: 1.0,
    MDAP: 1.75,

    bankCutOption: 'dap_bo', // 'dap_bo' hoặc 'mo_rong_bo'
    coRanhThoatNuocMai: false,

    coRanhThoatNuoc: false,
    DTN: 0.4,
    BTN: 0.4,
    HTN: 0.4,
    coTrongCo: false,

    coNgamMong: false,

    coBocThaoMoc: true,
    dayBocThaoMoc: 0.2,

    vatLieuKenh: 'Bê tông cốt thép M250',
    vatLieuLot: 'Bê tông lót M100',
    vatLieuRanh: 'Xây gạch mác 75'
  };

  const params = crossSectionParams[selectedSegmentIdx] || defaultParams;

  const selectedSegment = computedSegments[selectedSegmentIdx];
  const selectedHydraulics = segmentHydraulicResults[selectedSegmentIdx] || {};

  // Extract hydraulic inputs
  const b = selectedHydraulics.b_out !== undefined ? parseFloat(selectedHydraulics.b_out) : (selectedHydraulics.b !== undefined ? parseFloat(selectedHydraulics.b) : 1.0);
  const Htk = selectedHydraulics.h_des !== undefined ? parseFloat(selectedHydraulics.h_des) : (selectedHydraulics.h !== undefined ? parseFloat(selectedHydraulics.h) : 1.0);
  const h_safe = selectedHydraulics.safeHeight !== undefined ? parseFloat(selectedHydraulics.safeHeight) : 0.3;
  const H_total = Htk + h_safe;
  const m_trong = selectedHydraulics.m !== undefined ? parseFloat(selectedHydraulics.m) : 1.5;

  const handleParamChange = (key: string, value: any, isNumber = true) => {
    if (setCrossSectionParams) {
      setCrossSectionParams((prev: Record<number, any>) => ({
        ...prev,
        [selectedSegmentIdx]: {
          ...(prev[selectedSegmentIdx] || defaultParams),
          [key]: value
        }
      }));
    }
  };

  const applyToAll = () => {
    if (setCrossSectionParams) {
      setCrossSectionParams((prev: Record<number, any>) => {
        const newParams: Record<number, any> = { ...prev };
        const currentParams = prev[selectedSegmentIdx] || defaultParams;
        computedSegments.forEach((_, idx) => {
          newParams[idx] = { ...currentParams };
        });
        return newParams;
      });
    }
  };

  // -------------------------
  // SVG Drawing Logic
  // -------------------------
  // Dimensions for SVG canvas
  const svgWidth = 800;
  const svgHeight = 500;
  // Center coordinate
  const cx = svgWidth / 2;
  const cy = svgHeight / 2 + 100; // cy is the center bed elevation (bottom of water)
  // Scale factor (pixels per meter)
  const scale = 50;

  const drawCrossSection = () => {
    // Basic hydraulic points (inner points)
    const p1 = { x: cx - (b / 2) * scale, y: cy };
    const p2 = { x: cx + (b / 2) * scale, y: cy };
    const p0 = { x: p1.x - (m_trong * H_total) * scale, y: cy - H_total * scale };
    const p3 = { x: p2.x + (m_trong * H_total) * scale, y: cy - H_total * scale };

    // Water level
    const wl_left = { x: p1.x - (m_trong * Htk) * scale, y: cy - Htk * scale };
    const wl_right = { x: p2.x + (m_trong * Htk) * scale, y: cy - Htk * scale };

    // VAT (chamfer) calculation
    const vatScale = params.VAT * scale;
    const p1_top = { x: p1.x - vatScale * m_trong, y: p1.y - vatScale };
    const p1_right = { x: p1.x + vatScale, y: p1.y };
    const p2_left = { x: p2.x - vatScale, y: p2.y };
    const p2_top = { x: p2.x + vatScale * m_trong, y: p2.y - vatScale };

    // Outer concrete points
    const outerLeftTop = { x: p0.x - params.B1 * scale, y: p0.y };
    const outerRightTop = { x: p3.x + params.B1 * scale, y: p3.y };
    const outerLeftBottom = { x: p1.x - params.B2 * scale, y: p1.y };
    const outerRightBottom = { x: p2.x + params.B2 * scale, y: p2.y };

    // B3 (Trench clearance & Foundation extension)
    const concreteExt = params.coNgamMong ? params.B3 : 0;
    const trenchExt = params.B3;

    // Concrete outer corners at bottom
    const concLeftTop = { x: outerLeftBottom.x - concreteExt * scale, y: outerLeftBottom.y };
    const concRightTop = { x: outerRightBottom.x + concreteExt * scale, y: outerRightBottom.y };
    const concLeftBottom = { x: concLeftTop.x, y: concLeftTop.y + params.DDAY * scale };
    const concRightBottom = { x: concRightTop.x, y: concRightTop.y + params.DDAY * scale };

    // DLOT (Concrete lining, matches concrete width EXACTLY)
    const dlotLeftTop = { x: concLeftBottom.x, y: concLeftBottom.y };
    const dlotRightTop = { x: concRightBottom.x, y: concRightBottom.y };
    const dlotLeftBottom = { x: dlotLeftTop.x, y: dlotLeftTop.y + params.DLOT * scale };
    const dlotRightBottom = { x: dlotRightTop.x, y: dlotRightTop.y + params.DLOT * scale };

    // Banks (bờ kênh) - DBO is drop from top of canal to bank
    const bankElevLeft = p0.y + params.DBO * scale;
    const bankElevRight = p3.y + params.DBO * scale;

    // Intersection of outer wall and bank (ensures straight wall)
    const outerWallLeftSlope = (outerLeftBottom.x - outerLeftTop.x) / (outerLeftBottom.y - outerLeftTop.y);
    const bankInnerLeft = { x: outerLeftTop.x + (bankElevLeft - outerLeftTop.y) * outerWallLeftSlope, y: bankElevLeft };
    const outerWallRightSlope = (outerRightBottom.x - outerRightTop.x) / (outerRightBottom.y - outerRightTop.y);
    const bankInnerRight = { x: outerRightTop.x + (bankElevRight - outerRightTop.y) * outerWallRightSlope, y: bankElevRight };

    const bankOuterLeft = { x: bankInnerLeft.x - params.BT_trai * scale, y: bankElevLeft };
    const bankOuterRight = { x: bankInnerRight.x + params.BT_phai * scale, y: bankElevRight };

    // Trench (Hố móng)
    // The trench bottom is at DLOT bottom elevation, and extends outwards by B3 from the wall.
    const trenchLeftBottom = { x: outerLeftBottom.x - trenchExt * scale, y: dlotLeftBottom.y };
    const trenchRightBottom = { x: outerRightBottom.x + trenchExt * scale, y: dlotRightBottom.y };
    const trenchTopLeft = { x: trenchLeftBottom.x - (trenchLeftBottom.y - bankElevLeft) * params.MDAO1, y: bankElevLeft };
    const trenchTopRight = { x: trenchRightBottom.x + (trenchRightBottom.y - bankElevRight) * params.MDAO1, y: bankElevRight };

    // Excavation (Cut) / Fill (Mái đào đắp tự nhiên)
    const cutLeft = { x: bankOuterLeft.x - 2 * params.MDAO2 * scale, y: bankOuterLeft.y - 2 * scale };
    const fillRight = { x: bankOuterRight.x + 2 * params.MDAP * scale, y: bankOuterRight.y + 2 * scale };

    // Drainage ditch (Rãnh thoát nước) on the left cut slope
    let ditchSvg = null;
    let cutLeftFinal = cutLeft;
    let ditchTopLeft = bankOuterLeft;

    if (params.coRanhThoatNuoc) {
      const bDitchInner = params.BTN * scale; // Rộng
      const hDitchInner = params.HTN * scale; // Sâu
      const tDitch = params.DTN * scale;      // Dày

      const ditchTopRight = { x: bankOuterLeft.x, y: bankOuterLeft.y };
      ditchTopLeft = { x: ditchTopRight.x - (bDitchInner + 2 * tDitch), y: ditchTopRight.y };

      const ditchOuterBotRight = { x: ditchTopRight.x, y: ditchTopRight.y + hDitchInner + tDitch };
      const ditchOuterBotLeft = { x: ditchTopLeft.x, y: ditchTopLeft.y + hDitchInner + tDitch };

      const ditchInnerTopRight = { x: ditchTopRight.x - tDitch, y: ditchTopRight.y };
      const ditchInnerTopLeft = { x: ditchTopLeft.x + tDitch, y: ditchTopLeft.y };
      const ditchInnerBotRight = { x: ditchInnerTopRight.x, y: ditchInnerTopRight.y + hDitchInner };
      const ditchInnerBotLeft = { x: ditchInnerTopLeft.x, y: ditchInnerTopLeft.y + hDitchInner };

      const ditchPolygon = `${ditchTopRight.x},${ditchTopRight.y} ${ditchOuterBotRight.x},${ditchOuterBotRight.y} ${ditchOuterBotLeft.x},${ditchOuterBotLeft.y} ${ditchTopLeft.x},${ditchTopLeft.y} ${ditchInnerTopLeft.x},${ditchInnerTopLeft.y} ${ditchInnerBotLeft.x},${ditchInnerBotLeft.y} ${ditchInnerBotRight.x},${ditchInnerBotRight.y} ${ditchInnerTopRight.x},${ditchInnerTopRight.y}`;

      cutLeftFinal = { x: ditchTopLeft.x - 2 * params.MDAO2 * scale, y: ditchTopLeft.y - 2 * scale };

      ditchSvg = (
        <polygon points={ditchPolygon} fill="#e2e8f0" stroke="#334155" strokeWidth="1" />
      );
    }

    // Concrete Polygons
    const innerProfile = `${p0.x},${p0.y} ${p1_top.x},${p1_top.y} ${p1_right.x},${p1_right.y} ${p2_left.x},${p2_left.y} ${p2_top.x},${p2_top.y} ${p3.x},${p3.y}`;
    const outerProfile = `${outerRightTop.x},${outerRightTop.y} ${outerRightBottom.x},${outerRightBottom.y} ${concRightTop.x},${concRightTop.y} ${concRightBottom.x},${concRightBottom.y} ${concLeftBottom.x},${concLeftBottom.y} ${concLeftTop.x},${concLeftTop.y} ${outerLeftBottom.x},${outerLeftBottom.y} ${outerLeftTop.x},${outerLeftTop.y}`;
    const concretePolygon = `${innerProfile} ${outerProfile}`;

    const dlotPolygon = `${dlotLeftTop.x},${dlotLeftTop.y} ${dlotRightTop.x},${dlotRightTop.y} ${dlotRightBottom.x},${dlotRightBottom.y} ${dlotLeftBottom.x},${dlotLeftBottom.y}`;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Dimensions Layer */}
        <g stroke="#94a3b8" strokeWidth="1" fill="none">
          <line x1={p1.x} y1={cy - 20} x2={p2.x} y2={cy - 20} />
          <line x1={p1.x} y1={cy - 25} x2={p1.x} y2={cy} />
          <line x1={p2.x} y1={cy - 25} x2={p2.x} y2={cy} />
          <text x={cx} y={cy - 25} fill="#475569" fontSize="12" textAnchor="middle" stroke="none">b = {b}m</text>

          <line x1={p2.x + 10} y1={cy} x2={p3.x + 10} y2={p3.y} />
          <line x1={p2.x} y1={cy} x2={p2.x + 15} y2={cy} />
          <line x1={p3.x} y1={p3.y} x2={p3.x + 15} y2={p3.y} />
          <text x={p3.x + 20} y={cy - (H_total * scale) / 2} fill="#475569" fontSize="12" stroke="none">H = {H_total.toFixed(2)}m</text>
        </g>

        {/* Earthworks Layer */}
        <g stroke="#854d0e" strokeWidth="1.5" fill="none">
          {/* Surface */}
          <polyline points={`${cutLeftFinal.x},${cutLeftFinal.y} ${params.coRanhThoatNuoc ? ditchTopLeft.x + ',' + ditchTopLeft.y : bankOuterLeft.x + ',' + bankOuterLeft.y} ${bankInnerLeft.x},${bankInnerLeft.y}`} />
          <polyline points={`${bankInnerRight.x},${bankInnerRight.y} ${bankOuterRight.x},${bankOuterRight.y} ${fillRight.x},${fillRight.y}`} />
          <line x1={bankOuterLeft.x} y1={bankOuterLeft.y} x2={bankInnerLeft.x} y2={bankInnerLeft.y} />
          {ditchSvg}

          {/* Trench (Hố móng) */}
          <polyline points={`${trenchTopLeft.x},${trenchTopLeft.y} ${trenchLeftBottom.x},${trenchLeftBottom.y} ${dlotLeftBottom.x},${dlotLeftBottom.y} ${dlotRightBottom.x},${dlotRightBottom.y} ${trenchRightBottom.x},${trenchRightBottom.y} ${trenchTopRight.x},${trenchTopRight.y}`} stroke="#b45309" strokeWidth="1" strokeDasharray="4 3" />

          {/* Trench cut slope triangle (MDAO1) */}
          <g transform={`translate(${trenchLeftBottom.x - (trenchLeftBottom.y - bankOuterLeft.y) / 2 * params.MDAO1}, ${(trenchLeftBottom.y + bankOuterLeft.y) / 2})`}>
            <polyline points={`${-params.MDAO1 * 20},${-20} ${-params.MDAO1 * 20},0 0,0`} strokeWidth="1" />
            <text x={-params.MDAO1 * 20 - 5} y={-8} fill="#854d0e" fontSize="9" stroke="none" textAnchor="end">1</text>
            <text x={-params.MDAO1 * 10} y={10} fill="#854d0e" fontSize="9" stroke="none" textAnchor="middle">{params.MDAO1}</text>
          </g>

          {/* Natural Cut slope triangle (MDAO2) */}
          <polyline points={`${(params.coRanhThoatNuoc ? ditchTopLeft.x : bankOuterLeft.x) - params.MDAO2 * scale},${(params.coRanhThoatNuoc ? ditchTopLeft.y : bankOuterLeft.y) - 1 * scale} ${(params.coRanhThoatNuoc ? ditchTopLeft.x : bankOuterLeft.x) - params.MDAO2 * scale},${params.coRanhThoatNuoc ? ditchTopLeft.y : bankOuterLeft.y} ${params.coRanhThoatNuoc ? ditchTopLeft.x : bankOuterLeft.x},${params.coRanhThoatNuoc ? ditchTopLeft.y : bankOuterLeft.y}`} strokeWidth="1" />
          <text x={(params.coRanhThoatNuoc ? ditchTopLeft.x : bankOuterLeft.x) - params.MDAO2 * scale - 10} y={(params.coRanhThoatNuoc ? ditchTopLeft.y : bankOuterLeft.y) - 0.5 * scale + 5} fill="#854d0e" fontSize="10" stroke="none" textAnchor="end">1</text>
          <text x={(params.coRanhThoatNuoc ? ditchTopLeft.x : bankOuterLeft.x) - 0.5 * params.MDAO2 * scale} y={(params.coRanhThoatNuoc ? ditchTopLeft.y : bankOuterLeft.y) + 12} fill="#854d0e" fontSize="10" stroke="none" textAnchor="middle">{params.MDAO2}</text>

          {/* Fill slope triangle (MDAP) */}
          <polyline points={`${bankOuterRight.x + params.MDAP * scale},${bankOuterRight.y + 1 * scale} ${bankOuterRight.x + params.MDAP * scale},${bankOuterRight.y} ${bankOuterRight.x},${bankOuterRight.y}`} strokeWidth="1" />
          <text x={bankOuterRight.x + params.MDAP * scale + 10} y={bankOuterRight.y + 0.5 * scale + 5} fill="#854d0e" fontSize="10" stroke="none" textAnchor="start">1</text>
          <text x={bankOuterRight.x + 0.5 * params.MDAP * scale} y={bankOuterRight.y - 5} fill="#854d0e" fontSize="10" stroke="none" textAnchor="middle">{params.MDAP}</text>

          {/* DTM lines (Đường tự nhiên) */}
          <line x1={cutLeftFinal.x - 40} y1={cutLeftFinal.y} x2={cutLeftFinal.x + 10} y2={cutLeftFinal.y} strokeDasharray="5,5" strokeWidth="1" />
          <text x={cutLeftFinal.x - 45} y={cutLeftFinal.y + 4} fill="#854d0e" fontSize="11" stroke="none" textAnchor="end">DTM</text>

          <line x1={fillRight.x - 10} y1={fillRight.y} x2={fillRight.x + 40} y2={fillRight.y} strokeDasharray="5,5" strokeWidth="1" />
          <text x={fillRight.x + 45} y={fillRight.y + 4} fill="#854d0e" fontSize="11" stroke="none" textAnchor="start">DTM</text>
        </g>

        {/* Structure Layer (Concrete) */}
        <g stroke="#334155" strokeWidth="2" fill="#e2e8f0">
          <polygon points={concretePolygon} />
          <polygon points={dlotPolygon} fill="#f8fafc" strokeDasharray="2 2" />
          {ditchSvg}
          {/* Top of walls lines */}
          <line x1={p0.x} y1={p0.y} x2={outerLeftTop.x} y2={outerLeftTop.y} />
          <line x1={p3.x} y1={p3.y} x2={outerRightTop.x} y2={outerRightTop.y} />
        </g>

        {/* Water Layer */}
        <g fill="rgba(56, 189, 248, 0.4)" stroke="#0ea5e9" strokeWidth="1">
          <polygon points={`${wl_left.x},${wl_left.y} ${p1_top.x},${p1_top.y} ${p1_right.x},${p1_right.y} ${p2_left.x},${p2_left.y} ${p2_top.x},${p2_top.y} ${wl_right.x},${wl_right.y}`} />
          <line x1={wl_left.x} y1={wl_left.y} x2={wl_right.x} y2={wl_right.y} strokeDasharray="5,5" />
        </g>
      </svg>
    );
  };
  return (
    <div className="flex w-full h-full bg-slate-50">
      {/* Main SVG View */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded shadow-sm text-sm font-medium text-slate-700 border border-slate-200 z-10">
            Mặt cắt thiết kế đoạn {selectedSegmentIdx + 1}
          </div>
          {drawCrossSection()}
        </div>
      </div>

      {/* Right Sidebar (Parameters) */}
      <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-3 border-b border-slate-200 font-semibold text-sm text-slate-800 bg-slate-50 flex items-center justify-between">
          <span>Thông số cấu tạo</span>
          <button onClick={applyToAll} className="text-blue-600 text-[11px] hover:underline">Áp dụng cho tất cả</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          <div className="space-y-3">
            <select
              value={selectedSegmentIdx}
              onChange={(e) => setSelectedSegmentIdx(Number(e.target.value))}
              className="w-full bg-slate-100 border border-slate-300 text-slate-700 text-[13px] rounded px-3 py-2 outline-none focus:border-blue-500 font-semibold cursor-pointer"
            >
              {computedSegments.map((seg, idx) => {
                const startNode = flowNodes[seg.startIdx];
                const endNode = seg.endIdx !== null ? flowNodes[seg.endIdx] : flowNodes[flowNodes.length - 1];
                return (
                  <option key={idx} value={idx}>
                    Đoạn {idx + 1}: K{(startNode.chainage / 1000).toFixed(0)}+{((startNode.chainage % 1000).toFixed(2)).padStart(6, '0')} - K{(endNode.chainage / 1000).toFixed(0)}+{((endNode.chainage % 1000).toFixed(2)).padStart(6, '0')}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Thông số hình học (Bê tông)</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Bề dày đỉnh B1 (m)</span>
                <input type="number" step="0.01" value={params.B1} onChange={e => handleParamChange('B1', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Bề dày chân B2 (m)</span>
                <input type="number" step="0.01" value={params.B2} onChange={e => handleParamChange('B2', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Lưu không B3 (m)</span>
                <input type="number" step="0.01" value={params.B3} onChange={e => handleParamChange('B3', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Vát góc VAT (m)</span>
                <input type="number" step="0.01" value={params.VAT} onChange={e => handleParamChange('VAT', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Đáy chịu lực DDAY (m)</span>
                <input type="number" step="0.01" value={params.DDAY} onChange={e => handleParamChange('DDAY', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Đáy lót DLOT (m)</span>
                <input type="number" step="0.01" value={params.DLOT} onChange={e => handleParamChange('DLOT', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Hạ thấp bờ DBO (m)</span>
                <input type="number" step="0.01" value={params.DBO} onChange={e => handleParamChange('DBO', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Thông số Đào/Đắp & Bờ Kênh</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Bề rộng bờ trái BT</span>
                <input type="number" step="0.1" value={params.BT_trai} onChange={e => handleParamChange('BT_trai', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Bề rộng bờ phải BT</span>
                <input type="number" step="0.1" value={params.BT_phai} onChange={e => handleParamChange('BT_phai', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Mái đào hố móng</span>
                <input type="number" step="0.1" value={params.MDAO1} onChange={e => handleParamChange('MDAO1', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Mái đào nền tự nhiên</span>
                <input type="number" step="0.1" value={params.MDAO2} onChange={e => handleParamChange('MDAO2', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Mái đắp bờ kênh</span>
                <input type="number" step="0.1" value={params.MDAP} onChange={e => handleParamChange('MDAP', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1 col-span-2">
                <span className="text-slate-500">Mái dốc bên Đào</span>
                <select value={params.bankCutOption || 'dap_bo'} onChange={e => handleParamChange('bankCutOption', e.target.value, false)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white">
                  <option value="dap_bo">Đắp bờ dốc xuống (mặc định)</option>
                  <option value="mo_rong_bo">Mở rộng thềm bờ nằm ngang</option>
                </select>
              </label>
              {params.bankCutOption === 'mo_rong_bo' && (
                <label className="flex items-center gap-3 cursor-pointer mt-1 col-span-2">
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" className="sr-only peer" checked={params.coRanhThoatNuocMai || false} onChange={e => handleParamChange('coRanhThoatNuocMai', e.target.checked, false)} />
                    <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-[12px] font-medium text-slate-700">Có rãnh thoát nước mái (rãnh biên)</span>
                </label>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Tùy chọn phụ trợ</h4>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={params.coRanhThoatNuoc} onChange={e => handleParamChange('coRanhThoatNuoc', e.target.checked, false)} />
                <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-[13px] font-medium text-slate-700">Có rãnh thoát nước</span>
            </label>

            {params.coRanhThoatNuoc && (
              <div className="grid grid-cols-3 gap-2 pl-4 border-l-2 border-slate-200 ml-2 mt-2">
                <label className="text-[11px] text-slate-700 flex flex-col gap-1">
                  <span className="text-slate-500">Rộng (m)</span>
                  <input type="number" step="0.1" value={params.BTN} onChange={e => handleParamChange('BTN', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                </label>
                <label className="text-[11px] text-slate-700 flex flex-col gap-1">
                  <span className="text-slate-500">Sâu (m)</span>
                  <input type="number" step="0.1" value={params.HTN} onChange={e => handleParamChange('HTN', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                </label>
                <label className="text-[11px] text-slate-700 flex flex-col gap-1">
                  <span className="text-slate-500">Dày (m)</span>
                  <input type="number" step="0.1" value={params.DTN} onChange={e => handleParamChange('DTN', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                </label>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={params.coTrongCo} onChange={e => handleParamChange('coTrongCo', e.target.checked, false)} />
                <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-green-500"></div>
              </div>
              <span className="text-[13px] font-medium text-slate-700">Trồng cỏ bảo vệ mái</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={params.coNgamMong} onChange={e => handleParamChange('coNgamMong', e.target.checked, false)} />
                <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
              <span className="text-[13px] font-medium text-slate-700">Có ngàm móng</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={params.coBocThaoMoc} onChange={e => handleParamChange('coBocThaoMoc', e.target.checked, false)} />
                <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-amber-600"></div>
              </div>
              <span className="text-[13px] font-medium text-slate-700">Bóc thảo mộc (đắp nền)</span>
            </label>

            {params.coBocThaoMoc && (
              <div className="pl-4 border-l-2 border-slate-200 ml-2 mt-2">
                <label className="text-[11px] text-slate-700 flex flex-col gap-1 w-1/3">
                  <span className="text-slate-500">Chiều dày (m)</span>
                  <input type="number" step="0.05" value={params.dayBocThaoMoc} onChange={e => handleParamChange('dayBocThaoMoc', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                </label>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="space-y-3 pb-4">
            <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Vật liệu sử dụng</h4>
            <div className="space-y-2">
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Vật liệu làm kênh</span>
                <input type="text" value={params.vatLieuKenh} onChange={e => handleParamChange('vatLieuKenh', e.target.value, false)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                <span className="text-slate-500">Vật liệu lót</span>
                <input type="text" value={params.vatLieuLot} onChange={e => handleParamChange('vatLieuLot', e.target.value, false)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
              </label>
              {params.coRanhThoatNuoc && (
                <label className="text-[12px] text-slate-700 flex flex-col gap-1">
                  <span className="text-slate-500">Vật liệu rãnh thu nước</span>
                  <input type="text" value={params.vatLieuRanh} onChange={e => handleParamChange('vatLieuRanh', e.target.value, false)} className="w-full border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                </label>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
