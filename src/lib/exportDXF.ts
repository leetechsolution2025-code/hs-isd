class DxfWriter {
  private content: string[] = [];
  
  constructor() {
    this.content.push(
      "0", "SECTION",
      "2", "TABLES",
      "0", "TABLE",
      "2", "LTYPE",
      "70", "1",
      "0", "LTYPE",
      "2", "DASHED",
      "70", "0",
      "3", "Dashed __ __ __ __ __ __",
      "72", "65",
      "73", "2",
      "40", "0.75",
      "49", "0.5",
      "49", "-0.25",
      "0", "ENDTAB",
      "0", "TABLE",
      "2", "STYLE",
      "70", "1",
      "0", "STYLE",
      "2", "VnTimeH",
      "70", "0",
      "40", "0.0",
      "41", "1.0",
      "50", "0.0",
      "71", "0",
      "42", "1.5",
      "3", "vntimeh.shx",
      "4", "",
      "0", "ENDTAB",
      "0", "ENDSEC",
      "0", "SECTION",
      "2", "ENTITIES"
    );
  }

  public addLine(x1: number, y1: number, x2: number, y2: number, layer: string = "0", color: number = 256, ltype?: string) {
    this.content.push(
      "0", "LINE",
      "8", layer,
      "62", color.toString(),
      "10", x1.toFixed(3),
      "20", y1.toFixed(3),
      "30", "0.0",
      "11", x2.toFixed(3),
      "21", y2.toFixed(3),
      "31", "0.0"
    );
    if (ltype) {
      this.content.push("6", ltype);
    }
  }

  public addPolyline(points: {x: number, y: number}[], layer: string = "0", color: number = 256, ltype?: string) {
    if (points.length === 0) return;
    this.content.push(
      "0", "LWPOLYLINE",
      "100", "AcDbEntity",
      "8", layer,
      "62", color.toString()
    );
    if (ltype) {
      this.content.push("6", ltype);
    }
    this.content.push(
      "100", "AcDbPolyline",
      "90", points.length.toString(),
      "70", "0"
    );
    for (const p of points) {
      this.content.push(
        "10", p.x.toFixed(3),
        "20", p.y.toFixed(3)
      );
    }
  }

  public addText(text: string, x: number, y: number, height: number, rotationDeg: number = 0, layer: string = "0", color: number = 256, style?: string) {
    this.content.push(
      "0", "TEXT",
      "8", layer,
      "62", color.toString(),
      "10", x.toFixed(3),
      "20", y.toFixed(3),
      "30", "0.0",
      "40", height.toFixed(3),
      "1", text,
      "50", rotationDeg.toFixed(3)
    );
    if (style) {
      this.content.push("7", style);
    }
  }

  public generate(): string {
    this.content.push(
      "0", "ENDSEC",
      "0", "EOF"
    );
    return this.content.join("\n");
  }
}

import { unicodeToTCVN3 } from './tcvn3';
import { drawDXFStructure } from './exportStructures';

