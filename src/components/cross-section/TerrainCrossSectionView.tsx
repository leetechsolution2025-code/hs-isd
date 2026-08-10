import React, { useEffect, useState } from 'react';
import { CrossSectionStake, CrossSectionPoint } from './CrossSectionDesignWorkspace';

interface TerrainCrossSectionViewProps {
  stake: CrossSectionStake | null;
  computedSegments: any[];
  segmentHydraulicResults: Record<number, any>;
  flowNodes: any[];
  nodeElevations: any;
  crossSectionParams: Record<number, any>;
  showOverlay?: boolean;
  showCanal?: boolean;
  showPoints?: boolean;
}

export default function TerrainCrossSectionView({
  stake,
  computedSegments,
  segmentHydraulicResults,
  flowNodes,
  nodeElevations,
  crossSectionParams,
  showOverlay = true,
  showCanal = true,
  showPoints = true
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
      if (!stake.points || stake.points.length === 0) return 0;
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
     * Tìm giao điểm giữa tia thiết kế và địa hình bằng phương pháp đại số thuần túy.
     *
     * Tia thiết kế: đi từ startPt theo hướng (vx, vy).
     *   Phương trình tia: x = startPt.x + t*vx, y = startPt.y + t*vy  (t > 0)
     *   => Nếu vx != 0: y = startPt.y + (vy/vx)*(x - startPt.x)
     *      Nếu vx == 0: đường thẳng đứng x = startPt.x
     *
     * Mỗi đoạn địa hình: (pA, pB) với pA.offset < pB.offset.
     *   Phương trình: y = pA.elev + slope_seg*(x - pA.offset)
     *   với slope_seg = (pB.elev - pA.elev)/(pB.offset - pA.offset)
     *
     * Giải hệ 2 phương trình, tìm x giao điểm, kiểm tra x có nằm trong
     * đoạn địa hình không (hoặc trong đoạn kéo dài nếu không tìm được).
     * Cuối cùng kiểm tra t > 0 để đảm bảo giao điểm nằm đúng hướng tia.
     */
    const findIntersection = (startPt: { x: number, y: number }, vx: number, vy: number): { x: number, y: number } => {
      // Xây dựng danh sách đoạn địa hình, bao gồm phần kéo dài 2 đầu theo đúng độ dốc tự nhiên
      type Seg = { x1: number; y1: number; x2: number; y2: number };
      const segs: Seg[] = [];

      if (stake.points.length >= 2) {
        // Kéo dài đoạn đầu ra phía trái
        const pA0 = stake.points[0], pA1 = stake.points[1];
        const s0 = (pA1.elevation - pA0.elevation) / (pA1.offset - pA0.offset);
        segs.push({ x1: pA0.offset - 1e6, y1: pA0.elevation - 1e6 * s0, x2: pA0.offset, y2: pA0.elevation });

        // Các đoạn địa hình thực
        for (let i = 0; i < stake.points.length - 1; i++) {
          segs.push({
            x1: stake.points[i].offset, y1: stake.points[i].elevation,
            x2: stake.points[i + 1].offset, y2: stake.points[i + 1].elevation
          });
        }

        // Kéo dài đoạn cuối ra phía phải
        const pN1 = stake.points[stake.points.length - 2], pN2 = stake.points[stake.points.length - 1];
        const sN = (pN2.elevation - pN1.elevation) / (pN2.offset - pN1.offset);
        segs.push({ x1: pN2.offset, y1: pN2.elevation, x2: pN2.offset + 1e6, y2: pN2.elevation + 1e6 * sN });
      }

      let bestX = NaN, bestT = Infinity;

      const sx = startPt.x, sy = startPt.y;

      for (const seg of segs) {
        const { x1: ax, y1: ay, x2: bx, y2: by } = seg;
        const segDx = bx - ax;
        const segSlope = segDx === 0 ? null : (by - ay) / segDx; // null => đoạn thẳng đứng

        let xi: number; // x giao điểm

        if (vx === 0) {
          // Tia thẳng đứng: x cố định = sx
          xi = sx;
          // Kiểm tra xi có trong đoạn [ax, bx]
          if (xi < Math.min(ax, bx) - 1e-9 || xi > Math.max(ax, bx) + 1e-9) continue;
          if (segSlope === null) continue; // cả 2 đều thẳng đứng => song song
          const yi = ay + segSlope * (xi - ax);
          // t = (yi - sy)/vy (vì vx=0)
          if (vy === 0) continue;
          const t = (yi - sy) / vy;
          if (t > -1e-9 && t < bestT) { bestT = t; bestX = xi; }
        } else if (segSlope === null) {
          // Đoạn địa hình thẳng đứng: x cố định = ax
          xi = ax;
          // t = (xi - sx)/vx
          const t = (xi - sx) / vx;
          if (t > -1e-9) {
            const yi = sy + t * vy;
            // Kiểm tra yi trong đoạn dọc [ay, by]
            if (yi >= Math.min(ay, by) - 1e-9 && yi <= Math.max(ay, by) + 1e-9) {
              if (t < bestT) { bestT = t; bestX = xi; }
            }
          }
        } else {
          // Tia nghiêng + đoạn nghiêng
          // Tia: y = sy + (vy/vx)*(x - sx)  => y = (vy/vx)*x + (sy - (vy/vx)*sx)
          // Đoạn: y = ay + segSlope*(x - ax)  => y = segSlope*x + (ay - segSlope*ax)
          const raySlope = vy / vx;
          const slopeDiff = raySlope - segSlope;
          if (Math.abs(slopeDiff) < 1e-12) continue; // song song
          // raySlope*x + (sy - raySlope*sx) = segSlope*x + (ay - segSlope*ax)
          // x*(raySlope - segSlope) = (ay - segSlope*ax) - (sy - raySlope*sx)
          xi = ((ay - segSlope * ax) - (sy - raySlope * sx)) / slopeDiff;
          // Kiểm tra xi trong đoạn địa hình [ax, bx] (có thể đảo chiều)
          if (xi < Math.min(ax, bx) - 1e-9 || xi > Math.max(ax, bx) + 1e-9) continue;
          const t = (xi - sx) / vx;
          if (t > -1e-9 && t < bestT) { bestT = t; bestX = xi; }
        }
      }

      if (!isNaN(bestX) && isFinite(bestT)) {
        const yi = sy + bestT * vy;
        return { x: bestX, y: yi };
      }

      // Fallback an toàn: chiếu thẳng đứng xuống địa hình tại startPt
      return { x: sx, y: getTerrainElev(sx) };
    };

    const trenchLeftBottom = { x: outerLeftBottom.x - trenchExt, y: dlotLeftBottom.y };
    const trenchRightBottom = { x: outerRightBottom.x + trenchExt, y: dlotRightBottom.y };

    // Nếu thấp hơn đường địa hình thì tịnh tiến điểm A sang trái, điểm B sang phải một đoạn bằng lưu không móng (B3)
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

    // Nếu điểm A thấp hơn đường địa hình: tạo đường thẳng đi qua A có hệ số dốc mái đào móng (pMDAO1) và tìm giao điểm với đường địa hình
    let intersectA: { x: number; y: number } | null = null;
    if (isALowerThanTerrain) {
      intersectA = findIntersection(pointA, -pMDAO1, 1);
    }

    // Tương tự với điểm B: tạo đường thẳng đi qua B có hệ số dốc mái đào móng (pMDAO1) sang phải và tìm giao điểm với đường địa hình
    let intersectB: { x: number; y: number } | null = null;
    if (isBLowerThanTerrain) {
      intersectB = findIntersection(pointB, pMDAO1, 1);
    }

    // Trường hợp 1 điểm (A hoặc B) thấp hơn địa hình, điểm kia cao hơn địa hình:
    // Tạo đường nằm ngang từ điểm thấp hơn tới đường địa hình, giao điểm là điểm E
    let pointE: { x: number; y: number } | null = null;
    let lowerPointForE: { x: number; y: number } | null = null;
    if (isALowerThanTerrain && !isBLowerThanTerrain) {
      lowerPointForE = pointA;
      pointE = findIntersection(pointA, 1, 0);
    } else if (!isALowerThanTerrain && isBLowerThanTerrain) {
      lowerPointForE = pointB;
      pointE = findIntersection(pointB, -1, 0);
    }

    // Trường hợp cả hai điểm A, B đều cao hơn/bằng đường địa hình:
    // Dựng đường thẳng đi qua điểm 3, 4 có hệ số dốc pMDAP đi xuống giao với địa hình tại điểm 5 và 6
    // Từ 5 và 6 dựng đường thẳng dốc 1 đi xuống giao với đường bóc thảo mộc tại điểm 7 và 8
    const dayBocThaoMoc = Number(params.dayBocThaoMoc) || 0.2;
    const isFullFill = !isALowerThanTerrain && !isBLowerThanTerrain;
    let point5: { x: number; y: number } | null = null;
    let point6: { x: number; y: number } | null = null;
    let point7: { x: number; y: number } | null = null;
    let point8: { x: number; y: number } | null = null;

    if (isFullFill) {
      point5 = findIntersection(bankOuterLeft, -pMDAP, -1);
      point6 = findIntersection(bankOuterRight, pMDAP, -1);
      if (point5) {
        point7 = { x: point5.x + dayBocThaoMoc, y: point5.y - dayBocThaoMoc };
      }
      if (point6) {
        point8 = { x: point6.x - dayBocThaoMoc, y: point6.y - dayBocThaoMoc };
      }
    }

    // Tính diện tích đa giác bằng công thức Shoelace (Gauss)
    const calculatePolygonArea = (pts: { x: number; y: number }[]): number => {
      if (pts.length < 3) return 0;
      let area = 0;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y;
        area -= pts[j].x * pts[i].y;
      }
      return Math.abs(area) / 2.0;
    };

    // Đất đào (vùng màu trắng): Hình giới hạn bởi C-A-B-D (hoặc C-A-E, E-B-D) và đường địa hình tự nhiên
    const excavationCutoutPoly: { x: number; y: number }[] = [];

    if (intersectA && intersectB) {
      // Trường hợp cả A và B đều thấp hơn địa hình (C-A-B-D)
      excavationCutoutPoly.push(intersectA); // Điểm C
      excavationCutoutPoly.push(pointA);     // Điểm A
      excavationCutoutPoly.push(pointB);     // Điểm B
      excavationCutoutPoly.push(intersectB); // Điểm D
      stake.points
        .filter(p => p.offset > intersectA.x && p.offset < intersectB.x)
        .slice()
        .reverse()
        .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
    } else if (isALowerThanTerrain && intersectA && pointE) {
      // Điểm A thấp hơn, B cao hơn địa hình (C-A-E)
      excavationCutoutPoly.push(intersectA); // Điểm C
      excavationCutoutPoly.push(pointA);     // Điểm A
      excavationCutoutPoly.push(pointE);     // Điểm E
      stake.points
        .filter(p => p.offset > intersectA.x && p.offset < pointE.x)
        .slice()
        .reverse()
        .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
    } else if (isBLowerThanTerrain && intersectB && pointE) {
      // Điểm B thấp hơn, A cao hơn địa hình (E-B-D)
      excavationCutoutPoly.push(pointE);     // Điểm E
      excavationCutoutPoly.push(pointB);     // Điểm B
      excavationCutoutPoly.push(intersectB); // Điểm D
      stake.points
        .filter(p => p.offset > pointE.x && p.offset < intersectB.x)
        .slice()
        .reverse()
        .forEach(p => excavationCutoutPoly.push({ x: p.offset, y: p.elevation }));
    }

    const S_dao_trang = calculatePolygonArea(excavationCutoutPoly);

    // Diện tích bóc thảo mộc: Hình giới hạn bởi các điểm 5, 7, 8, 6, đường địa hình và đường bóc thảo mộc
    const strippedPoly: { x: number; y: number }[] = [];
    if (isFullFill && point5 && point6 && point7 && point8) {
      strippedPoly.push(point5);
      strippedPoly.push(point7);
      stake.points
        .filter(p => p.offset > point7.x && p.offset < point8.x)
        .forEach(p => strippedPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
      strippedPoly.push(point8);
      strippedPoly.push(point6);
      stake.points
        .filter(p => p.offset > point5.x && p.offset < point6.x)
        .slice()
        .reverse()
        .forEach(p => strippedPoly.push({ x: p.offset, y: p.elevation }));
    }

    const S_boc_thao_moc = calculatePolygonArea(strippedPoly);

    // Đắp bờ và móng kênh (vùng màu vàng đắp hoàn toàn):
    // Giới hạn bởi: 1, 3, 5, 7, đường bóc thảo mộc (7->8), 8, 6, 4, 2 và mép ngoài mặt cắt kênh nằm dưới điểm 1, 2
    const fullEmbankmentPoly: { x: number; y: number }[] = [];
    if (isFullFill && point5 && point6 && point7 && point8) {
      fullEmbankmentPoly.push(bankInnerLeft);  // Điểm 1
      fullEmbankmentPoly.push(bankOuterLeft);  // Điểm 3
      fullEmbankmentPoly.push(point5);         // Điểm 5
      fullEmbankmentPoly.push(point7);         // Điểm 7

      // Đường bóc thảo mộc từ 7 đến 8
      stake.points
        .filter(p => p.offset > point7.x && p.offset < point8.x)
        .forEach(p => fullEmbankmentPoly.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));

      fullEmbankmentPoly.push(point8);         // Điểm 8
      fullEmbankmentPoly.push(point6);         // Điểm 6
      fullEmbankmentPoly.push(bankOuterRight); // Điểm 4
      fullEmbankmentPoly.push(bankInnerRight); // Điểm 2

      // Mép ngoài mặt cắt kênh nằm dưới điểm 2 và điểm 1
      fullEmbankmentPoly.push(outerRightBottom);
      fullEmbankmentPoly.push(concRightTop);
      fullEmbankmentPoly.push(concRightBottom);
      fullEmbankmentPoly.push(dlotRightBottom); // Điểm B
      fullEmbankmentPoly.push(dlotLeftBottom);  // Điểm A
      fullEmbankmentPoly.push(concLeftBottom);
      fullEmbankmentPoly.push(concLeftTop);
      fullEmbankmentPoly.push(outerLeftBottom);
    }

    const S_dap = calculatePolygonArea(fullEmbankmentPoly);

    // Xác định 2 điểm giới hạn cắt bỏ đường địa hình giữa C-D, C-E, E-D, hoặc 5-6
    let leftCutPoint: { x: number; y: number } | null = null;
    if (intersectA) {
      leftCutPoint = intersectA; // Điểm C
    } else if (pointE && isBLowerThanTerrain) {
      leftCutPoint = pointE;     // Điểm E khi B thấp hơn địa hình
    } else if (isFullFill && point5) {
      leftCutPoint = point5;     // Điểm 5 khi đắp toàn bộ
    }

    let rightCutPoint: { x: number; y: number } | null = null;
    if (intersectB) {
      rightCutPoint = intersectB; // Điểm D
    } else if (pointE && isALowerThanTerrain) {
      rightCutPoint = pointE;      // Điểm E khi A thấp hơn địa hình
    } else if (isFullFill && point6) {
      rightCutPoint = point6;      // Điểm 6 khi đắp toàn bộ
    }

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
    let isLeftCut = (getTerrainElev(test_bank_x_l) > bankElevLeft);
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
    let isRightCut = (getTerrainElev(test_bank_x_r) > bankElevRight);
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
    let leftIntersectUnderground = false;
    if (isLeftCut) {
      cutLeftFinal = findIntersection(ditchTopLeft, -pMDAO2, 1);
    } else {
      const y_int_fill = (x_T_l - x_F_l + y_F_l * pMDAP + y_T_l * pMDAO1) / (pMDAO1 + pMDAP);
      if (y_int_fill >= y_T_l && y_int_fill <= trenchTopLeft.y && y_int_fill <= ditchTopLeft.y) {
        cutLeftFinal = { x: x_T_l - (y_int_fill - y_T_l) * pMDAO1, y: y_int_fill };
        leftIntersectUnderground = true;
      } else {
        cutLeftFinal = findIntersection(ditchTopLeft, -pMDAP, -1);
      }
    }

    let fillRight;
    const x_F_r = ditchTopRightRight.x, y_F_r = ditchTopRightRight.y;
    const x_T_r = trenchRightBottom.x, y_T_r = trenchRightBottom.y;
    let rightIntersectUnderground = false;
    if (isRightCut) {
      fillRight = findIntersection(ditchTopRightRight, pMDAO2, 1);
    } else {
      const y_int_fill = (x_F_r - x_T_r + y_F_r * pMDAP + y_T_r * pMDAO1) / (pMDAO1 + pMDAP);
      if (y_int_fill >= y_T_r && y_int_fill <= trenchTopRight.y && y_int_fill <= bankOuterRight.y) {
        fillRight = { x: x_T_r + (y_int_fill - y_T_r) * pMDAO1, y: y_int_fill };
        rightIntersectUnderground = true;
      } else {
        fillRight = findIntersection(bankOuterRight, pMDAP, -1);
      }
    }

    const trueExcavationPts: { x: number, y: number }[] = [];
    const visualExcavationPts: { x: number, y: number }[] = [];
    if (isLeftCut) {
      trueExcavationPts.push(cutLeftFinal);
      visualExcavationPts.push(cutLeftFinal);
      if (hasDitchLeft) {
        const hDitch = Number(params.HTN) || 0;
        const tDitch = Number(params.DTN) || 0;
        trueExcavationPts.push(
          ditchTopLeft,
          { x: ditchTopLeft.x, y: ditchTopLeft.y - hDitch - tDitch },
          { x: bankOuterLeft.x, y: bankOuterLeft.y - hDitch - tDitch }
        );
        visualExcavationPts.push(
          ditchTopLeft,
          { x: ditchTopLeft.x, y: ditchTopLeft.y - hDitch - tDitch },
          { x: bankOuterLeft.x, y: bankOuterLeft.y - hDitch - tDitch }
        );
      } else {
        trueExcavationPts.push(bankOuterLeft);
        visualExcavationPts.push(bankOuterLeft);
      }
    } else {
      if (leftIntersectUnderground) {
        if (params.coBocThaoMoc) {
          const depth = Number(params.dayBocThaoMoc) || 0;
          trueExcavationPts.push({ x: cutLeftFinal.x, y: cutLeftFinal.y - depth });
          visualExcavationPts.push({ x: cutLeftFinal.x, y: cutLeftFinal.y - depth });
        } else {
          trueExcavationPts.push({ x: cutLeftFinal.x, y: cutLeftFinal.y });
          visualExcavationPts.push({ x: cutLeftFinal.x, y: cutLeftFinal.y });
        }
      } else {
        const minX = Math.min(cutLeftFinal.x, trenchTopLeft.x);
        const maxX = Math.max(cutLeftFinal.x, trenchTopLeft.x);
        const y_minX = minX === cutLeftFinal.x ? cutLeftFinal.y : getTerrainElev(trenchTopLeft.x);
        const y_maxX = maxX === cutLeftFinal.x ? cutLeftFinal.y : getTerrainElev(trenchTopLeft.x);

        if (params.coBocThaoMoc) {
          const depth = Number(params.dayBocThaoMoc) || 0;
          trueExcavationPts.push({ x: minX, y: y_minX - depth });
          visualExcavationPts.push({ x: minX, y: y_minX - depth });
          stake.points.forEach(p => {
            if (p.offset > minX && p.offset < maxX) {
              trueExcavationPts.push({ x: p.offset, y: p.elevation - depth });
              visualExcavationPts.push({ x: p.offset, y: p.elevation - depth });
            }
          });
          trueExcavationPts.push({ x: maxX, y: y_maxX - depth });
          visualExcavationPts.push({ x: maxX, y: y_maxX - depth });
        } else {
          trueExcavationPts.push({ x: minX, y: y_minX });
          stake.points.forEach(p => {
            if (p.offset > minX && p.offset < maxX) {
              trueExcavationPts.push({ x: p.offset, y: p.elevation });
            }
          });
          trueExcavationPts.push({ x: maxX, y: y_maxX });
          // Đường đào móng (fill case): cutLeftFinal → bankOuterLeft → bankInnerLeft → trenchLeftBottom
          // bankInnerLeft cần có để đường đi theo mặt ngoài tường kết cấu (không cắt chéo)
          visualExcavationPts.push(cutLeftFinal);
          visualExcavationPts.push(bankOuterLeft);
          visualExcavationPts.push(bankInnerLeft);
        }
      }
    }
    trueExcavationPts.push(trenchLeftBottom, dlotLeftBottom, dlotRightBottom, trenchRightBottom);
    visualExcavationPts.push(trenchLeftBottom, dlotLeftBottom, dlotRightBottom, trenchRightBottom);
    if (isRightCut) {
      if (hasDitchRight) {
        const hDitch = Number(params.HTN) || 0;
        const tDitch = Number(params.DTN) || 0;
        trueExcavationPts.push(
          { x: bankOuterRight.x, y: bankOuterRight.y - hDitch - tDitch },
          { x: ditchTopRightRight.x, y: ditchTopRightRight.y - hDitch - tDitch },
          ditchTopRightRight
        );
        visualExcavationPts.push(
          { x: bankOuterRight.x, y: bankOuterRight.y - hDitch - tDitch },
          { x: ditchTopRightRight.x, y: ditchTopRightRight.y - hDitch - tDitch },
          ditchTopRightRight
        );
      } else {
        trueExcavationPts.push(bankOuterRight);
        visualExcavationPts.push(bankOuterRight);
      }
      trueExcavationPts.push(fillRight);
      visualExcavationPts.push(fillRight);
    } else {
      if (rightIntersectUnderground) {
        if (params.coBocThaoMoc) {
          const depth = Number(params.dayBocThaoMoc) || 0;
          trueExcavationPts.push({ x: fillRight.x, y: fillRight.y - depth });
          visualExcavationPts.push({ x: fillRight.x, y: fillRight.y - depth });
        } else {
          trueExcavationPts.push({ x: fillRight.x, y: fillRight.y });
          visualExcavationPts.push({ x: fillRight.x, y: fillRight.y });
        }
      } else {
        const minX = Math.min(trenchTopRight.x, fillRight.x);
        const maxX = Math.max(trenchTopRight.x, fillRight.x);
        const y_minX = minX === trenchTopRight.x ? getTerrainElev(trenchTopRight.x) : fillRight.y;
        const y_maxX = maxX === trenchTopRight.x ? getTerrainElev(trenchTopRight.x) : fillRight.y;

        if (params.coBocThaoMoc) {
          const depth = Number(params.dayBocThaoMoc) || 0;
          trueExcavationPts.push({ x: minX, y: y_minX - depth });
          visualExcavationPts.push({ x: minX, y: y_minX - depth });
          stake.points.forEach(p => {
            if (p.offset > minX && p.offset < maxX) {
              trueExcavationPts.push({ x: p.offset, y: p.elevation - depth });
              visualExcavationPts.push({ x: p.offset, y: p.elevation - depth });
            }
          });
          trueExcavationPts.push({ x: maxX, y: y_maxX - depth });
          visualExcavationPts.push({ x: maxX, y: y_maxX - depth });
        } else {
          trueExcavationPts.push({ x: minX, y: y_minX });
          stake.points.forEach(p => {
            if (p.offset > minX && p.offset < maxX) {
              trueExcavationPts.push({ x: p.offset, y: p.elevation });
            }
          });
          trueExcavationPts.push({ x: maxX, y: y_maxX });
          // Đường đào móng (fill case): trenchRightBottom → bankInnerRight → bankOuterRight → fillRight (trên địa hình)
          // bankInnerRight cần có trong path để đường đi theo mặt ngoài tường, không bị cắt chéo
          visualExcavationPts.push(bankInnerRight);
          visualExcavationPts.push(bankOuterRight);
          visualExcavationPts.push(fillRight);
        }
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

    let extTerrainPts = [...stake.points];
    if (stake.points.length > 1) {
      const extLeftX = minOffset - 100;
      const extRightX = maxOffset + 100;
      extTerrainPts = [
        { offset: extLeftX, elevation: getTerrainElev(extLeftX) },
        ...stake.points,
        { offset: extRightX, elevation: getTerrainElev(extRightX) }
      ];
    }
    const terrainPts = extTerrainPts.map(p => `${toSvgX(p.offset)},${toSvgY(p.elevation)}`).join(' ');

    // Xây dựng chuỗi điểm SVG cho đoạn địa hình bên trái và bên phải (bỏ hẳn đoạn giữa C và D)
    let leftTerrainSvgPts = '';
    let rightTerrainSvgPts = '';

    if (leftCutPoint) {
      const leftPts = extTerrainPts.filter(p => p.offset < leftCutPoint!.x);
      leftPts.push({ offset: leftCutPoint.x, elevation: leftCutPoint.y });
      leftTerrainSvgPts = ptsToSvg(leftPts.map(p => `${p.offset},${p.elevation}`).join(' '));
    }

    if (rightCutPoint) {
      const rightPts = [{ offset: rightCutPoint.x, elevation: rightCutPoint.y }];
      extTerrainPts.filter(p => p.offset > rightCutPoint!.x).forEach(p => rightPts.push(p));
      rightTerrainSvgPts = ptsToSvg(rightPts.map(p => `${p.offset},${p.elevation}`).join(' '));
    }

    // Đường bóc hữu cơ / thảo mộc (hạ thấp đường địa hình xuống một khoảng dayBocThaoMoc, giới hạn chính xác từ Điểm 7 đến Điểm 8)
    let strippedTerrainSvgPts = '';
    if (isFullFill && point7 && point8) {
      const strippedPts: { x: number; y: number }[] = [];
      strippedPts.push(point7);
      stake.points
        .filter(p => p.offset > point7.x && p.offset < point8.x)
        .forEach(p => strippedPts.push({ x: p.offset, y: p.elevation - dayBocThaoMoc }));
      strippedPts.push(point8);

      strippedTerrainSvgPts = ptsToSvg(strippedPts.map(p => `${p.x},${p.y}`).join(' '));
    }

    const firstPt = extTerrainPts[0];
    const lastPt = extTerrainPts[extTerrainPts.length - 1];
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
              ...extTerrainPts.filter(p => p.offset < trueExcavationPts[0].x).map(p => `${p.offset},${p.elevation}`),
              ...trueExcavationPts.map(p => `${p.x},${p.y}`),
              ...extTerrainPts.filter(p => p.offset > trueExcavationPts[trueExcavationPts.length - 1].x).map(p => `${p.offset},${p.elevation}`),
              `${lastPt.offset},${maxElev + 10}`
            ].join(' '))} />
          </clipPath>
          <clipPath id="clip-fill-below-earth">
            <polygon points={ptsToSvg([
              `${firstPt.offset},${minElev - 10}`,
              `${firstPt.offset},${firstPt.elevation}`,
              ...extTerrainPts.filter(p => p.offset < trueExcavationPts[0].x).map(p => `${p.offset},${p.elevation}`),
              `${trueExcavationPts[0].x},${trueExcavationPts[0].y}`,
              ...(params.coRanhThoatNuoc && isLeftCut ? [
                `${ditchTopLeft.x},${ditchTopLeft.y}`,
                `${ditchTopLeft.x},${ditchTopLeft.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${bankOuterLeft.x},${bankOuterLeft.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${bankOuterLeft.x},${bankOuterLeft.y}`
              ] : [
                `${bankOuterLeft.x},${bankOuterLeft.y}`
              ]),
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
              ...(params.coRanhThoatNuoc && isRightCut ? [
                `${bankOuterRight.x},${bankOuterRight.y}`,
                `${bankOuterRight.x},${bankOuterRight.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${ditchTopRightRight.x},${ditchTopRightRight.y - (Number(params.HTN) || 0) - (Number(params.DTN) || 0)}`,
                `${ditchTopRightRight.x},${ditchTopRightRight.y}`
              ] : [
                `${bankOuterRight.x},${bankOuterRight.y}`
              ]),
              `${trueExcavationPts[trueExcavationPts.length - 1].x},${trueExcavationPts[trueExcavationPts.length - 1].y}`,
              ...extTerrainPts.filter(p => p.offset > trueExcavationPts[trueExcavationPts.length - 1].x).map(p => `${p.offset},${p.elevation}`),
              `${lastPt.offset},${lastPt.elevation}`,
              `${lastPt.offset},${minElev - 10}`
            ].join(' '))} />
          </clipPath>
        </defs>

        {/* Background */}
        <rect x={margin.left} y={margin.top} width={drawW} height={drawH} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

        {/* Terrain fill (original terrain) */}
        <polygon points={terrainFill} fill="#d4c5a0" fillOpacity="0.4" clipPath="url(#drawArea)" />

        {/* Full Embankment Area fill (Vùng đắp hoàn toàn màu vàng) */}
        {showOverlay && isFullFill && fullEmbankmentPoly.length > 0 && (
          <polygon
            points={ptsToSvg(fullEmbankmentPoly.map(p => `${p.x},${p.y}`).join(' '))}
            fill="#fef08a"
            fillOpacity="0.85"
            stroke="#eab308"
            strokeWidth="1"
            clipPath="url(#drawArea)"
          />
        )}

        {/* Excavation Earth Area (Cutout filled with white) bounded by C-A-B-D and terrain */}
        {excavationCutoutPoly.length > 0 && (
          <polygon
            points={ptsToSvg(excavationCutoutPoly.map(p => `${p.x},${p.y}`).join(' '))}
            fill="#ffffff"
            clipPath="url(#drawArea)"
          />
        )}

        {/* Terrain line: Bỏ hẳn đoạn địa hình ở giữa hai điểm C và D (hoặc C-E, E-D) */}
        {leftCutPoint || rightCutPoint ? (
          <>
            {leftTerrainSvgPts && <polyline points={leftTerrainSvgPts} fill="none" stroke="#92400e" strokeWidth="2.5" clipPath="url(#drawArea)" />}
            {rightTerrainSvgPts && <polyline points={rightTerrainSvgPts} fill="none" stroke="#92400e" strokeWidth="2.5" clipPath="url(#drawArea)" />}
          </>
        ) : (
          <polyline points={terrainPts} fill="none" stroke="#92400e" strokeWidth="2.5" clipPath="url(#drawArea)" />
        )}

        {/* Stripped terrain line (bóc thảo mộc) lowered by dayBocThaoMoc */}
        {isFullFill && strippedTerrainSvgPts && (
          <polyline
            points={strippedTerrainSvgPts}
            fill="none"
            stroke="#92400e"
            strokeWidth="2.5"
            clipPath="url(#drawArea)"
          />
        )}

        {/* Grid lines */}
        {elevGrid.map(e => (
          <line key={`eg-${e}`} x1={margin.left} y1={toSvgY(e)} x2={margin.left + drawW} y2={toSvgY(e)}
            stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" clipPath="url(#drawArea)" />
        ))}
        {offGrid.map(o => (
          <line key={`og-${o}`} x1={toSvgX(o)} y1={margin.top} x2={toSvgX(o)} y2={margin.top + drawH}
            stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" clipPath="url(#drawArea)" />
        ))}

        {/* Canal Structure */}
        {showCanal && (
          <>
            {/* Concrete Lining */}
            <polygon points={concretePolygon} fill="#94a3b8" stroke="#334155" strokeWidth="1" clipPath="url(#drawArea)" />

            {/* Lean Concrete */}
            <polygon points={dlotPolygon} fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" clipPath="url(#drawArea)" />

            {/* Water fill */}
            <polygon points={waterPoints} fill="#3b82f6" fillOpacity="0.25" clipPath="url(#drawArea)" />

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
          </>
        )}

        {/* Line AB if both A and B are lower than terrain */}
        {isALowerThanTerrain && isBLowerThanTerrain && (
          <line
            x1={toSvgX(pointA.x)} y1={toSvgY(pointA.y)}
            x2={toSvgX(pointB.x)} y2={toSvgY(pointB.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Slope line from A to terrain intersection intersectA */}
        {isALowerThanTerrain && intersectA && (
          <line
            x1={toSvgX(pointA.x)} y1={toSvgY(pointA.y)}
            x2={toSvgX(intersectA.x)} y2={toSvgY(intersectA.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Slope line from B to terrain intersection intersectB */}
        {isBLowerThanTerrain && intersectB && (
          <line
            x1={toSvgX(pointB.x)} y1={toSvgY(pointB.y)}
            x2={toSvgX(intersectB.x)} y2={toSvgY(intersectB.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Horizontal line from lower point (A or B) to point E on terrain */}
        {lowerPointForE && pointE && (
          <line
            x1={toSvgX(lowerPointForE.x)} y1={toSvgY(lowerPointForE.y)}
            x2={toSvgX(pointE.x)} y2={toSvgY(pointE.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Horizontal line 1 -> 3 (Left bank width BT_trai) */}
        <line
          x1={toSvgX(bankInnerLeft.x)} y1={toSvgY(bankInnerLeft.y)}
          x2={toSvgX(bankOuterLeft.x)} y2={toSvgY(bankOuterLeft.y)}
          stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
        />

        {/* Horizontal line 2 -> 4 (Right bank width BT_phai) */}
        <line
          x1={toSvgX(bankInnerRight.x)} y1={toSvgY(bankInnerRight.y)}
          x2={toSvgX(bankOuterRight.x)} y2={toSvgY(bankOuterRight.y)}
          stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
        />

        {/* Embankment slope line 3 -> 5 (left) */}
        {point5 && (
          <line
            x1={toSvgX(bankOuterLeft.x)} y1={toSvgY(bankOuterLeft.y)}
            x2={toSvgX(point5.x)} y2={toSvgY(point5.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Embankment slope line 4 -> 6 (right) */}
        {point6 && (
          <line
            x1={toSvgX(bankOuterRight.x)} y1={toSvgY(bankOuterRight.y)}
            x2={toSvgX(point6.x)} y2={toSvgY(point6.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Slope line 5 -> 7 (slope 1 to stripped terrain left) */}
        {point5 && point7 && (
          <line
            x1={toSvgX(point5.x)} y1={toSvgY(point5.y)}
            x2={toSvgX(point7.x)} y2={toSvgY(point7.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Slope line 6 -> 8 (slope 1 to stripped terrain right) */}
        {point6 && point8 && (
          <line
            x1={toSvgX(point6.x)} y1={toSvgY(point6.y)}
            x2={toSvgX(point8.x)} y2={toSvgY(point8.y)}
            stroke="black" strokeWidth="2" clipPath="url(#drawArea)"
          />
        )}

        {/* Bottom corner points A, B, 1, 2, 3, 4, C, D, E, 5, 6, 7, 8 */}
        {showPoints && (
          <g clipPath="url(#drawArea)">
            {/* Point A (Bottom Left) */}
            <circle cx={toSvgX(pointA.x)} cy={toSvgY(pointA.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(pointA.x) - 6} y={toSvgY(pointA.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">A</text>

            {/* Point B (Bottom Right) */}
            <circle cx={toSvgX(pointB.x)} cy={toSvgY(pointB.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(pointB.x) + 6} y={toSvgY(pointB.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">B</text>

            {/* Point 1 (Outer canal wall left at depth DBO) */}
            <circle cx={toSvgX(bankInnerLeft.x)} cy={toSvgY(bankInnerLeft.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(bankInnerLeft.x) + 6} y={toSvgY(bankInnerLeft.y) - 6} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">1</text>

            {/* Point 2 (Outer canal wall right at depth DBO) */}
            <circle cx={toSvgX(bankInnerRight.x)} cy={toSvgY(bankInnerRight.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(bankInnerRight.x) - 6} y={toSvgY(bankInnerRight.y) - 6} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">2</text>

            {/* Point 3 (Outer edge of left bank) */}
            <circle cx={toSvgX(bankOuterLeft.x)} cy={toSvgY(bankOuterLeft.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(bankOuterLeft.x) - 6} y={toSvgY(bankOuterLeft.y) - 6} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">3</text>

            {/* Point 4 (Outer edge of right bank) */}
            <circle cx={toSvgX(bankOuterRight.x)} cy={toSvgY(bankOuterRight.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <text x={toSvgX(bankOuterRight.x) + 6} y={toSvgY(bankOuterRight.y) - 6} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">4</text>

            {/* Point C (Intersection of left slope line with terrain) */}
            {isALowerThanTerrain && intersectA && (
              <>
                <circle cx={toSvgX(intersectA.x)} cy={toSvgY(intersectA.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(intersectA.x) - 6} y={toSvgY(intersectA.y) - 8} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">C</text>
              </>
            )}

            {/* Point D (Intersection of right slope line with terrain) */}
            {isBLowerThanTerrain && intersectB && (
              <>
                <circle cx={toSvgX(intersectB.x)} cy={toSvgY(intersectB.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(intersectB.x) + 6} y={toSvgY(intersectB.y) - 8} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">D</text>
              </>
            )}

            {/* Point E (Intersection of horizontal line from lower A/B point with terrain) */}
            {pointE && lowerPointForE && (
              <>
                <circle cx={toSvgX(pointE.x)} cy={toSvgY(pointE.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(pointE.x) + (lowerPointForE === pointA ? 8 : -8)} y={toSvgY(pointE.y) - 6} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor={lowerPointForE === pointA ? "start" : "end"}>E</text>
              </>
            )}

            {/* Point 5 (Intersection of left embankment slope from 3 with terrain) */}
            {point5 && (
              <>
                <circle cx={toSvgX(point5.x)} cy={toSvgY(point5.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(point5.x) - 6} y={toSvgY(point5.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">5</text>
              </>
            )}

            {/* Point 6 (Intersection of right embankment slope from 4 with terrain) */}
            {point6 && (
              <>
                <circle cx={toSvgX(point6.x)} cy={toSvgY(point6.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(point6.x) + 6} y={toSvgY(point6.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">6</text>
              </>
            )}

            {/* Point 7 (Intersection of slope 1 from 5 with stripped terrain) */}
            {point7 && (
              <>
                <circle cx={toSvgX(point7.x)} cy={toSvgY(point7.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(point7.x) - 6} y={toSvgY(point7.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="end">7</text>
              </>
            )}

            {/* Point 8 (Intersection of slope 1 from 6 with stripped terrain) */}
            {point8 && (
              <>
                <circle cx={toSvgX(point8.x)} cy={toSvgY(point8.y)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <text x={toSvgX(point8.x) + 6} y={toSvgY(point8.y) + 16} fontSize="12" fontWeight="bold" fill="#dc2626" textAnchor="start">8</text>
              </>
            )}
          </g>
        )}

        {/* Info Legend (S đào, S đắp & S bóc thảo mộc area display) */}
        <g transform={`translate(${margin.left + drawW - 170}, ${margin.top + 20})`}>
          <rect
            x="0" y="0"
            width="155" height={isFullFill ? "76" : "32"}
            fill="white" stroke="#cbd5e1" strokeWidth="1" rx="6" opacity="0.95"
          />
          <text x="12" y="21" fontSize="12" fill="#0f172a" fontWeight="700">S đào: {S_dao_trang.toFixed(2)} m²</text>
          {isFullFill && (
            <>
              <text x="12" y="41" fontSize="12" fill="#ca8a04" fontWeight="700">S đắp: {S_dap.toFixed(2)} m²</text>
              <text x="12" y="61" fontSize="12" fill="#92400e" fontWeight="700">S bóc TM: {S_boc_thao_moc.toFixed(2)} m²</text>
            </>
          )}
        </g>

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
