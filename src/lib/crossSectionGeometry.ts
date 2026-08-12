export interface Point2D {
  x: number;
  y: number;
}

export interface CrossSectionPoint {
  offset: number;
  elevation: number;
}

export interface CrossSectionStake {
  id?: string;
  name: string;
  chainage: number;
  centerElevation: number;
  centerOffset: number;
  datum?: number;
  points: CrossSectionPoint[];
}

export interface CrossSectionGeometryResult {
  dayKenhAtStake: number;
  waterLevelAtStake: number;
  topLevelAtStake: number;
  stakeDatum: number;
  cx: number;
  cy: number;
  b: number;
  H_total: number;
  params: any;
  
  // Key points
  p1: Point2D;
  p2: Point2D;
  p0: Point2D;
  p3: Point2D;
  p1_top: Point2D;
  p1_right: Point2D;
  p2_left: Point2D;
  p2_top: Point2D;
  
  outerLeftTop: Point2D;
  outerRightTop: Point2D;
  outerLeftBottom: Point2D;
  outerRightBottom: Point2D;
  
  concLeftTop: Point2D;
  concRightTop: Point2D;
  concLeftBottom: Point2D;
  concRightBottom: Point2D;
  
  dlotLeftTop: Point2D;
  dlotRightTop: Point2D;
  dlotLeftBottom: Point2D;
  dlotRightBottom: Point2D;
  
  bankElevLeft: number;
  bankElevRight: number;
  bankInnerLeft: Point2D;
  bankInnerRight: Point2D;
  bankOuterLeft: Point2D;
  bankOuterRight: Point2D;
  
  pointA: Point2D;
  pointB: Point2D;
  intersectA: Point2D | null;
  intersectB: Point2D | null;
  
  point5_terrain: Point2D | null;
  point6_terrain: Point2D | null;
  point5: Point2D | null;
  point6: Point2D | null;
  
  isALowerThanTerrain: boolean;
  isBLowerThanTerrain: boolean;
  isFullFill: boolean;
  
  hasDitchLeft: boolean;
  hasDitchRight: boolean;
  ditchPolysLeft?: Point2D[];
  ditchPolysRight?: Point2D[];
  ditchTopLeft: Point2D;
  ditchTopRightRight: Point2D;
  
  isLeftCut: boolean;
  isRightCut: boolean;
  cutLeftFinal: Point2D | null;
  fillRight: Point2D | null;
  
  // Helper to interpolate terrain elevation at x offset
  getTerrainElev: (x: number) => number;
  findIntersection: (startPt: Point2D, vx: number, vy: number) => Point2D;

  // New intermediate points and areas
  pointE: Point2D | null;
  lowerPointForE: Point2D | null;
  point7: Point2D | null;
  point8: Point2D | null;
  point9: Point2D | null;
  point10: Point2D | null;
  S_dao_trang: number;
  S_boc_thao_moc: number;
  S_dap: number;
  L_trong_co: number;
}

