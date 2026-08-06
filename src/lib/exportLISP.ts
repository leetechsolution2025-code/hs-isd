import { unicodeToTCVN3 } from './tcvn3';
import { drawLISPStructure } from './exportStructures';

export function generateProfileLISP(data: any[], settings: any, landmarkData: { name?: string, chainage: number, angleStr: string }[] = [], canalStructures: any[] = []) {
  const { horizontalScale, verticalScale, datumElevation, stakePrefix } = settings;
  const H = horizontalScale;
  const V = verticalScale;
  
  // Find min elevation if datum is not set
  let datum = datumElevation;
  if (datum === null || datum === undefined || datum === "") {
    let minE = Infinity;
    for (const row of data) {
      if (row.dayVal !== undefined && row.dayVal < minE) minE = row.dayVal;
      if (row.bedVal !== undefined && row.bedVal < minE) minE = row.bedVal;
    }
    datum = Math.floor(minE) - 2; // offset by 2m
    if (datum === Infinity) datum = 0;
  }
  
  // Starting coordinate on CAD (can be 0,0)
  const X0 = 0;
  const Y0 = 0; // Datumn line Y

  let scr = "";
  scr += ";;========================================================================\n";
  scr += ";; AUTOCAD SCRIPT TO DRAW LONGITUDINAL PROFILE\n";
  scr += ";;========================================================================\n";

  // Disable OSNAP
  scr += "OSMODE\n0\n";

  // Load Linetype and define Text Style ONLY if they don't exist
  // This prevents AutoCAD from asking "Reload?" and breaking the script sync
  scr += "(if (not (tblsearch \"LTYPE\" \"DASHED\")) (command \"_-LINETYPE\" \"_Load\" \"DASHED\" \"acad.lin\" \"\"))\n";
  scr += "(if (not (tblsearch \"STYLE\" \"VnTimeH\")) (command \"_-STYLE\" \"VnTimeH\" \"vntimeh.shx\" \"0.0\" \"1.0\" \"0.0\" \"_N\" \"_N\" \"_N\"))\n";

  // Create Layers
  scr += "-LAYER\n";
  scr += "Make\nTuNhien\nColor\n8\n\nLtype\nDASHED\n\n";
  scr += "Make\nThietKe_Day\nColor\n1\n\n";
  scr += "Make\nThietKe_MucNuoc\nColor\n5\n\n";
  scr += "Make\nThietKe_Dinh\nColor\n2\n\n";
  scr += "Make\nCoc_LyTrinh\nColor\n3\n\n";
  scr += "Make\nKhungBang\nColor\n8\n\n";
  scr += "Make\nTextBang\nColor\n7\n\n";
  scr += "\n"; // Exit layer command

  // 1. Draw TuNhien
  scr += "CLAYER\nTuNhien\n";
  scr += "PLINE\n";
  data.forEach((row) => {
    const x = X0 + row.chainage * (1000 / H);
    const y = Y0 + ((row.dayVal || 0) - datum) * (1000 / V);
    scr += `${x},${y}\n`;
  });
  scr += "\n";

  // 2. Draw Day Kenh
  scr += "CLAYER\nThietKe_Day\n";
  scr += "PLINE\n";
  data.forEach((row) => {
    const x = X0 + row.chainage * (1000 / H);
    const y = Y0 + ((row.bedVal || 0) - datum) * (1000 / V);
    scr += `${x},${y}\n`;
  });
  scr += "\n";

  // 3. Draw Muc Nuoc
  scr += "CLAYER\nThietKe_MucNuoc\n";
  scr += "PLINE\n";
  data.forEach((row) => {
    const x = X0 + row.chainage * (1000 / H);
    const y = Y0 + ((row.htkVal || 0) - datum) * (1000 / V);
    scr += `${x},${y}\n`;
  });
  scr += "\n";

  // 4. Draw Dinh Kenh
  scr += "CLAYER\nThietKe_Dinh\n";
  scr += "PLINE\n";
  data.forEach((row) => {
    const x = X0 + row.chainage * (1000 / H);
    const y = Y0 + ((row.dinhKenhVal || 0) - datum) * (1000 / V);
    scr += `${x},${y}\n`;
  });
  scr += "\n";

  // Table Config
  const X_start = X0 - 55;
  const X_split = X_start + 10;
  const X_data_start = X0;
  const maxX = X0 + data[data.length - 1].chainage * (1000 / H);

  // Helper for Entmake LINE
  const lspLine = (x1: number, y1: number, x2: number, y2: number, layer: string, color: number = 256) => 
    `(entmake (list '(0 . "LINE") '(8 . "${layer}") (cons 62 ${color}) (cons 10 (list ${x1} ${y1} 0)) (cons 11 (list ${x2} ${y2} 0))))\n`;

  // Helper for Entmake TEXT
  const lspText = (txt: string, x: number, y: number, rot: number, layer: string, color: number, alignType: "left" | "center" | "right" = "left") => {
    const encTxt = unicodeToTCVN3(txt);
    const rad = (rot * Math.PI) / 180;
    if (alignType === "center") {
      return `(entmake (list '(0 . "TEXT") '(8 . "${layer}") '(7 . "VnTimeH") (cons 62 ${color}) '(72 . 1) '(73 . 2) (cons 10 (list ${x} ${y} 0)) (cons 11 (list ${x} ${y} 0)) (cons 40 1.5) (cons 1 "${encTxt}") (cons 50 ${rad})))\n`;
    } else if (alignType === "right") {
      return `(entmake (list '(0 . "TEXT") '(8 . "${layer}") '(7 . "VnTimeH") (cons 62 ${color}) '(72 . 2) '(73 . 2) (cons 10 (list ${x} ${y} 0)) (cons 11 (list ${x} ${y} 0)) (cons 40 1.5) (cons 1 "${encTxt}") (cons 50 ${rad})))\n`;
    } else {
      return `(entmake (list '(0 . "TEXT") '(8 . "${layer}") '(7 . "VnTimeH") (cons 62 ${color}) (cons 10 (list ${x} ${y} 0)) (cons 40 1.5) (cons 1 "${encTxt}") (cons 50 ${rad})))\n`;
    }
  };

  const gridColor = 7; // White for grids

  // Label MỨC SO SÁNH
  scr += lspText(`MỨC SO SÁNH (${datum}M)`, X_start, Y0 + 2, 0, "KhungBang", 7);

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
  
  const w = 1.0;
  // Left and right edges
  scr += lspLine(X0 - w/2, Y0, X0 - w/2, scaleYMax, "KhungBang", 7);
  scr += lspLine(X0 + w/2, Y0, X0 + w/2, scaleYMax, "KhungBang", 7);
  
  for (let e = datum; e <= maxScale; e += 2) {
    const yTick = Y0 + (e - datum) * (1000 / V);
    scr += lspLine(X0 - w/2, yTick, X0 - w/2 - 1.5, yTick, "KhungBang", 7);
    scr += lspText(e.toString(), X0 - w/2 - 2.5, yTick, 0, "TextBang", 7, "right");
    
    if ((e - datum) % 4 === 2 && e < maxScale) {
      const yNext = Y0 + (e + 2 - datum) * (1000 / V);
      scr += `(entmake (list '(0 . "SOLID") '(8 . "KhungBang") '(62 . 7) ` +
             `(cons 10 (list ${X0 - w/2} ${yTick} 0)) (cons 11 (list ${X0 + w/2} ${yTick} 0)) ` +
             `(cons 12 (list ${X0 - w/2} ${yNext} 0)) (cons 13 (list ${X0 + w/2} ${yNext} 0))))\n`;
    }
  }

  // Red line below the table for stake positions
  const Y_red_line = -90;
  scr += lspLine(X0, Y_red_line, maxX, Y_red_line, "KhungBang", 1);

  // Horizontal Grid Lines
  const yRows = [0, -10, -20, -30, -40, -50, -60, -70, -80];
  yRows.forEach((y) => {
    if (y === -20 || y === -30 || y === -40) {
      scr += lspLine(X_split, y, maxX, y, "KhungBang", gridColor);
    } else {
      scr += lspLine(X_start, y, maxX, y, "KhungBang", gridColor);
    }
  });

  // Vertical Grid Lines for Headers
  scr += lspLine(X_start, 0, X_start, -80, "KhungBang", gridColor);
  scr += lspLine(X_split, -10, X_split, -50, "KhungBang", gridColor);
  scr += lspLine(X_data_start, 0, X_data_start, -80, "KhungBang", gridColor);

  // Header Texts
  scr += lspText("CAO ĐỘ MẶT ĐẤT TỰ NHIÊN (M)", X_start + 2, -6.5, 0, "TextBang", 7);
  scr += lspText("THIẾT KẾ", X_start + 4, -42, 90, "TextBang", 7);
  scr += lspText("CAO ĐỘ ĐÁY KÊNH (M)", X_split + 2, -16.5, 0, "TextBang", 7);
  scr += lspText("CAO ĐỘ MỰC NƯỚC MAX(M)", X_split + 2, -26.5, 0, "TextBang", 7);
  scr += lspText("CAO ĐỘ MỰC NƯỚC (M)", X_split + 2, -36.5, 0, "TextBang", 7);
  scr += lspText("CAO ĐỘ BỜ KÊNH (M)", X_split + 2, -46.5, 0, "TextBang", 7);
  scr += lspText("KHOẢNG CÁCH (M)", X_start + 2, -56.5, 0, "TextBang", 7);
  scr += lspText("K/C CỘNG DỒN (M)", X_start + 2, -66.5, 0, "TextBang", 7);
  scr += lspText("TÊN CỌC", X_start + 2, -76.5, 0, "TextBang", 7);

  // Data Columns
  let prevChainage = 0;
  data.forEach((row, i) => {
    const x = X0 + row.chainage * (1000 / H);
    
    // Vertical line projection up to the natural ground, stops at Y0
    const yGround = Y0 + ((row.dayVal || 0) - datum) * (1000 / V);
    scr += lspLine(x, yGround, x, 0, "KhungBang", 8); // Color 8
    scr += lspLine(x, -50, x, -60, "KhungBang", gridColor); // Color 7

    if (i > 0) {
      const prevX = X0 + prevChainage * (1000 / H);
      const centerX = (prevX + x) / 2;
      const distVal = row.chainage - prevChainage;
      const distStr = distVal.toFixed(1);
      
      if (distVal * (1000 / H) < 4.5) {
        scr += lspText(distStr, centerX, -55, 90, "TextBang", 7, "center");
      } else {
        scr += lspText(distStr, centerX, -55, 0, "TextBang", 7, "center");
      }
    }
    prevChainage = row.chainage;

    scr += lspText((row.dayVal || 0).toFixed(2), x, -5, 90, "TextBang", 7, "center");
    
    const isValidStake = row.name && row.isTerrain;

    if (isValidStake) {
      scr += lspText((row.bedVal || 0).toFixed(2), x, -15, 90, "TextBang", 7, "center");
      scr += lspText((row.htkVal || 0).toFixed(2), x, -25, 90, "TextBang", 7, "center");
      scr += lspText((row.htkVal || 0).toFixed(2), x, -35, 90, "TextBang", 7, "center");
      scr += lspText((row.dinhKenhVal || 0).toFixed(2), x, -45, 90, "TextBang", 7, "center");
    }
    
    scr += lspText(row.chainage.toFixed(1), x, -65, 90, "TextBang", 7, "center");
    
    if (isValidStake) {
      const stakeName = `${stakePrefix}${row.name}`;
      // Tên cọc màu đỏ (color 1), nằm ngang (rotation 0)
      scr += lspText(stakeName, x, -75, 0, "TextBang", 1, "center");
    }
  });

  // Markers on the red line (Y = -90) using canal centerline landmarks
  landmarkData.forEach(ld => {
    const x = X0 + ld.chainage * (1000 / H);
    
    const hw = 0.5;
    scr += `(entmake (list '(0 . "SOLID") '(8 . "KhungBang") '(62 . 1) ` +
           `(cons 10 (list ${x - hw} ${Y_red_line - hw} 0)) (cons 11 (list ${x + hw} ${Y_red_line - hw} 0)) ` +
           `(cons 12 (list ${x - hw} ${Y_red_line + hw} 0)) (cons 13 (list ${x + hw} ${Y_red_line + hw} 0))))\n`;

    if (ld.name) {
      scr += lspText(ld.name, x, Y_red_line + 2.0, 0, "TextBang", 7, "center");
    }
    
    if (ld.angleStr) {
      scr += lspText(ld.angleStr, x, Y_red_line - 3.0, 0, "TextBang", 7, "center");
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
    }

    scr += drawLISPStructure(x, Y_red_line, internalIconType, struct.status || 'planned', offtakeSide);

    if (internalIconType === 'aqueduct' && struct.endChainage !== null && struct.endChainage !== undefined) {
      const endChainageNum = Number(struct.endChainage) || 0;
      if (endChainageNum > structChainage) {
        const xEnd = X0 + endChainageNum * (1000 / H);
        const yTop = scaleYMax + 30;
        
        // Vertical lines
        scr += lspLine(x, scaleYMax, x, yTop + 5, "KhungBang", 7);
        scr += lspLine(xEnd, scaleYMax, xEnd, yTop + 5, "KhungBang", 7);
        
        // Horizontal line
        scr += lspLine(x, yTop, xEnd, yTop, "KhungBang", 7);
        
        // Arrows
        scr += lspLine(x, yTop, x + 2, yTop + 1, "KhungBang", 7);
        scr += lspLine(x, yTop, x + 2, yTop - 1, "KhungBang", 7);
        
        scr += lspLine(xEnd, yTop, xEnd - 2, yTop + 1, "KhungBang", 7);
        scr += lspLine(xEnd, yTop, xEnd - 2, yTop - 1, "KhungBang", 7);
        
        // Texts
        const startChainageText = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0').replace(/\.00$/, '')}`;
        const endChainageText = `K${Math.floor(endChainageNum / 1000)}+${(endChainageNum % 1000).toFixed(2).padStart(6, '0').replace(/\.00$/, '')}`;
        
        scr += lspText(startChainageText, x - 1.5, yTop, 90, "TextBang", 7, "center");
        scr += lspText(endChainageText, xEnd + 1.5, yTop, 90, "TextBang", 7, "center");
        
        const centerX = (x + xEnd) / 2;
        scr += lspText(struct.name || 'CẦU MÁNG', centerX, yTop + 3.5, 0, "TextBang", 7, "center");
        scr += lspText(`${startChainageText} - ${endChainageText}`, centerX, yTop + 1.5, 0, "TextBang", 7, "center");
        const length = endChainageNum - structChainage;
        scr += lspText(`L=${length.toFixed(2)}M`, centerX, yTop - 2.5, 0, "TextBang", 7, "center");
      }
    } else {
      // For all other structures, draw annotation at the top of the graph (like Image 2)
      const topYLineStart = scaleYMax - 10;
      const topYLineEnd = scaleYMax + 40;
      scr += lspLine(x, topYLineStart, x, topYLineEnd, "KhungBang", 7);
      
      const chainageTextTop = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0')}`;
      const structNameTop = struct.name || '';
      
      if (structNameTop) {
        // Text on the left, rotated 90
        scr += lspText(structNameTop, x - 1.5, topYLineEnd - 15, 90, "TextBang", 7, "center");
      }
      // Text on the right, rotated 90
      scr += lspText(chainageTextTop, x + 1.5, topYLineEnd - 15, 90, "TextBang", 7, "center");
    }

    // Chainage on opposite side (rotation 0)
    const isPhai = offtakeSide.toLowerCase() === 'phai';
    const chainageText = `K${Math.floor(structChainage / 1000)}+${(structChainage % 1000).toFixed(2).padStart(6, '0')}`;
    const chainageY = isPhai ? (Y_red_line + 4) : (Y_red_line - 6);
    scr += lspText(chainageText, x, chainageY, 0, "TextBang", 7, "center");

    const textY = isPhai ? (Y_red_line - 3) : (Y_red_line + 3);
    const dy = isPhai ? -2 : 2;

    // Text for structures
    if (struct.type === 'offtake_irrigation') {
      const area = (Number(struct.riceArea) || 0) + (Number(struct.fruitArea) || 0);
      const L = Number(struct.length) || 0;
      const Q = Number(struct.reqFlow) || 0;
      const t1 = `${struct.name || ''}`;
      const t2 = `A=${area.toFixed(2)} ha, L=${L.toFixed(2)} m`;
      const t3 = `Qtk=${Q.toFixed(2)} m3/s`;
      
      scr += lspText(t1, x, textY, 0, "TextBang", 7, "center");
      scr += lspText(t2, x, textY + dy, 0, "TextBang", 7, "center");
      scr += lspText(t3, x, textY + dy * 2, 0, "TextBang", 7, "center");
    } else {
      if (struct.name) {
        scr += lspText(struct.name, x, textY, 0, "TextBang", 7, "center");
      }
    }
  });

  scr += "ZOOM\nExtents\n";

  return scr;
}
