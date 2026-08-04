"use client";

import React, { useMemo, useState } from 'react';

export interface ProfileChartPoint {
  chainage: number;
  chainageDisplay: string;
  dayVal: number | null;
  htkVal: number | null;
  dinhKenhVal: number | null;
  yeuCauVal?: number | null;
  name: string;
  isDrop?: boolean;
  endChainage?: number;
}

interface LongitudinalProfileChartProps {
  data: ProfileChartPoint[];
  terrainData?: any[];
  focusedChainage?: number | null;
  zoom?: number;
  onZoomChange?: (zoom: number | ((prev: number) => number)) => void;
  isPanMode?: boolean;
  onHoverChainage?: (chainage: number | null) => void;
  isPickingMode?: boolean;
  onChainagePicked?: (chainage: number) => void;
}

export default function LongitudinalProfileChart({ data, terrainData, focusedChainage, zoom: externalZoom, onZoomChange, isPanMode = false, onHoverChainage, isPickingMode = false, onChainagePicked }: LongitudinalProfileChartProps) {
  const { minX, maxX, minY, maxY } = useMemo(() => {
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    let hasData = false;

    if (data && data.length > 0) {
      hasData = true;
      data.forEach(p => {
        if (p.chainage < minX) minX = p.chainage;
        if (p.chainage > maxX) maxX = p.chainage;
      
      const vals = [p.dayVal, p.htkVal, p.dinhKenhVal, p.yeuCauVal].filter(v => v !== null && v !== undefined && typeof v === 'number' && !isNaN(v)) as number[];
      if (vals.length > 0) {
        const localMin = Math.min(...vals);
        const localMax = Math.max(...vals);
        if (localMin < minY) minY = localMin;
        if (localMax > maxY) maxY = localMax;
      }
    });
    }

    if (terrainData && terrainData.length > 0) {
      hasData = true;
      terrainData.forEach(p => {
        const chainage = Number(p.lyTrinh);
        const caoDo = Number(p.caoDo);
        if (!isNaN(chainage)) {
          if (chainage < minX) minX = chainage;
          if (chainage > maxX) maxX = chainage;
        }
        if (!isNaN(caoDo)) {
          if (caoDo < minY) minY = caoDo;
          if (caoDo > maxY) maxY = caoDo;
        }
      });
    }

    if (!hasData) return { minX: 0, maxX: 100, minY: 0, maxY: 10 };
    
    if (minY === Number.MAX_VALUE) {
      minY = 0; maxY = 10;
    }
    
    // Add some padding to Y axis
    const yPadding = Math.max((maxY - minY) * 0.2, 1);
    minY = minY - yPadding;
    maxY = maxY + yPadding;
    
    // Add some padding to X axis for labels
    const xPadding = Math.max((maxX - minX) * 0.05, 10);
    maxX = maxX + xPadding;
    
    return { minX, maxX, minY, maxY };
  }, [data]);

  const [containerHeight, setContainerHeight] = useState(400);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [internalZoom, setInternalZoom] = useState(1);
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const setZoom = onZoomChange || setInternalZoom;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [internalHoveredChainage, setInternalHoveredChainage] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  
  // Tỷ lệ đứng 1:200, ngang 1:1000 => Hệ số phóng đại đứng so với ngang = 1000/200 = 5
  const EXAGGERATION = 5;

  const rangeY = maxY - minY;
  const rangeX = maxX - minX;

  const innerHeight = containerHeight - padding.top - padding.bottom;
  // Apply zoom factor to the base pixels per meter
  const pixelsPerMeterY = (rangeY > 0 ? innerHeight / rangeY : 10) * zoom;
  const pixelsPerMeterX = pixelsPerMeterY / EXAGGERATION;
  
  const calculatedInnerWidth = rangeX * pixelsPerMeterX;
  const minRequiredWidth = calculatedInnerWidth + padding.left + padding.right;
  const svgWidth = Math.max(minRequiredWidth, containerWidth);
  const svgHeight = Math.max(containerHeight, innerHeight * zoom + padding.top + padding.bottom);

  const getX = (val: number, width: number) => {
    if (rangeX === 0) return padding.left;
    return padding.left + (val - minX) * pixelsPerMeterX;
  };

  const getY = (val: number, height: number) => {
    if (rangeY === 0) return height - padding.bottom;
    return height - padding.bottom - (val - minY) * pixelsPerMeterY;
  };

  const drawPath = (points: ProfileChartPoint[], valKey: keyof ProfileChartPoint, width: number, height: number) => {
    const validPoints = points.filter(p => p[valKey] !== null && p[valKey] !== undefined);
    if (validPoints.length === 0) return '';
    
    let path = '';
    validPoints.forEach((p, i) => {
      const x = getX(p.chainage, width);
      const y = getY(p[valKey] as number, height);
      if (i === 0) {
        path += `M ${x} ${y} `;
      } else {
        path += `L ${x} ${y} `;
      }
    });
    return path;
  };

  const drawTerrainPath = (points: any[] | undefined, width: number, height: number) => {
    if (!points || points.length === 0) return '';
    let path = '';
    let first = true;
    points.forEach((p) => {
      const xVal = Number(p.lyTrinh);
      const yVal = Number(p.caoDo);
      if (!isNaN(xVal) && !isNaN(yVal)) {
        const x = getX(xVal, width);
        const y = getY(yVal, height);
        if (first) {
          path += `M ${x} ${y} `;
          first = false;
        } else {
          path += `L ${x} ${y} `;
        }
      }
    });
    return path;
  };

  // Drag to pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPickingMode && internalHoveredChainage !== null && onChainagePicked) {
      onChainagePicked(internalHoveredChainage);
      return;
    }
    if (!isPanMode) return;
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX,
      y: e.pageY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    });
    // Set pointer capture so we don't lose drag if moving outside briefly
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      
      if (pixelsPerMeterX > 0) {
        let chainage = (x - padding.left) / pixelsPerMeterX + minX;
        if (chainage < minX) chainage = minX;
        if (chainage > maxX) chainage = maxX;
        
        setInternalHoveredChainage(chainage);
        if (onHoverChainage) {
          onHoverChainage(chainage);
        }
      }
    }

    if (!isDragging || !containerRef.current) return;
    const walkX = e.pageX - dragStart.x;
    const walkY = e.pageY - dragStart.y;
    containerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    containerRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    handlePointerUp(e);
    setInternalHoveredChainage(null);
    if (onHoverChainage) {
      onHoverChainage(null);
    }
  };

  // Scroll to focused chainage
  React.useEffect(() => {
    if (focusedChainage !== undefined && focusedChainage !== null && containerRef.current) {
      // Calculate X coordinate directly
      const x = padding.left + (focusedChainage - minX) * pixelsPerMeterX;
      // Center the focused point in the container
      const targetScrollLeft = x - containerWidth / 2;
      containerRef.current.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, [focusedChainage, minX, pixelsPerMeterX, containerWidth, padding.left]);

  // Extract grid lines for Y axis
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = rangeY > 10 ? 5 : rangeY > 5 ? 2 : rangeY > 2 ? 1 : 0.5;
    let start = Math.ceil(minY / step) * step;
    for (let i = start; i <= maxY; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [minY, maxY, rangeY]);

  // Extract grid lines for X axis
  const xTicks = useMemo(() => {
    const ticks = [];
    const step = rangeX > 5000 ? 1000 : rangeX > 1000 ? 500 : rangeX > 500 ? 200 : 100;
    let start = Math.ceil(minX / step) * step;
    for (let i = start; i <= maxX; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [minX, maxX, rangeX]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // Zoom in or out based on scroll direction
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.2, Math.min(prev + zoomDelta, 5)));
    }
  };

  if ((!data || data.length === 0) && (!terrainData || terrainData.length === 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white">
        Chưa có dữ liệu đồ thị
      </div>
    );
  }

  const topOffset = Math.max(0, (containerHeight - svgHeight) / 2);
  const cursorClass = isPickingMode 
    ? 'cursor-crosshair'
    : (isPanMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair');

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative bg-[#f8fafc] overflow-auto custom-scrollbar ${cursorClass}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
    >
      <div style={{ width: svgWidth, height: svgHeight, minWidth: '100%', marginTop: topOffset }} className="relative pointer-events-none shadow-sm">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full block absolute inset-0">
          <rect width={svgWidth} height={svgHeight} fill="#ffffff" />
          
          {/* Y-axis Grid */}
          {yTicks.map(tick => {
            const y = getY(tick, svgHeight);
            return (
              <g key={`y-grid-${tick}`}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              </g>
            );
          })}

          {/* X-axis Grid */}
          {xTicks.map(tick => {
            const x = getX(tick, svgWidth);
            return (
              <g key={`x-grid-${tick}`}>
                <line x1={x} y1={padding.top} x2={x} y2={svgHeight - padding.bottom} stroke="#f1f5f9" strokeWidth="1" />
              </g>
            );
          })}

          {/* Đỉnh Kênh */}
          <path d={drawPath(data, 'dinhKenhVal', svgWidth, svgHeight)} fill="none" stroke="#475569" strokeWidth="1.5" />
          
          {/* Htk (Mực nước thiết kế) */}
          <path d={drawPath(data, 'htkVal', svgWidth, svgHeight)} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Đường Địa hình tự nhiên */}
          {terrainData && terrainData.length > 0 && (
            <path d={drawTerrainPath(terrainData, svgWidth, svgHeight)} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 2" />
          )}

          {/* Đáy Kênh */}
          <path d={drawPath(data, 'dayVal', svgWidth, svgHeight)} fill="none" stroke="#d97706" strokeWidth="2.5" />
          
          {/* Vertical Pick Line */}
          {isPickingMode && internalHoveredChainage !== null && (
            <line 
              x1={getX(internalHoveredChainage, svgWidth)} 
              y1={padding.top} 
              x2={getX(internalHoveredChainage, svgWidth)} 
              y2={svgHeight - padding.bottom} 
              stroke="#ef4444" 
              strokeWidth="1.5" 
              strokeDasharray="4 2"
              className="pointer-events-none"
            />
          )}
        </svg>
        
        {/* Absolute overlay for text/markers that shouldn't stretch when SVG stretches */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full block absolute inset-0 pointer-events-none">
          {/* Y-axis Labels */}
          {yTicks.map(tick => {
            const y = getY(tick, svgHeight);
            return (
              <g key={`y-lbl-${tick}`}>
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b" className="font-sans">
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X-axis Labels */}
          {xTicks.map(tick => {
            const x = getX(tick, svgWidth);
            return (
              <g key={`x-lbl-${tick}`}>
                <text x={x} y={svgHeight - padding.bottom + 20} textAnchor="middle" fontSize="10" fill="#64748b" className="font-sans">
                  K{Math.floor(tick/1000)}+{String(tick%1000).padStart(3, '0')}
                </text>
              </g>
            );
          })}

          {/* X and Y Axes */}
          <line x1={padding.left} y1={svgHeight - padding.bottom} x2={svgWidth - padding.right} y2={svgHeight - padding.bottom} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={svgHeight - padding.bottom} stroke="#94a3b8" strokeWidth="1.5" />

          {/* Điểm đặc biệt & Yêu cầu */}
          {data.map((p, i) => {
            if (!p.yeuCauVal) return null;
            const x = getX(p.chainage, svgWidth);
            const y = getY(p.yeuCauVal, svgHeight);
            return (
              <g key={`req-${i}`}>
                <circle cx={x} cy={y} r="3" fill="#dc2626" />
                <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#dc2626" fontWeight="bold" className="font-sans drop-shadow-sm">
                  {p.name}: {p.yeuCauVal.toFixed(2)}
                </text>
              </g>
            );
          })}
          
          {/* Chú thích nhỏ cho các cống / trạm trên đáy kênh */}
          {data.map((p, i) => {
            if (!p.dayVal || p.isDrop) return null;
            if (!p.name || p.name.includes("Cọc") || p.name.includes("Ngầm") || p.name.startsWith("Cuối ")) return null;
            const x = getX(p.chainage, svgWidth);
            const y = getY(p.dayVal, svgHeight);
            
            if (p.endChainage) {
              const endX = getX(p.endChainage, svgWidth);
              const width = Math.max(endX - x, 4);
              const displayName = p.name.startsWith("Đầu ") ? p.name.substring(4) : p.name;
              return (
                <g key={`node-${i}`}>
                  <rect x={x} y={y - 8} width={width} height={8} fill="#f59e0b" opacity={0.8} />
                  <rect x={x} y={y} width={width} height={2} fill="#b45309" />
                  <text x={x + width/2} y={y + 12} textAnchor="middle" fontSize="8.5" fill="#b45309" className="font-sans">
                    {displayName}
                  </text>
                </g>
              );
            }

            return (
              <g key={`node-${i}`}>
                <circle cx={x} cy={y} r="2.5" fill="#d97706" />
                <text x={x} y={y + 12} textAnchor="middle" fontSize="8.5" fill="#b45309" className="font-sans">
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend & Scale Info - Fixed position within container */}
      <div className="sticky left-full float-right mr-4 mt-4 w-max bg-white/90 p-3 rounded-lg shadow-sm text-xs border border-slate-200 flex flex-col gap-2 backdrop-blur-md z-10">
        <div className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-1">
          Tỷ lệ đứng 1:200 <br/> Tỷ lệ ngang 1:1000
        </div>
        <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-slate-600"></div> Đỉnh kênh</div>
        {terrainData && terrainData.length > 0 && (
          <div className="flex items-center gap-2"><div className="w-5 h-0 border-t-2 border-dashed border-green-500"></div> Địa hình</div>
        )}
        <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-blue-500"></div> Mực nước thiết kế</div>
        <div className="flex items-center gap-2"><div className="w-5 h-1 bg-amber-600 rounded-full"></div> Đáy kênh</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600 ml-1.5"></div> Yêu cầu nhánh</div>
      </div>

    </div>
  );
}
