/**
 * Bảng G1 - Hệ số lợi dụng η của kênh nhỏ dựa theo diện tích của khu tưới, loại kênh và tính chất đất đắp kênh
 */

export type CanalType = 'A' | 'B';
export type Permeability = 'nhieu' | 'vua' | 'it';

interface DataPoint {
  area: number;
  A_nhieu: number;
  A_vua: number;
  A_it: number;
  B_nhieu: number;
  B_vua: number;
  B_it: number;
}

const efficiencyTable: DataPoint[] = [
  { area: 25, A_nhieu: 0.80, A_vua: 0.90, A_it: 0.95, B_nhieu: 0.75, B_vua: 0.85, B_it: 0.90 },
  { area: 50, A_nhieu: 0.75, A_vua: 0.87, A_it: 0.92, B_nhieu: 0.70, B_vua: 0.80, B_it: 0.86 },
  { area: 100, A_nhieu: 0.72, A_vua: 0.84, A_it: 0.90, B_nhieu: 0.66, B_vua: 0.75, B_it: 0.83 },
  { area: 150, A_nhieu: 0.69, A_vua: 0.81, A_it: 0.87, B_nhieu: 0.63, B_vua: 0.72, B_it: 0.80 },
  { area: 200, A_nhieu: 0.66, A_vua: 0.78, A_it: 0.84, B_nhieu: 0.60, B_vua: 0.70, B_it: 0.77 },
  { area: 300, A_nhieu: 0.62, A_vua: 0.74, A_it: 0.80, B_nhieu: 0.57, B_vua: 0.66, B_it: 0.74 },
];

/**
 * Hàm nội suy tuyến tính hệ số lợi dụng kênh nhánh
 * @param area Diện tích tưới (ha)
 * @param canalType Kênh loại 'A' hoặc 'B'
 * @param permeability Mức độ thấm ('nhieu', 'vua', 'it')
 * @returns Hệ số lợi dụng η
 */
export function calculateEfficiencyCoefficient(
  area: number,
  canalType: CanalType,
  permeability: Permeability
): number {
  const key = `${canalType}_${permeability}` as keyof Omit<DataPoint, 'area'>;

  // Nếu diện tích nhỏ hơn hoặc bằng 25
  if (area <= efficiencyTable[0].area) {
    return efficiencyTable[0][key];
  }

  // Nếu diện tích lớn hơn hoặc bằng 300
  const lastIndex = efficiencyTable.length - 1;
  if (area >= efficiencyTable[lastIndex].area) {
    return efficiencyTable[lastIndex][key];
  }

  // Tìm 2 điểm để nội suy
  for (let i = 0; i < lastIndex; i++) {
    const p1 = efficiencyTable[i];
    const p2 = efficiencyTable[i + 1];

    if (area >= p1.area && area <= p2.area) {
      const v1 = p1[key];
      const v2 = p2[key];
      
      // Công thức nội suy tuyến tính: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      const interpolatedValue = v1 + ((area - p1.area) * (v2 - v1)) / (p2.area - p1.area);
      
      // Làm tròn 3 chữ số thập phân cho an toàn sai số float
      return Math.round(interpolatedValue * 1000) / 1000;
    }
  }

  return 0; // Fallback
}

export const PERMEABILITY_PROPERTIES = {
  rat_it: { label: 'Thấm rất ít', A: 0.70, m: 0.30, A1: 0.70, m1: 0.30 },
  it: { label: 'Thấm ít', A: 1.30, m: 0.35, A1: 1.30, m1: 0.35 },
  vua: { label: 'Thấm vừa', A: 1.90, m: 0.40, A1: 1.90, m1: 0.40 },
  nhieu: { label: 'Thấm nhiều', A: 2.65, m: 0.45, A1: 2.65, m1: 0.45 },
  rat_manh: { label: 'Thấm rất mạnh', A: 3.40, m: 0.50, A1: 3.40, m1: 0.50 }
} as const;

export type PermeabilityLevel = keyof typeof PERMEABILITY_PROPERTIES;

/**
 * Bảng 12 - Chiều cao an toàn của kênh
 * @param flow Lưu lượng của kênh (m³/s)
 * @param canalType Loại kênh ('khong_gia_co' cho kênh đất, 'gia_co' cho kênh bọc bê tông...)
 * @returns Chiều cao an toàn (m) dạng chuỗi
 */
