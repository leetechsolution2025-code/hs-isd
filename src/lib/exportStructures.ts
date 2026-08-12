export const SCALE = 4.0 / 24.0;

function pt(x: number, y: number, px: number, py: number, flipY: boolean = false) {
  return {
    X: x + (px - 12) * SCALE,
    Y: y + (12 - py) * SCALE * (flipY ? -1 : 1)
  };
}

export function drawDXFStructure(dxf: any, x: number, y: number, type: string, status: string, offtakeSide: string) {
  const flip = offtakeSide.toLowerCase() === 'phai';
  
  const addLine = (p1x: number, p1y: number, p2x: number, p2y: number, ltype?: string) => {
    const p1 = pt(x, y, p1x, p1y, flip);
    const p2 = pt(x, y, p2x, p2y, flip);
    dxf.addLine(p1.X, p1.Y, p2.X, p2.Y, "Khung", 1, ltype);
  };
  const addSolidRedCircle = (cx: number, cy: number, r: number) => {
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      const p0 = pt(x, y, cx, cy, flip);
      const p1 = pt(x, y, x1, y1, flip);
      const p2 = pt(x, y, x2, y2, flip);
      dxf.content.push(
          "0", "SOLID", "8", "Khung", "62", "1",
          "10", p0.X.toFixed(3), "20", p0.Y.toFixed(3), "30", "0.0",
          "11", p1.X.toFixed(3), "21", p1.Y.toFixed(3), "31", "0.0",
          "12", p2.X.toFixed(3), "22", p2.Y.toFixed(3), "32", "0.0",
          "13", p2.X.toFixed(3), "23", p2.Y.toFixed(3), "33", "0.0"
      );
    }
  };
  const addArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const c = pt(x, y, cx, cy, flip);
    let sa = startA;
    let ea = endA;
    if (flip) {
      sa = 360 - endA;
      ea = 360 - startA;
    }
    dxf.content.push("0", "ARC", "8", "Khung", "62", "1", "10", c.X.toFixed(3), "20", c.Y.toFixed(3), "30", "0.0", "40", (r * SCALE).toFixed(3), "50", sa.toFixed(3), "51", ea.toFixed(3));
  };
  const addRect = (rx: number, ry: number, w: number, h: number) => {
    addLine(rx, ry, rx+w, ry);
    addLine(rx+w, ry, rx+w, ry+h);
    addLine(rx+w, ry+h, rx, ry+h);
    addLine(rx, ry+h, rx, ry);
  };
  const addPoly = (points: number[][], ltype?: string) => {
    const pts = points.map(p => pt(x, y, p[0], p[1], flip));
    dxf.addPolyline(pts, "Khung", 1, ltype);
  };

  switch(type) {
    case 'pump_irrigation':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180); // upper half
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(18, 12, 24, 12); addLine(21, 9, 24, 12); addLine(21, 15, 24, 12);
      break;
    case 'pump_drainage':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180);
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(6, 12, 0, 12, "DASHED"); addLine(3, 9, 0, 12); addLine(3, 15, 0, 12);
      break;
    case 'pump_combined':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180);
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(18, 10, 24, 10); addLine(21, 7, 24, 10); addLine(21, 13, 24, 10);
      addLine(6, 14, 0, 14, "DASHED"); addLine(3, 11, 0, 14); addLine(3, 17, 0, 14);
      break;
    case 'intake_irrigation':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(18, 12, 24, 12); addLine(21, 9, 24, 12); addLine(21, 15, 24, 12);
      break;
    case 'intake_drainage':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(6, 12, 0, 12, "DASHED"); addLine(3, 9, 0, 12); addLine(3, 15, 0, 12);
      break;
    case 'intake_combined':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(18, 10, 24, 10); addLine(21, 7, 24, 10); addLine(21, 13, 24, 10);
      addLine(6, 14, 0, 14, "DASHED"); addLine(3, 11, 0, 14); addLine(3, 17, 0, 14);
      break;
    case 'offtake_irrigation':
      addLine(12, 7.5, 12, -12);
      addSolidRedCircle(12, 7.5, 4.5);
      break;
    case 'drainage_under_canal':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addSolidRedCircle(12, 12, 5);
      addLine(12, 24, 10, 20); addLine(12, 24, 14, 20);
      break;
    case 'culvert_road':
      addLine(0, 12, 24, 12);
      addArc(12, 12, 4, 0, 180);
      addSolidRedCircle(8, 12, 1.5); addSolidRedCircle(16, 12, 1.5);
      break;
    case 'culvert_canal':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addArc(12, 12, 4, 270, 90);
      addSolidRedCircle(12, 8, 1.5); addSolidRedCircle(12, 16, 1.5);
      break;
    case 'bridge_auto':
      addLine(0, 12, 24, 12);
      addLine(10, 4, 10, 20); addLine(14, 4, 14, 20);
      addLine(10, 4, 6, 2); addLine(10, 20, 6, 22);
      addLine(14, 4, 18, 2); addLine(14, 20, 18, 22);
      break;
    case 'bridge_rough':
      addLine(0, 12, 24, 12);
      addLine(12, 4, 12, 20);
      addLine(12, 4, 8, 2); addLine(12, 20, 8, 22);
      addLine(12, 4, 16, 2); addLine(12, 20, 16, 22);
      break;
    case 'aqueduct':
      addLine(0, 12, 24, 12);
      addRect(8, 8, 8, 8);
      addLine(4, 10, 8, 8); addLine(4, 14, 8, 16); addLine(4, 10, 4, 14);
      addLine(20, 10, 16, 8); addLine(20, 14, 16, 16); addLine(20, 10, 20, 14);
      break;
    case 'weir_in':
      addLine(0, 16, 24, 16);
      addArc(12, 16, 6, 0, 180);
      addLine(12, 11, 12, 16);
      break;
    case 'weir_out':
      addLine(0, 8, 24, 8);
      addArc(12, 8, 6, 180, 360);
      addLine(12, 13, 12, 8);
      break;
    case 'gate_regulate':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addSolidRedCircle(12, 12, 5);
      addLine(8.5, 8.5, 15.5, 15.5); addLine(8.5, 15.5, 15.5, 8.5);
      break;
    case 'check_structure':
      addLine(0, 12, 24, 12); addLine(12, 4, 12, 16); addLine(8, 16, 16, 16);
      break;
    case 'drop_structure':
      addLine(0, 12, 24, 12, "DASHED");
      addPoly([[4, 8], [12, 8], [12, 16], [20, 16]]);
      break;
    case 'measure_structure':
      addLine(0, 14, 24, 14);
      addPoly([[6, 14], [6, 8], [16, 8], [16, 18]]);
      addSolidRedCircle(16, 18, 2.5);
      addLine(14.5, 18, 17.5, 18);
      break;
    case 'hydropower':
      addLine(0, 12, 24, 12);
      addSolidRedCircle(12, 12, 6);
      addPoly([[7, 12], [9.5, 8], [12, 12], [14.5, 16], [17, 12]]);
      break;
  }

  // Status Modifiers
  if (status !== 'planned') {
    addRect(1, 1, 22, 22);
  }
  if (status === 'repair') {
    addLine(10, 21, 14, 24);
    addLine(10, 24, 14, 21);
  }
  if (status === 'abandoned') {
    addLine(1, 1, 23, 23);
    addLine(23, 1, 1, 23);
  }
}

