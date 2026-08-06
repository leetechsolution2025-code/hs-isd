#!/bin/bash
sed -i '' "s/const flip = offtakeSide === 'Trái' || offtakeSide === 'Trái\/Phải';/const flip = offtakeSide.toLowerCase() === 'phai';/" src/lib/exportStructures.ts

# Add addSolidRedCircle to DXF
sed -i '' '/const addCircle = (cx: number, cy: number, r: number) => {/i\
  const addSolidRedCircle = (cx: number, cy: number, r: number) => {\
    const segments = 16;\
    for (let i = 0; i < segments; i++) {\
      const a1 = (i / segments) * Math.PI * 2;\
      const a2 = ((i + 1) / segments) * Math.PI * 2;\
      const x1 = cx + Math.cos(a1) * r;\
      const y1 = cy + Math.sin(a1) * r;\
      const x2 = cx + Math.cos(a2) * r;\
      const y2 = cy + Math.sin(a2) * r;\
      const p0 = pt(x, y, cx, cy, flip);\
      const p1 = pt(x, y, x1, y1, flip);\
      const p2 = pt(x, y, x2, y2, flip);\
      dxf.content.push(\
          "0", "SOLID", "8", "Khung", "62", "1",\
          "10", p0.X.toFixed(3), "20", p0.Y.toFixed(3), "30", "0.0",\
          "11", p1.X.toFixed(3), "21", p1.Y.toFixed(3), "31", "0.0",\
          "12", p2.X.toFixed(3), "22", p2.Y.toFixed(3), "32", "0.0",\
          "13", p2.X.toFixed(3), "23", p2.Y.toFixed(3), "33", "0.0"\
      );\
    }\
  };\
' src/lib/exportStructures.ts

# Replace addCircle with addSolidRedCircle in DXF
sed -i '' 's/addCircle(12, 12, 6);/addSolidRedCircle(12, 12, 6);/g' src/lib/exportStructures.ts
sed -i '' 's/addCircle(12, 7.5, 4.5);/addSolidRedCircle(12, 7.5, 4.5);/g' src/lib/exportStructures.ts
sed -i '' 's/addCircle(12, 12, 5);/addSolidRedCircle(12, 12, 5);/g' src/lib/exportStructures.ts
sed -i '' 's/addCircle(8, 12, 1.5); addCircle(16, 12, 1.5);/addSolidRedCircle(8, 12, 1.5); addSolidRedCircle(16, 12, 1.5);/g' src/lib/exportStructures.ts
sed -i '' 's/addCircle(12, 8, 1.5); addCircle(12, 16, 1.5);/addSolidRedCircle(12, 8, 1.5); addSolidRedCircle(12, 16, 1.5);/g' src/lib/exportStructures.ts
sed -i '' 's/addCircle(16, 18, 2.5);/addSolidRedCircle(16, 18, 2.5);/g' src/lib/exportStructures.ts