export function calculateCrossSectionGeometry(
  stake: CrossSectionStake,
  computedSegments: any[],
  segmentHydraulicResults: Record<number, any>,
  flowNodes: any[],
  nodeElevations: any,
  crossSectionParams: Record<number, any>
): CrossSectionGeometryResult {
  const stakeChainage = stake.chainage;
  let selectedSegmentIdx = 0;
  let dayKenhAtStake = stake.centerElevation || 16.52;
  let waterLevelAtStake = dayKenhAtStake + 1.51;
  let topLevelAtStake = dayKenhAtStake + 1.93;

  if (computedSegments && computedSegments.length > 0) {
    for (let i = 0; i < computedSegments.length; i++) {
      const seg = computedSegments[i];
      const startNode = flowNodes ? flowNodes[seg.startIdx] : null;
      const endNode = seg.endIdx !== null && flowNodes ? flowNodes[seg.endIdx] : (flowNodes ? flowNodes[flowNodes.length - 1] : null);
      
      const startC = startNode?.chainage || 0;
      const endC = endNode?.chainage || Infinity;

      if (stakeChainage >= startC && stakeChainage <= endC) {
        selectedSegmentIdx = i;

        const startDay = nodeElevations?.[i]?.[seg.startIdx] ?? null;
        const endDay = nodeElevations?.[i]?.[seg.endIdx] ?? startDay;

        const res = segmentHydraulicResults?.[i] || {};
        const isDesigned = res && res.b_out !== undefined;
        const h_max_val = res.h_max ? Number(res.h_max) : 1.73;
        const safeHeightVal = res.safeHeight ? Number(res.safeHeight) : 0.3;

        const startWater = (startDay !== null && isDesigned && res.h_des) ? startDay + Number(res.h_des) : null;
        const endWater = (endDay !== null && isDesigned && res.h_des) ? endDay + Number(res.h_des) : startWater;

        const startTop = (startDay !== null && isDesigned) ? startDay + h_max_val + safeHeightVal : null;
        const endTop = (endDay !== null && isDesigned) ? endDay + h_max_val + safeHeightVal : startTop;

        if (endC > startC && startC !== Infinity && endC !== Infinity) {
          const ratio = (stakeChainage - startC) / (endC - startC);
          dayKenhAtStake = (startDay || 0) + ratio * ((endDay || 0) - (startDay || 0));
          waterLevelAtStake = (startWater || 0) + ratio * ((endWater || 0) - (startWater || 0));
          topLevelAtStake = (startTop || 0) + ratio * ((endTop || 0) - (startTop || 0));
        } else {
          dayKenhAtStake = startDay || 16.52;
          waterLevelAtStake = startWater || (dayKenhAtStake + 1.51);
          topLevelAtStake = startTop || (dayKenhAtStake + 1.93);
        }
        break;
      }
    }
  }

  const selectedHydraulics = segmentHydraulicResults?.[selectedSegmentIdx] || {};
  const defaultParams = {
    B1: 0.2, B2: 0.25, B3: 0.4, VAT: 0.1, DDAY: 0.2, DLOT: 0.1, DBO: 0.3,
    BT_trai: 1.5, BT_phai: 1.5, MDAO1: 1.5, MDAO2: 1.0, MDAP: 1.75,
    bankCutOption: 'dap_bo', coRanhThoatNuocMai: false,
    coRanhThoatNuoc: false, DTN: 0.4, BTN: 0.4, HTN: 0.4, coTrongCo: false,
    coNgamMong: false, coBocThaoMoc: true, dayBocThaoMoc: 0.2
  };
  const segParam = crossSectionParams?.[selectedSegmentIdx] || {};
  const params = { ...defaultParams, ...segParam };

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

  const H_total = Math.max(0.8, topLevelAtStake - dayKenhAtStake, h_max_for_draw + h_safe);

  const _m = parseFloat(selectedHydraulics.m);
  const m_trong = !isNaN(_m) ? _m : 0.0; // 0 for U-ditch rectangular canal

  const validElevs = (stake.points || []).map(p => p.elevation).filter(e => !isNaN(e));
  const stakeDatum = stake.datum !== undefined
    ? stake.datum
    : (validElevs.length > 0 ? Math.floor(Math.min(...validElevs)) - 2 : Math.floor(dayKenhAtStake) - 2);

  const cx = (stake.centerOffset !== undefined && !isNaN(stake.centerOffset)) ? stake.centerOffset : 10.0;
  const cy = dayKenhAtStake;
  const b_half = b / 2;

  const p1 = { x: cx - b_half, y: cy };
  const p2 = { x: cx + b_half, y: cy };
  const p0 = { x: p1.x - (m_trong * H_total), y: cy + H_total };
  const p3 = { x: p2.x + (m_trong * H_total), y: cy + H_total };

  const vatX = Number(params.VAT) || 0;
  const vatY = Number(params.VAT) || 0;
  const p1_top = { x: p1.x - vatX * m_trong, y: p1.y + vatY };
  const p1_right = { x: p1.x + vatX, y: p1.y };
  const p2_left = { x: p2.x - vatX, y: p2.y };
  const p2_top = { x: p2.x + vatX * m_trong, y: p2.y + vatY };

  const pB1 = Number(params.B1) || 0.2;
  const pB2 = Number(params.B2) || 0.25;
  const pB3 = Number(params.B3) || 0.4;

  const outerLeftTop = { x: p0.x - pB1, y: p0.y };
  const outerRightTop = { x: p3.x + pB1, y: p3.y };
  const outerLeftBottom = { x: p1.x - pB2, y: p1.y };
  const outerRightBottom = { x: p2.x + pB2, y: p2.y };

  const concreteExt = params.coNgamMong ? pB3 : 0;
  const trenchExt = pB3;

  const pDDAY = Number(params.DDAY) || 0.2;
  const concLeftTop = { x: outerLeftBottom.x - concreteExt, y: outerLeftBottom.y };
  const concRightTop = { x: outerRightBottom.x + concreteExt, y: outerRightBottom.y };
  const concLeftBottom = { x: concLeftTop.x, y: concLeftTop.y - pDDAY };
  const concRightBottom = { x: concRightTop.x, y: concRightTop.y - pDDAY };

  const pDLOT = Number(params.DLOT) || 0.1;
  const dlotLeftTop = { x: concLeftBottom.x, y: concLeftBottom.y };
  const dlotRightTop = { x: concRightBottom.x, y: concRightBottom.y };
  const dlotLeftBottom = { x: dlotLeftTop.x - trenchExt, y: dlotLeftTop.y - pDLOT };
  const dlotRightBottom = { x: dlotRightTop.x + trenchExt, y: dlotRightTop.y - pDLOT };

  const pDBO = Number(params.DBO) || 0.3;
  const bankElevLeft = p0.y - pDBO;
  const bankElevRight = p3.y - pDBO;

  const outerWallLeftSlope = (outerLeftTop.x - outerLeftBottom.x) / (outerLeftTop.y - outerLeftBottom.y || 0.001);
  const bankInnerLeft = { x: outerLeftBottom.x + (bankElevLeft - outerLeftBottom.y) * outerWallLeftSlope, y: bankElevLeft };
  const outerWallRightSlope = (outerRightTop.x - outerRightBottom.x) / (outerRightTop.y - outerRightBottom.y || 0.001);
  const bankInnerRight = { x: outerRightBottom.x + (bankElevRight - outerRightBottom.y) * outerWallRightSlope, y: bankElevRight };

  const pBT_trai = Number(params.BT_trai) || 1.5;
  const pBT_phai = Number(params.BT_phai) || 1.5;
  const bankOuterLeft = { x: bankInnerLeft.x - pBT_trai, y: bankElevLeft };
  const bankOuterRight = { x: bankInnerRight.x + pBT_phai, y: bankElevRight };

  const pMDAO1 = Number(params.MDAO1) || 1.0;
  const pMDAO2 = Number(params.MDAO2) || 1.0;
  const pMDAP = Number(params.MDAP) || 1.25;

  const getTerrainElev = (x: number): number => {
    if (!stake.points || stake.points.length === 0) return cy;
    if (stake.points.length === 1) return stake.points[0].elevation;

    if (x <= stake.points[0].offset) {
      const pA = stake.points[0];
      const pB = stake.points[1];
      const slope = (pB.offset === pA.offset) ? 0 : (pB.elevation - pA.elevation) / (pB.offset - pA.offset);
      return pA.elevation + slope * (x - pA.offset);
    }
    if (x >= stake.points[stake.points.length - 1].offset) {
      const pA = stake.points[stake.points.length - 2];
      const pB = stake.points[stake.points.length - 1];
      const slope = (pB.offset === pA.offset) ? 0 : (pB.elevation - pA.elevation) / (pB.offset - pA.offset);
      return pB.elevation + slope * (x - pB.offset);
    }
    for (let i = 0; i < stake.points.length - 1; i++) {
      const pA = stake.points[i];
      const pB = stake.points[i + 1];
      if (x >= pA.offset && x <= pB.offset) {
        const ratio = (pB.offset === pA.offset) ? 0 : (x - pA.offset) / (pB.offset - pA.offset);
        return pA.elevation + ratio * (pB.elevation - pA.elevation);
      }
    }
    return stake.points[0].elevation;
  };

  /**
   * Find intersection between a ray starting at startPt with vector direction (vx, vy)
   * and the natural terrain segments (including extended end slopes).
   */
  const findIntersection = (startPt: Point2D, vx: number, vy: number): Point2D => {
    type Seg = { x1: number; y1: number; x2: number; y2: number };
    const segs: Seg[] = [];

    if (stake.points && stake.points.length >= 2) {
      const pA0 = stake.points[0], pA1 = stake.points[1];
      const s0 = (pA1.elevation - pA0.elevation) / (pA1.offset - pA0.offset || 0.001);
      segs.push({ x1: pA0.offset - 1e6, y1: pA0.elevation - 1e6 * s0, x2: pA0.offset, y2: pA0.elevation });

      for (let i = 0; i < stake.points.length - 1; i++) {
        segs.push({
          x1: stake.points[i].offset, y1: stake.points[i].elevation,
          x2: stake.points[i + 1].offset, y2: stake.points[i + 1].elevation
        });
      }

      const pN1 = stake.points[stake.points.length - 2], pN2 = stake.points[stake.points.length - 1];
      const sN = (pN2.elevation - pN1.elevation) / (pN2.offset - pN1.offset || 0.001);
      segs.push({ x1: pN2.offset, y1: pN2.elevation, x2: pN2.offset + 1e6, y2: pN2.elevation + 1e6 * sN });
    } else {
      segs.push({ x1: startPt.x - 1e6, y1: cy, x2: startPt.x + 1e6, y2: cy });
    }

    let bestX = NaN, bestT = Infinity;
    const sx = startPt.x, sy = startPt.y;

    for (const seg of segs) {
      const { x1: ax, y1: ay, x2: bx, y2: by } = seg;
      const segDx = bx - ax;
      const segSlope = segDx === 0 ? null : (by - ay) / segDx;

      let xi: number;

      if (vx === 0) {
        xi = sx;
        if (xi < Math.min(ax, bx) - 1e-9 || xi > Math.max(ax, bx) + 1e-9) continue;
        if (segSlope === null) continue;
        const yi = ay + segSlope * (xi - ax);
        if (vy === 0) continue;
        const t = (yi - sy) / vy;
        if (t > -1e-9 && t < bestT) { bestT = t; bestX = xi; }
      } else if (segSlope === null) {
        xi = ax;
        const t = (xi - sx) / vx;
        if (t > -1e-9) {
          const yi = sy + t * vy;
          if (yi >= Math.min(ay, by) - 1e-9 && yi <= Math.max(ay, by) + 1e-9) {
            if (t < bestT) { bestT = t; bestX = xi; }
          }
        }
      } else {
        const raySlope = vy / vx;
        const slopeDiff = raySlope - segSlope;
        if (Math.abs(slopeDiff) < 1e-12) continue;
        xi = ((ay - segSlope * ax) - (sy - raySlope * sx)) / slopeDiff;
        if (xi < Math.min(ax, bx) - 1e-9 || xi > Math.max(ax, bx) + 1e-9) continue;
        const t = (xi - sx) / vx;
        if (t > -1e-9 && t < bestT) { bestT = t; bestX = xi; }
      }
    }

    if (!isNaN(bestX) && isFinite(bestT)) {
      const yi = sy + bestT * vy;
      return { x: bestX, y: yi };
    }

    return { x: sx, y: getTerrainElev(sx) };
  };

  const isALowerThanTerrain = getTerrainElev(dlotLeftBottom.x) > dlotLeftBottom.y;
  const pointA = {
    x: isALowerThanTerrain ? dlotLeftBottom.x - pB3 : dlotLeftBottom.x,
    y: dlotLeftBottom.y
  };

  const isBLowerThanTerrain = getTerrainElev(dlotRightBottom.x) > dlotRightBottom.y;
  const pointB = {
    x: isBLowerThanTerrain ? dlotRightBottom.x + pB3 : dlotRightBottom.x,
    y: dlotRightBottom.y
  };

  let intersectA: Point2D | null = null;
  if (isALowerThanTerrain) {
    intersectA = findIntersection(pointA, -pMDAO1, 1);
  }

  let intersectB: Point2D | null = null;
  if (isBLowerThanTerrain) {
    intersectB = findIntersection(pointB, pMDAO1, 1);
  }

  // Trench tops
  const x_trench_left_top = dlotLeftBottom.x - (bankElevLeft - dlotLeftBottom.y) * pMDAO1;
  const test_bank_x_l = Math.min(bankOuterLeft.x, x_trench_left_top);
  const isLeftCut = (getTerrainElev(test_bank_x_l) > bankElevLeft);

  const x_trench_right_top = dlotRightBottom.x + (bankElevRight - dlotRightBottom.y) * pMDAO1;
  const test_bank_x_r = Math.max(bankOuterRight.x, x_trench_right_top);
  const isRightCut = (getTerrainElev(test_bank_x_r) > bankElevRight);

  // CORRECTED EMBANKMENT SLOPE VECTOR DIRECTION:
  // Left embankment: moving LEFT (vx = -pMDAP) and DOWNWARDS (vy = -1)
  // Right embankment: moving RIGHT (vx = pMDAP) and DOWNWARDS (vy = -1)
  const point5_terrain = findIntersection(bankOuterLeft, -pMDAP, -1);
  const point6_terrain = findIntersection(bankOuterRight, pMDAP, -1);

  const leftCutDepth = Math.max(0, getTerrainElev(dlotLeftBottom.x) - dlotLeftBottom.y);
  const rightCutDepth = Math.max(0, getTerrainElev(dlotRightBottom.x) - dlotRightBottom.y);
  const isFullFill = (!isALowerThanTerrain && !isBLowerThanTerrain) || (leftCutDepth < 1.50 && rightCutDepth < 1.50);

  let point5: Point2D | null = null;
  if (isLeftCut) {
    if (params.bankCutOption === 'mo_rong_bo') {
      if (isALowerThanTerrain && pMDAO1 > 0) {
        const x5 = pointA.x - pMDAO1 * (bankElevLeft - pointA.y);
        point5 = { x: x5, y: bankElevLeft };
      }
    } else {
      // 'dap_bo'
      if (isALowerThanTerrain && intersectA && pMDAO1 > 0 && pMDAP > 0) {
        const y5 = (pointA.x - bankOuterLeft.x + pMDAO1 * pointA.y + pMDAP * bankOuterLeft.y) / (pMDAO1 + pMDAP);
        const x5 = pointA.x - pMDAO1 * (y5 - pointA.y);
        if (x5 > intersectA.x && y5 >= pointA.y && y5 <= bankOuterLeft.y) {
          point5 = { x: x5, y: y5 };
        }
      }
    }
  } else {
    // Fill section
    point5 = point5_terrain;
    if (isALowerThanTerrain && intersectA && pMDAO1 > 0 && pMDAP > 0) {
      const y5 = (pointA.x - bankOuterLeft.x + pMDAO1 * pointA.y + pMDAP * bankOuterLeft.y) / (pMDAO1 + pMDAP);
      const x5 = pointA.x - pMDAO1 * (y5 - pointA.y);
      if (x5 > intersectA.x && y5 >= pointA.y && y5 <= bankOuterLeft.y) {
        point5 = { x: x5, y: y5 };
      }
    }
  }

  let point6: Point2D | null = null;
  if (isRightCut) {
    if (params.bankCutOption === 'mo_rong_bo') {
      if (isBLowerThanTerrain && pMDAO1 > 0) {
        const x6 = pointB.x + pMDAO1 * (bankElevRight - pointB.y);
        point6 = { x: x6, y: bankElevRight };
      }
    } else {
      // 'dap_bo'
      if (isBLowerThanTerrain && intersectB && pMDAO1 > 0 && pMDAP > 0) {
        const y6 = (bankOuterRight.x - pointB.x + pMDAP * bankOuterRight.y + pMDAO1 * pointB.y) / (pMDAO1 + pMDAP);
        const x6 = pointB.x + pMDAO1 * (y6 - pointB.y);
        if (x6 < intersectB.x && y6 >= pointB.y && y6 <= bankOuterRight.y) {
          point6 = { x: x6, y: y6 };
        }
      }
    }
  } else {
    // Fill section
    point6 = point6_terrain;
    if (isBLowerThanTerrain && intersectB && pMDAO1 > 0 && pMDAP > 0) {
      const y6 = (bankOuterRight.x - pointB.x + pMDAP * bankOuterRight.y + pMDAO1 * pointB.y) / (pMDAO1 + pMDAP);
      const x6 = pointB.x + pMDAO1 * (y6 - pointB.y);
      if (x6 < intersectB.x && y6 >= pointB.y && y6 <= bankOuterRight.y) {
        point6 = { x: x6, y: y6 };
      }
    }
  }

  // Drainage Ditches (Rãnh thoát nước bờ kênh)
  let trenchTopLeft = dlotLeftBottom;
  if (getTerrainElev(dlotLeftBottom.x) > dlotLeftBottom.y) {
    trenchTopLeft = findIntersection(dlotLeftBottom, -pMDAO1, 1);
  }

  let trenchTopRight = dlotRightBottom;
  if (getTerrainElev(dlotRightBottom.x) > dlotRightBottom.y) {
    trenchTopRight = findIntersection(dlotRightBottom, pMDAO1, 1);
  }

  let hasDitchLeft = false;
  if (isLeftCut && pMDAO1 > 0 && params.coRanhThoatNuoc) {
    const hDitch = Number(params.HTN) || 0.4;
    const tDitch = Number(params.DTN) || 0.4;
    const bDitch = Number(params.BTN) || 0.4;
    const ditchBotY = bankElevLeft - hDitch - tDitch;
    let x_trench_left_bot = dlotLeftBottom.x - (ditchBotY - dlotLeftBottom.y) * pMDAO1;
    let potential_bank_x = Math.min(bankOuterLeft.x, x_trench_left_bot);
    let potential_ditch_end_x = potential_bank_x - (bDitch + 2 * tDitch);

    if (getTerrainElev(potential_ditch_end_x) > bankElevLeft) {
      hasDitchLeft = true;
    }
  }

  let hasDitchRight = false;
  if (isRightCut && pMDAO1 > 0 && params.coRanhThoatNuoc) {
    const hDitch = Number(params.HTN) || 0.4;
    const tDitch = Number(params.DTN) || 0.4;
    const bDitch = Number(params.BTN) || 0.4;
    const ditchBotY = bankElevRight - hDitch - tDitch;
    let x_trench_right_bot = dlotRightBottom.x + (ditchBotY - dlotRightBottom.y) * pMDAO1;
    let potential_bank_x = Math.max(bankOuterRight.x, x_trench_right_bot);
    let potential_ditch_end_x = potential_bank_x + (bDitch + 2 * tDitch);

    if (getTerrainElev(potential_ditch_end_x) > bankElevRight) {
      hasDitchRight = true;
    }
  }

  let ditchTopLeft = bankOuterLeft;
  let ditchPolysLeft: Point2D[] = [];
  if (hasDitchLeft || (isLeftCut && params.bankCutOption === 'mo_rong_bo' && params.coRanhThoatNuocMai && point5)) {
    const bDitch = Number(params.BTN) || 0.4;
    const hDitch = Number(params.HTN) || 0.4;
    const tDitch = Number(params.DTN) || 0.4;

    if (isLeftCut && params.bankCutOption === 'mo_rong_bo' && point5) {
      const ditchTopL = { x: point5.x, y: point5.y };
      const ditchTopR = { x: point5.x + (bDitch + 2 * tDitch), y: point5.y };
      ditchTopLeft = ditchTopL;
      
      const ditchOuterBotR = { x: ditchTopR.x, y: ditchTopR.y - hDitch - tDitch };
      const ditchOuterBotL = { x: ditchTopL.x, y: ditchTopL.y - hDitch - tDitch };
      const ditchInnerTopR = { x: ditchTopR.x - tDitch, y: ditchTopR.y };
      const ditchInnerTopL = { x: ditchTopL.x + tDitch, y: ditchTopL.y };
      const ditchInnerBotR = { x: ditchInnerTopR.x, y: ditchInnerTopR.y - hDitch };
      const ditchInnerBotL = { x: ditchInnerTopL.x, y: ditchInnerTopL.y - hDitch };

      ditchPolysLeft = [
        ditchTopR, ditchOuterBotR, ditchOuterBotL, ditchTopL,
        ditchInnerTopL, ditchInnerBotL, ditchInnerBotR, ditchInnerTopR
      ];
    } else {
      const ditchTopRight = { x: bankOuterLeft.x, y: bankOuterLeft.y };
      ditchTopLeft = { x: ditchTopRight.x - (bDitch + 2 * tDitch), y: ditchTopRight.y };
      const ditchOuterBotRight = { x: ditchTopRight.x, y: ditchTopRight.y - hDitch - tDitch };
      const ditchOuterBotLeft = { x: ditchTopLeft.x, y: ditchTopLeft.y - hDitch - tDitch };
      const ditchInnerTopRight = { x: ditchTopRight.x - tDitch, y: ditchTopRight.y };
      const ditchInnerTopLeft = { x: ditchTopLeft.x + tDitch, y: ditchTopLeft.y };
      const ditchInnerBotRight = { x: ditchInnerTopRight.x, y: ditchInnerTopRight.y - hDitch };
      const ditchInnerBotLeft = { x: ditchInnerTopLeft.x, y: ditchInnerTopLeft.y - hDitch };

      ditchPolysLeft = [
        ditchTopRight, ditchOuterBotRight, ditchOuterBotLeft, ditchTopLeft,
        ditchInnerTopLeft, ditchInnerBotLeft, ditchInnerBotRight, ditchInnerTopRight
      ];
    }
  }

  let ditchTopRightRight = bankOuterRight;
  let ditchPolysRight: Point2D[] = [];
  if (hasDitchRight || (isRightCut && params.bankCutOption === 'mo_rong_bo' && params.coRanhThoatNuocMai && point6)) {
    const bDitch = Number(params.BTN) || 0.4;
    const hDitch = Number(params.HTN) || 0.4;
    const tDitch = Number(params.DTN) || 0.4;

    if (isRightCut && params.bankCutOption === 'mo_rong_bo' && point6) {
      const ditchTopR = { x: point6.x, y: point6.y };
      const ditchTopL = { x: point6.x - (bDitch + 2 * tDitch), y: point6.y };
      ditchTopRightRight = ditchTopR;
      
      const ditchOuterBotR = { x: ditchTopR.x, y: ditchTopR.y - hDitch - tDitch };
      const ditchOuterBotL = { x: ditchTopL.x, y: ditchTopL.y - hDitch - tDitch };
      const ditchInnerTopR = { x: ditchTopR.x - tDitch, y: ditchTopR.y };
      const ditchInnerTopL = { x: ditchTopL.x + tDitch, y: ditchTopL.y };
      const ditchInnerBotR = { x: ditchInnerTopR.x, y: ditchInnerTopR.y - hDitch };
      const ditchInnerBotL = { x: ditchInnerTopL.x, y: ditchInnerTopL.y - hDitch };

      ditchPolysRight = [
        ditchTopR, ditchOuterBotR, ditchOuterBotL, ditchTopL,
        ditchInnerTopL, ditchInnerBotL, ditchInnerBotR, ditchInnerTopR
      ];
    } else {
      const ditchTopLeftRight = { x: bankOuterRight.x, y: bankOuterRight.y };
      ditchTopRightRight = { x: ditchTopLeftRight.x + (bDitch + 2 * tDitch), y: ditchTopLeftRight.y };
      const ditchOuterBotRightR = { x: ditchTopRightRight.x, y: ditchTopRightRight.y - hDitch - tDitch };
      const ditchOuterBotLeftR = { x: ditchTopLeftRight.x, y: ditchTopLeftRight.y - hDitch - tDitch };
      const ditchInnerTopRightR = { x: ditchTopRightRight.x - tDitch, y: ditchTopRightRight.y };
      const ditchInnerTopLeftR = { x: ditchTopLeftRight.x + tDitch, y: ditchTopLeftRight.y };
      const ditchInnerBotRightR = { x: ditchInnerTopRightR.x, y: ditchInnerTopRightR.y - hDitch };
      const ditchInnerBotLeftR = { x: ditchInnerTopLeftR.x, y: ditchInnerTopLeftR.y - hDitch };

      ditchPolysRight = [
        ditchTopRightRight, ditchOuterBotRightR, ditchOuterBotLeftR, ditchTopLeftRight,
        ditchInnerTopLeftR, ditchInnerBotLeftR, ditchInnerBotRightR, ditchInnerTopRightR
      ];
    }
  }

  let cutLeftFinal: Point2D | null = null;
  const x_F_l = ditchTopLeft.x, y_F_l = ditchTopLeft.y;
  const x_T_l = dlotLeftBottom.x, y_T_l = dlotLeftBottom.y;
  if (isLeftCut) {
    cutLeftFinal = findIntersection(ditchTopLeft, -pMDAO2, 1);
  } else {
    const y_int_fill = (x_T_l - x_F_l + y_F_l * pMDAP + y_T_l * pMDAO1) / (pMDAO1 + pMDAP || 0.001);
    if (y_int_fill >= y_T_l && y_int_fill <= trenchTopLeft.y && y_int_fill <= ditchTopLeft.y) {
      cutLeftFinal = { x: x_T_l - (y_int_fill - y_T_l) * pMDAO1, y: y_int_fill };
    } else {
      cutLeftFinal = findIntersection(ditchTopLeft, -pMDAP, -1);
    }
  }

  let fillRight: Point2D | null = null;
  const x_F_r = ditchTopRightRight.x, y_F_r = ditchTopRightRight.y;
  const x_T_r = dlotRightBottom.x, y_T_r = dlotRightBottom.y;
  if (isRightCut) {
    fillRight = findIntersection(ditchTopRightRight, pMDAO2, 1);
  } else {
    const y_int_fill = (x_F_r - x_T_r + y_F_r * pMDAP + y_T_r * pMDAO1) / (pMDAO1 + pMDAP || 0.001);
    if (y_int_fill >= y_T_r && y_int_fill <= trenchTopRight.y && y_int_fill <= bankOuterRight.y) {
      fillRight = { x: x_T_r + (y_int_fill - y_T_r) * pMDAO1, y: y_int_fill };
    } else {
      fillRight = findIntersection(bankOuterRight, pMDAP, -1);
    }
  }

  // pointE and lowerPointForE calculations
  let pointE: Point2D | null = null;
  let lowerPointForE: Point2D | null = null;
  if (isALowerThanTerrain && !isBLowerThanTerrain) {
    lowerPointForE = pointA;
    pointE = findIntersection(pointA, 1, 0);
  } else if (!isALowerThanTerrain && isBLowerThanTerrain) {
    lowerPointForE = pointB;
    pointE = findIntersection(pointB, -1, 0);
  }

  const dayBocThaoMoc = Number(params.dayBocThaoMoc) || 0.2;
  let point7: Point2D | null = null;
  let point8: Point2D | null = null;
  let point9: Point2D | null = null;
  let point10: Point2D | null = null;

  const hasLeftSolidTerrainFill = Boolean(
    point5 && point5_terrain && Math.abs(point5.x - point5_terrain.x) < 0.01 && (!intersectA || point5.x < intersectA.x)
  );
  if (hasLeftSolidTerrainFill && point5_terrain) {
    point7 = { x: point5_terrain.x + dayBocThaoMoc, y: point5_terrain.y - dayBocThaoMoc };
    if (isALowerThanTerrain && intersectA && pMDAO1 > 0) {
      point9 = { x: intersectA.x + pMDAO1 * dayBocThaoMoc, y: intersectA.y - dayBocThaoMoc };
    }
  }

  const hasRightSolidTerrainFill = Boolean(
    point6 && point6_terrain && Math.abs(point6.x - point6_terrain.x) < 0.01 && (!intersectB || point6.x > intersectB.x)
  );
  if (hasRightSolidTerrainFill && point6_terrain) {
    point8 = { x: point6_terrain.x - dayBocThaoMoc, y: point6_terrain.y - dayBocThaoMoc };
    if (isBLowerThanTerrain && intersectB && pMDAO1 > 0) {
      point10 = { x: intersectB.x - pMDAO1 * dayBocThaoMoc, y: intersectB.y - dayBocThaoMoc };
    }
  }

  const calculatePolygonArea = (pts: Point2D[]): number => {
    if (pts.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i].x * pts[j].y;
      area -= pts[j].x * pts[i].y;
    }
    return Math.abs(area) / 2.0;
  };

  // S_dao_trang (excavation area)
  const excavationCutoutPoly: Point2D[] = [];
  if (intersectA && intersectB) {
    excavationCutoutPoly.push(intersectA);
    excavationCutoutPoly.push(pointA);
    excavationCutoutPoly.push(pointB);
    excavationCutoutPoly.push(intersectB);
    (stake.points || [])
      .filter(p => p.offset > intersectA.x && p.offset < intersectB.x)
      .slice()
      .reverse()
      .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
  } else if (isALowerThanTerrain && intersectA && pointE) {
    excavationCutoutPoly.push(intersectA);
    excavationCutoutPoly.push(pointA);
    excavationCutoutPoly.push(pointE);
    (stake.points || [])
      .filter(p => p.offset > intersectA.x && p.offset < pointE.x)
      .slice()
      .reverse()
      .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
  } else if (isBLowerThanTerrain && intersectB && pointE) {
    excavationCutoutPoly.push(pointE);
    excavationCutoutPoly.push(pointB);
    excavationCutoutPoly.push(intersectB);
    (stake.points || [])
      .filter(p => p.offset > pointE.x && p.offset < intersectB.x)
      .slice()
      .reverse()
      .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
  }
  const S_dao_trang = calculatePolygonArea(excavationCutoutPoly);

  // S_boc_thao_moc (topsoil stripping area)
  const fullStrippedPoly: Point2D[] = [];
  const leftStrippedPoly: Point2D[] = [];
  const rightStrippedPoly: Point2D[] = [];

  const useFullFill = !!(isFullFill && point5 && point6 && point7 && point8);

  if (useFullFill && point5 && point6 && point7 && point8) {
    fullStrippedPoly.push(point5);
    fullStrippedPoly.push(point7);
    (stake.points || [])
      .filter(p => p.offset > point7.x && p.offset < point8.x)
      .forEach(p => fullStrippedPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
    fullStrippedPoly.push(point8);
    fullStrippedPoly.push(point6);
    (stake.points || [])
      .filter(p => p.offset > point5.x && p.offset < point6.x)
      .slice()
      .reverse()
      .forEach(p => fullStrippedPoly.push({ x: p.offset, y: p.elevation }));
  } else {
    const p5_ter = point5_terrain || point5;
    if (p5_ter && point7) {
      const p7 = { x: p5_ter.x + dayBocThaoMoc, y: p5_ter.y - dayBocThaoMoc };
      const endX = point9 ? point9.x : p5_ter.x;
      leftStrippedPoly.push(p5_ter);
      leftStrippedPoly.push(p7);
      (stake.points || [])
        .filter(p => p.offset >= p7.x && p.offset <= endX)
        .forEach(p => leftStrippedPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
      if (point9) leftStrippedPoly.push(point9);
      (stake.points || [])
        .filter(p => p.offset >= p7.x && p.offset <= endX)
        .slice()
        .reverse()
        .forEach(p => leftStrippedPoly.push({ x: p.offset, y: p.elevation }));
    }
    const p6_ter = point6_terrain || point6;
    if (p6_ter && point8) {
      const p8 = { x: p6_ter.x - dayBocThaoMoc, y: p6_ter.y - dayBocThaoMoc };
      const startX = point10 ? point10.x : p6_ter.x;
      rightStrippedPoly.push(p6_ter);
      rightStrippedPoly.push(p8);
      (stake.points || [])
        .filter(p => p.offset >= startX && p.offset <= p8.x)
        .forEach(p => rightStrippedPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
      if (point10) rightStrippedPoly.push(point10);
      (stake.points || [])
        .filter(p => p.offset >= startX && p.offset <= p8.x)
        .slice()
        .reverse()
        .forEach(p => rightStrippedPoly.push({ x: p.offset, y: p.elevation }));
    }
  }
  const S_boc_thao_moc = useFullFill
    ? calculatePolygonArea(fullStrippedPoly)
    : calculatePolygonArea(leftStrippedPoly) + calculatePolygonArea(rightStrippedPoly);

  // S_dap (embankment area)
  const fullEmbankmentPoly: Point2D[] = [];
  const leftEmbankmentPoly: Point2D[] = [];
  const rightEmbankmentPoly: Point2D[] = [];
  if (useFullFill && point5 && point6 && point7 && point8) {
    fullEmbankmentPoly.push(bankInnerLeft);
    fullEmbankmentPoly.push(bankOuterLeft);
    fullEmbankmentPoly.push(point5);
    fullEmbankmentPoly.push(point7);
    (stake.points || [])
      .filter(p => p.offset > point7.x && p.offset < point8.x)
      .forEach(p => fullEmbankmentPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
    fullEmbankmentPoly.push(point8);
    fullEmbankmentPoly.push(point6);
    fullEmbankmentPoly.push(bankOuterRight);
    fullEmbankmentPoly.push(bankInnerRight);
    fullEmbankmentPoly.push(outerRightBottom);
    fullEmbankmentPoly.push(concRightTop);
    fullEmbankmentPoly.push(concRightBottom);
    fullEmbankmentPoly.push(dlotRightBottom);
    fullEmbankmentPoly.push(dlotLeftBottom);
    fullEmbankmentPoly.push(concLeftBottom);
    fullEmbankmentPoly.push(concLeftTop);
    fullEmbankmentPoly.push(outerLeftBottom);
  } else {
    if (point5) {
      leftEmbankmentPoly.push(bankInnerLeft);
      leftEmbankmentPoly.push(bankOuterLeft);
      if (isLeftCut && params.bankCutOption === 'mo_rong_bo' && params.coRanhThoatNuocMai) {
        const bDitch = Number(params.BTN) || 0.4;
        const tDitch = Number(params.DTN) || 0.4;
        const bDitch_total = bDitch + 2 * tDitch;
        leftEmbankmentPoly.push({ x: point5.x + bDitch_total, y: point5.y });
        const hDitch = Number(params.HTN) || 0.4;
        leftEmbankmentPoly.push({ x: point5.x + bDitch_total, y: point5.y - hDitch - tDitch });
        leftEmbankmentPoly.push({ x: point5.x, y: point5.y - hDitch - tDitch });
      }
      leftEmbankmentPoly.push(point5);
      if (point7) leftEmbankmentPoly.push(point7);
      if (point9) leftEmbankmentPoly.push(point9);
      leftEmbankmentPoly.push(pointA);
      leftEmbankmentPoly.push(dlotLeftBottom);
      leftEmbankmentPoly.push(concLeftBottom);
      leftEmbankmentPoly.push(concLeftTop);
      leftEmbankmentPoly.push(outerLeftBottom);
    }
    if (point6) {
      rightEmbankmentPoly.push(bankInnerRight);
      rightEmbankmentPoly.push(bankOuterRight);
      if (isRightCut && params.bankCutOption === 'mo_rong_bo' && params.coRanhThoatNuocMai) {
        const bDitch = Number(params.BTN) || 0.4;
        const tDitch = Number(params.DTN) || 0.4;
        const bDitch_total = bDitch + 2 * tDitch;
        rightEmbankmentPoly.push({ x: point6.x - bDitch_total, y: point6.y });
        const hDitch = Number(params.HTN) || 0.4;
        rightEmbankmentPoly.push({ x: point6.x - bDitch_total, y: point6.y - hDitch - tDitch });
        rightEmbankmentPoly.push({ x: point6.x, y: point6.y - hDitch - tDitch });
      }
      rightEmbankmentPoly.push(point6);
      if (point8) rightEmbankmentPoly.push(point8);
      if (point10) rightEmbankmentPoly.push(point10);
      rightEmbankmentPoly.push(pointB);
      rightEmbankmentPoly.push(dlotRightBottom);
      rightEmbankmentPoly.push(concRightBottom);
      rightEmbankmentPoly.push(concRightTop);
      rightEmbankmentPoly.push(outerRightBottom);
    }
  }
  const S_dap = useFullFill
    ? calculatePolygonArea(fullEmbankmentPoly)
    : calculatePolygonArea(leftEmbankmentPoly) + calculatePolygonArea(rightEmbankmentPoly);

  const L_35 = (point5 && !(isLeftCut && params.bankCutOption === 'mo_rong_bo'))
    ? Math.sqrt(Math.pow(point5.x - bankOuterLeft.x, 2) + Math.pow(point5.y - bankOuterLeft.y, 2))
    : 0;
  const L_46 = (point6 && !(isRightCut && params.bankCutOption === 'mo_rong_bo'))
    ? Math.sqrt(Math.pow(point6.x - bankOuterRight.x, 2) + Math.pow(point6.y - bankOuterRight.y, 2))
    : 0;
  const L_trong_co = params.coTrongCo ? L_35 + L_46 : 0;

  return {
    dayKenhAtStake,
    waterLevelAtStake,
    topLevelAtStake,
    stakeDatum,
    cx,
    cy,
    b,
    H_total,
    params,
    p1, p2, p0, p3,
    p1_top, p1_right, p2_left, p2_top,
    outerLeftTop, outerRightTop, outerLeftBottom, outerRightBottom,
    concLeftTop, concRightTop, concLeftBottom, concRightBottom,
    dlotLeftTop, dlotRightTop, dlotLeftBottom, dlotRightBottom,
    bankElevLeft, bankElevRight,
    bankInnerLeft, bankInnerRight,
    bankOuterLeft, bankOuterRight,
    pointA, pointB,
    intersectA, intersectB,
    point5_terrain, point6_terrain,
    point5, point6,
    isALowerThanTerrain, isBLowerThanTerrain, isFullFill: useFullFill,
    hasDitchLeft, hasDitchRight,
    ditchPolysLeft, ditchPolysRight,
    ditchTopLeft, ditchTopRightRight,
    isLeftCut, isRightCut,
    cutLeftFinal, fillRight,
    getTerrainElev,
    findIntersection,
    pointE,
    lowerPointForE,
    point7,
    point8,
    point9,
    point10,
    S_dao_trang,
    S_boc_thao_moc,
    S_dap,
    L_trong_co
  };
}
