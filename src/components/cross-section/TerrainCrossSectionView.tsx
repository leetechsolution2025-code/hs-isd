import React, { useEffect, useState } from 'react';
import { CrossSectionStake, CrossSectionPoint } from './CrossSectionDesignWorkspace';

interface TerrainCrossSectionViewProps {
  stake: CrossSectionStake | null;
  computedSegments: any[];
  segmentHydraulicResults: Record<number, any>;
  flowNodes: any[];
  nodeElevations: any;
  crossSectionParams: Record<number, any>;
}

export default function TerrainCrossSectionView({
  stake,
  computedSegments,
  segmentHydraulicResults,
  flowNodes,
  nodeElevations,
  crossSectionParams
}: TerrainCrossSectionViewProps) {
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 400;

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('terrain-svg-container');
      if (container) {
        setSvgWidth(container.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!stake) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        Chưa chọn cọc địa hình
      </div>
    );
  }

  // Find matching segment based on chainage and interpolate elevations
  const stakeChainage = stake.chainage;
  let selectedSegmentIdx = 0;
  let dayKenhAtStake = 0;
  let waterLevelAtStake = 0;
  let topLevelAtStake = 0;

  for (let i = 0; i < computedSegments.length; i++) {
    const seg = computedSegments[i];
    const startNode = flowNodes[seg.startIdx];
    const endNode = seg.endIdx !== null ? flowNodes[seg.endIdx] : flowNodes[flowNodes.length - 1];
    if (stakeChainage >= (startNode?.chainage || 0) && stakeChainage <= (endNode?.chainage || Infinity)) {
      selectedSegmentIdx = i;

      const startC = startNode?.chainage || 0;
      const endC = endNode?.chainage || 0;

      const startDay = nodeElevations[i]?.[seg.startIdx] ?? null;
      const endDay = nodeElevations[i]?.[seg.endIdx] ?? startDay;

      const res = segmentHydraulicResults[i] || {};
      const isDesigned = res && res.b_out !== undefined;
      const h_max_val = res.h_max ? Number(res.h_max) : 0;
      const safeHeightVal = res.safeHeight ? Number(res.safeHeight) : 0.3;

      const startWater = (startDay !== null && isDesigned && res.h_des) ? startDay + Number(res.h_des) : null;
      const endWater = (endDay !== null && isDesigned && res.h_des) ? endDay + Number(res.h_des) : startWater;

      const startTop = (startDay !== null && isDesigned) ? startDay + h_max_val + safeHeightVal : null;
      const endTop = (endDay !== null && isDesigned) ? endDay + h_max_val + safeHeightVal : startTop;

      if (endC > startC) {
        const ratio = (stakeChainage - startC) / (endC - startC);
        dayKenhAtStake = (startDay || 0) + ratio * ((endDay || 0) - (startDay || 0));
        waterLevelAtStake = (startWater || 0) + ratio * ((endWater || 0) - (startWater || 0));
        topLevelAtStake = (startTop || 0) + ratio * ((endTop || 0) - (startTop || 0));
      } else {
        dayKenhAtStake = startDay || 0;
        waterLevelAtStake = startWater || 0;
        topLevelAtStake = startTop || 0;
      }
      break;
    }
  }

  const selectedSegment = computedSegments[selectedSegmentIdx];
  const selectedHydraulics = segmentHydraulicResults[selectedSegmentIdx] || {};
  const defaultParams = {
    B1: 0.2, B2: 0.35, B3: 0.3, VAT: 0.15, DDAY: 0.35, DLOT: 0.1, DBO: 0.7,
    m_trong: 1.5, m_dao: 1.0, m_dap: 1.25,
    b_dao: 0.8, b_dap: 0.8,
    coNgamMong: false, coRanhThoatNuoc: false, coTuongChan: false,
    R_ranh: 0.4, S_ranh: 0.4, D_ranh: 0.1, H_tuong: 1.0, B_tuong: 0.2
  };
  const params = { ...defaultParams, ...(crossSectionParams[selectedSegmentIdx] || {}) };

  const b = selectedHydraulics.b_out !== undefined ? parseFloat(selectedHydraulics.b_out) : (selectedHydraulics.b !== undefined ? parseFloat(selectedHydraulics.b) : 1.0);
  const Htk = selectedHydraulics.h_des !== undefined ? parseFloat(selectedHydraulics.h_des) : (selectedHydraulics.h !== undefined ? parseFloat(selectedHydraulics.h) : 1.0);
  const h_safe = selectedHydraulics.safeHeight !== undefined ? parseFloat(selectedHydraulics.safeHeight) : 0.3;
  const H_total = Htk + h_safe;
  const m_trong = selectedHydraulics.m !== undefined ? parseFloat(selectedHydraulics.m) : 1.5;

  const drawCrossSection = () => {
    const scale = 40;
    const cx = svgWidth / 2;
    const cy = 250; // Shift down a bit to make room for terrain

    // ----------------------------------------------------------------
    // 1. Calculate Concrete Geometry (Same as Tab 1)
    // ----------------------------------------------------------------
    const innerBottomWidth = b * scale;
    const innerHeight = H_total * scale;
    const dx_inner = innerHeight * m_trong;

    const p1 = { x: cx - innerBottomWidth / 2, y: cy };
    const p2 = { x: cx + innerBottomWidth / 2, y: cy };
    const p3 = { x: p2.x + dx_inner, y: cy - innerHeight };
    const p4 = { x: p1.x - dx_inner, y: cy - innerHeight };

    const w_vat = params.VAT * scale;
    const w_B1 = params.B1 * scale;
    const w_B2 = params.B2 * scale;
    const h_DDAY = params.DDAY * scale;
    const h_DLOT = params.DLOT * scale;

    const v1 = { x: p1.x - w_vat, y: p1.y };
    const v2 = { x: p1.x, y: p1.y - w_vat };
    const v3 = { x: p2.x, y: p2.y - w_vat };
    const v4 = { x: p2.x + w_vat, y: p2.y };

    const topRightOuter = { x: p3.x + w_B1, y: p3.y };
    const toRightBottomOuter = { x: p3.x + w_B1 + innerHeight * m_trong, y: p1.y };
    const concRightBottom = { x: p2.x + w_B2, y: p1.y + h_DDAY };
    const concLeftBottom = { x: p1.x - w_B2, y: p1.y + h_DDAY };
    const toLeftBottomOuter = { x: p4.x - w_B1 - innerHeight * m_trong, y: p1.y };
    const topLeftOuter = { x: p4.x - w_B1, y: p4.y };

    const dx_outer = h_DDAY * m_trong;
    const outerRightBottom = { x: toRightBottomOuter.x + dx_outer, y: concRightBottom.y };
    const outerLeftBottom = { x: toLeftBottomOuter.x - dx_outer, y: concLeftBottom.y };

    const concreteExt = params.coNgamMong ? params.B3 : 0;
    const trenchExt = params.B3;

    const concLeftExt = { x: outerLeftBottom.x - concreteExt * scale, y: concLeftBottom.y };
    const concRightExt = { x: outerRightBottom.x + concreteExt * scale, y: concRightBottom.y };

    const concretePolygon = `${topLeftOuter.x},${topLeftOuter.y} ${p4.x},${p4.y} ${v2.x},${v2.y} ${v3.x},${v3.y} ${p3.x},${p3.y} ${topRightOuter.x},${topRightOuter.y} ${outerRightBottom.x},${outerRightBottom.y} ${concRightExt.x},${concRightExt.y} ${concLeftExt.x},${concLeftExt.y} ${outerLeftBottom.x},${outerLeftBottom.y}`;

    const dlotLeftTop = { x: outerLeftBottom.x - concreteExt * scale, y: concLeftBottom.y };
    const dlotRightTop = { x: outerRightBottom.x + concreteExt * scale, y: concRightBottom.y };
    const dlotRightBottom = { x: dlotRightTop.x, y: dlotRightTop.y + h_DLOT };
    const dlotLeftBottom = { x: dlotLeftTop.x, y: dlotLeftTop.y + h_DLOT };

    const dlotPolygon = `${dlotLeftTop.x},${dlotLeftTop.y} ${dlotRightTop.x},${dlotRightTop.y} ${dlotRightBottom.x},${dlotRightBottom.y} ${dlotLeftBottom.x},${dlotLeftBottom.y}`;

    const trenchLeftBottom = { x: outerLeftBottom.x - trenchExt * scale, y: dlotLeftBottom.y };
    const trenchRightBottom = { x: outerRightBottom.x + trenchExt * scale, y: dlotRightBottom.y };

    // Excavation / Backfill Banks
    const w_bankL = params.b_dao * scale;
    const w_bankR = params.b_dap * scale;
    const drop = params.DBO * scale;

    const bankInnerLeft = { x: topLeftOuter.x - w_bankL, y: topLeftOuter.y };
    const bankOuterLeft = { x: bankInnerLeft.x, y: bankInnerLeft.y + drop };
    const bankInnerRight = { x: topRightOuter.x + w_bankR, y: topRightOuter.y };
    const bankOuterRight = { x: bankInnerRight.x, y: bankInnerRight.y + drop };

    // Trench sloped lines (dashed)
    const cutLeft = { x: trenchLeftBottom.x - (trenchLeftBottom.y - bankOuterLeft.y) * params.m_dao, y: bankOuterLeft.y };
    const cutRight = { x: trenchRightBottom.x + (trenchRightBottom.y - bankOuterRight.y) * params.m_dao, y: bankOuterRight.y };

    let ditchSvg = null;
    let cutLeftFinal = cutLeft;
    let ditchTopLeft = bankOuterLeft;

    if (params.coRanhThoatNuoc) {
      const wR = params.R_ranh * scale;
      const hR = params.S_ranh * scale;
      const tR = params.D_ranh * scale;

      ditchTopLeft = { x: bankOuterLeft.x - wR, y: bankOuterLeft.y };
      const dbl = { x: ditchTopLeft.x, y: ditchTopLeft.y + hR };
      const dbr = { x: bankOuterLeft.x, y: bankOuterLeft.y + hR };

      const out_dtl = { x: ditchTopLeft.x - tR, y: ditchTopLeft.y };
      const out_dbl = { x: out_dtl.x, y: dbl.y + tR };
      const out_dbr = { x: bankOuterLeft.x + tR, y: dbr.y + tR };
      const out_dtr = { x: bankOuterLeft.x + tR, y: bankOuterLeft.y };

      const ditchPath = `${ditchTopLeft.x},${ditchTopLeft.y} ${dbl.x},${dbl.y} ${dbr.x},${dbr.y} ${bankOuterLeft.x},${bankOuterLeft.y} ${out_dtr.x},${out_dtr.y} ${out_dbr.x},${out_dbr.y} ${out_dbl.x},${out_dbl.y} ${out_dtl.x},${out_dtl.y}`;

      ditchSvg = (
        <polygon points={ditchPath} fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
      );

      cutLeftFinal = { x: trenchLeftBottom.x - (trenchLeftBottom.y - out_dtl.y) * params.m_dao, y: out_dtl.y };
    }

    // ----------------------------------------------------------------
    // 2. Map Terrain Data to SVG Coordinates
    // ----------------------------------------------------------------
    const centerOffset = stake.centerOffset || 10.0;

    // Function to map (offset, elevation) to (x, y)
    const mapPoint = (p: CrossSectionPoint) => {
      const x = cx + (p.offset - centerOffset) * scale;
      const y = cy - (p.elevation - dayKenhAtStake) * scale;
      return { x, y };
    };

    const dtmPoints = stake.points.map(mapPoint);
    const dtmPointsString = dtmPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <svg width="100%" height="100%" className="absolute inset-0 z-0">
        {/* Bản vẽ trống, chờ hướng dẫn... */}
      </svg>
    );
  };

  return (
    <div id="terrain-svg-container" className="w-full h-full relative flex items-center justify-center">
      {/* Thông tin cọc */}
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur border border-slate-200 p-3 rounded-md shadow-sm z-10 text-sm pointer-events-none">
        <div className="font-bold text-slate-800 text-base mb-1">
          Cọc {stake.name} (Lý trình: {stake.chainage.toFixed(2)})
        </div>
        <div className="text-slate-600 flex items-center space-x-2">
          <span>Đoạn số {selectedSegmentIdx + 1}</span>
          <span className="text-slate-300">|</span>
          <span>Cao độ đáy: <strong className="text-slate-800">{dayKenhAtStake.toFixed(2)}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Mực nước TK: <strong className="text-blue-600">{waterLevelAtStake.toFixed(2)}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Đỉnh kênh: <strong className="text-slate-800">{topLevelAtStake.toFixed(2)}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Hmax: <strong className="text-slate-800">{(selectedHydraulics.h_max ? Number(selectedHydraulics.h_max) : 0).toFixed(2)}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Độ cao an toàn: <strong className="text-slate-800">{(selectedHydraulics.safeHeight ? Number(selectedHydraulics.safeHeight) : 0.3).toFixed(2)}</strong></span>
        </div>
      </div>

      {drawCrossSection()}
    </div>
  );
}
