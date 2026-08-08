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
  const [svgHeight, setSvgHeight] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('terrain-svg-container');
      if (container) {
        setSvgWidth(container.clientWidth);
        setSvgHeight(container.clientHeight);
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
    B1: 0.2, B2: 0.25, B3: 0.4, VAT: 0.1, DDAY: 0.2, DLOT: 0.1, DBO: 0.3,
    BT_trai: 1.5, BT_phai: 1.5, MDAO1: 1.5, MDAO2: 1.0, MDAP: 1.75,
    coRanhThoatNuoc: false, DTN: 0.4, BTN: 0.4, HTN: 0.4, coTrongCo: false,
    coNgamMong: false,
    vatLieuKenh: 'Bê tông cốt thép M250', vatLieuLot: 'Bê tông lót M100', vatLieuRanh: 'Xây gạch mác 75'
  };
  const params = { ...defaultParams, ...(crossSectionParams[selectedSegmentIdx] || {}) };

  const _bOut = parseFloat(selectedHydraulics.b_out);
  const _b = parseFloat(selectedHydraulics.b);
  const b = !isNaN(_bOut) ? _bOut : (!isNaN(_b) ? _b : 1.0);

  const _hDes = parseFloat(selectedHydraulics.h_des);
  const _h = parseFloat(selectedHydraulics.h);
  const Htk = !isNaN(_hDes) ? _hDes : (!isNaN(_h) ? _h : 1.0);

  const _hMax = parseFloat(selectedHydraulics.h_max);
  const h_max_for_draw = !isNaN(_hMax) ? _hMax : Htk;

  const _hSafe = parseFloat(selectedHydraulics.safeHeight);
  const h_safe = !isNaN(_hSafe) ? _hSafe : 0.3;

  const H_total = h_max_for_draw + h_safe;

  const _m = parseFloat(selectedHydraulics.m);
  const m_trong = !isNaN(_m) ? _m : 1.5;

  const drawCrossSection = () => {
    // ----------------------------------------------------------------
    // 1. Check for terrain data
    // ----------------------------------------------------------------
    if (!stake.points || stake.points.length < 2) {
      return (
        <svg width="100%" height="100%" className="absolute inset-0 z-0">
          <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8" fontSize="14">Chưa có dữ liệu địa hình cho cọc này</text>
        </svg>
      );
    }

    // ----------------------------------------------------------------
    // STEP 1: Real-world Coordinates for Parametric Geometry
    // ----------------------------------------------------------------
    const cx_real = stake.centerOffset;
    const cy_real = dayKenhAtStake;
    const b_half = b / 2;

    const p1 = { x: cx_real - b_half, y: cy_real };
    const p2 = { x: cx_real + b_half, y: cy_real };
    const p0 = { x: p1.x - (m_trong * H_total), y: cy_real + H_total };
    const p3 = { x: p2.x + (m_trong * H_total), y: cy_real + H_total };

    const h_des = selectedHydraulics.h_des ? parseFloat(selectedHydraulics.h_des) : Htk;
    const water_elev = dayKenhAtStake + h_des;
    const water_left_off = p1.x - m_trong * h_des;
    const water_right_off = p2.x + m_trong * h_des;

    const vatX = Number(params.VAT) || 0;
    const vatY = Number(params.VAT) || 0;
    const p1_top = { x: p1.x - vatX * m_trong, y: p1.y + vatY };
    const p1_right = { x: p1.x + vatX, y: p1.y };
    const p2_left = { x: p2.x - vatX, y: p2.y };
    const p2_top = { x: p2.x + vatX * m_trong, y: p2.y + vatY };

    const pB1 = Number(params.B1) || 0;
    const pB2 = Number(params.B2) || 0;
    const pB3 = Number(params.B3) || 0;
    const outerLeftTop = { x: p0.x - pB1, y: p0.y };
    const outerRightTop = { x: p3.x + pB1, y: p3.y };
    const outerLeftBottom = { x: p1.x - pB2, y: p1.y };
    const outerRightBottom = { x: p2.x + pB2, y: p2.y };

    const concreteExt = params.coNgamMong ? pB3 : 0;
    const trenchExt = pB3;

    const pDDAY = Number(params.DDAY) || 0;
    const concLeftTop = { x: outerLeftBottom.x - concreteExt, y: outerLeftBottom.y };
    const concRightTop = { x: outerRightBottom.x + concreteExt, y: outerRightBottom.y };
    const concLeftBottom = { x: concLeftTop.x, y: concLeftTop.y - pDDAY };
    const concRightBottom = { x: concRightTop.x, y: concRightTop.y - pDDAY };

    const pDLOT = Number(params.DLOT) || 0;
    const dlotLeftTop = { x: concLeftBottom.x, y: concLeftBottom.y };
    const dlotRightTop = { x: concRightBottom.x, y: concRightBottom.y };
    const dlotLeftBottom = { x: dlotLeftTop.x, y: dlotLeftTop.y - pDLOT };
    const dlotRightBottom = { x: dlotRightTop.x, y: dlotRightTop.y - pDLOT };

    const pDBO = Number(params.DBO) || 0;
    const bankElevLeft = p0.y - pDBO;
    const bankElevRight = p3.y - pDBO;

    const outerWallLeftSlope = (outerLeftTop.x - outerLeftBottom.x) / (outerLeftTop.y - outerLeftBottom.y || 0.001);
    const bankInnerLeft = { x: outerLeftBottom.x + (bankElevLeft - outerLeftBottom.y) * outerWallLeftSlope, y: bankElevLeft };
    const outerWallRightSlope = (outerRightTop.x - outerRightBottom.x) / (outerRightTop.y - outerRightBottom.y || 0.001);
    const bankInnerRight = { x: outerRightBottom.x + (bankElevRight - outerRightBottom.y) * outerWallRightSlope, y: bankElevRight };

    const pBT_trai = Number(params.BT_trai) || 0;
    const pBT_phai = Number(params.BT_phai) || 0;
    let bankOuterLeft = { x: bankInnerLeft.x - pBT_trai, y: bankElevLeft };
    let bankOuterRight = { x: bankInnerRight.x + pBT_phai, y: bankElevRight };

    const pMDAO1 = Number(params.MDAO1) || 0;
    const pMDAO2 = Number(params.MDAO2) || 0;
    const pMDAP = Number(params.MDAP) || 0;
    const getTerrainElev = (x: number): number => {
      if (x <= stake.points[0].offset) return stake.points[0].elevation;
      if (x >= stake.points[stake.points.length - 1].offset) return stake.points[stake.points.length - 1].elevation;
      for (let i = 0; i < stake.points.length - 1; i++) {
        const pA = stake.points[i];
        const pB = stake.points[i + 1];
        if (x >= pA.offset && x <= pB.offset) {
          const ratio = (x - pA.offset) / (pB.offset - pA.offset);
          return pA.elevation + ratio * (pB.elevation - pA.elevation);
        }
      }
      return stake.points[0].elevation;
    };

    const findIntersection = (startPt: { x: number, y: number }, vx: number, vy: number): { x: number, y: number } => {
      let closestPt = null;
      let minT = Infinity;

      for (let i = 0; i < stake.points.length - 1; i++) {
        const pA = stake.points[i];
        const pB = stake.points[i + 1];

        const x1 = startPt.x, y1 = startPt.y;
        const x2 = startPt.x + vx, y2 = startPt.y + vy;
        const x3 = pA.offset, y3 = pA.elevation;
        const x4 = pB.offset, y4 = pB.elevation;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) continue;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        if (t > 0 && u >= 0 && u <= 1) {
          if (t < minT) {
            minT = t;
            closestPt = { x: x1 + t * vx, y: y1 + t * vy };
          }
        }
      }
      if (closestPt) return closestPt;
      return { x: startPt.x + vx * 10, y: startPt.y + vy * 10 };
    };

    const trenchLeftBottom = { x: outerLeftBottom.x - trenchExt, y: dlotLeftBottom.y };
    const trenchRightBottom = { x: outerRightBottom.x + trenchExt, y: dlotRightBottom.y };

    let trenchTopLeft = trenchLeftBottom;
    if (getTerrainElev(trenchLeftBottom.x) > trenchLeftBottom.y) {
      trenchTopLeft = findIntersection(trenchLeftBottom, -pMDAO1, 1);
    }

    let trenchTopRight = trenchRightBottom;
    if (getTerrainElev(trenchRightBottom.x) > trenchRightBottom.y) {
      trenchTopRight = findIntersection(trenchRightBottom, pMDAO1, 1);
    }

    const x_trench_left_top = trenchLeftBottom.x - (bankElevLeft - trenchLeftBottom.y) * pMDAO1;
    let isInsideTrenchLeft = (bankElevLeft <= trenchTopLeft.y && x_trench_left_top < bankOuterLeft.x);

    let test_bank_x_l = Math.min(bankOuterLeft.x, x_trench_left_top);
    let isLeftCut = isInsideTrenchLeft ? false : (getTerrainElev(test_bank_x_l) > bankElevLeft);
    let hasDitchLeft = false;

    if (isLeftCut && pMDAO1 > 0 && params.coRanhThoatNuoc) {
      const hDitch = Number(params.HTN) || 0;
      const tDitch = Number(params.DTN) || 0;
      const bDitch = Number(params.BTN) || 0;
      const ditchBotY = bankElevLeft - hDitch - tDitch;
      let x_trench_left_bot = trenchLeftBottom.x - (ditchBotY - trenchLeftBottom.y) * pMDAO1;
      let potential_bank_x = Math.min(bankOuterLeft.x, x_trench_left_bot);
      let potential_ditch_end_x = potential_bank_x - (bDitch + 2 * tDitch);

      if (getTerrainElev(potential_ditch_end_x) > bankElevLeft) {
        hasDitchLeft = true;
        bankOuterLeft.x = potential_bank_x;
      }
    }

    if (!hasDitchLeft && isLeftCut && pMDAO1 > 0) {
      bankOuterLeft.x = Math.min(bankOuterLeft.x, x_trench_left_top);
      isLeftCut = (getTerrainElev(bankOuterLeft.x) > bankElevLeft);
    }

    const x_trench_right_top = trenchRightBottom.x + (bankElevRight - trenchRightBottom.y) * pMDAO1;
    let isInsideTrenchRight = (bankElevRight <= trenchTopRight.y && x_trench_right_top > bankOuterRight.x);

    let test_bank_x_r = Math.max(bankOuterRight.x, x_trench_right_top);
    let isRightCut = isInsideTrenchRight ? false : (getTerrainElev(test_bank_x_r) > bankElevRight);
    let hasDitchRight = false;

    if (isRightCut && pMDAO1 > 0 && params.coRanhThoatNuoc) {
      const hDitch = Number(params.HTN) || 0;
      const tDitch = Number(params.DTN) || 0;
      const bDitch = Number(params.BTN) || 0;
      const ditchBotY = bankElevRight - hDitch - tDitch;
      let x_trench_right_bot = trenchRightBottom.x + (ditchBotY - trenchRightBottom.y) * pMDAO1;
      let potential_bank_x = Math.max(bankOuterRight.x, x_trench_right_bot);
      let potential_ditch_end_x = potential_bank_x + (bDitch + 2 * tDitch);

      if (getTerrainElev(potential_ditch_end_x) > bankElevRight) {
        hasDitchRight = true;
        bankOuterRight.x = potential_bank_x;
      }
    }

    if (!hasDitchRight && isRightCut && pMDAO1 > 0) {
      bankOuterRight.x = Math.max(bankOuterRight.x, x_trench_right_top);
      isRightCut = (getTerrainElev(bankOuterRight.x) > bankElevRight);
    }

    let ditchTopLeft = bankOuterLeft;
    let ditchPolys: string = "";
    if (hasDitchLeft) {
      const bDitch = Number(params.BTN) || 0;
      const hDitch = Number(params.HTN) || 0;
      const tDitch = Number(params.DTN) || 0;

      const ditchTopRight = { x: bankOuterLeft.x, y: bankOuterLeft.y };
      ditchTopLeft = { x: ditchTopRight.x - (bDitch + 2 * tDitch), y: ditchTopRight.y };
      const ditchOuterBotRight = { x: ditchTopRight.x, y: ditchTopRight.y - hDitch - tDitch };
      const ditchOuterBotLeft = { x: ditchTopLeft.x, y: ditchTopLeft.y - hDitch - tDitch };
      const ditchInnerTopRight = { x: ditchTopRight.x - tDitch, y: ditchTopRight.y };
      const ditchInnerTopLeft = { x: ditchTopLeft.x + tDitch, y: ditchTopLeft.y };
      const ditchInnerBotRight = { x: ditchInnerTopRight.x, y: ditchInnerTopRight.y - hDitch };
      const ditchInnerBotLeft = { x: ditchInnerTopLeft.x, y: ditchInnerTopLeft.y - hDitch };

      ditchPolys = `${ditchTopRight.x},${ditchTopRight.y} ${ditchOuterBotRight.x},${ditchOuterBotRight.y} ${ditchOuterBotLeft.x},${ditchOuterBotLeft.y} ${ditchTopLeft.x},${ditchTopLeft.y} ${ditchInnerTopLeft.x},${ditchInnerTopLeft.y} ${ditchInnerBotLeft.x},${ditchInnerBotLeft.y} ${ditchInnerBotRight.x},${ditchInnerBotRight.y} ${ditchInnerTopRight.x},${ditchInnerTopRight.y}`;
    }

    let ditchTopRightRight = bankOuterRight;
    let ditchPolysRight: string = "";
    if (hasDitchRight) {
      const bDitch = Number(params.BTN) || 0;
      const hDitch = Number(params.HTN) || 0;
      const tDitch = Number(params.DTN) || 0;

      const ditchTopLeftRight = { x: bankOuterRight.x, y: bankOuterRight.y };
      ditchTopRightRight = { x: ditchTopLeftRight.x + (bDitch + 2 * tDitch), y: ditchTopLeftRight.y };
      const ditchOuterBotRightR = { x: ditchTopRightRight.x, y: ditchTopRightRight.y - hDitch - tDitch };
      const ditchOuterBotLeftR = { x: ditchTopLeftRight.x, y: ditchTopLeftRight.y - hDitch - tDitch };
      const ditchInnerTopRightR = { x: ditchTopRightRight.x - tDitch, y: ditchTopRightRight.y };
      const ditchInnerTopLeftR = { x: ditchTopLeftRight.x + tDitch, y: ditchTopLeftRight.y };
      const ditchInnerBotRightR = { x: ditchInnerTopRightR.x, y: ditchInnerTopRightR.y - hDitch };
      const ditchInnerBotLeftR = { x: ditchInnerTopLeftR.x, y: ditchInnerTopLeftR.y - hDitch };

      ditchPolysRight = `${ditchTopRightRight.x},${ditchTopRightRight.y} ${ditchOuterBotRightR.x},${ditchOuterBotRightR.y} ${ditchOuterBotLeftR.x},${ditchOuterBotLeftR.y} ${ditchTopLeftRight.x},${ditchTopLeftRight.y} ${ditchInnerTopLeftR.x},${ditchInnerTopLeftR.y} ${ditchInnerBotLeftR.x},${ditchInnerBotLeftR.y} ${ditchInnerBotRightR.x},${ditchInnerBotRightR.y} ${ditchInnerTopRightR.x},${ditchInnerTopRightR.y}`;
    }

    const groundYLeft = getTerrainElev(ditchTopLeft.x);
    let cutLeftFinal;
    const x_F_l = ditchTopLeft.x, y_F_l = ditchTopLeft.y;
    const x_T_l = trenchLeftBottom.x, y_T_l = trenchLeftBottom.y;
    if (isLeftCut) {
      cutLeftFinal = findIntersection(ditchTopLeft, -pMDAO2, 1);
    } else {
      const y_int_fill = (x_T_l - x_F_l + y_F_l * pMDAP + y_T_l * pMDAO1) / (pMDAO1 + pMDAP);
      if (y_int_fill >= y_T_l && y_int_fill <= trenchTopLeft.y && y_int_fill <= ditchTopLeft.y) {
        cutLeftFinal = { x: x_T_l - (y_int_fill - y_T_l) * pMDAO1, y: y_int_fill };
      } else {
        cutLeftFinal = findIntersection(ditchTopLeft, -pMDAP, -1);
      }
    }

    let fillRight;
    const x_F_r = ditchTopRightRight.x, y_F_r = ditchTopRightRight.y;
    const x_T_r = trenchRightBottom.x, y_T_r = trenchRightBottom.y;
    if (isRightCut) {
      fillRight = findIntersection(ditchTopRightRight, pMDAO2, 1);
    } else {
      const y_int_fill = (x_F_r - x_T_r + y_F_r * pMDAP + y_T_r * pMDAO1) / (pMDAO1 + pMDAP);
      if (y_int_fill >= y_T_r && y_int_fill <= trenchTopRight.y && y_int_fill <= bankOuterRight.y) {
        fillRight = { x: x_T_r + (y_int_fill - y_T_r) * pMDAO1, y: y_int_fill };
      } else {
        fillRight = findIntersection(bankOuterRight, pMDAP, -1);
      }
    }

    const trueExcavationPts: { x: number, y: number }[] = [];
    if (isLeftCut) {
      trueExcavationPts.push(cutLeftFinal);
      if (hasDitchLeft) {
        const hDitch = Number(params.HTN) || 0;
        const tDitch = Number(params.DTN) || 0;
        trueExcavationPts.push(
          ditchTopLeft,
          { x: ditchTopLeft.x, y: ditchTopLeft.y - hDitch - tDitch },
          { x: bankOuterLeft.x, y: bankOuterLeft.y - hDitch - tDitch }
        );
      } else {
        trueExcavationPts.push(bankOuterLeft);
      }
    } else {
      if (params.coBocThaoMoc) {
        const depth = Number(params.dayBocThaoMoc) || 0;
        const y_start = getTerrainElev(cutLeftFinal.x);
        trueExcavationPts.push({ x: cutLeftFinal.x, y: y_start });
        trueExcavationPts.push({ x: cutLeftFinal.x, y: y_start - depth });
        stake.points.forEach(p => {
          if (p.offset > cutLeftFinal.x && p.offset < trenchTopLeft.x) {
            trueExcavationPts.push({ x: p.offset, y: p.elevation - depth });
          }
        });
        const y_end = getTerrainElev(trenchTopLeft.x);
        trueExcavationPts.push({ x: trenchTopLeft.x, y: y_end - depth });
      } else {
        trueExcavationPts.push({ x: cutLeftFinal.x, y: cutLeftFinal.y });
        stake.points.forEach(p => {
          if (p.offset > cutLeftFinal.x && p.offset < trenchTopLeft.x) {
            trueExcavationPts.push({ x: p.offset, y: p.elevation });
          }
        });
        trueExcavationPts.push({ x: trenchTopLeft.x, y: getTerrainElev(trenchTopLeft.x) });
      }
    }
    trueExcavationPts.push(trenchLeftBottom, dlotLeftBottom, dlotRightBottom, trenchRightBottom);
    if (isRightCut) {
      if (hasDitchRight) {
        const hDitch = Number(params.HTN) || 0;
        const tDitch = Number(params.DTN) || 0;
        trueExcavationPts.push(
          { x: bankOuterRight.x, y: bankOuterRight.y - hDitch - tDitch },
          { x: ditchTopRightRight.x, y: ditchTopRightRight.y - hDitch - tDitch },
          ditchTopRightRight
        );
      } else {
        trueExcavationPts.push(bankOuterRight);
      }
      trueExcavationPts.push(fillRight);
    } else {
      if (params.coBocThaoMoc) {
        const depth = Number(params.dayBocThaoMoc) || 0;
        const y_start = getTerrainElev(trenchTopRight.x);
        trueExcavationPts.push({ x: trenchTopRight.x, y: y_start - depth });
        stake.points.forEach(p => {
          if (p.offset > trenchTopRight.x && p.offset < fillRight.x) {
            trueExcavationPts.push({ x: p.offset, y: p.elevation - depth });
          }
        });
        const y_end = getTerrainElev(fillRight.x);
        trueExcavationPts.push({ x: fillRight.x, y: y_end - depth });
        trueExcavationPts.push({ x: fillRight.x, y: y_end });
      } else {
        trueExcavationPts.push({ x: trenchTopRight.x, y: getTerrainElev(trenchTopRight.x) });
        stake.points.forEach(p => {
          if (p.offset > trenchTopRight.x && p.offset < fillRight.x) {
            trueExcavationPts.push({ x: p.offset, y: p.elevation });
          }
        });
        trueExcavationPts.push({ x: fillRight.x, y: fillRight.y });
      }
    }

    // ----------------------------------------------------------------
    // STEP 2: Determine data extents to auto-scale
    // ----------------------------------------------------------------
    const allOffsets = stake.points.map(p => p.offset);
    const allElevs = stake.points.map(p => p.elevation);

    const canalLeftOffset = cutLeftFinal.x - 2.0;
    const canalRightOffset = fillRight.x + 2.0;

    const minOffset = Math.min(...allOffsets, canalLeftOffset);
    const maxOffset = Math.max(...allOffsets, canalRightOffset);
    const trueMinElev = Math.min(...allElevs, dlotLeftBottom.y - 0.5);
    const maxElev = Math.max(...allElevs, cy_real + H_total + 0.5);

    const cutoutPoints: { x: number, y: number }[] = [];
    cutoutPoints.push({ x: trueExcavationPts[0].x, y: maxElev + 10 });
    cutoutPoints.push(...trueExcavationPts);
    cutoutPoints.push({ x: trueExcavationPts[trueExcavationPts.length - 1].x, y: maxElev + 10 });

    // Mức so sánh (Datum)
    const mss = stake.datum !== undefined && !isNaN(stake.datum) ? stake.datum : Math.floor(trueMinElev);
    const minElev = mss;

    const margin = { top: 20, bottom: 60, left: 60, right: 30 };
    const drawW = svgWidth - margin.left - margin.right;
    const drawH = svgHeight - margin.top - margin.bottom;

    const dataW = maxOffset - minOffset || 1;
    const dataH = maxElev - minElev || 1;

    // Use equal aspect ratio (1:1 horizontal vs vertical scale)
    const scaleX = drawW / dataW;
    const scaleY = drawH / dataH;
    const scale = Math.min(scaleX, scaleY);

    const actualDrawW = dataW * scale;
    const actualDrawH = dataH * scale;

    // Center the drawing horizontally
    const offsetX = margin.left + (drawW - actualDrawW) / 2;

    // Map real coords → SVG pixels (Y is inverted and anchored to bottom)
    const toSvgX = (offset: number) => offsetX + (offset - minOffset) * scale;
    const toSvgY = (elev: number) => margin.top + drawH - (elev - minElev) * scale;
    const ptsToSvg = (str: string) => str.split(' ').map(pt => { const [x, y] = pt.split(','); return `${toSvgX(parseFloat(x))},${toSvgY(parseFloat(y))}` }).join(' ');

    // ----------------------------------------------------------------
    // STEP 3: Generate SVG Paths
    // ----------------------------------------------------------------
    const cutoutPolyStr = cutoutPoints.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ');

    const calcExcavationArea = (excavPts: { x: number, y: number }[]) => {
      let area = 0;
      for (let i = 0; i < excavPts.length - 1; i++) {
        const p1 = excavPts[i];
        const p2 = excavPts[i + 1];
        if (p1.x >= p2.x) continue;

        const xs = [p1.x];
        for (const tp of stake.points) {
          if (tp.offset > p1.x && tp.offset < p2.x) {
            xs.push(tp.offset);
          }
        }
        xs.push(p2.x);

        for (let j = 0; j < xs.length - 1; j++) {
          const xa = xs[j];
          const xb = xs[j + 1];
          if (xa === xb) continue;

          const ya_des = p1.y + (p2.y - p1.y) * (xa - p1.x) / (p2.x - p1.x);
          const yb_des = p1.y + (p2.y - p1.y) * (xb - p1.x) / (p2.x - p1.x);

          const ya_ter = getTerrainElev(xa);
          const yb_ter = getTerrainElev(xb);

          const diff_a = ya_ter - ya_des;
          const diff_b = yb_ter - yb_des;

          if (diff_a >= 0 && diff_b >= 0) {
            area += (diff_a + diff_b) * (xb - xa) / 2;
          } else if (diff_a <= 0 && diff_b <= 0) {
            continue;
          } else {
            const t = -diff_a / (diff_b - diff_a);
            const x_cross = xa + t * (xb - xa);
            if (diff_a > 0) {
              area += diff_a * (x_cross - xa) / 2;
            } else {
              area += diff_b * (xb - x_cross) / 2;
            }
          }
        }
      }
      return area;
    };
    const S_dao = calcExcavationArea(trueExcavationPts);

    const terrainPts = stake.points.map(p => `${toSvgX(p.offset)},${toSvgY(p.elevation)}`).join(' ');

    const firstPt = stake.points[0];
    const lastPt = stake.points[stake.points.length - 1];
    const baseY = margin.top + drawH;
    const terrainFill = `${toSvgX(firstPt.offset)},${baseY} ` + terrainPts + ` ${toSvgX(lastPt.offset)},${baseY}`;

    const innerProfile = `${p0.x},${p0.y} ${p1_top.x},${p1_top.y} ${p1_right.x},${p1_right.y} ${p2_left.x},${p2_left.y} ${p2_top.x},${p2_top.y} ${p3.x},${p3.y}`;
    const outerProfile = `${outerRightTop.x},${outerRightTop.y} ${outerRightBottom.x},${outerRightBottom.y} ${concRightTop.x},${concRightTop.y} ${concRightBottom.x},${concRightBottom.y} ${concLeftBottom.x},${concLeftBottom.y} ${concLeftTop.x},${concLeftTop.y} ${outerLeftBottom.x},${outerLeftBottom.y} ${outerLeftTop.x},${outerLeftTop.y}`;

    const concretePolygon = ptsToSvg(`${innerProfile} ${outerProfile}`);
    const dlotPolygon = ptsToSvg(`${dlotLeftTop.x},${dlotLeftTop.y} ${dlotRightTop.x},${dlotRightTop.y} ${dlotRightBottom.x},${dlotRightBottom.y} ${dlotLeftBottom.x},${dlotLeftBottom.y}`);
    const ditchSvgPolys = ditchPolys ? ptsToSvg(ditchPolys) : "";
    const ditchSvgPolysRight = ditchPolysRight ? ptsToSvg(ditchPolysRight) : "";

    // Water fill
    const waterPoints = ptsToSvg([
      `${water_left_off},${water_elev}`,
      `${p1.x},${p1.y}`,
      `${p2.x},${p2.y}`,
      `${water_right_off},${water_elev}`,
    ].join(' '));

    const top_elev = cy_real + H_total;
    const top_right_off = p3.x;
    const bot_left_off = p1.x;
    const bot_right_off = p2.x;

    // ----------------------------------------------------------------
    // STEP 4: Vertical elevation labels (right axis)
    // ----------------------------------------------------------------
    const elevStep = dataH > 4 ? 1.0 : dataH > 2 ? 0.5 : 0.25;
    const elevStart = Math.ceil(minElev / elevStep) * elevStep;
    const elevGrid: number[] = [];
    for (let e = elevStart; e <= maxElev + 0.01; e = parseFloat((e + elevStep).toFixed(3))) {
      elevGrid.push(e);
    }

    // ----------------------------------------------------------------
    // STEP 5: Horizontal offset labels (bottom axis)
    // ----------------------------------------------------------------
    const offStep = dataW > 30 ? 5 : dataW > 10 ? 2 : 1;
    const offStart = Math.ceil(minOffset / offStep) * offStep;
    const offGrid: number[] = [];
    for (let o = offStart; o <= maxOffset + 0.01; o = parseFloat((o + offStep).toFixed(3))) {
      offGrid.push(o);
    }

    return (
      <svg width={svgWidth} height={svgHeight} className="absolute inset-0 z-0 select-none">
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="0.8" />
          </pattern>
          <clipPath id="drawArea">
            <rect x={margin.left} y={margin.top} width={drawW} height={drawH} />
          </clipPath>
          <clipPath id="clip-fill-above-excavation">
            <polygon points={ptsToSvg([
              `${firstPt.offset},${maxElev + 10}`,
              ...stake.points.filter(p => p.offset < trueExcavationPts[0].x).map(p => `${p.offset},${p.elevation}`),
              ...trueExcavationPts.map(p => `${p.x},${p.y}`),
              ...stake.points.filter(p => p.offset > trueExcavationPts[trueExcavationPts.length - 1].x).map(p => `${p.offset},${p.elevation}`),
              `${lastPt.offset},${maxElev + 10}`
            ].join(' '))} />
          </clipPath>
          <clipPath id="clip-fill-below-earth">
            <polygon points={ptsToSvg([
              `${firstPt.offset},${minElev - 10}`,
              `${cutLeftFinal.x},${minElev - 10}`,
              `${cutLeftFinal.x},${cutLeftFinal.y}`,
              ...(params.coRanhThoatNuoc && isLeftCut ? [
                `${ditchTopLeft.x},${ditchTopLeft.y}`,
                `${ditchTopLeft.x},${ditchTopLeft.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${bankOuterLeft.x},${bankOuterLeft.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${bankOuterLeft.x},${bankOuterLeft.y}`
              ] : []),
              `${bankOuterLeft.x},${bankOuterLeft.y}`,
              `${bankInnerLeft.x},${bankInnerLeft.y}`,
              `${outerLeftTop.x},${outerLeftTop.y}`,
              `${outerLeftBottom.x},${outerLeftBottom.y}`,
              `${concLeftBottom.x},${concLeftBottom.y}`,
              `${concLeftBottom.x},${dlotLeftBottom.y}`,
              `${concRightBottom.x},${dlotRightBottom.y}`,
              `${concRightBottom.x},${concRightBottom.y}`,
              `${outerRightBottom.x},${outerRightBottom.y}`,
              `${outerRightTop.x},${outerRightTop.y}`,
              `${bankInnerRight.x},${bankInnerRight.y}`,
              `${bankOuterRight.x},${bankOuterRight.y}`,
              `${fillRight.x},${fillRight.y}`,
              `${fillRight.x},${minElev - 10}`,
              `${lastPt.offset},${minElev - 10}`
            ].join(' '))} />
          </clipPath>
        </defs>

        {/* Background */}
        <rect x={margin.left} y={margin.top} width={drawW} height={drawH} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

        {/* Terrain fill */}
        <polygon points={terrainFill} fill="#d4c5a0" fillOpacity="0.4" clipPath="url(#drawArea)" />

        {/* Terrain line */}
        <polyline points={terrainPts} fill="none" stroke="#92400e" strokeWidth="2" clipPath="url(#drawArea)" />

        {/* Excavation Cut Out (Erases terrain inside trench using background color) */}
        <polygon points={cutoutPolyStr} fill="#f8fafc" clipPath="url(#drawArea)" />

        {/* Embankment Fill Area (Yellow/Green) */}
        <g clipPath="url(#drawArea)">
          <g clipPath="url(#clip-fill-above-excavation)">
            <g clipPath="url(#clip-fill-below-earth)">
              <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#fef08a" opacity="0.6" />
            </g>
          </g>
        </g>

        {/* Grid lines (Drawn over the erased area so they aren't hidden) */}
        {elevGrid.map(e => (
          <line key={`eg-${e}`} x1={margin.left} y1={toSvgY(e)} x2={margin.left + drawW} y2={toSvgY(e)}
            stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" clipPath="url(#drawArea)" />
        ))}
        {offGrid.map(o => (
          <line key={`og-${o}`} x1={toSvgX(o)} y1={margin.top} x2={toSvgX(o)} y2={margin.top + drawH}
            stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" clipPath="url(#drawArea)" />
        ))}

        {hasDitchLeft ? (
          <>
            <polyline points={ptsToSvg(`${cutLeftFinal.x},${cutLeftFinal.y} ${ditchTopLeft.x},${ditchTopLeft.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
            <polyline points={ptsToSvg(`${bankOuterLeft.x},${bankOuterLeft.y} ${bankInnerLeft.x},${bankInnerLeft.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
          </>
        ) : (
          <polyline points={ptsToSvg(`${cutLeftFinal.x},${cutLeftFinal.y} ${bankOuterLeft.x},${bankOuterLeft.y} ${bankInnerLeft.x},${bankInnerLeft.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
        )}

        {hasDitchRight ? (
          <>
            <polyline points={ptsToSvg(`${bankInnerRight.x},${bankInnerRight.y} ${bankOuterRight.x},${bankOuterRight.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
            <polyline points={ptsToSvg(`${ditchTopRightRight.x},${ditchTopRightRight.y} ${fillRight.x},${fillRight.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
          </>
        ) : (
          <polyline points={ptsToSvg(`${bankInnerRight.x},${bankInnerRight.y} ${bankOuterRight.x},${bankOuterRight.y} ${fillRight.x},${fillRight.y}`)} fill="none" stroke="#854d0e" strokeWidth="1.5" clipPath="url(#drawArea)" />
        )}

        {/* Trench boundary (Solid line, ground color) */}
        <polyline points={ptsToSvg(trueExcavationPts.map(p => `${p.x},${p.y}`).join(' '))} fill="none" stroke="#92400e" strokeWidth="1.5" clipPath="url(#drawArea)" />

        {/* Drainage Ditch */}
        {ditchSvgPolys && <polygon points={ditchSvgPolys} fill="#e2e8f0" stroke="#334155" strokeWidth="1" clipPath="url(#drawArea)" />}
        {ditchSvgPolysRight && <polygon points={ditchSvgPolysRight} fill="#e2e8f0" stroke="#334155" strokeWidth="1" clipPath="url(#drawArea)" />}

        {/* Concrete Lining */}
        <polygon points={concretePolygon} fill="#94a3b8" stroke="#334155" strokeWidth="1" clipPath="url(#drawArea)" />

        {/* Lean Concrete */}
        <polygon points={dlotPolygon} fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" clipPath="url(#drawArea)" />

        {/* Water fill */}
        <polygon points={waterPoints} fill="#3b82f6" fillOpacity="0.25" clipPath="url(#drawArea)" />

        {/* Info Legend */}
        <g transform={`translate(${margin.left + drawW - 130}, ${margin.top + 20})`}>
          <rect x="0" y="0" width="115" height="30" fill="white" stroke="#e2e8f0" strokeWidth="1" rx="4" opacity="0.9" />
          <text x="10" y="19" fontSize="12" fill="#1e293b" fontWeight="600">S đào: {S_dao.toFixed(2)} m²</text>
        </g>

        {/* Water surface line */}
        <line
          x1={toSvgX(water_left_off)} y1={toSvgY(water_elev)}
          x2={toSvgX(water_right_off)} y2={toSvgY(water_elev)}
          stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6,3" clipPath="url(#drawArea)"
        />

        {/* Datum / bottom of canal line */}
        <line
          x1={toSvgX(bot_left_off) - 12} y1={toSvgY(dayKenhAtStake)}
          x2={toSvgX(bot_right_off) + 12} y2={toSvgY(dayKenhAtStake)}
          stroke="#ef4444" strokeWidth="1" strokeDasharray="4,2" clipPath="url(#drawArea)"
        />

        {/* Centre line */}
        <line
          x1={toSvgX(cx_real)} y1={toSvgY(dayKenhAtStake)}
          x2={toSvgX(cx_real)} y2={toSvgY(top_elev + 0.3)}
          stroke="#6366f1" strokeWidth="1" strokeDasharray="4,2" clipPath="url(#drawArea)"
        />

        {/* Elevation axis labels (right) */}
        {elevGrid.map(e => (
          <text key={`el-${e}`} x={margin.left - 4} y={toSvgY(e) + 3} textAnchor="end"
            fontSize="9" fill="#475569">{e.toFixed(2)}</text>
        ))}

        {/* Offset axis labels (bottom) */}
        {offGrid.map(o => (
          <text key={`ol-${o}`} x={toSvgX(o)} y={margin.top + drawH + 14} textAnchor="middle"
            fontSize="9" fill="#475569">{o.toFixed(1)}</text>
        ))}

        {/* Axis labels */}
        <text x={margin.left - 42} y={margin.top + drawH / 2} textAnchor="middle"
          fontSize="9" fill="#64748b" transform={`rotate(-90, ${margin.left - 42}, ${margin.top + drawH / 2})`}>
          Cao độ (m)
        </text>
        <text x={margin.left + drawW / 2} y={svgHeight - 4} textAnchor="middle" fontSize="9" fill="#64748b">
          Khoảng cách từ tim kênh (m)
        </text>

        {/* Key level labels */}
        {/* Day kenh */}
        <text x={toSvgX(cx_real) + 4} y={toSvgY(dayKenhAtStake) - 3} fontSize="9" fill="#ef4444">
          ▽ {dayKenhAtStake.toFixed(2)}
        </text>
        {/* Water level */}
        <text x={toSvgX(water_right_off) + 4} y={toSvgY(water_elev) + 3} fontSize="9" fill="#2563eb">
          MN TK {water_elev.toFixed(2)}
        </text>
        {/* Top level */}
        <text x={toSvgX(top_right_off) + 4} y={toSvgY(top_elev) + 3} fontSize="9" fill="#1e293b">
          ▲ {top_elev.toFixed(2)}
        </text>

        {/* Bottom width dimension */}
        <line x1={toSvgX(bot_left_off)} y1={toSvgY(dayKenhAtStake) + 12}
          x2={toSvgX(bot_right_off)} y2={toSvgY(dayKenhAtStake) + 12} stroke="#475569" strokeWidth="1" />
        <line x1={toSvgX(bot_left_off)} y1={toSvgY(dayKenhAtStake) + 8}
          x2={toSvgX(bot_left_off)} y2={toSvgY(dayKenhAtStake) + 16} stroke="#475569" strokeWidth="1" />
        <line x1={toSvgX(bot_right_off)} y1={toSvgY(dayKenhAtStake) + 8}
          x2={toSvgX(bot_right_off)} y2={toSvgY(dayKenhAtStake) + 16} stroke="#475569" strokeWidth="1" />
        <text x={(toSvgX(bot_left_off) + toSvgX(bot_right_off)) / 2} y={toSvgY(dayKenhAtStake) + 24}
          textAnchor="middle" fontSize="9" fill="#475569">b={b.toFixed(2)}m</text>

        {/* Terrain points dots */}
        {stake.points.map((p, i) => (
          <circle key={i} cx={toSvgX(p.offset)} cy={toSvgY(p.elevation)} r="2"
            fill="#92400e" clipPath="url(#drawArea)" />
        ))}
      </svg>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {/* Thông tin cọc */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-10 text-sm">
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

      <div id="terrain-svg-container" className="flex-1 relative overflow-hidden bg-white">
        {drawCrossSection()}
      </div>
    </div>
  );
}