export function generateProfileDXF(data: any[], settings: any, landmarkData: { name?: string, chainage: number, angleStr: string }[] = [], canalStructures: any[] = []) {
  const { horizontalScale, verticalScale, datumElevation, stakePrefix } = settings;
  const H = horizontalScale;
  const V = verticalScale;
  
  let datum = datumElevation;
  if (datum === null || datum === undefined || datum === "") {
    let minE = Infinity;
    for (const row of data) {
      if (row.dayVal !== undefined && row.dayVal < minE) minE = row.dayVal;
      if (row.bedVal !== undefined && row.bedVal < minE) minE = row.bedVal;
    }
    datum = Math.floor(minE) - 2;
    if (datum === Infinity) datum = 0;
  }
  
  const X0 = 0;
  const Y0 = 0;

  const dxf = new DxfWriter();

  // Polylines
  const ptsTuNhien = [];
  const ptsThietKeDay = [];
  const ptsThietKeMucNuoc = [];
  const ptsThietKeDinh = [];

  for (const row of data) {
    const x = X0 + row.chainage * (1000 / H);
    ptsTuNhien.push({ x, y: Y0 + ((row.dayVal || 0) - datum) * (1000 / V) });
    ptsThietKeDay.push({ x, y: Y0 + ((row.bedVal || 0) - datum) * (1000 / V) });
    ptsThietKeMucNuoc.push({ x, y: Y0 + ((row.htkVal || 0) - datum) * (1000 / V) });
    ptsThietKeDinh.push({ x, y: Y0 + ((row.dinhKenhVal || 0) - datum) * (1000 / V) });
  }

  // Draw Lines
  dxf.addPolyline(ptsTuNhien, "TuNhien", 8, "DASHED"); // Dashed Grey
  dxf.addPolyline(ptsThietKeDay, "ThietKeDay", 1); // Red
  dxf.addPolyline(ptsThietKeMucNuoc, "ThietKeMucNuoc", 5); // Blue
  dxf.addPolyline(ptsThietKeDinh, "ThietKeDinh", 2); // Yellow

  // Table Config
  const X_start = X0 - 55;
  const X_split = X_start + 10;
  const X_data_start = X0;
  const maxX = X0 + data[data.length - 1].chainage * (1000 / H);
  
  const textStyle = "VnTimeH";
  const textColor = 7; // White
  const gridColor = 7; // White for grid lines

  // Override addText to use alignment
  const addAlignedDXFText = (txt: string, x: number, y: number, rot: number, layer: string, color: number, alignType: "left" | "center" | "right" = "left") => {
    const encTxt = unicodeToTCVN3(txt);
    if (alignType === "center") {
      dxf['content'].push(
        "0", "TEXT", "8", layer, "62", color.toString(),
        "10", x.toFixed(3), "20", y.toFixed(3), "30", "0.0", "40", "1.500",
        "1", encTxt, "50", rot.toFixed(3), "7", textStyle,
        "72", "1", "11", x.toFixed(3), "21", y.toFixed(3), "31", "0.0", "73", "2"
      );
    } else if (alignType === "right") {
      dxf['content'].push(
        "0", "TEXT", "8", layer, "62", color.toString(),
        "10", x.toFixed(3), "20", y.toFixed(3), "30", "0.0", "40", "1.500",
        "1", encTxt, "50", rot.toFixed(3), "7", textStyle,
        "72", "2", "11", x.toFixed(3), "21", y.toFixed(3), "31", "0.0", "73", "2"
      );
    } else {
      dxf.addText(encTxt, x, y, 1.5, rot, layer, color, textStyle);
    }
  };

  // Label MỨC SO SÁNH
  addAlignedDXFText(`MỨC SO SÁNH (${datum}M)`, X_start, Y0 + 2, 0, "Khung", textColor);

  // Horizontal Grid Lines
  const yRows = [0, -10, -20, -30, -40, -50, -60, -70, -80];
  yRows.forEach((y, i) => {
    // "Thiết kế" block merged cell (from y= -10 to -50)
    if (y === -20 || y === -30 || y === -40) {
      dxf.addLine(X_split, y, maxX, y, "Khung", gridColor);
    } else {
      dxf.addLine(X_start, y, maxX, y, "Khung", gridColor);
    }
  });

  // Vertical Grid Lines for Headers
  dxf.addLine(X_start, 0, X_start, -80, "Khung", gridColor);
  dxf.addLine(X_split, -10, X_split, -50, "Khung", gridColor);
  dxf.addLine(X_data_start, 0, X_data_start, -80, "Khung", gridColor);

  // Elevation Scale (Thước cao độ) at X0
  let maxE = datum;
  data.forEach(row => {
    if (row.dayVal > maxE) maxE = row.dayVal;
    if (row.bedVal > maxE) maxE = row.bedVal;
    if (row.htkVal > maxE) maxE = row.htkVal;
    if (row.dinhKenhVal > maxE) maxE = row.dinhKenhVal;
  });
  const maxScale = Math.ceil(maxE / 2) * 2 + 2;
  const scaleYMax = Y0 + (maxScale - datum) * (1000 / V);
  
  const w = 1.0; // width of the scale bar
  // The left and right edges for the scale
  dxf.addLine(X0 - w/2, Y0, X0 - w/2, scaleYMax, "Khung", 7);
  dxf.addLine(X0 + w/2, Y0, X0 + w/2, scaleYMax, "Khung", 7);
  
  for (let e = datum; e <= maxScale; e += 2) {
    const yTick = Y0 + (e - datum) * (1000 / V);
    dxf.addLine(X0 - w/2, yTick, X0 - w/2 - 1.0, yTick, "Khung", 7);
    addAlignedDXFText(e.toString(), X0 - w/2 - 2.0, yTick, 0, "Khung", textColor, "right");
    
    // Draw white SOLID bar from e to e+2 if (e - datum) % 4 == 2
    if ((e - datum) % 4 === 2 && e < maxScale) {
      const yNext = Y0 + (e + 2 - datum) * (1000 / V);
      dxf['content'].push(
        "0", "SOLID",
        "8", "Khung",
        "62", "7",
        "10", (X0 - w/2).toFixed(3), "20", yTick.toFixed(3), "30", "0.0",
        "11", (X0 + w/2).toFixed(3), "21", yTick.toFixed(3), "31", "0.0",
        "12", (X0 - w/2).toFixed(3), "22", yNext.toFixed(3), "32", "0.0",
        "13", (X0 + w/2).toFixed(3), "23", yNext.toFixed(3), "33", "0.0"
      );
    }
  }

  // Red line below the table for stake positions
  const Y_red_line = -90;
  dxf.addLine(X0, Y_red_line, maxX, Y_red_line, "Khung", 1); // color 1 = red

  // Header Texts (Left aligned)
  addAlignedDXFText("CAO ĐỘ MẶT ĐẤT TỰ NHIÊN (M)", X_start + 2, -6.5, 0, "Khung", textColor);
  addAlignedDXFText("THIẾT KẾ", X_start + 4, -42, 90, "Khung", textColor);
  addAlignedDXFText("CAO ĐỘ ĐÁY KÊNH (M)", X_split + 2, -16.5, 0, "Khung", textColor);
  addAlignedDXFText("CAO ĐỘ MỰC NƯỚC MAX(M)", X_split + 2, -26.5, 0, "Khung", textColor);
  addAlignedDXFText("CAO ĐỘ MỰC NƯỚC (M)", X_split + 2, -36.5, 0, "Khung", textColor);
  addAlignedDXFText("CAO ĐỘ BỜ KÊNH (M)", X_split + 2, -46.5, 0, "Khung", textColor);
  addAlignedDXFText("KHOẢNG CÁCH (M)", X_start + 2, -56.5, 0, "Khung", textColor);
  addAlignedDXFText("KC CỘNG DỒN (M)", X_start + 2, -66.5, 0, "Khung", textColor);
  addAlignedDXFText("TÊN CỌC", X_start + 2, -76.5, 0, "Khung", textColor);

  // Data Columns
  let prevChainage = 0;
  data.forEach((row, i) => {
    const x = X0 + row.chainage * (1000 / H);
    
    // Vertical line projection up to the natural ground, stops at Y0
    const yGround = Y0 + ((row.dayVal || 0) - datum) * (1000 / V);
    dxf.addLine(x, yGround, x, 0, "Khung", 8); // color 8 for projection lines
    dxf.addLine(x, -50, x, -60, "Khung", gridColor); // Only in KHOẢNG CÁCH row (color 7)

    // Khoảng cách lẻ (Centered between previous line and this line)
    if (i > 0) {
      const prevX = X0 + prevChainage * (1000 / H);
      const centerX = (prevX + x) / 2;
      const distVal = row.chainage - prevChainage;
      const distStr = distVal.toFixed(1);
      
      // If distance is too small graphically, rotate it 90 degrees
      if (distVal * (1000 / H) < 4.5) {
        addAlignedDXFText(distStr, centerX, -55, 90, "Text", textColor, "center");
      } else {
        addAlignedDXFText(distStr, centerX, -55, 0, "Text", textColor, "center");
      }
    }
    prevChainage = row.chainage;

    // Data Texts rotated 90 deg along vertical lines, Center aligned on x
    addAlignedDXFText((row.dayVal || 0).toFixed(2), x, -5, 90, "Text", textColor, "center");
    
    // Only show design elevations if there is a VALID stake name (from terrain data)
    const isValidStake = row.name && row.isTerrain;
    
    if (isValidStake) {
      addAlignedDXFText((row.bedVal || 0).toFixed(2), x, -15, 90, "Text", textColor, "center");
      addAlignedDXFText((row.htkVal || 0).toFixed(2), x, -25, 90, "Text", textColor, "center");
      addAlignedDXFText((row.htkVal || 0).toFixed(2), x, -35, 90, "Text", textColor, "center");
      addAlignedDXFText((row.dinhKenhVal || 0).toFixed(2), x, -45, 90, "Text", textColor, "center");
    }
    
    addAlignedDXFText(row.chainage.toFixed(1), x, -65, 90, "Text", textColor, "center");
    
    if (isValidStake) {
      const stakeName = `${stakePrefix}${row.name}`;
      // Tên cọc nằm ngang (rotation 0)
      addAlignedDXFText(stakeName, x, -75, 0, "Text", 1, "center");
    }
  });

  // Markers on the red line (Y = -90) using canal centerline landmarks
  landmarkData.forEach(ld => {
    const x = X0 + ld.chainage * (1000 / H);
    
    // Solid square instead of circle
    const hw = 0.5;
    dxf['content'].push(
        "0", "SOLID",
        "8", "Khung",
        "62", "1",
        "10", (x - hw).toFixed(3), "20", (Y_red_line - hw).toFixed(3), "30", "0.0",
        "11", (x + hw).toFixed(3), "21", (Y_red_line - hw).toFixed(3), "31", "0.0",
        "12", (x - hw).toFixed(3), "22", (Y_red_line + hw).toFixed(3), "32", "0.0",
        "13", (x + hw).toFixed(3), "23", (Y_red_line + hw).toFixed(3), "33", "0.0"
    );

    // Name above
    if (ld.name) {
      addAlignedDXFText(ld.name, x, Y_red_line + 2.0, 0, "Text", 7, "center");
    }
    
    // Angle below
    if (ld.angleStr) {
      addAlignedDXFText(ld.angleStr, x, Y_red_line - 3.0, 0, "Text", 7, "center");
    }
  });

  // Canal structures on the red line
  canalStructures.forEach(struct => {
    const structChainage = Number(struct.chainage) || 0;
    const x = X0 + structChainage * (1000 / H);
    const offtakeSide = struct.offtakeSide || '';
    
    let internalIconType = struct.type;
    if (struct.type === 'inline_structure') {
      let typeName = struct.inlineStructureType || struct.flowCalcMethod || '';
      
      if (!typeName && struct.name) {
        const lowerName = struct.name.toLowerCase();
        if (lowerName.includes('cầu ô tô')) typeName = 'Cầu ô tô';
        else if (lowerName.includes('cầu thô sơ')) typeName = 'Cầu thô sơ';
        else if (lowerName.includes('cầu máng')) typeName = 'Cầu máng';
        else if (lowerName.includes('cống luồn dưới đường')) typeName = 'Cống luồn dưới đường';
        else if (lowerName.includes('cống luồn qua kênh')) typeName = 'Cống luồn qua kênh';
        else if (lowerName.includes('cống tiêu')) typeName = 'Cống tiêu dưới kênh tưới';
        else if (lowerName.includes('bậc nước') || lowerName.includes('dốc nước')) typeName = 'Bậc nước';
        else if (lowerName.includes('điều tiết')) typeName = 'Cống điều tiết';
        else if (lowerName.includes('dâng nước')) typeName = 'Công trình dâng nước';
        else if (lowerName.includes('đo nước')) typeName = 'Công trình đo nước';
        else if (lowerName.includes('thuỷ điện')) typeName = 'Trạm thuỷ điện';
        else if (lowerName.includes('tràn vào')) typeName = 'Tràn vào kênh';
        else if (lowerName.includes('tràn từ') || lowerName.includes('tràn ra')) typeName = 'Tràn từ kênh ra';
      }

      if (typeName === 'Cầu ô tô') internalIconType = 'bridge_auto';
      else if (typeName === 'Cầu thô sơ') internalIconType = 'bridge_rough';
      else if (typeName === 'Cầu máng') internalIconType = 'aqueduct';
      else if (typeName === 'Cống luồn dưới đường') internalIconType = 'culvert_road';
      else if (typeName === 'Cống luồn qua kênh') internalIconType = 'culvert_canal';
      else if (typeName === 'Cống tiêu dưới kênh tưới') internalIconType = 'drainage_under_canal';
      else if (typeName === 'Bậc nước') internalIconType = 'drop_structure';
      else if (typeName === 'Cống điều tiết') internalIconType = 'gate_regulate';
      else if (typeName === 'Công trình dâng nước') internalIconType = 'check_structure';
      else if (typeName === 'Công trình đo nước') internalIconType = 'measure_structure';
      else if (typeName === 'Trạm thuỷ điện') internalIconType = 'hydropower';
      else if (typeName === 'Tràn vào kênh') internalIconType = 'weir_in';
      else if (typeName === 'Tràn từ kênh ra') internalIconType = 'weir_out';
      // Trạm bơm and Cống đầu mối might just be 'Tưới'/'Tiêu' in the DB but they are usually root nodes?
    }
    
    drawDXFStructure(dxf, x, Y_red_line, internalIconType, struct.status || 'planned', offtakeSide);

    if (internalIconType === 'aqueduct' && struct.endChainage !== null && struct.endChainage !== undefined) {
      const endChainageNum = Number(struct.endChainage) || 0;
      if (endChainageNum > structChainage) {
        const xEnd = X0 + endChainageNum * (1000 / H);
        const yTop = scaleYMax + 30;
        
        // Vertical lines
        dxf.addLine(x, scaleYMax, x, yTop + 5, "Khung", 7);
        dxf.addLine(xEnd, scaleYMax, xEnd, yTop + 5, "Khung", 7);
        
        // Horizontal line
        dxf.addLine(x, yTop, xEnd, yTop, "Khung", 7);
        
        // Arrows
        dxf.addLine(x, yTop, x + 2, yTop + 1, "Khung", 7);
        dxf.addLine(x, yTop, x + 2, yTop - 1, "Khung", 7);
        
        dxf.addLine(xEnd, yTop, xEnd - 2, yTop + 1, "Khung", 7);
        dxf.addLine(xEnd, yTop, xEnd - 2, yTop - 1, "Khung", 7);
        
        // Texts
        const startChainageText = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0').replace(/\.00$/, '')}`;
        const endChainageText = `K${Math.floor(endChainageNum / 1000)}+${(endChainageNum % 1000).toFixed(2).padStart(6, '0').replace(/\.00$/, '')}`;
        
        addAlignedDXFText(startChainageText, x - 1.5, yTop, 90, "Text", 7, "center");
        addAlignedDXFText(endChainageText, xEnd + 1.5, yTop, 90, "Text", 7, "center");
        
        const centerX = (x + xEnd) / 2;
        addAlignedDXFText(struct.name || 'CẦU MÁNG', centerX, yTop + 3.5, 0, "Text", 7, "center");
        addAlignedDXFText(`${startChainageText} - ${endChainageText}`, centerX, yTop + 1.5, 0, "Text", 7, "center");
        const length = endChainageNum - structChainage;
        addAlignedDXFText(`L=${length.toFixed(2)}M`, centerX, yTop - 2.5, 0, "Text", 7, "center");
      }
    } else {
      // For all other structures, draw annotation at the top of the graph (like Image 2)
      const topYLineStart = scaleYMax - 10;
      const topYLineEnd = scaleYMax + 40;
      dxf.addLine(x, topYLineStart, x, topYLineEnd, "Khung", 7);
      
      const chainageTextTop = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0')}`;
      const structNameTop = struct.name || '';
      
      if (structNameTop) {
        // Text on the left, rotated 90
        addAlignedDXFText(structNameTop, x - 1.5, topYLineEnd - 15, 90, "Text", 7, "center");
      }
      // Text on the right, rotated 90
      addAlignedDXFText(chainageTextTop, x + 1.5, topYLineEnd - 15, 90, "Text", 7, "center");
    }

    // Chainage on opposite side (rotation 0)
    const isPhai = offtakeSide.toLowerCase() === 'phai';
    const chainageText = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0')}`;
    const chainageY = isPhai ? (Y_red_line + 4) : (Y_red_line - 6);
    addAlignedDXFText(chainageText, x, chainageY, 0, "Text", 7, "center");

    const textY = isPhai ? (Y_red_line - 3) : (Y_red_line + 3);
    const dy = isPhai ? -2 : 2;

    // Text for structures
    if (struct.type === 'offtake_irrigation') {
      const area = (Number(struct.riceArea) || 0) + (Number(struct.fruitArea) || 0);
      const L = Number(struct.length) || 0;
      const Q = Number(struct.reqFlow) || 0;
      const t1 = `${struct.name || ''}`; // Bỏ chữ kênh
      const t2 = `A=${area.toFixed(2)} ha, L=${L.toFixed(2)} m`;
      const t3 = `Qtk=${Q.toFixed(2)} m3/s`;
      
      addAlignedDXFText(t1, x, textY, 0, "Text", 7, "center");
      addAlignedDXFText(t2, x, textY + dy, 0, "Text", 7, "center");
      addAlignedDXFText(t3, x, textY + dy * 2, 0, "Text", 7, "center");
    } else {
      if (struct.name) {
        addAlignedDXFText(struct.name, x, textY, 0, "Text", 7, "center");
      }
    }
  });

  return dxf.generate();
}