export function drawLISPStructure(x: number, y: number, type: string, status: string, offtakeSide: string): string {
  const flip = offtakeSide.toLowerCase() === 'phai';
  let scr = "";
  
  const addLine = (p1x: number, p1y: number, p2x: number, p2y: number, ltype?: string) => {
    const p1 = pt(x, y, p1x, p1y, flip);
    const p2 = pt(x, y, p2x, p2y, flip);
    scr += `(entmake\n  (list\n    '(0 . "LINE")\n    '(8 . "KhungBang")\n    '(62 . 1)\n    (cons 10 (list ${p1.X.toFixed(3)} ${p1.Y.toFixed(3)} 0))\n    (cons 11 (list ${p2.X.toFixed(3)} ${p2.Y.toFixed(3)} 0))\n`;
    if (ltype) scr += `    (cons 6 "${ltype}")\n`;
    scr += `  )\n)\n`;
  };
  const addSolidRedCircle = (cx: number, cy: number, r: number) => {
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      const p0 = pt(x, y, cx, cy, flip);
      const p1 = pt(x, y, x1, y1, flip);
      const p2 = pt(x, y, x2, y2, flip);
      scr += `(entmake\n  (list\n    '(0 . "SOLID")\n    '(8 . "KhungBang")\n    '(62 . 1)\n` +
             `    (cons 10 (list ${p0.X.toFixed(3)} ${p0.Y.toFixed(3)} 0))\n` +
             `    (cons 11 (list ${p1.X.toFixed(3)} ${p1.Y.toFixed(3)} 0))\n` +
             `    (cons 12 (list ${p2.X.toFixed(3)} ${p2.Y.toFixed(3)} 0))\n` +
             `    (cons 13 (list ${p2.X.toFixed(3)} ${p2.Y.toFixed(3)} 0))\n  )\n)\n`;
    }
  };
  const addArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const c = pt(x, y, cx, cy, flip);
    let sa = startA;
    let ea = endA;
    if (flip) {
      sa = 360 - endA;
      ea = 360 - startA;
    }
    const saRad = sa * Math.PI / 180;
    const eaRad = ea * Math.PI / 180;
    scr += `(entmake\n  (list\n    '(0 . "ARC")\n    '(8 . "KhungBang")\n    '(62 . 1)\n    (cons 10 (list ${c.X.toFixed(3)} ${c.Y.toFixed(3)} 0))\n    (cons 40 ${(r * SCALE).toFixed(3)})\n    (cons 50 ${saRad.toFixed(3)})\n    (cons 51 ${eaRad.toFixed(3)})\n  )\n)\n`;
  };
  const addRect = (rx: number, ry: number, w: number, h: number) => {
    addLine(rx, ry, rx+w, ry);
    addLine(rx+w, ry, rx+w, ry+h);
    addLine(rx+w, ry+h, rx, ry+h);
    addLine(rx, ry+h, rx, ry);
  };
  const addPoly = (points: number[][], ltype?: string) => {
    for (let i = 0; i < points.length - 1; i++) {
      addLine(points[i][0], points[i][1], points[i+1][0], points[i+1][1], ltype);
    }
  };

  switch(type) {
    case 'pump_irrigation':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180);
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(18, 12, 24, 12); addLine(21, 9, 24, 12); addLine(21, 15, 24, 12);
      break;
    case 'pump_drainage':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180);
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(6, 12, 0, 12, "DASHED"); addLine(3, 9, 0, 12); addLine(3, 15, 0, 12);
      break;
    case 'pump_combined':
      addSolidRedCircle(12, 12, 6);
      addArc(12, 12, 6, 0, 180);
      addLine(8, 8, 12, 12); addLine(7, 11, 12, 16); addLine(10, 16, 12, 14);
      addLine(18, 10, 24, 10); addLine(21, 7, 24, 10); addLine(21, 13, 24, 10);
      addLine(6, 14, 0, 14, "DASHED"); addLine(3, 11, 0, 14); addLine(3, 17, 0, 14);
      break;
    case 'intake_irrigation':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(18, 12, 24, 12); addLine(21, 9, 24, 12); addLine(21, 15, 24, 12);
      break;
    case 'intake_drainage':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(6, 12, 0, 12, "DASHED"); addLine(3, 9, 0, 12); addLine(3, 15, 0, 12);
      break;
    case 'intake_combined':
      addSolidRedCircle(12, 12, 6);
      addLine(7, 8, 17, 16); addLine(8, 7, 16, 17); addLine(9, 6, 15, 18);
      addLine(6, 9, 18, 15); addLine(7, 11, 17, 13); addLine(6, 12, 18, 12);
      addLine(7, 14, 17, 10); addLine(8, 16, 16, 8); addLine(9, 18, 15, 6);
      addLine(18, 10, 24, 10); addLine(21, 7, 24, 10); addLine(21, 13, 24, 10);
      addLine(6, 14, 0, 14, "DASHED"); addLine(3, 11, 0, 14); addLine(3, 17, 0, 14);
      break;
    case 'offtake_irrigation':
      addLine(12, 7.5, 12, -12);
      addSolidRedCircle(12, 7.5, 4.5);
      break;
    case 'drainage_under_canal':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addSolidRedCircle(12, 12, 5);
      addLine(12, 24, 10, 20); addLine(12, 24, 14, 20);
      break;
    case 'culvert_road':
      addLine(0, 12, 24, 12);
      addArc(12, 12, 4, 0, 180);
      addSolidRedCircle(8, 12, 1.5); addSolidRedCircle(16, 12, 1.5);
      break;
    case 'culvert_canal':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addArc(12, 12, 4, 270, 90);
      addSolidRedCircle(12, 8, 1.5); addSolidRedCircle(12, 16, 1.5);
      break;
    case 'bridge_auto':
      addLine(0, 12, 24, 12);
      addLine(10, 4, 10, 20); addLine(14, 4, 14, 20);
      addLine(10, 4, 6, 2); addLine(10, 20, 6, 22);
      addLine(14, 4, 18, 2); addLine(14, 20, 18, 22);
      break;
    case 'bridge_rough':
      addLine(0, 12, 24, 12);
      addLine(12, 4, 12, 20);
      addLine(12, 4, 8, 2); addLine(12, 20, 8, 22);
      addLine(12, 4, 16, 2); addLine(12, 20, 16, 22);
      break;
    case 'aqueduct':
      addLine(0, 12, 24, 12);
      addRect(8, 8, 8, 8);
      addLine(4, 10, 8, 8); addLine(4, 14, 8, 16); addLine(4, 10, 4, 14);
      addLine(20, 10, 16, 8); addLine(20, 14, 16, 16); addLine(20, 10, 20, 14);
      break;
    case 'weir_in':
      addLine(0, 16, 24, 16);
      addArc(12, 16, 6, 0, 180);
      addLine(12, 11, 12, 16);
      break;
    case 'weir_out':
      addLine(0, 8, 24, 8);
      addArc(12, 8, 6, 180, 360);
      addLine(12, 13, 12, 8);
      break;
    case 'gate_regulate':
      addLine(0, 12, 24, 12); addLine(12, 0, 12, 24);
      addSolidRedCircle(12, 12, 5);
      addLine(8.5, 8.5, 15.5, 15.5); addLine(8.5, 15.5, 15.5, 8.5);
      break;
    case 'check_structure':
      addLine(0, 12, 24, 12); addLine(12, 4, 12, 16); addLine(8, 16, 16, 16);
      break;
    case 'drop_structure':
      addLine(0, 12, 24, 12, "DASHED");
      addPoly([[4, 8], [12, 8], [12, 16], [20, 16]]);
      break;
    case 'measure_structure':
      addLine(0, 14, 24, 14);
      addPoly([[6, 14], [6, 8], [16, 8], [16, 18]]);
      addSolidRedCircle(16, 18, 2.5);
      addLine(14.5, 18, 17.5, 18);
      break;
    case 'hydropower':
      addLine(0, 12, 24, 12);
      addSolidRedCircle(12, 12, 6);
      addPoly([[7, 12], [9.5, 8], [12, 12], [14.5, 16], [17, 12]]);
      break;
  }

  if (status !== 'planned') {
    addRect(1, 1, 22, 22);
  }
  if (status === 'repair') {
    addLine(10, 21, 14, 24);
    addLine(10, 24, 14, 21);
  }
  if (status === 'abandoned') {
    addLine(1, 1, 23, 23);
    addLine(23, 1, 1, 23);
  }

  return scr;
}
