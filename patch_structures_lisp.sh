#!/bin/bash
# Add addSolidRedCircle to LISP
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
      scr += `(entmake (list '"'"'(0 . "SOLID") '"'"'(8 . "KhungBang") '"'"'(62 . 1) ` +\
             `(cons 10 (list ${p0.X.toFixed(3)} ${p0.Y.toFixed(3)} 0)) ` +\
             `(cons 11 (list ${p1.X.toFixed(3)} ${p1.Y.toFixed(3)} 0)) ` +\
             `(cons 12 (list ${p2.X.toFixed(3)} ${p2.Y.toFixed(3)} 0)) ` +\
             `(cons 13 (list ${p2.X.toFixed(3)} ${p2.Y.toFixed(3)} 0))))\\n`;\
    }\
  };\
' src/lib/exportStructures.ts