export function calculateSafeHeight(flow: number, canalType: 'gia_co' | 'khong_gia_co'): string {
  if (flow < 1) {
    return canalType === 'khong_gia_co' ? '0.20' : '0.15';
  }
  if (flow >= 1 && flow <= 10) {
    return canalType === 'khong_gia_co' ? '0.30' : '0.20';
  }
  if (flow > 10 && flow <= 30) {
    return canalType === 'khong_gia_co' ? '0.40' : '0.30';
  }
  if (flow > 30 && flow <= 50) {
    return canalType === 'khong_gia_co' ? '0.50' : '0.35';
  }
  if (flow > 50 && flow <= 100) {
    return canalType === 'khong_gia_co' ? '0.60' : '0.40';
  }
  return '';
}

export function getKMaxCoefficient(q: number): number {
  // Lấy giá trị trung bình trong khoảng quy định của bảng 3
  if (q < 1) return 1.25; // từ 1.2 đến 1.3
  if (q >= 1 && q <= 10) return 1.175; // từ 1.15 đến 1.2
  return 1.125; // từ 1.1 đến 1.15
}

export interface HydraulicResult {
  h?: number;
  b?: number;
  v?: number;
  success: boolean;
  error?: string;
}

// Hàm tính cột nước (h) khi biết bề rộng đáy (b)
export function solveForH(Q: number, b: number, m: number, i: number, n: number): HydraulicResult {
  if (Q <= 0 || b <= 0 || i <= 0 || n <= 0) return { success: false, error: 'Thông số đầu vào không hợp lệ' };
  
  const K0 = (Q * n) / Math.sqrt(i);
  
  // Dùng phương pháp chia đôi (Bisection method)
  let hMin = 0.001;
  let hMax = 100;
  let h = (hMin + hMax) / 2;
  
  for (let iter = 0; iter < 100; iter++) {
    const A = (b + m * h) * h;
    const P = b + 2 * h * Math.sqrt(1 + m * m);
    const K_calc = Math.pow(A, 5/3) / Math.pow(P, 2/3);
    
    if (Math.abs(K_calc - K0) < 1e-5) {
      break;
    }
    
    if (K_calc < K0) {
      hMin = h;
    } else {
      hMax = h;
    }
    h = (hMin + hMax) / 2;
  }
  
  const A = (b + m * h) * h;
  const v = Q / A;
  
  return { success: true, h, b, v };
}

// Hàm tính bề rộng đáy (b) khi biết cột nước (h)
export function solveForB(Q: number, h: number, m: number, i: number, n: number): HydraulicResult {
  if (Q <= 0 || h <= 0 || i <= 0 || n <= 0) return { success: false, error: 'Thông số đầu vào không hợp lệ' };
  
  const K0 = (Q * n) / Math.sqrt(i);
  
  let bMin = 0.001;
  let bMax = 1000;
  let b = (bMin + bMax) / 2;
  
  for (let iter = 0; iter < 100; iter++) {
    const A = (b + m * h) * h;
    const P = b + 2 * h * Math.sqrt(1 + m * m);
    const K_calc = Math.pow(A, 5/3) / Math.pow(P, 2/3);
    
    if (Math.abs(K_calc - K0) < 1e-5) {
      break;
    }
    
    if (K_calc < K0) {
      bMin = b;
    } else {
      bMax = b;
    }
    b = (bMin + bMax) / 2;
  }
  
  const A = (b + m * h) * h;
  const v = Q / A;
  
  return { success: true, h, b, v };
}

// Hàm tính cả cột nước (h) và bề rộng đáy (b) dựa trên tỷ số beta = b/h
export function solveForHandB(Q: number, beta: number, m: number, i: number, n: number): HydraulicResult {
  if (Q <= 0 || beta <= 0 || i <= 0 || n <= 0) return { success: false, error: 'Thông số đầu vào không hợp lệ' };
  
  const K0 = (Q * n) / Math.sqrt(i);
  
  // h = ( K0 * (beta + 2*sqrt(1+m^2))^(2/3) / (beta + m)^(5/3) ) ^ (3/8)
  const term1 = Math.pow(beta + 2 * Math.sqrt(1 + m * m), 2/3);
  const term2 = Math.pow(beta + m, 5/3);
  
  const h = Math.pow(K0 * (term1 / term2), 3/8);
  const b = beta * h;
  
  const A = (b + m * h) * h;
  const v = Q / A;
  
  return { success: true, h, b, v };
}
