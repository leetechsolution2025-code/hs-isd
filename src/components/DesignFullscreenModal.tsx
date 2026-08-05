"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Save, ZoomIn, ZoomOut, Hand, Plus, FileSpreadsheet, ChevronRight, ChevronDown, Settings2, Trash2, Calculator, MoreHorizontal, RotateCcw } from 'lucide-react';
import { ModernStepper, ModernStepItem } from './ModernStepper';
import FullWidthTable from './FullWidthTable';
import { calculateEfficiencyCoefficient, calculateSafeHeight, solveForH, solveForB, solveForHandB, getKMaxCoefficient } from '@/lib/calculations';
import * as XLSX from 'xlsx';
import { saveLandmarkCoordinates, getLandmarkCoordinates, saveCanalStructures,
  getTerrainData,
  saveTerrainData, getCanalStructures, getCategoriesByGroupName, saveProjectDesignConfig } from '@/app/actions';
import { StructureIcon, StructureStatus } from './icons/StructureIcon';
import { toast } from 'react-hot-toast';
import Toolbar from './Toolbar';
import { PropertiesPanel, PropertyGroup, PropertyRow } from './PropertiesPanel';
import Button from './Button';
import TerrainDataOffcanvas from './TerrainDataOffcanvas';
import LongitudinalProfileChart, { ProfileChartPoint } from './LongitudinalProfileChart';

interface DesignFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess?: () => void;
}

const designSteps: ModernStepItem[] = [
  { num: 1, id: "diagram", title: "Sơ đồ hệ thống", desc: "Mạng lưới thuỷ lợi", icon: "bi-diagram-3" },
  { num: 2, id: "flow", title: "Tính lưu lượng", desc: "Lưu lượng thiết kế", icon: "bi-water" },
  { num: 3, id: "cross-section", title: "Mặt cắt ngang", desc: "Mặt cắt ngang", icon: "bi-arrows-collapse" },
  { num: 4, id: "long-profile", title: "Cắt dọc", desc: "Mặt cắt dọc", icon: "bi-bar-chart-steps" },
  { num: 5, id: "branch", title: "Xuất bản vẽ", desc: "Thiết kế tuyến kênh", icon: "bi-share" },
  { num: 6, id: "headworks", title: "Cống đầu kênh nhánh", desc: "Công trình điều tiết", icon: "bi-building" },
];

const formatNum = (val: any, decimals?: number) => {
  if (val === null || val === undefined || val === '' || val === '-') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (decimals !== undefined) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 3 });
};

export default function DesignFullscreenModal({ isOpen, onClose, project, onSuccess }: DesignFullscreenModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [landmarkName, setLandmarkName] = useState("S1");
  const [isPropertiesExpanded, setIsPropertiesExpanded] = useState(false);
  const [isLongitudinalPanelExpanded, setIsLongitudinalPanelExpanded] = useState(false);
  const [isLongitudinalPanelFullscreen, setIsLongitudinalPanelFullscreen] = useState(false);
  const [collapsedSegments, setCollapsedSegments] = useState<Record<number, boolean>>({});
  const [focusedChainage, setFocusedChainage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedPoints, setImportedPoints] = useState<{name: string, x: number, y: number}[]>([]);
  const [viewTransform, setViewTransform] = useState({ zoom: 1, x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [showPointDot, setShowPointDot] = useState(true);
  const [showPointName, setShowPointName] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileChartZoom, setProfileChartZoom] = useState(1);
  const [isProfilePanMode, setIsProfilePanMode] = useState(false);
  const [hoveredProfileChainage, setHoveredProfileChainage] = useState<number | null>(null);
  const [pickingChainageTarget, setPickingChainageTarget] = useState<'start'|'end'|'single'|null>(null);
  const [startChainageInput, setStartChainageInput] = useState<string>('');
  const [endChainageInput, setEndChainageInput] = useState<string>('');
  
  const [inlineStructureTypeInput, setInlineStructureTypeInput] = useState<string>('');
  const [inlineStructureNameInput, setInlineStructureNameInput] = useState<string>('');
  const [inlineStructureLossInput, setInlineStructureLossInput] = useState<string>('');
  const [showInlineLossDetails, setShowInlineLossDetails] = useState(false);
  const [inlineInletLoss, setInlineInletLoss] = useState<string>('');
  const [inlineOutletLoss, setInlineOutletLoss] = useState<string>('');
  const [inlineFrictionLoss, setInlineFrictionLoss] = useState<string>('');
  const [selectedInlineStructureId, setSelectedInlineStructureId] = useState<string>('');

  const [landmarkX, setLandmarkX] = useState<number | ''>('');
  const [landmarkY, setLandmarkY] = useState<number | ''>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState<{name: string, ts: number} | null>(null);

  const [chainageInput, setChainageInput] = useState('');
  const [canalNameInput, setCanalNameInput] = useState('');
  const [offtakeSide, setOfftakeSide] = useState<'trai' | 'phai'>('trai');
  const [offtakeStatus, setOfftakeStatus] = useState<'moi' | 'sua' | 'da_co'>('moi');
  
  const [canalLengthInput, setCanalLengthInput] = useState<string>('0');
  const [flowCalcMethodInput, setFlowCalcMethodInput] = useState('tinh_toan');
  const [reqFlowInput, setReqFlowInput] = useState<string>('0');
  const [riceAreaInput, setRiceAreaInput] = useState<string>('0');
  const [fruitAreaInput, setFruitAreaInput] = useState<string>('0');
  const [permeabilityInput, setPermeabilityInput] = useState('rat_it');
  const [reqWaterLevelInput, setReqWaterLevelInput] = useState<string>('0');
  const [offtakeSizeInput, setOfftakeSizeInput] = useState<string>('0');
  const [showWaterLevelCalc, setShowWaterLevelCalc] = useState(false);
  const [calcElevation, setCalcElevation] = useState<string>('');

  const [controlElevationType, setControlElevationType] = useState<'day' | 'muc_nuoc'>('muc_nuoc');
  const [controlElevationValue, setControlElevationValue] = useState<string>('');
  const [maintainWaterLevel, setMaintainWaterLevel] = useState(false);
  const [calcDepth, setCalcDepth] = useState<string>('');
  const [calcSlope, setCalcSlope] = useState<string>('');
  const [calcLoss, setCalcLoss] = useState<string>('');
  
  const [sourceFlow, setSourceFlow] = useState<string>('');
  const [reinforcementFactor, setReinforcementFactor] = useState<string>('1');
  const [permeabilityLevel, setPermeabilityLevel] = useState<string>('rat_it');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [segmentPermeabilities, setSegmentPermeabilities] = useState<Record<string, string>>({});
  const [segmentBreakpoints, setSegmentBreakpoints] = useState<string[]>([]);
  const [autoSegment, setAutoSegment] = useState<boolean>(false);


  // Step 3 properties states
  const [calcMethod, setCalcMethod] = useState<'thu_cong' | 'tu_dong'>('tu_dong');
  const [calcProblem, setCalcProblem] = useState<'cot_nuoc' | 'be_rong_day' | 'cot_nuoc_be_rong_day'>('cot_nuoc');
  const [crossSectionType, setCrossSectionType] = useState<'gia_co' | 'khong_gia_co'>('gia_co');
  const [bottomSlope, setBottomSlope] = useState<string>('');
  const [sideSlope, setSideSlope] = useState<string>('');
  const [roughnessCoef, setRoughnessCoef] = useState<string>('');
  const [bhRatio, setBhRatio] = useState<string>('');
  const [designFlow, setDesignFlow] = useState<string>('');
  const [channelWidth, setChannelWidth] = useState<string>('');
  const [safeHeight, setSafeHeight] = useState<string>('');
  const [channelHeight, setChannelHeight] = useState<string>('');
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(0);
  const [segmentHydraulicResults, setSegmentHydraulicResults] = useState<Record<number, {
    h_des: string; v_des: string; h_max: string; v_max: string; h_min: string; v_min: string; b_out: string;
    i: string; n: string; m: string; safeHeight: string; H: string; crossSectionType: string;
  }>>({});
  const [showRoughnessDropdown, setShowRoughnessDropdown] = useState<boolean>(false);
  const [maxWaterLevel, setMaxWaterLevel] = useState<string>('');
  const [designWaterLevel, setDesignWaterLevel] = useState<string>('');
  const [minWaterLevel, setMinWaterLevel] = useState<string>('');
  const [maxVelocity, setMaxVelocity] = useState<string>('');
  const [designVelocity, setDesignVelocity] = useState<string>('');
  const [minVelocity, setMinVelocity] = useState<string>('');
  const [kminCoef, setKminCoef] = useState<string>('0.8');
  const [flowDifference, setFlowDifference] = useState<string>('');

  const [hoverTooltip, setHoverTooltip] = useState<{ x: number, y: number, data: any, segIdx: number } | null>(null);

  const isWaterLevelCalculated = showWaterLevelCalc && (calcElevation !== '' || calcDepth !== '' || calcSlope !== '' || calcLoss !== '');

  const [canalStructures, setCanalStructures] = useState<{ 
    id: string, name: string, x: number, y: number, angle: number, status: StructureStatus, type: any,
    chainage?: string, length?: number, riceArea?: number, fruitArea?: number, permeability?: string, reqWaterLevel?: number, offtakeSide?: string, offtakeSize?: number, offtakeStatus?: string,
    inlineStructureType?: string, endChainage?: string, headLoss?: number, inletLoss?: number, outletLoss?: number, frictionLoss?: number,
    flowCalcMethod?: string, reqFlow?: number
  }[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [isTerrainDataOpen, setIsTerrainDataOpen] = useState(false);
  const [terrainData, setTerrainData] = useState<any[]>([]);
  const [focusStructureTrigger, setFocusStructureTrigger] = useState<{id: string, ts: number} | null>(null);
  const [permeabilityBranchOptions, setPermeabilityBranchOptions] = useState<{id: string, name: string}[]>([]);
  const [permeabilityMainOptions, setPermeabilityMainOptions] = useState<{id: string, name: string, metadata?: string}[]>([]);
  const [canalStructureTypes, setCanalStructureTypes] = useState<any[]>([]);

  const handleAddCoordinate = () => {
    const match = landmarkName.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      setLandmarkName(`${prefix}${num + 1}`);
    } else {
      setLandmarkName(`${landmarkName}1`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let newPoints: {name: string, x: number, y: number}[] = [];

      if (extension === 'txt') {
        const text = await file.text();
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          const parts = line.trim().split(/[,;\t]+/).map(p => p.trim()).filter(Boolean);
          const finalParts = parts.length >= 2 ? parts : line.trim().split(/\s+/).map(p => p.trim()).filter(Boolean);
          
          if (finalParts.length >= 2) {
             let name, x, y;
             if (finalParts.length === 2) {
                name = `P${index + 1}`;
                x = parseFloat(finalParts[0]);
                y = parseFloat(finalParts[1]);
             } else {
                name = finalParts[0];
                x = parseFloat(finalParts[1]);
                y = parseFloat(finalParts[2]);
             }
             if (!isNaN(x) && !isNaN(y)) {
               newPoints.push({ name, x, y });
             }
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        data.forEach((row, index) => {
          const vals = row.filter(v => v !== undefined && v !== null && v !== '');
          if (vals.length >= 2) {
            let name, x, y;
            if (vals.length === 2) {
               name = `P${index + 1}`;
               x = parseFloat(vals[0]);
               y = parseFloat(vals[1]);
            } else {
               name = String(vals[0]);
               x = parseFloat(vals[1]);
               y = parseFloat(vals[2]);
            }
            if (!isNaN(x) && !isNaN(y)) {
              newPoints.push({ name, x, y });
            }
          }
        });
      }

      if (newPoints.length > 0) {
        setImportedPoints(newPoints);
        setViewTransform({ zoom: 1, x: 0, y: 0 });
      } else {
        alert("Không tìm thấy dữ liệu toạ độ hợp lệ trong tệp.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi đọc tệp.");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (project?.id) {
        Promise.all([
          getLandmarkCoordinates(project.id),
          getCanalStructures(project.id),
          getCategoriesByGroupName("Độ thấm kênh nhánh"),
          getCategoriesByGroupName("Độ thấm kênh chính"),
          getCategoriesByGroupName("Loại công trình trên kênh"),
          getTerrainData(project.id)
        ]).then(([coords, structures, branchPermCats, mainPermCats, structureCats, terrainRows]) => {
          if (terrainRows && terrainRows.length > 0) {
            setTerrainData(terrainRows);
          }
          if (coords && coords.length > 0) {
            setImportedPoints(coords);
            setViewTransform({ zoom: 1, x: 0, y: 0 });
          }
          if (structures && structures.length > 0) {
            setCanalStructures(structures as any);
          }
          if (branchPermCats && branchPermCats.length > 0) {
            setPermeabilityBranchOptions(branchPermCats);
          }
          if (mainPermCats && mainPermCats.length > 0) {
            setPermeabilityMainOptions(mainPermCats.map((m: any) => ({...m, metadata: m.metadata || undefined})));
            if (permeabilityLevel === 'rat_it' && (!project.designConfig || !JSON.parse(project.designConfig).permeabilityLevel)) {
              setPermeabilityLevel(mainPermCats[0].id);
            }
          }
          if (structureCats && structureCats.length > 0) {
            setCanalStructureTypes(structureCats);
          }

          if (project.designConfig) {
            try {
              const config = JSON.parse(project.designConfig);
              if (config.sourceFlow !== undefined) setSourceFlow(config.sourceFlow);
              if (config.reinforcementFactor !== undefined) setReinforcementFactor(config.reinforcementFactor);
              if (config.permeabilityLevel !== undefined) setPermeabilityLevel(config.permeabilityLevel);
              if (config.applyToAll !== undefined) setApplyToAll(config.applyToAll);
              if (config.segmentPermeabilities !== undefined) setSegmentPermeabilities(config.segmentPermeabilities);
              
              if (config.segmentBreakpoints !== undefined) setSegmentBreakpoints(config.segmentBreakpoints);
              if (config.autoSegment !== undefined) setAutoSegment(config.autoSegment);
              if (config.flowDifference !== undefined) setFlowDifference(config.flowDifference);
              if (config.calcMethod !== undefined) setCalcMethod(config.calcMethod);
              if (config.calcProblem !== undefined) setCalcProblem(config.calcProblem);
              if (config.crossSectionType !== undefined) setCrossSectionType(config.crossSectionType);
              if (config.kminCoef !== undefined) setKminCoef(config.kminCoef);
              if (config.segmentHydraulicResults !== undefined) setSegmentHydraulicResults(config.segmentHydraulicResults);
              if (config.controlElevationType !== undefined) setControlElevationType(config.controlElevationType);
              if (config.controlElevationValue !== undefined) setControlElevationValue(config.controlElevationValue);
              if (config.maintainWaterLevel !== undefined) setMaintainWaterLevel(config.maintainWaterLevel);
            } catch (e) {
              console.error("Failed to parse design config", e);
            }
          }
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, project]);

  const handleSaveProject = async () => {
    if (!project?.id) return;
    setIsSaving(true);
    const calculatedElevations = computedSegments.map((seg, segIdx) => {
      const res = segmentHydraulicResults[segIdx];
      const isDesigned = res !== undefined;
      const nodes = [];
      const endNodeIdx = seg.endIdx !== null && seg.endIdx < flowNodesData.flowNodes.length ? seg.endIdx : flowNodesData.flowNodes.length - 1;
      
      for (let index = seg.startIdx; index <= endNodeIdx; index++) {
        const node = flowNodesData.flowNodes[index];
        const dayVal = nodeElevations[segIdx]?.[index];
        const htkVal = dayVal !== null && dayVal !== undefined && isDesigned && res.h_des ? dayVal + Number(res.h_des) : null;
        
        let safeHeightVal = 0;
        if (res && res.safeHeight) {
          safeHeightVal = Number(String(res.safeHeight).replace(',', '.'));
          if (isNaN(safeHeightVal)) safeHeightVal = 0;
        } else {
          // Approximate safe height if not found
          safeHeightVal = 0;
        }
        const h_max_val = !isNaN(Number(res?.h_max)) ? Number(res?.h_max) : 0;
        const dinhKenhVal = dayVal !== null && dayVal !== undefined && isDesigned ? dayVal + h_max_val + safeHeightVal : null;

        let terrainVal = null;
        if (terrainData && terrainData.length > 0) {
          const chainage = node.chainage || 0;
          const exactMatch = terrainData.find(t => Math.abs(Number(t.lyTrinh) - chainage) < 0.1);
          if (exactMatch) {
            terrainVal = Number(exactMatch.caoDo);
          } else {
            const sortedData = [...terrainData].sort((a, b) => Number(a.lyTrinh) - Number(b.lyTrinh));
            let prev = null;
            let next = null;
            for (let i = 0; i < sortedData.length; i++) {
              const tChainage = Number(sortedData[i].lyTrinh);
              if (tChainage <= chainage) prev = sortedData[i];
              if (tChainage >= chainage && !next) next = sortedData[i];
            }
            if (prev && next && Number(prev.lyTrinh) !== Number(next.lyTrinh)) {
              terrainVal = Number(prev.caoDo) + ((chainage - Number(prev.lyTrinh)) / (Number(next.lyTrinh) - Number(prev.lyTrinh))) * (Number(next.caoDo) - Number(prev.caoDo));
            } else if (prev) {
              terrainVal = Number(prev.caoDo);
            } else if (next) {
              terrainVal = Number(next.caoDo);
            }
          }
        }
        
        nodes.push({
          nodeId: node.id,
          chainage: node.chainage,
          dayKenh: dayVal,
          htk: htkVal,
          dinhKenh: dinhKenhVal,
          matDat: terrainVal
        });
      }
      return { segIdx, nodes };
    });

    const configData = {
      sourceFlow,
      reinforcementFactor,
      permeabilityLevel,
      applyToAll,
      segmentPermeabilities,
      segmentBreakpoints,
      autoSegment,
      flowDifference,
      calcMethod,
      calcProblem,
      crossSectionType,
      kminCoef,
      segmentHydraulicResults,
      calculatedElevations,
      controlElevationType,
      controlElevationValue,
      maintainWaterLevel
    };

    const [resLandmark, resCanal, resConfig] = await Promise.all([
      saveLandmarkCoordinates(project.id, importedPoints),
      saveCanalStructures(project.id, canalStructures),
      saveProjectDesignConfig(project.id, JSON.stringify(configData))
    ]);
    setIsSaving(false);
    if (resLandmark.success && resCanal.success && resConfig.success) {
      toast.success('Đã lưu dữ liệu dự án thành công!');
      onSuccess?.();
    } else {
      toast.error('Có lỗi xảy ra khi lưu: ' + (resLandmark.error || resCanal.error || resConfig.error));
    }
  };

  useEffect(() => {
    if (selectedStructureId) {
      const struct = canalStructures.find(s => s.id === selectedStructureId);
      if (struct) {
        setCanalNameInput(struct.name || '');
        setChainageInput(struct.chainage || '');
        setCanalLengthInput(struct.length?.toString() || '0');
        setFlowCalcMethodInput(struct.flowCalcMethod || 'tinh_toan');
        setReqFlowInput(struct.reqFlow?.toString() || '0');
        setRiceAreaInput(struct.riceArea?.toString() || '0');
        setFruitAreaInput(struct.fruitArea?.toString() || '0');
        setPermeabilityInput(struct.permeability || 'rat_it');
        setReqWaterLevelInput(struct.reqWaterLevel?.toString() || '0');
        setOfftakeSide((struct.offtakeSide as any) || 'trai');
        setOfftakeSizeInput(struct.offtakeSize?.toString() || '0');
        setOfftakeStatus((struct.offtakeStatus as any) || 'moi');
        setCalcElevation('');
        setCalcDepth('');
        setCalcSlope('');
        setCalcLoss('');
      }
    }
  }, [selectedStructureId]);

  useEffect(() => {
    const parsedElev = parseFloat(calcElevation) || 0;
    const parsedDepth = parseFloat(calcDepth) || 0;
    const parsedSlope = parseFloat(calcSlope) || 0;
    const parsedLoss = parseFloat(calcLoss) || 0;

    if (showWaterLevelCalc && (calcElevation !== '' || calcDepth !== '' || calcSlope !== '' || calcLoss !== '')) {
      const computed = parsedElev + parsedDepth + (parsedSlope * Number(canalLengthInput || 0)) + parsedLoss;
      setReqWaterLevelInput(String(Math.round(computed * 100) / 100));
    }
  }, [calcElevation, calcDepth, calcSlope, calcLoss, canalLengthInput, showWaterLevelCalc]);

  useEffect(() => {
    if (showInlineLossDetails) {
      const v1 = parseFloat(inlineInletLoss) || 0;
      const v2 = parseFloat(inlineOutletLoss) || 0;
      const v3 = parseFloat(inlineFrictionLoss) || 0;
      if (inlineInletLoss !== '' || inlineOutletLoss !== '' || inlineFrictionLoss !== '') {
        setInlineStructureLossInput(String(Math.round((v1 + v2 + v3) * 100) / 100));
      }
    }
  }, [inlineInletLoss, inlineOutletLoss, inlineFrictionLoss, showInlineLossDetails]);

  const calculateStructurePosition = () => {
    const parsed = parseFloat(chainageInput.replace(/[^\d.]/g, ''));
    const targetChainage = isNaN(parsed) ? 0 : parsed;
    let cumulativeLength = 0;
    
    for (let i = 0; i < importedPoints.length - 1; i++) {
      const p1 = importedPoints[i];
      const p2 = importedPoints[i+1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (cumulativeLength + dist >= targetChainage || i === importedPoints.length - 2) {
        let t = dist === 0 ? 0 : (targetChainage - cumulativeLength) / dist;
        t = Math.max(0, Math.min(1, t));

        const structX = p1.x + t * dx;
        const structY = p1.y + t * dy;

        // Tính góc: Nếu công trình nằm rất gần một điểm mốc (bán kính 5m), 
        // lấy điểm mốc trước và sau đó để tạo thành đường thẳng tổng quát
        let prevPoint = p1;
        let nextPoint = p2;
        const distToP1 = t * dist;
        const distToP2 = (1 - t) * dist;

        if (distToP1 <= 5.0 && i > 0) {
          prevPoint = importedPoints[i - 1];
        } else if (distToP2 <= 5.0 && i < importedPoints.length - 2) {
          nextPoint = importedPoints[i + 2];
        }

        let angleDx = nextPoint.x - prevPoint.x;
        let angleDy = nextPoint.y - prevPoint.y;
        
        if (angleDx === 0 && angleDy === 0) {
          angleDx = dx;
          angleDy = dy;
        }

        let angleDeg = Math.atan2(angleDy, angleDx) * 180 / Math.PI;
        if (offtakeSide === 'phai') {
          angleDeg += 180;
        }

        return { structX, structY, angleDeg };
      }
      cumulativeLength += dist;
    }
    return null;
  };

  const flowNodesData = useMemo(() => {
    let cropNames = ['Cây trồng 1', 'Cây trồng 2'];
    let parsedCrops: any[] = [];
    if (project?.irrigationCoefficient) {
      try {
        parsedCrops = JSON.parse(project.irrigationCoefficient);
        if (parsedCrops && parsedCrops.length > 0) {
          cropNames = parsedCrops.map((c: any) => c.name || 'Cây trồng');
        }
      } catch (e) {}
    }

    const processedBranches = (canalStructures || []).filter(s => s.type !== 'inline_structure').map((struct) => {
      const totalArea = (Number(struct.riceArea) || 0) + (Number(struct.fruitArea) || 0);
      const length = Number(struct.length) || 0;
      const canalType = (totalArea > 0 && (length / totalArea) <= 50) ? 'A' : 'B';
      
      let permeability = struct.permeability || 'it';
      if (permeability === 'rat_it') permeability = 'it';
      else if (permeability === 'rat_manh') permeability = 'nhieu';
      else if (!['it', 'vua', 'nhieu'].includes(permeability)) {
        const lowerPerm = permeability.toLowerCase();
        if (lowerPerm.includes('nhỏ') || lowerPerm.includes('ít')) permeability = 'it';
        else if (lowerPerm.includes('vừa')) permeability = 'vua';
        else if (lowerPerm.includes('nhiều') || lowerPerm.includes('mạnh')) permeability = 'nhieu';
        else permeability = 'it';
      }
      
      const efficiency = totalArea > 0 ? calculateEfficiencyCoefficient(totalArea, canalType, permeability as 'it' | 'vua' | 'nhieu') : 0;
      
      let totalFlow = 0;
      if (efficiency > 0) {
        cropNames.forEach((c: string) => {
          const isRice = c.toLowerCase().includes('lúa');
          const area = isRice ? (Number(struct.riceArea) || 0) : (Number(struct.fruitArea) || 0);
          const cropCoeff = parsedCrops.find((ic: any) => ic.name === c);
          const q = cropCoeff ? Number(cropCoeff.coef) : 0;
          
          if (area > 0 && q > 0) {
            totalFlow += (area * q * 0.001) / efficiency;
          }
        });
      }
      
      return {
        ...struct,
        totalArea,
        canalType,
        permeability,
        efficiency,
        totalFlow: struct.flowCalcMethod === 'nhap_gia_tri' ? (Number(struct.reqFlow) || 0) : totalFlow
      };
    });

    const sortedBranches = [...processedBranches].sort((a, b) => {
      const chainageA = Number(a.chainage) || 0;
      const chainageB = Number(b.chainage) || 0;
      return chainageA - chainageB;
    });

    const inlineStructures = (canalStructures || []).filter(s => s.type === 'inline_structure').map(struct => ({
      ...struct,
      chainage: Number(struct.chainage) || 0
    })).sort((a, b) => a.chainage - b.chainage);

    let canalTotalLength = 0;
    for (let i = 0; i < importedPoints.length - 1; i++) {
      const p1 = importedPoints[i];
      const p2 = importedPoints[i+1];
      canalTotalLength += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    const rawNodes: any[] = [];
    for (let i = 0; i < sortedBranches.length; i++) {
      const b = sortedBranches[i];
      rawNodes.push({ type: 'branch', id: b.id, name: b.name, chainage: Number(b.chainage) || 0, q_branch: b.totalFlow || 0, reqWaterLevel: b.reqWaterLevel || 0, q_sau: 0, q_truoc: 0, loss: 0 });
    }
    for (let i = 0; i < inlineStructures.length; i++) {
      const st = inlineStructures[i];
      if (st.endChainage && Number(st.endChainage) > st.chainage) {
        rawNodes.push({ type: 'inline_structure_start', id: st.id + '_start', name: `Đầu ${st.name}`, inlineStructureType: st.inlineStructureType, chainage: st.chainage, q_branch: 0, q_sau: 0, q_truoc: 0, loss: 0, parentId: st.id, endChainage: st.endChainage, headLoss: st.headLoss });
        rawNodes.push({ type: 'inline_structure_end', id: st.id + '_end', name: `Cuối ${st.name}`, inlineStructureType: st.inlineStructureType, chainage: Number(st.endChainage), q_branch: 0, q_sau: 0, q_truoc: 0, loss: st.headLoss || 0, parentId: st.id, headLoss: st.headLoss });
      } else {
        rawNodes.push({ type: 'inline_structure', id: st.id, name: st.name, inlineStructureType: st.inlineStructureType, chainage: st.chainage, endChainage: st.endChainage, headLoss: st.headLoss || 0, q_branch: 0, q_sau: 0, q_truoc: 0, loss: st.headLoss || 0 });
      }
    }
    
    // Sort all intermediate nodes by chainage
    rawNodes.sort((a, b) => a.chainage - b.chainage);

    const flowNodes: any[] = [];
    flowNodes.push({ type: 'dau', id: 'dau', chainage: 0, q_branch: 0, q_sau: 0, q_truoc: 0, loss: 0 });
    flowNodes.push(...rawNodes);
    flowNodes.push({ type: 'cuoi', id: 'cuoi', chainage: canalTotalLength, q_branch: 0, q_sau: 0, q_truoc: 0, loss: 0 });

    const inputSourceFlow = Number(sourceFlow) || 0;

    for (let i = flowNodes.length - 1; i >= 0; i--) {
      const currNode = flowNodes[i];
      if (i === flowNodes.length - 1) { 
        currNode.q_sau = 0;
        currNode.q_truoc = inputSourceFlow; 
        currNode.loss = 0;
      } else {
        const nextNode = flowNodes[i+1];
        const segPermId = segmentPermeabilities[nextNode.id] || permeabilityLevel;
        
        let A1 = 1.9;
        let m1 = 0.4;
        const selectedPermOpt = permeabilityMainOptions.find(o => o.id === segPermId);
        if (selectedPermOpt && selectedPermOpt.metadata) {
          try {
            const meta = JSON.parse(selectedPermOpt.metadata);
            if (meta.A1 !== undefined) A1 = Number(meta.A1);
            if (meta.m1 !== undefined) m1 = Number(meta.m1);
          } catch(e) {}
        }

        const deltaL_km = (nextNode.chainage - currNode.chainage) / 1000;
        let loss = 0;
        if (deltaL_km > 0) {
          const rf = Number(reinforcementFactor);
          const validRf = (!isNaN(rf) && reinforcementFactor !== '') ? rf : 1;
          loss = (10 * A1 * Math.pow(nextNode.q_truoc, 1 - m1) * deltaL_km) / 1000 * validRf;
        }
        currNode.loss = loss;
        currNode.q_sau = nextNode.q_truoc + loss;
        currNode.q_truoc = currNode.q_sau + currNode.q_branch;
      }
    }

    return { cropNames, processedBranches, sortedBranches, flowNodes };
  }, [project?.irrigationCoefficient, canalStructures, permeabilityLevel, permeabilityMainOptions, segmentPermeabilities, importedPoints, sourceFlow, reinforcementFactor]);

  // Backward compatibility: Convert numeric breakpoints to node IDs
  useEffect(() => {
    if (segmentBreakpoints.length > 0 && typeof segmentBreakpoints[0] === 'number' && flowNodesData.flowNodes.length > 0) {
      const newBreakpoints = (segmentBreakpoints as any as number[])
        .map(idx => flowNodesData.flowNodes[idx]?.id)
        .filter(Boolean);
      setSegmentBreakpoints(newBreakpoints);
    }
  }, [segmentBreakpoints, flowNodesData.flowNodes]);

  const computedSegments = useMemo(() => {
    if (!flowNodesData.flowNodes || flowNodesData.flowNodes.length === 0) return [];
    
    const breakpointIndices = segmentBreakpoints
       .map(id => flowNodesData.flowNodes.findIndex((n: any) => n.id === id))
       .filter(idx => idx > 0)
       .sort((a, b) => a - b);

    const segments: {startIdx: number, endIdx: number | null}[] = [];
    let startIdx = 0;
    breakpointIndices.forEach(bp => {
      segments.push({ startIdx, endIdx: bp });
      startIdx = bp;
    });
    
    const lastNodeIdx = flowNodesData.flowNodes.length - 1;
    if (startIdx < lastNodeIdx) {
      segments.push({ startIdx, endIdx: null });
    }
    return segments;
  }, [flowNodesData.flowNodes, segmentBreakpoints]);

  const nodeElevations = useMemo(() => {
    if (!flowNodesData.flowNodes || flowNodesData.flowNodes.length === 0) return [];
    
    let currentDay = 0;
    let validStart = false;

    if (controlElevationValue && !isNaN(Number(controlElevationValue))) {
      const val = Number(controlElevationValue);
      if (controlElevationType === 'day') {
        currentDay = val;
        validStart = true;
      } else if (controlElevationType === 'muc_nuoc') {
        const firstRes = segmentHydraulicResults[0];
        if (firstRes && firstRes.h_des) {
           currentDay = val - Number(firstRes.h_des);
           validStart = true;
        }
      }
    }

    const elevations: { [segIdx: number]: { [nodeIdx: number]: number | null } } = {};
    
    let runningDay: number | null = validStart ? currentDay : null;

    for (let segIdx = 0; segIdx < computedSegments.length; segIdx++) {
      const seg = computedSegments[segIdx];
      elevations[segIdx] = {};
      const res = segmentHydraulicResults[segIdx];
      const isDesigned = res !== undefined;
      const i_val = isDesigned ? Number(res.i || 0.0003) : 0;
      
      const endNodeIdx = seg.endIdx !== null && seg.endIdx < flowNodesData.flowNodes.length ? seg.endIdx : flowNodesData.flowNodes.length - 1;

      for (let index = seg.startIdx; index <= endNodeIdx; index++) {
        const node = flowNodesData.flowNodes[index];
        
        if (index === seg.startIdx) {
           if (segIdx === 0) {
              elevations[segIdx][index] = runningDay;
           } else {
              if (maintainWaterLevel && runningDay !== null) {
                 const prevRes = segmentHydraulicResults[segIdx - 1];
                 const h_des_old = prevRes?.h_des ? Number(prevRes.h_des) : 0;
                 const h_des_new = res?.h_des ? Number(res.h_des) : 0;
                 runningDay = runningDay + h_des_old - h_des_new;
              }
              elevations[segIdx][index] = runningDay;
           }
        } else {
           if (runningDay !== null) {
              const prevNode = flowNodesData.flowNodes[index - 1];
              const L = (node.chainage || 0) - (prevNode.chainage || 0);
              let frictionLoss = L * i_val;
              
              if (node.type === 'inline_structure_end' && prevNode.type === 'inline_structure_start' && prevNode.parentId === node.parentId) {
                frictionLoss = 0;
              }
              
              let localHeadLoss = 0;
              if (node.type === 'inline_structure_end' || node.type === 'inline_structure') {
                localHeadLoss = Number(node.headLoss) || 0;
              }
              runningDay = runningDay - frictionLoss - localHeadLoss;
              elevations[segIdx][index] = runningDay;
           } else {
              elevations[segIdx][index] = null;
           }
        }
      }
    }
    
    return elevations;
  }, [flowNodesData.flowNodes, computedSegments, segmentHydraulicResults, controlElevationValue, controlElevationType, maintainWaterLevel]);

  useEffect(() => {
    if (computedSegments.length > 0 && computedSegments[selectedSegmentIdx]) {
      const seg = computedSegments[selectedSegmentIdx];
      const startNode = flowNodesData.flowNodes[seg.startIdx];
      const res = segmentHydraulicResults[selectedSegmentIdx];

      if (res) {
        setBottomSlope(res.i || '0.0003');
        setSideSlope(res.m || '0');
        setRoughnessCoef(res.n || '0.017');
        if (res.crossSectionType) setCrossSectionType(res.crossSectionType as any);
        setChannelWidth(res.b_out || '');
        setChannelHeight(res.H || '');
        setMaxWaterLevel(res.h_max || '');
        setDesignWaterLevel(res.h_des || '');
        setMinWaterLevel(res.h_min || '');
        setMaxVelocity(res.v_max || '');
        setDesignVelocity(res.v_des || '');
        setMinVelocity(res.v_min || '');
        if (res.b_out && res.h_des) {
          const b_val = parseFloat(res.b_out);
          const h_val = parseFloat(res.h_des);
          if (!isNaN(b_val) && !isNaN(h_val) && h_val > 0) {
            setBhRatio((b_val / h_val).toFixed(2));
          }
        }
      } else {
        setChannelWidth('');
        setChannelHeight('');
        setMaxWaterLevel('');
        setDesignWaterLevel('');
        setMinWaterLevel('');
        setMaxVelocity('');
        setDesignVelocity('');
        setMinVelocity('');
        setBhRatio('');
      }

      if (startNode) {
        setDesignFlow(formatNum(startNode.q_sau, 3));
        if (res && res.safeHeight && !res.safeHeight.includes('-')) {
          setSafeHeight(res.safeHeight);
        } else {
          setSafeHeight(calculateSafeHeight(startNode.q_sau, crossSectionType));
        }
      }
    } else {
      setDesignFlow('');
      setSafeHeight('');
    }
  }, [selectedSegmentIdx, computedSegments, flowNodesData.flowNodes, crossSectionType, segmentHydraulicResults]);

  useEffect(() => {
    if (currentStep === 3) {
      setTimeout(() => {
        const row = document.getElementById(`segment-row-${selectedSegmentIdx}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [selectedSegmentIdx, currentStep]);


  const formatChainageToK = (chainage: number) => {
    const km = Math.floor(chainage / 1000);
    const m = chainage % 1000;
    let mStr = m.toFixed(2);
    mStr = mStr.replace(/\.00$/, '');
    const parts = mStr.split('.');
    parts[0] = parts[0].padStart(3, '0');
    return `K${km}+${parts.join('.')}`;
  };

  const handleAutoSegmentCalculator = () => {
    const diffVal = parseFloat(flowDifference);
    if (isNaN(diffVal) || diffVal <= 0) {
      toast.error('Vui lòng nhập phần trăm chênh lệch lưu lượng hợp lệ (lớn hơn 0).');
      return;
    }

    const nodes = flowNodesData.flowNodes;
    if (nodes.length <= 1) return;

    const newBreakpoints: string[] = [];
    let startQ = parseFloat(nodes[0].q_truoc) || 0;

    for (let i = 1; i < nodes.length; i++) {
      const currentQ = parseFloat(nodes[i].q_truoc) || 0;
      if (startQ > 0) {
        const diffPercent = ((startQ - currentQ) / startQ) * 100;
        if (diffPercent >= diffVal) {
          newBreakpoints.push(nodes[i].id);
          startQ = currentQ;
        }
      }
    }

    setSegmentBreakpoints(newBreakpoints);
    toast.success(`Đã tự động phân đoạn với chênh lệch ${diffVal}%.`);
  };

  const handleCalculateHydraulics = () => {
    const Q_des = parseFloat(designFlow);
    const i = parseFloat(bottomSlope);
    const m = parseFloat(sideSlope);
    const n = parseFloat(roughnessCoef);
    const Kmin = parseFloat(kminCoef) || 0.8;
    const b = parseFloat(channelWidth);
    const beta = parseFloat(bhRatio);
    const h_in = parseFloat(designWaterLevel);

    if (isNaN(Q_des) || isNaN(i) || isNaN(m) || isNaN(n)) {
      toast.error('Vui lòng nhập đầy đủ Lưu lượng, Độ dốc, Hệ số mái, Hệ số nhám.');
      return;
    }

    let h = 0;
    let b_out = 0;
    let v_des = 0;

    if (calcProblem === 'cot_nuoc') {
      if (isNaN(b)) { toast.error('Vui lòng nhập Bề rộng đáy kênh (b).'); return; }
      const res = solveForH(Q_des, b, m, i, n);
      if (!res.success) { toast.error(res.error || 'Lỗi tính toán'); return; }
      h = res.h!; b_out = b; v_des = res.v!;
    } else if (calcProblem === 'be_rong_day') {
      if (isNaN(h_in)) { toast.error('Vui lòng nhập Cột nước thiết kế (h).'); return; }
      const res = solveForB(Q_des, h_in, m, i, n);
      if (!res.success) { toast.error(res.error || 'Lỗi tính toán'); return; }
      h = h_in; b_out = res.b!; v_des = res.v!;
    } else if (calcProblem === 'cot_nuoc_be_rong_day') {
      if (isNaN(beta)) { toast.error('Vui lòng nhập Tỷ số Bh.'); return; }
      const res = solveForHandB(Q_des, beta, m, i, n);
      if (!res.success) { toast.error(res.error || 'Lỗi tính toán'); return; }
      h = res.h!; b_out = res.b!; v_des = res.v!;
    }

    setChannelWidth(b_out.toFixed(2));
    setDesignWaterLevel(h.toFixed(2));
    setDesignVelocity(v_des.toFixed(2));
    
    const kMax = getKMaxCoefficient(Q_des);
    const Q_max = Q_des * kMax;
    const resMax = solveForH(Q_max, b_out, m, i, n);
    if (resMax.success) {
      setMaxWaterLevel(resMax.h!.toFixed(2));
      setMaxVelocity(resMax.v!.toFixed(2));
    }

    const Q_min = Q_des * Kmin;
    if (Q_min > 0) {
      const resMin = solveForH(Q_min, b_out, m, i, n);
      if (resMin.success) {
        setMinWaterLevel(resMin.h!.toFixed(2));
        setMinVelocity(resMin.v!.toFixed(2));
      }
    } else {
      setMinWaterLevel('0.00');
      setMinVelocity('0.00');
    }

    const sHeight = parseFloat(safeHeight) || 0;
    setChannelHeight((h + sHeight).toFixed(2));

    let h_min_str = '0.00', v_min_str = '0.00';
    if (Q_min > 0) {
      const resMin = solveForH(Q_min, b_out, m, i, n);
      if (resMin.success) {
        h_min_str = resMin.h!.toFixed(2);
        v_min_str = resMin.v!.toFixed(2);
      }
    }
    
    setSegmentHydraulicResults(prev => ({
      ...prev,
      [selectedSegmentIdx]: {
        h_des: h.toFixed(2),
        v_des: v_des.toFixed(2),
        h_max: resMax.success ? resMax.h!.toFixed(2) : '-',
        v_max: resMax.success ? resMax.v!.toFixed(2) : '-',
        h_min: h_min_str,
        v_min: v_min_str,
        b_out: b_out.toFixed(2),
        i: i.toString(),
        n: n.toString(),
        m: m.toString(),
        safeHeight: safeHeight || '0',
        H: (h + sHeight).toFixed(2),
        crossSectionType: crossSectionType
      }
    }));

    toast.success('Tính toán thuỷ lực thành công!');
  };

  const chartData = useMemo(() => {
    if (currentStep !== 4 || computedSegments.length === 0) return [];
    const data: ProfileChartPoint[] = [];
    
    computedSegments.forEach((seg, segIdx) => {
      const res = segmentHydraulicResults[segIdx];
      const isDesigned = res !== undefined;
      const endNodeIdx = seg.endIdx !== null && seg.endIdx < flowNodesData.flowNodes.length ? seg.endIdx : flowNodesData.flowNodes.length - 1;
      
      for (let index = seg.startIdx; index <= endNodeIdx; index++) {
        const node = flowNodesData.flowNodes[index];
        const dayVal = nodeElevations[segIdx]?.[index] ?? null;
        
        const htkVal = (dayVal !== null && isDesigned && res.h_des) ? dayVal + Number(res.h_des) : null;
        
        let safeHeightVal = 0;
        if (res && res.safeHeight && !String(res.safeHeight).includes('-')) {
          safeHeightVal = Number(String(res.safeHeight).replace(',', '.'));
          if (isNaN(safeHeightVal)) safeHeightVal = 0;
        } else if (seg.startIdx !== null && flowNodesData.flowNodes[seg.startIdx]) {
          safeHeightVal = Number(calculateSafeHeight(flowNodesData.flowNodes[seg.startIdx].q_sau, res?.crossSectionType as any)) || 0;
        }
        
        const h_max_val = !isNaN(Number(res?.h_max)) ? Number(res?.h_max) : 0;
        const dinhKenhVal = (dayVal !== null && isDesigned) ? dayVal + h_max_val + safeHeightVal : null;
        
        let yeuCauVal: number | null = null;
        if (node.type === 'branch' && node.reqWaterLevel !== undefined && node.reqWaterLevel !== null && node.reqWaterLevel !== '') {
          const num = Number(node.reqWaterLevel);
          if (!isNaN(num) && num > 0) {
            yeuCauVal = num;
          }
        }
        
        let name = '';
        if (node.type === 'dau') name = 'Đầu kênh';
        else if (node.type === 'cuoi') name = 'Cuối kênh';
        else if (node.type === 'inline_structure' || node.type === 'inline_structure_start' || node.type === 'inline_structure_end') name = node.name || 'Công trình';
        else name = node.name || 'Kênh nhánh';

        let chainageDisplay = Number(node.chainage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
        
        const isDrop = segIdx > 0 && index === seg.startIdx;
        
        let localHeadLoss = 0;
        if (node.type === 'inline_structure_end' || node.type === 'inline_structure') {
          localHeadLoss = Number(node.headLoss) || 0;
        }

        if (localHeadLoss > 0 && dayVal !== null && htkVal !== null && dinhKenhVal !== null) {
          data.push({
            chainage: node.chainage || 0,
            chainageDisplay,
            dayVal: dayVal + localHeadLoss,
            htkVal: htkVal + localHeadLoss,
            dinhKenhVal: dinhKenhVal + localHeadLoss,
            yeuCauVal: null,
            name: '',
            isDrop: true
          });
        }
        
        data.push({
          chainage: node.chainage || 0,
          endChainage: node.type === 'inline_structure_start' && node.endChainage ? Number(node.endChainage) : undefined,
          chainageDisplay,
          dayVal,
          htkVal,
          dinhKenhVal,
          yeuCauVal,
          name,
          isDrop
        });
      }
    });
    
    return data;
  }, [currentStep, computedSegments, segmentHydraulicResults, flowNodesData.flowNodes, nodeElevations]);

  useEffect(() => {
    if (focusedChainage !== null) {
      setTimeout(() => {
        const row = document.getElementById(`row-${focusedChainage}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusedChainage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200 shrink-0 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Thiết kế chi tiết: <span className="text-blue-600">[{project?.code}] {project?.name}</span>
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveProject}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu dự án'}
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="border-b border-slate-200 bg-white shrink-0">
        <ModernStepper 
          steps={designSteps} 
          currentStep={currentStep} 
          onStepChange={setCurrentStep} 
        />
      </div>

      {currentStep === 1 && (
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            {project?.type === 'CANAL' && (
              <div className="flex items-center gap-3 mr-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 h-[30px] rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {project.canalType === 'pipe' ? 'Đường ống có áp' : 'Kênh hở'}
                </div>
                <div className="w-px h-3 bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-600">{project.cropCount || 0}</span> loại cây trồng
                </div>
              </div>
            )}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md overflow-hidden h-[30px] shadow-sm">
              <button 
                className={`p-1.5 transition-colors ${isPanMode ? 'text-blue-600 bg-blue-100' : 'text-slate-600 hover:bg-slate-200 hover:text-blue-600'}`}
                title="Kéo màn hình"
                onClick={() => setIsPanMode(!isPanMode)}
              >
                <Hand size={18} />
              </button>
              <div className="w-px h-5 bg-slate-200"></div>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-blue-600 transition-colors" 
                title="Thu nhỏ"
                onClick={() => setViewTransform(prev => {
                  const newZoom = Math.max(0.1, prev.zoom / 1.2);
                  const factor = newZoom / prev.zoom;
                  return { zoom: newZoom, x: prev.x * factor, y: prev.y * factor };
                })}
              >
                <ZoomOut size={18} />
              </button>
              <button 
                className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-blue-600 transition-colors" 
                title="Phóng to"
                onClick={() => setViewTransform(prev => {
                  const newZoom = Math.min(50, prev.zoom * 1.2);
                  const factor = newZoom / prev.zoom;
                  return { zoom: newZoom, x: prev.x * factor, y: prev.y * factor };
                })}
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-md px-3 h-[30px] shadow-sm ml-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showPointDot} onChange={(e) => setShowPointDot(e.target.checked)} className="w-3 h-3 text-blue-600 rounded-sm focus:ring-blue-500 border-slate-300" />
                <span className="text-[11px] font-medium text-slate-600">Điểm mốc</span>
              </label>
              <div className="w-px h-3 bg-slate-200"></div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showPointName} onChange={(e) => setShowPointName(e.target.checked)} className="w-3 h-3 text-blue-600 rounded-sm focus:ring-blue-500 border-slate-300" />
                <span className="text-[11px] font-medium text-slate-600">Tên mốc</span>
              </label>
            </div>
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm h-[30px]">
            <div className="relative h-full border-r border-slate-200 focus-within:bg-slate-50 transition-colors rounded-l-md">
              <input 
                type="text" 
                value={landmarkName}
                onChange={(e) => {
                  setLandmarkName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Tên mốc" 
                className="w-[80px] h-full px-3 text-xs font-medium text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0"
              />
              {showSuggestions && importedPoints.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-[150px] max-h-[200px] overflow-y-auto bg-white border border-slate-200 shadow-lg rounded-md z-50">
                  {importedPoints
                    .filter(p => p.name.toLowerCase().includes(landmarkName.toLowerCase()))
                    .slice(0, 50)
                    .map((p, i) => (
                      <div 
                        key={i} 
                        className="px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setLandmarkName(p.name);
                          setLandmarkX(p.x);
                          setLandmarkY(p.y);
                          setShowSuggestions(false);
                          setFocusTrigger({ name: p.name, ts: Date.now() });
                        }}
                      >
                        {p.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 pl-3 h-full border-r border-slate-200 focus-within:bg-slate-50 transition-colors">
              <span className="text-xs font-medium text-slate-400">X:</span>
              <input 
                type="number" 
                value={landmarkX} 
                onChange={(e) => setLandmarkX(e.target.value === '' ? '' : Number(e.target.value))}
                step="any"
                className="w-[60px] h-full text-xs font-medium tabular-nums text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex items-center gap-1 pl-3 h-full border-r border-slate-200 focus-within:bg-slate-50 transition-colors">
              <span className="text-xs font-medium text-slate-400">Y:</span>
              <input 
                type="number" 
                value={landmarkY} 
                onChange={(e) => setLandmarkY(e.target.value === '' ? '' : Number(e.target.value))}
                step="any"
                className="w-[60px] h-full text-xs font-medium tabular-nums text-slate-700 bg-transparent border-none outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            
            <button 
              className="flex items-center justify-center w-[32px] h-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border-r border-slate-200" 
              title="Nhập toạ độ điểm từ màn hình"
              onClick={handleAddCoordinate}
            >
              <Plus size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.txt" 
              onChange={handleFileUpload} 
            />
            <button 
              className="flex items-center justify-center w-[32px] h-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors rounded-r-md" 
              title="Nhập toạ độ từ tệp, hỗ trợ các dạng xlsx, txt."
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-slate-50 flex flex-col relative">
          {currentStep === 1 && (
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {importedPoints.length > 0 ? (
              <CoordinateWorkspace 
                points={importedPoints} 
                viewTransform={viewTransform} 
                setViewTransform={setViewTransform} 
                isPanMode={isPanMode} 
                showPointDot={showPointDot}
                showPointName={showPointName}
                focusTrigger={focusTrigger}
                activeLandmark={landmarkName}
                activeStructureId={selectedStructureId}
                focusStructureTrigger={focusStructureTrigger}
                canalStructures={canalStructures}
                onPointClick={(p) => {
                  setLandmarkName(p.name);
                  setLandmarkX(p.x);
                  setLandmarkY(p.y);
                }}
                onStructureClick={(id) => {
                  setSelectedStructureId(id);
                }}
              />
            ) : (
              <div className="text-center">
                <div className="text-slate-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </div>
                <p className="text-lg text-slate-500 font-medium">Không gian làm việc: Sơ đồ hệ thống</p>
                <p className="text-sm text-slate-400 mt-1">Giao diện vẽ sơ đồ mạng lưới sẽ được xây dựng tại đây...</p>
              </div>
            )}
          </div>
        )}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col h-full bg-[#f8f9fa]">
            <Toolbar
              sourceFlow={sourceFlow}
              setSourceFlow={setSourceFlow}
              reinforcementFactor={reinforcementFactor}
              setReinforcementFactor={setReinforcementFactor}
              permeabilityLevel={permeabilityLevel}
              setPermeabilityLevel={setPermeabilityLevel}
              permeabilityMainOptions={permeabilityMainOptions}
              applyToAll={applyToAll}
              setApplyToAll={setApplyToAll}
              onClearSegments={() => setSegmentPermeabilities({})}
            />
            
            {(() => {
              const { cropNames, processedBranches, sortedBranches, flowNodes } = flowNodesData;

              return (
                <div className="flex-1 flex overflow-hidden p-2 gap-2">
                  <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                      <span className="font-semibold text-sm uppercase text-slate-700">Lưu lượng yêu cầu đầu các kênh nhánh</span>
                    </div>
                    <div className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-0 overflow-hidden">
                      <FullWidthTable
                        nestedHead={
                          <>
                            <tr className="uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 bg-[#fafafa]">
                              <th rowSpan={2} className="px-4 py-2 align-middle text-center w-12">STT</th>
                              <th rowSpan={2} className="px-4 py-2 align-middle">Tên kênh</th>
                              <th rowSpan={2} className="px-4 py-2 align-middle">Lý trình</th>
                              <th colSpan={cropNames.length} className="px-4 py-1.5 align-middle text-center border-b border-slate-200 bg-[#fafafa]">Diện tích tưới <span className="normal-case text-[10px] text-slate-500">(ha)</span></th>
                              <th rowSpan={2} className="px-4 py-2 align-middle text-center">Hệ số<br/>lợi dụng</th>
                              <th rowSpan={2} className="px-4 py-2 align-middle text-center">Lưu lượng<br/><span className="normal-case text-[10px] text-slate-500">(m³/s)</span></th>
                              <th rowSpan={2} className="px-4 py-2 align-middle text-center">Mực nước yêu cầu<br/><span className="normal-case text-[10px] text-slate-500">(m)</span></th>
                            </tr>
                            <tr className="uppercase text-[11px] tracking-wider font-bold bg-[#fafafa]">
                              {cropNames.map((name: string, idx: number) => (
                                <th key={idx} className="px-4 py-1.5 text-center">{name}</th>
                              ))}
                            </tr>
                          </>
                        }
                      >
                        {sortedBranches && sortedBranches.length > 0 ? (
                          sortedBranches.map((branch: any, idx: number) => (
                            <tr key={branch.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-[13px]">
                              <td className="px-4 py-2 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-2 text-slate-700 font-medium">{branch.name || `Kênh nhánh ${idx + 1}`}</td>
                              <td className="px-4 py-2 text-slate-700">{formatNum(branch.chainage)}</td>
                              {cropNames.map((c: string, i: number) => (
                                <td key={i} className="px-4 py-2 text-center text-slate-700">
                                  {c.toLowerCase().includes('lúa') ? (branch.riceArea > 0 ? formatNum(branch.riceArea) : '-') : (branch.fruitArea > 0 ? formatNum(branch.fruitArea) : '-')}
                                </td>
                              ))}
                              <td className="px-4 py-2 text-center text-slate-700">
                                {branch.efficiency > 0 ? formatNum(branch.efficiency, 3) : '-'}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold text-blue-600">
                                {branch.totalFlow > 0 ? formatNum(branch.totalFlow, 3) : '-'}
                              </td>
                              <td className="px-4 py-2 text-center font-medium text-slate-700">{branch.reqWaterLevel > 0 ? formatNum(branch.reqWaterLevel) : '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6 + cropNames.length} className="px-4 py-6 text-center text-slate-400 italic">
                              Chưa có dữ liệu tính toán
                            </td>
                          </tr>
                        )}
                      </FullWidthTable>
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                      <span className="font-semibold text-sm uppercase text-slate-700">Phân bố lưu lượng trên kênh chính</span>
                    </div>
                    <div className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-0 overflow-hidden">
                      <FullWidthTable
                        nestedHead={
                          <>
                            <tr className="uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 bg-[#fafafa]">
                              <th rowSpan={2} className="px-4 py-2 align-middle text-center w-12">STT</th>
                              <th rowSpan={2} className="px-4 py-2 align-middle">Công trình</th>
                              <th rowSpan={2} className="px-4 py-2 align-middle">Lý trình</th>
                              <th rowSpan={2} className="px-2 py-2 align-middle text-center w-[100px]">Độ thấm</th>
                              <th colSpan={3} className="px-4 py-1.5 align-middle text-center border-b border-slate-200 bg-[#fafafa]">Lưu lượng <span className="normal-case text-[10px] text-slate-500">(m³/s)</span></th>
                            </tr>
                            <tr className="uppercase text-[11px] tracking-wider font-bold bg-[#fafafa]">
                              <th className="px-4 py-1.5 text-center">Kênh nhánh</th>
                              <th className="px-4 py-1.5 text-center">Tổn thất</th>
                              <th className="px-4 py-1.5 text-center">Kênh chính</th>
                            </tr>
                          </>
                        }
                      >
                        <tr className="hover:bg-slate-50 border-b border-slate-100 text-[13px]">
                          <td className="px-4 py-2 text-center text-slate-500">1</td>
                          <td className="px-4 py-2 font-medium text-slate-700">Đầu kênh</td>
                          <td className="px-4 py-2 text-slate-700">{formatNum(0, 2)}</td>
                          <td className="px-2 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center font-bold text-slate-800 bg-blue-50/50">{formatNum(flowNodes.find((n: any) => n.type === 'dau')?.q_truoc, 3)}</td>
                        </tr>
                        {sortedBranches.map((branch: any, idx: number) => (
                          <React.Fragment key={branch.id}>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                              <td colSpan={3} className="h-6 border-r border-slate-100/50"></td>
                              <td className="px-1 py-1 text-center text-xs font-medium text-slate-500">
                                <select 
                                  className="w-full pl-1 pr-5 py-0.5 border-none outline-none focus:ring-0 bg-transparent text-slate-500 font-medium cursor-pointer"
                                  value={segmentPermeabilities[branch.id] || permeabilityLevel}
                                  onChange={(e) => {
                                    setSegmentPermeabilities(prev => ({ ...prev, [branch.id]: e.target.value }));
                                    if (applyToAll) setApplyToAll(false);
                                  }}
                                >
                                  {permeabilityMainOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1 text-center text-slate-400">-</td>
                              <td className="px-4 py-1 text-center text-[13px] font-medium text-slate-700">
                                {idx === 0 
                                  ? formatNum(flowNodes.find((n: any) => n.type === 'dau')?.loss, 3) 
                                  : formatNum(flowNodes.find((n: any) => n.id === sortedBranches[idx - 1].id)?.loss, 3)}
                              </td>
                              <td className="border-l border-slate-100/50"></td>
                            </tr>
                            <tr className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-[13px]">
                              <td className="px-4 py-2 text-center text-slate-500">{idx + 2}</td>
                              <td className="px-4 py-2 font-medium text-slate-700">{branch.name || `Kênh nhánh ${idx + 1}`}</td>
                              <td className="px-4 py-2 text-slate-700">{formatNum(branch.chainage)}</td>
                              <td className="px-2 py-2 text-center text-slate-400">-</td>
                              <td className="px-4 py-2 text-center font-medium text-blue-600">{branch.totalFlow > 0 ? formatNum(branch.totalFlow, 3) : '-'}</td>
                              <td className="px-4 py-2 text-center text-slate-400">-</td>
                              <td className="px-4 py-2 text-center font-medium text-slate-700 bg-slate-50/30">{formatNum(flowNodes.find((n: any) => n.id === branch.id)?.q_truoc, 3)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <td colSpan={3} className="h-6 border-r border-slate-100/50"></td>
                          <td className="px-1 py-1 text-center text-xs font-medium text-slate-500">
                            <select 
                              className="w-full pl-1 pr-5 py-0.5 border-none outline-none focus:ring-0 bg-transparent text-slate-500 font-medium cursor-pointer"
                              value={segmentPermeabilities['cuoi'] || permeabilityLevel}
                              onChange={(e) => {
                                setSegmentPermeabilities(prev => ({ ...prev, cuoi: e.target.value }));
                                if (applyToAll) setApplyToAll(false);
                              }}
                            >
                              {permeabilityMainOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-1 text-center text-slate-400">-</td>
                          <td className="px-4 py-1 text-center text-[13px] font-medium text-slate-700">
                            {sortedBranches.length > 0 
                               ? formatNum(flowNodes.find((n: any) => n.id === sortedBranches[sortedBranches.length - 1].id)?.loss, 3)
                               : formatNum(flowNodes.find((n: any) => n.type === 'dau')?.loss, 3)}
                          </td>
                          <td className="border-l border-slate-100/50"></td>
                        </tr>
                        <tr className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-[13px]">
                          <td className="px-4 py-2 text-center text-slate-500">{sortedBranches.length + 2}</td>
                          <td className="px-4 py-2 font-medium text-slate-700">Cuối kênh</td>
                          <td className="px-4 py-2 text-slate-700">{formatNum(flowNodesData.flowNodes.find((n: any) => n.type === 'cuoi')?.chainage || 0, 2)}</td>
                          <td className="px-2 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center text-slate-400">-</td>
                          <td className="px-4 py-2 text-center font-bold text-slate-800 bg-blue-50/50">{formatNum(flowNodes.find((n: any) => n.type === 'cuoi')?.q_truoc, 3)}</td>
                        </tr>
                      </FullWidthTable>
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>
          )}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col h-full bg-[#f8f9fa]">
            <Toolbar>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium text-[11px]">Tự động phân đoạn</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={autoSegment} onChange={() => {
                    const nextVal = !autoSegment;
                    setAutoSegment(nextVal);
                    if (nextVal) {
                      setIsPropertiesExpanded(false);
                    }
                  }} />
                  <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5px] after:left-[1.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <div className="h-4 w-px bg-slate-300 mx-2"></div>
                <span className={`text-slate-600 font-medium text-[11px] ${!autoSegment ? 'opacity-50' : ''}`}>Chênh lệch lưu lượng các đoạn</span>
                <div className="relative flex items-center">
                  <input type="text" value={flowDifference} onChange={e => setFlowDifference(e.target.value)} disabled={!autoSegment} className="w-16 text-[11px] pl-2 pr-5 py-1 outline-none text-slate-700 bg-white border border-slate-300 rounded disabled:bg-slate-50 disabled:text-slate-400" />
                  <span className={`absolute right-2 text-[11px] text-slate-500 ${!autoSegment ? 'opacity-50' : ''}`}>%</span>
                </div>
                <button
                  disabled={!autoSegment}
                  onClick={handleAutoSegmentCalculator}
                  className={`p-1 flex items-center justify-center rounded border transition-colors ${
                    autoSegment 
                      ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Tự động phân đoạn"
                >
                  <Calculator size={14} />
                </button>
              </div>
            </Toolbar>
            <div className="flex-1 flex overflow-hidden p-2 gap-2 bg-[#f8f9fa] relative">
              <div className="w-4/12 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                  <span className="font-semibold text-sm uppercase text-slate-700">Lưu lượng trên kênh chính</span>
                </div>
                <div className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-0 overflow-y-auto">
                  <FullWidthTable
                    head={
                      <>
                        <th className="px-4 py-2 align-middle text-left font-bold text-slate-600">Vị trí</th>
                        <th className="px-4 py-2 align-middle text-left font-bold text-slate-600">Công trình</th>
                        <th className="px-4 py-2 align-middle text-right font-bold text-slate-600">Lý trình</th>
                        <th className="px-4 py-2 align-middle text-right font-bold text-slate-600">Lưu lượng<br/><span className="normal-case text-[10px] text-slate-500">(m³/s)</span></th>
                      </>
                    }
                  >
                    {flowNodesData.flowNodes.length > 0 ? (
                      flowNodesData.flowNodes.map((node: any, index: number) => {
                        let viTri = formatChainageToK(node.chainage || 0);
                        let congTrinh = '';
                        if (node.type === 'dau') {
                          congTrinh = 'Đầu kênh';
                        } else if (node.type === 'cuoi') {
                          congTrinh = 'Cuối kênh';
                        } else if (node.type === 'inline_structure' || node.type === 'inline_structure_start' || node.type === 'inline_structure_end') {
                          congTrinh = node.name || 'Công trình';
                        } else {
                          const branchIdx = flowNodesData.sortedBranches.findIndex((b: any) => b.id === node.id);
                          congTrinh = node.name || `Kênh nhánh ${branchIdx + 1}`;
                        }

                        const isFirstRow = index === 0;
                        const isSelected = segmentBreakpoints.includes(node.id);

                        return (
                          <tr 
                            key={`${node.id}-${index}`} 
                            className={`border-b border-slate-100 last:border-b-0 text-[13px] transition-colors
                              ${isFirstRow ? 'opacity-80 cursor-not-allowed bg-slate-50/50' : 'cursor-pointer hover:bg-blue-50/50'}
                              ${isSelected ? 'bg-blue-100/50' : ''}
                            `}
                            onClick={() => {
                              if (!isFirstRow) {
                                setSegmentBreakpoints(prev => {
                                  if (prev.includes(node.id)) {
                                    return prev.filter(id => id !== node.id);
                                  }
                                  return [...prev, node.id];
                                });
                              }
                            }}
                          >
                            <td className="px-4 py-2 text-slate-700">{viTri}</td>
                            <td className="px-4 py-2 font-medium text-slate-700">{congTrinh}</td>
                            <td className="px-4 py-2 text-right text-slate-700">{formatNum(node.chainage)}</td>
                            <td className="px-4 py-2 text-right font-medium text-blue-600">
                              {formatNum(node.q_sau, 3)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </FullWidthTable>
                </div>
              </div>
              
              {/* Right Column (8/12) */}
              <div className="w-8/12 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="px-4 py-2 pr-12 border-b border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
                  <span className="font-semibold text-sm uppercase text-slate-700">Các loại mặt cắt ngang áp dụng</span>
                  <button 
                    onClick={() => setSegmentBreakpoints([])}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Khôi phục mặc định"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6 pt-0 overflow-hidden">
                  <FullWidthTable
                    head={
                      <>
                        <th className="px-4 py-2 align-middle text-center font-bold text-slate-600 w-40">Đoạn</th>
                        <th className="px-4 py-2 align-middle text-center font-bold text-slate-600">Trường hợp</th>
                        <th className="px-4 py-2 align-middle text-center font-bold text-slate-600">Lưu lượng<br/><span className="normal-case text-[10px] text-slate-500">(m³/s)</span></th>
                        <th className="px-4 py-2 align-middle text-center font-bold text-slate-600">Cột nước<br/><span className="normal-case text-[10px] text-slate-500">(m)</span></th>
                        <th className="px-4 py-2 align-middle text-center font-bold text-slate-600">Vận tốc<br/><span className="normal-case text-[10px] text-slate-500">(m/s)</span></th>
                      </>
                    }
                  >
                    {(() => {
                      if (flowNodesData.flowNodes.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        );
                      }

                      const segments = computedSegments;

                      return segments.map((seg, segIdx) => {
                        const startNode = flowNodesData.flowNodes[seg.startIdx];
                        const endNode = seg.endIdx !== null ? flowNodesData.flowNodes[seg.endIdx] : null;

                        const startKText = formatChainageToK(startNode.chainage);
                        const endKText = endNode ? formatChainageToK(endNode.chainage) : 'K...';
                        const length = endNode ? (endNode.chainage - startNode.chainage) : null;
                        const lengthText = length !== null ? formatNum(length) : 'xx';
                        const thietKeFlowText = formatNum(startNode.q_sau, 3);
                        
                        const kMax = getKMaxCoefficient(startNode.q_sau);
                        const lonNhatFlowText = formatNum(startNode.q_sau * kMax, 3);

                        const res = segmentHydraulicResults[segIdx];

                        return (
                          <React.Fragment key={segIdx}>
                            {['Lớn nhất', 'Thiết kế', 'Nhỏ nhất'].map((truongHop, rowIdx) => {
                              const flowText = truongHop === 'Thiết kế' ? thietKeFlowText : truongHop === 'Lớn nhất' ? lonNhatFlowText : formatNum(startNode.q_sau * (parseFloat(kminCoef) || 0.8), 3);
                              let hText = '-';
                              let vText = '-';
                              if (res) {
                                if (truongHop === 'Thiết kế') { hText = res.h_des; vText = res.v_des; }
                                else if (truongHop === 'Lớn nhất') { hText = res.h_max; vText = res.v_max; }
                                else if (truongHop === 'Nhỏ nhất') { hText = res.h_min; vText = res.v_min; }
                              }
                              return (
                                <tr id={rowIdx === 0 ? `segment-row-${segIdx}` : undefined} key={rowIdx} className={`hover:bg-slate-50 border-b ${rowIdx === 2 ? 'border-slate-200' : 'border-slate-100'} text-[13px]`}>
                                  {rowIdx === 0 && (
                                    <td 
                                      rowSpan={3} 
                                      className="px-4 py-1.5 align-middle text-center bg-slate-50/50 border-r border-slate-100 relative cursor-help"
                                      onMouseEnter={(e) => {
                                        if (res) {
                                          setHoverTooltip({ x: e.clientX, y: e.clientY, data: res, segIdx: segIdx + 1 });
                                        }
                                      }}
                                      onMouseMove={(e) => {
                                        if (res) {
                                          setHoverTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                                        }
                                      }}
                                      onMouseLeave={() => setHoverTooltip(null)}
                                    >
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <span className="font-bold text-slate-700 uppercase text-[13px] flex items-center justify-center">
                                          {segIdx === selectedSegmentIdx && (
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block mr-1.5" />
                                          )}
                                          Đoạn {segIdx + 1}
                                        </span>
                                        <span className="text-[10.5px] text-slate-500 font-normal normal-case">Từ {startKText} đến {endKText} | Chiều dài {lengthText} m</span>
                                        {res && (
                                          <div className="mt-2 text-[10.5px] text-slate-500 border-t border-slate-200 pt-2 w-full text-left flex flex-col gap-1 px-1">
                                            <div className="flex justify-between items-center whitespace-nowrap gap-2">
                                              <span>Độ dốc đáy: <strong className="text-slate-700">{res.i}</strong></span>
                                              <span className="text-slate-300">|</span>
                                              <span>Hệ số nhám: <strong className="text-slate-700">{res.n}</strong></span>
                                              <span className="text-slate-300">|</span>
                                              <span>Hệ số mái: <strong className="text-slate-700">{res.m}</strong></span>
                                              <span className="text-slate-300">|</span>
                                              <span>Độ cao an toàn: <strong className="text-slate-700">{res.safeHeight}m</strong></span>
                                            </div>
                                            <div className="flex justify-between items-center whitespace-nowrap gap-2">
                                              <span>Bề rộng đáy: <strong className="text-slate-700">{res.b_out}m</strong></span>
                                              <span className="text-slate-300">|</span>
                                              <span>Chiều cao kênh: <strong className="text-slate-700">{res.H}m</strong></span>
                                              <span className="text-slate-300">|</span>
                                              <span>Loại mặt cắt: <strong className="text-slate-700">{res.crossSectionType === 'gia_co' ? 'Gia cố' : 'Không gia cố'}</strong></span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-4 py-1.5 text-center font-medium text-slate-600">{truongHop}</td>
                                  <td className="px-4 py-1.5 text-center font-medium text-blue-600">
                                    {flowText}
                                  </td>
                                  <td className="px-4 py-1.5 text-center text-slate-700">{hText}</td>
                                  <td className="px-4 py-1.5 text-center text-slate-700">{vText}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </FullWidthTable>
                </div>
              </div>

              {hoverTooltip && hoverTooltip.data && (() => {
                const { b_out, H, m, h_des, safeHeight, crossSectionType } = hoverTooltip.data;
                const bVal = parseFloat(b_out) || 0;
                const hVal = parseFloat(h_des) || 0;
                const mVal = parseFloat(m) || 0;
                const HVal = parseFloat(H) || 0;

                const topWidth = bVal + 2 * mVal * HVal;
                
                const svgW = 320;
                const svgH = 180;
                const marginX = 60; // Increased margins for text labels
                const marginY = 40;

                const maxDrawW = svgW - marginX * 2;
                const maxDrawH = svgH - marginY * 2;

                let scale = 1;
                if (topWidth > 0 && HVal > 0) {
                  scale = Math.min(maxDrawW / topWidth, maxDrawH / HVal);
                }

                const dx = mVal * HVal * scale;
                const dwTop = topWidth * scale;
                const dwBot = bVal * scale;
                const dh = HVal * scale;
                
                const dWaterH = hVal * scale;
                const dWaterDx = mVal * hVal * scale;

                // Center drawing horizontally
                const startX = (svgW - dwTop) / 2;

                const x1 = startX;
                const y1 = marginY;
                const x2 = startX + dwTop;
                const y2 = marginY;
                const x3 = x2 - dx;
                const y3 = marginY + dh;
                const x4 = x1 + dx;
                const y4 = y3;

                const wx1 = x4 - dWaterDx;
                const wy1 = y3 - dWaterH;
                const wx2 = x3 + dWaterDx;
                const wy2 = wy1;

                let tooltipLeft = hoverTooltip.x + 20;
                let tooltipTop = hoverTooltip.y + 20;
                const tooltipBoxW = 360;
                const tooltipBoxH = 280;
                if (typeof window !== 'undefined') {
                  if (tooltipLeft + tooltipBoxW > window.innerWidth) {
                    tooltipLeft = hoverTooltip.x - tooltipBoxW - 10;
                  }
                  if (tooltipTop + tooltipBoxH > window.innerHeight) {
                    tooltipTop = hoverTooltip.y - tooltipBoxH - 10;
                  }
                }

                return (
                  <div 
                    className="fixed z-[9999] pointer-events-none bg-white p-4 rounded-xl shadow-2xl border border-slate-200 flex flex-col items-center backdrop-blur-md bg-white/95"
                    style={{ left: tooltipLeft, top: tooltipTop }}
                  >
                    <div className="flex items-center gap-2 mb-3 w-full border-b border-slate-100 pb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                      <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">Mặt cắt ngang đoạn {hoverTooltip.segIdx}</div>
                    </div>
                    <svg width={svgW} height={svgH} className="bg-slate-50/50 rounded-lg border border-slate-200/60 overflow-visible">
                      {/* Ground extension lines */}
                      <polyline 
                        points={`0,${y1} ${x1},${y1}`}
                        fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2"
                      />
                      <polyline 
                        points={`${x2},${y2} ${svgW},${y2}`}
                        fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2"
                      />
                      
                      {/* Ground channel line */}
                      <polyline 
                        points={`${x1},${y1} ${x4},${y4} ${x3},${y3} ${x2},${y2}`}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={crossSectionType === 'gia_co' ? "3.5" : "2"}
                        strokeLinejoin="round"
                      />
                      
                      {/* Water polygon */}
                      {hVal > 0 && (
                        <polygon 
                          points={`${wx1},${wy1} ${wx2},${wy2} ${x3},${y3} ${x4},${y4}`}
                          fill="#3b82f6"
                          fillOpacity="0.25"
                          stroke="#2563eb"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Water level line */}
                      {hVal > 0 && (
                        <line x1={wx1 - 10} y1={wy1} x2={wx2 + 10} y2={wy1} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" />
                      )}
                      
                      {/* Water level symbol */}
                      {hVal > 0 && (
                        <path d={`M${wx1 - 8},${wy1} L${wx1 - 14},${wy1 - 7} L${wx1 - 2},${wy1 - 7} Z`} fill="#2563eb" />
                      )}

                      {/* Dimensions - b */}
                      <line x1={x4} y1={y4 + 14} x2={x3} y2={y3 + 14} stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1={x4} y1={y4} x2={x4} y2={y4 + 18} stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1={x3} y1={y3} x2={x3} y2={y3 + 18} stroke="#94a3b8" strokeWidth="1.5" />
                      <text x={x4 + (x3 - x4)/2} y={y4 + 28} fontSize="12" fontWeight="700" fill="#475569" textAnchor="middle">b = {b_out}m</text>

                      {/* Dimensions - H (Vertical) */}
                      <line x1={x2 + 20} y1={y2} x2={x2 + 20} y2={y3} stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1={x2} y1={y2} x2={x2 + 24} y2={y2} stroke="#94a3b8" strokeWidth="1.5" />
                      <line x1={x3} y1={y3} x2={x2 + 24} y2={y3} stroke="#94a3b8" strokeWidth="1.5" />
                      <text x={x2 + 28} y={y2 + dh/2 + 4} fontSize="12" fontWeight="700" fill="#475569" textAnchor="start">H = {H}m</text>

                      {/* Dimensions - h (Water depth, Vertical) */}
                      {hVal > 0 && (
                        <>
                          <line x1={wx1 - 20} y1={wy1} x2={wx1 - 20} y2={y4} stroke="#3b82f6" strokeWidth="1.5" />
                          <line x1={wx1 - 24} y1={wy1} x2={wx1} y2={wy1} stroke="#3b82f6" strokeWidth="1.5" />
                          <line x1={wx1 - 24} y1={y4} x2={x4} y2={y4} stroke="#3b82f6" strokeWidth="1.5" />
                          <text x={wx1 - 28} y={wy1 + (y4 - wy1)/2 + 4} fontSize="12" fontWeight="700" fill="#2563eb" textAnchor="end">h = {h_des}m</text>
                        </>
                      )}
                    </svg>
                    <div className="w-full mt-3 flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-[3px] border ${crossSectionType === 'gia_co' ? 'bg-slate-500 border-slate-600' : 'bg-[#e2e8f0] border-slate-300'}`}></span>
                        Loại: {crossSectionType === 'gia_co' ? 'Gia cố' : 'Kênh đất'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">|</span>
                        Hệ số mái <strong className="text-slate-800">m = {m}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
        {/* Properties Panel for Step 3 */}
        {currentStep === 3 && (
          <PropertiesPanel
            isExpanded={isPropertiesExpanded}
            onToggle={setIsPropertiesExpanded}
            collapsedTitle="Thuộc tính phân đoạn"
            width="w-[320px]"
            topBar={
              <>
                <span className="flex-1 text-[11px] font-bold px-2 py-1 text-slate-700">Thuộc tính phân đoạn</span>
                <button 
                  className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-blue-600" 
                  title="Tính toán"
                  onClick={handleCalculateHydraulics}
                >
                  <Calculator size={14} />
                </button>
                <button 
                  className="p-1 border-y border-r border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-emerald-600" 
                  title="Cập nhật"
                  onClick={() => toast('Tính năng chưa được cập nhật')}
                >
                  <Save size={14} />
                </button>
                <button 
                  className="p-1 border-y border-r border-slate-400 bg-white flex items-center justify-center text-rose-600 mr-1 disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Xóa"
                  onClick={() => toast('Tính năng chưa được cập nhật')}
                  disabled={true}
                >
                  <Trash2 size={14} />
                </button>
              </>
            }
          >
            <PropertyGroup title="Thông số cơ bản" defaultExpanded={true}>
              <PropertyRow label="Tên phân đoạn">
                {computedSegments.length > 0 ? (
                  <select
                    className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 bg-white border border-slate-200 rounded"
                    value={selectedSegmentIdx}
                    onChange={(e) => setSelectedSegmentIdx(Number(e.target.value))}
                  >
                    {computedSegments.map((seg, idx) => {
                      const startNode = flowNodesData.flowNodes[seg.startIdx];
                      const endNode = seg.endIdx !== null ? flowNodesData.flowNodes[seg.endIdx] : null;
                      const startKText = formatChainageToK(startNode?.chainage || 0);
                      const endKText = endNode ? formatChainageToK(endNode.chainage) : 'K...';
                      return (
                        <option key={idx} value={idx}>
                          Đoạn {idx + 1} ({startKText} - {endKText})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input type="text" className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" placeholder="Chưa có dữ liệu" disabled />
                )}
              </PropertyRow>
              <PropertyRow label="Phương pháp tính">
                <div className="flex w-full items-center gap-3 px-2 py-1 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1 cursor-not-allowed text-slate-400">
                    <input type="radio" name="calcMethod" value="thu_cong" checked={calcMethod === 'thu_cong'} onChange={(e) => setCalcMethod(e.target.value as any)} disabled={true} className="w-3 h-3 text-blue-600 focus:ring-0 disabled:opacity-50 cursor-not-allowed" />
                    Thủ công
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="calcMethod" value="tu_dong" checked={calcMethod === 'tu_dong'} onChange={(e) => setCalcMethod(e.target.value as any)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Tự động
                  </label>
                </div>
              </PropertyRow>
              <PropertyRow label="Bài toán">
                <select 
                  className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 bg-white"
                  value={calcProblem}
                  onChange={(e) => setCalcProblem(e.target.value as any)}
                >
                  <option value="cot_nuoc">Tính cột nước</option>
                  <option value="be_rong_day">Tính bề rộng đáy</option>
                  <option value="cot_nuoc_be_rong_day">Tính cột nước và bề rộng đáy</option>
                </select>
              </PropertyRow>
              <PropertyRow label="Loại mặt cắt">
                <div className="flex w-full items-center gap-3 px-2 py-1 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="crossSectionType" value="gia_co" checked={crossSectionType === 'gia_co'} onChange={(e) => setCrossSectionType(e.target.value as any)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Gia cố
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="crossSectionType" value="khong_gia_co" checked={crossSectionType === 'khong_gia_co'} onChange={(e) => setCrossSectionType(e.target.value as any)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Không gia cố
                  </label>
                </div>
              </PropertyRow>
              <PropertyRow label="Hệ số Kmin">
                <input type="text" value={kminCoef} onChange={e => setKminCoef(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 bg-white" />
              </PropertyRow>
            </PropertyGroup>
            <PropertyGroup title="Thông số thủy lực" defaultExpanded={true}>
              <PropertyRow label="Độ dốc đáy kênh">
                <div className="flex w-full">
                  <input type="text" value={bottomSlope} onChange={e => setBottomSlope(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
                  <button className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors shrink-0" title="Chọn giá trị" onClick={() => toast('Tính năng chưa cập nhật')}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </PropertyRow>
              <PropertyRow label="Hệ số mái kênh (m)">
                <div className="flex w-full">
                  <input type="text" value={sideSlope} onChange={e => setSideSlope(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
                  <button className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors shrink-0" title="Chọn giá trị" onClick={() => toast('Tính năng chưa cập nhật')}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </PropertyRow>
              <PropertyRow label="Hệ số nhám lòng kênh">
                <div className="flex w-full relative">
                  <input type="text" value={roughnessCoef} onChange={e => setRoughnessCoef(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
                  <button 
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors shrink-0" 
                    title="Chọn giá trị" 
                    onClick={() => setShowRoughnessDropdown(!showRoughnessDropdown)}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {showRoughnessDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRoughnessDropdown(false)}></div>
                      <div className="absolute right-0 top-full mt-1 w-[260px] max-h-[350px] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-md z-50 text-[11px] text-slate-700 custom-scrollbar">
                        {crossSectionType === 'khong_gia_co' && (
                          <>
                            <div className="px-3 py-1.5 bg-slate-200 font-bold border-b border-slate-300 sticky top-0 shadow-sm">Kênh đất</div>
                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Q &gt; 25 m³/s</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0200'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Đất dính, cát</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0200</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0225'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Đất lẫn sỏi cuội</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0225</span>
                        </div>
                        
                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">0.1 ≤ Q ≤ 25 m³/s</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0225'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Đất dính, cát</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0225</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0250'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Đất lẫn sỏi cuội</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0250</span>
                        </div>

                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Khác</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0250'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Q &lt; 1 m³/s</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0250</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-200" onClick={() => { setRoughnessCoef('0.0275'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Kênh sử dụng định kỳ</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0275</span>
                        </div>

                        <div className="px-3 py-1.5 bg-slate-200 font-bold border-y border-slate-300 sticky top-0 shadow-sm mt-2">Kênh đào trong đá</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.020 - 0.025'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Mặt được sửa sang tốt</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.020 - 0.025</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.030 - 0.035'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Sửa sang vừa, không lồi lõm</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.030 - 0.035</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-200" onClick={() => { setRoughnessCoef('0.040 - 0.045'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Sửa sang vừa, có lồi lõm</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.040 - 0.045</span>
                        </div>
                          </>
                        )}

                        {crossSectionType === 'gia_co' && (
                          <>
                            <div className="px-3 py-1.5 bg-slate-200 font-bold border-b border-slate-300 sticky top-0 shadow-sm">Kênh gia cố</div>
                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Tráng vữa xi măng</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0120'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Nhẵn</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0120</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0140'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Không nhẵn</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0140</span>
                        </div>

                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Mặt bằng bê tông</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0150'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Dùng ván khuôn gỗ</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0150</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0170'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Mặt nhám</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0170</span>
                        </div>

                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Mặt phun vữa xi măng</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0150'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Đã sửa chữa bằng phẳng</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0150</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0180'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Chưa sửa</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0180</span>
                        </div>

                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Cầu máng bằng gỗ</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0120'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Gỗ bào nhẵn</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0120</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0130'); setShowRoughnessDropdown(false); }}>
                          <span className="pl-2 leading-tight">- Gỗ bào chưa nhẵn</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0130</span>
                        </div>

                        <div className="px-3 py-1 bg-slate-50 font-semibold border-y border-slate-100 text-blue-600">Khác</div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0225'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Mặt lát bằng đá tròn cạnh</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0225</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0150'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Mặt xây lát bằng đá đã gia công</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0150</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0130'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Mặt xây lát bằng gạch</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0130</span>
                        </div>
                        <div className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setRoughnessCoef('0.0110 - 0.0120'); setShowRoughnessDropdown(false); }}>
                          <span className="leading-tight">Mặt xây đá hộc trát vữa XM</span><span className="font-bold text-slate-700 shrink-0 ml-2">0.0110 - 0.0120</span>
                        </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </PropertyRow>
              {calcMethod === 'tu_dong' && (
                <PropertyRow label="Tỷ số Bh">
                  <div className="flex w-full">
                    <input type="text" value={bhRatio} onChange={e => setBhRatio(e.target.value)} disabled={calcProblem !== 'cot_nuoc_be_rong_day'} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
                    <button className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors shrink-0" title="Chọn giá trị" onClick={() => toast('Tính năng chưa cập nhật')}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </PropertyRow>
              )}
              <PropertyRow label={<span>Lưu lượng thiết kế <span className="normal-case text-[10px] text-slate-500">(m³/s)</span></span>}>
                <input type="text" value={designFlow} onChange={e => setDesignFlow(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
              </PropertyRow>
              <PropertyRow label={<span>Bề rộng đáy kênh <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={channelWidth} onChange={e => setChannelWidth(e.target.value)} disabled={calcProblem !== 'cot_nuoc'} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Độ cao an toàn <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={safeHeight} onChange={e => setSafeHeight(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
              </PropertyRow>
              <PropertyRow label={<span>Chiều cao kênh <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={channelHeight} onChange={e => setChannelHeight(e.target.value)} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700" />
              </PropertyRow>
            </PropertyGroup>
            <PropertyGroup title="Điều kiện thuỷ lực" defaultExpanded={true}>
              <PropertyRow label={<span>Cột nước lớn nhất <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={maxWaterLevel} onChange={e => setMaxWaterLevel(e.target.value)} disabled={true} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Cột nước thiết kế <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={designWaterLevel} onChange={e => setDesignWaterLevel(e.target.value)} disabled={calcProblem !== 'be_rong_day'} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Cột nước nhỏ nhất <span className="normal-case text-[10px] text-slate-500">(m)</span></span>}>
                <input type="text" value={minWaterLevel} onChange={e => setMinWaterLevel(e.target.value)} disabled={true} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Lưu tốc lớn nhất <span className="normal-case text-[10px] text-slate-500">(m/s)</span></span>}>
                <input type="text" value={maxVelocity} onChange={e => setMaxVelocity(e.target.value)} disabled={true} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Lưu tốc thiết kế <span className="normal-case text-[10px] text-slate-500">(m/s)</span></span>}>
                <input type="text" value={designVelocity} onChange={e => setDesignVelocity(e.target.value)} disabled={true} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
              <PropertyRow label={<span>Lưu tốc nhỏ nhất <span className="normal-case text-[10px] text-slate-500">(m/s)</span></span>}>
                <input type="text" value={minVelocity} onChange={e => setMinVelocity(e.target.value)} disabled={true} className="w-full text-[11px] px-2 py-1 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" />
              </PropertyRow>
            </PropertyGroup>
          </PropertiesPanel>
        )}
            </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
            <Toolbar>
              <div className="flex-1 flex items-center justify-between px-2 w-full">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-medium text-slate-700">Cao độ khống chế:</span>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="controlElevation" 
                        value="day" 
                        checked={controlElevationType === 'day'}
                        onChange={() => setControlElevationType('day')}
                        className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">Đáy đầu kênh</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="controlElevation" 
                        value="muc_nuoc" 
                        checked={controlElevationType === 'muc_nuoc'}
                        onChange={() => setControlElevationType('muc_nuoc')}
                        className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">Mực nước đầu kênh</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nhập giá trị"
                        value={controlElevationValue}
                        onChange={(e) => setControlElevationValue(e.target.value)}
                        className="w-32 pl-2.5 pr-6 py-1 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-500 pointer-events-none">m</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-2">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={maintainWaterLevel}
                          onChange={(e) => setMaintainWaterLevel(e.target.checked)}
                        />
                        <div className={`block w-7 h-4 rounded-full transition-colors ${maintainWaterLevel ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${maintainWaterLevel ? 'transform translate-x-3' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-[13px] font-medium text-slate-700">Duy trì đường mức nước</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <Button onClick={() => setIsTerrainDataOpen(true)} variant="secondary" size="sm" className="h-[28px] px-3 gap-1.5 text-[13px] font-medium border-slate-200">
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    Dữ liệu địa hình
                  </Button>
                </div>
              </div>
            </Toolbar>
            <div className="flex-1 flex overflow-hidden px-4 sm:px-6 pt-0 pb-16 bg-white relative">
              <FullWidthTable
                nestedHead={
                  <>
                    <tr className="uppercase text-[10px] tracking-wider font-bold text-center border-b border-slate-200">
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-[#fafafa] align-middle">Tên cọc</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-[#fafafa] align-middle">Công trình</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-[#fafafa] align-middle">Lý trình</th>
                      <th colSpan={2} className="px-3 py-2 border-r border-slate-200 border-b border-slate-200 bg-[#fafafa]">Tổn thất (m)</th>
                      <th colSpan={3} className="px-3 py-2 border-r border-slate-200 border-b border-slate-200 bg-[#fafafa]">Cột nước (m)</th>
                      <th colSpan={5} className="px-3 py-2 border-r border-slate-200 border-b border-slate-200 bg-[#fafafa]">Cao độ</th>
                      <th rowSpan={2} className="px-3 py-2 bg-[#fafafa] align-middle min-w-[120px]">Ghi chú</th>
                    </tr>
                    <tr className="uppercase text-[10px] tracking-wider font-bold text-center">
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Ma sát</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Cục bộ</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Lớn nhất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Thiết kế</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Nhỏ nhất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Mặt đất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Đáy kênh</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Htk</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Đỉnh kênh</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Yêu cầu</th>
                    </tr>
                  </>
                }
              >
                {computedSegments.length > 0 ? (
                  computedSegments.map((seg, segIdx) => {
                    const res = segmentHydraulicResults[segIdx];
                    const isDesigned = res !== undefined;
                    const startNode = flowNodesData.flowNodes[seg.startIdx];
                    const endNodeIdx = seg.endIdx !== null && seg.endIdx < flowNodesData.flowNodes.length ? seg.endIdx : flowNodesData.flowNodes.length - 1;
                    const endNode = flowNodesData.flowNodes[endNodeIdx];
                    
                    const startViTri = formatChainageToK(startNode.chainage || 0);
                    const endViTri = formatChainageToK(endNode?.chainage || 0);
                    const chieuDaiRaw = (endNode?.chainage || 0) - (startNode.chainage || 0);
                    const chieuDai = chieuDaiRaw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                    const q_val = formatNum(startNode.q_sau, 3);
                    const i_str = isDesigned ? (res?.i || '0.0003') : '-';
                    const m_str = isDesigned ? (res?.m || '0') : '-';
                    const n_str = isDesigned ? (res?.n || '0.017') : '-';
                    const b_str = isDesigned ? (res?.b_out || '-') : '-';

                    const isCollapsed = collapsedSegments[segIdx];
                    const toggleSegment = (sIdx: number) => {
                      setCollapsedSegments(prev => ({ ...prev, [sIdx]: !prev[sIdx] }));
                    };

                    const segmentHeaderRow = (
                        <tr key={`header-${segIdx}`} className="bg-slate-100/80 hover:bg-slate-200/60 transition-colors cursor-pointer border-b border-t border-slate-200 shadow-sm" onClick={() => toggleSegment(segIdx)}>
                          <td colSpan={14} className="px-3 py-2 text-left font-semibold text-slate-700">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isCollapsed ? <ChevronRight size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                              <span>Đoạn {segIdx + 1}</span>
                              <span className="font-normal text-slate-500 ml-1 text-[13px]">
                                (Từ {startViTri} đến {endViTri}, L = {chieuDai}m, Qtk = {q_val} m³/s{isDesigned ? `, i = ${i_str}, m = ${m_str}, n = ${n_str}, b = ${b_str}m` : ''})
                              </span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ml-1 ${isDesigned ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                {isDesigned ? 'Đã thiết kế' : 'Chưa thiết kế'}
                              </span>
                            </div>
                          </td>
                        </tr>
                    );

                    if (isCollapsed) {
                      return <React.Fragment key={`segment-${segIdx}`}>{segmentHeaderRow}</React.Fragment>;
                    }

                    const h_max = isDesigned ? (res.h_max || '-') : '-';
                    const h_des = isDesigned ? (res.h_des || '-') : '-';
                    const h_min = isDesigned ? (res.h_min || '-') : '-';
                    
                    const nodeElements = [];
                    for (let index = seg.startIdx; index <= endNodeIdx; index++) {
                      const node = flowNodesData.flowNodes[index];
                      let viTri = formatChainageToK(node.chainage || 0);
                      let congTrinh = '';
                      if (node.type === 'dau') {
                        congTrinh = 'Đầu kênh';
                      } else if (node.type === 'cuoi') {
                        congTrinh = 'Cuối kênh';
                      } else if (node.type === 'inline_structure' || node.type === 'inline_structure_start' || node.type === 'inline_structure_end') {
                        congTrinh = node.name || 'Công trình';
                      } else {
                        congTrinh = node.name || 'Kênh nhánh';
                      }
                      
                      let chainageDisplay = Number(node.chainage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                      
                      const dayVal = nodeElevations[segIdx]?.[index];
                      const dayStr = dayVal !== null && dayVal !== undefined ? dayVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';
                      const htkStr = dayVal !== null && dayVal !== undefined && isDesigned && res.h_des ? (dayVal + Number(res.h_des)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';
                      
                      let safeHeightVal = 0;
                      if (res && res.safeHeight) {
                        safeHeightVal = Number(String(res.safeHeight).replace(',', '.'));
                        if (isNaN(safeHeightVal)) safeHeightVal = 0;
                      } else {
                        safeHeightVal = Number(calculateSafeHeight(startNode.q_sau, res?.crossSectionType as any)) || 0;
                      }
                      
                      const h_max_val = !isNaN(Number(res?.h_max)) ? Number(res?.h_max) : 0;
                      const dinhKenhStr = dayVal !== null && dayVal !== undefined && isDesigned ? (dayVal + h_max_val + safeHeightVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';
                      
                      const yeuCauStr = node.type === 'branch' && node.reqWaterLevel ? node.reqWaterLevel.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';
                      
                      // Find terrain elevation for this chainage
                      let terrainElevationStr = '-';
                      if (terrainData && terrainData.length > 0) {
                        const chainage = node.chainage || 0;
                        const exactMatch = terrainData.find(t => Math.abs(Number(t.lyTrinh) - chainage) < 0.1);
                        if (exactMatch) {
                          terrainElevationStr = Number(exactMatch.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                        } else {
                          const sortedData = [...terrainData].sort((a, b) => Number(a.lyTrinh) - Number(b.lyTrinh));
                          let prev = null;
                          let next = null;
                          for (let i = 0; i < sortedData.length; i++) {
                            const tChainage = Number(sortedData[i].lyTrinh);
                            if (tChainage <= chainage) prev = sortedData[i];
                            if (tChainage >= chainage && !next) next = sortedData[i];
                          }
                          if (prev && next && Number(prev.lyTrinh) !== Number(next.lyTrinh)) {
                            const lyTrinhPrev = Number(prev.lyTrinh);
                            const lyTrinhNext = Number(next.lyTrinh);
                            const caoDoPrev = Number(prev.caoDo);
                            const caoDoNext = Number(next.caoDo);
                            const ratio = (chainage - lyTrinhPrev) / (lyTrinhNext - lyTrinhPrev);
                            const interpolated = caoDoPrev + ratio * (caoDoNext - caoDoPrev);
                            terrainElevationStr = interpolated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                          } else if (prev) {
                            terrainElevationStr = Number(prev.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                          } else if (next) {
                            terrainElevationStr = Number(next.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                          }
                        }
                      }
                      
                      const isFirstNode = segIdx === 0 && index === 0;

                      const dataRow = (
                        <tr 
                          id={`row-${node.chainage}`}
                          key={`data-${segIdx}-${index}`} 
                          className={`hover:bg-slate-100 transition-colors cursor-pointer text-[13px] ${focusedChainage === node.chainage ? 'bg-blue-50/50' : ''}`}
                          onClick={() => setFocusedChainage(node.chainage || 0)}
                        >
                          <td className="px-3 py-1.5 text-center text-slate-700 font-medium border-r border-slate-100">{viTri}</td>
                          <td className="px-3 py-1.5 text-center text-slate-700 border-r border-slate-100">{congTrinh}</td>
                          <td className="px-3 py-1.5 text-center text-slate-500 border-r border-slate-100">{chainageDisplay}</td>
                          <td className="px-3 py-1.5 text-center text-slate-300 border-r border-slate-100">-</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${(node.headLoss || 0) > 0 ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{(node.headLoss || 0) > 0 ? Number(node.headLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isDesigned ? 'text-slate-700' : 'text-slate-300'}`}>{h_max}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isDesigned ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{h_des}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isDesigned ? 'text-slate-700' : 'text-slate-300'}`}>{h_min}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${terrainElevationStr !== '-' ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                            {terrainElevationStr}
                          </td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isFirstNode && controlElevationType === 'day' && controlElevationValue ? 'font-bold text-red-600' : (dayStr !== '-' ? 'text-slate-700' : 'text-slate-300')}`}>
                            {dayStr}
                          </td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isFirstNode && controlElevationType === 'muc_nuoc' && controlElevationValue ? 'font-bold text-red-600' : (htkStr !== '-' ? 'text-slate-700' : 'text-slate-300')}`}>
                            {htkStr}
                          </td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${dinhKenhStr !== '-' ? 'text-slate-700' : 'text-slate-300'}`}>
                            {dinhKenhStr}
                          </td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${yeuCauStr !== '-' ? 'text-[#8B0000] font-medium' : 'text-slate-300'}`}>
                            {yeuCauStr}
                          </td>
                          <td className="px-3 py-1.5 text-center text-slate-300">-</td>
                        </tr>
                      );
                      
                      nodeElements.push(dataRow);
                      
                      if (index < endNodeIdx) {
                        let hFriction = '-';
                        if (isDesigned) {
                          const nextNode = flowNodesData.flowNodes[index + 1];
                          const L = (nextNode.chainage || 0) - (node.chainage || 0);
                          const i_val = Number(res?.i || 0.0003);
                          hFriction = (L * i_val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                        }
                        
                        nodeElements.push(
                          <tr key={`empty-${segIdx}-${index}`} className="bg-slate-50/40">
                            {Array.from({ length: 14 }).map((_, i) => {
                              let cellContent: React.ReactNode = '-';
                              let className = `px-3 py-1.5 text-center ${i < 13 ? 'border-r border-slate-100' : ''}`;
                              if (i === 3) {
                                 cellContent = hFriction;
                                 className += (hFriction !== '-' ? ' text-slate-500 font-medium' : ' text-transparent');
                              } else {
                                 className += ' text-transparent';
                              }
                              return (
                                  <td key={`empty-cell-${segIdx}-${index}-${i}`} className={className}>
                                    {cellContent}
                                  </td>
                              );
                            })}
                          </tr>
                        );
                      }
                    }

                    return (
                      <React.Fragment key={`segment-${segIdx}`}>
                        {segmentHeaderRow}
                        {nodeElements}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-slate-400 italic">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </FullWidthTable>
              
              <PropertiesPanel
                isExpanded={isPropertiesExpanded}
                onToggle={setIsPropertiesExpanded}
                collapsedTitle="Công trình trên kênh"
                width="w-[320px]"
                topBar={
                  <>
                    <select 
                      className="flex-1 text-[11px] border border-slate-400 bg-white pl-2 pr-6 py-1 outline-none text-slate-700 font-bold"
                      value={selectedInlineStructureId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedInlineStructureId(id);
                        if (id) {
                          const struct = canalStructures.find(s => s.id === id);
                          if (struct) {
                            setFocusedChainage(Number(struct.chainage) || 0);
                            setInlineStructureTypeInput(struct.type || '');
                            setInlineStructureNameInput(struct.name || '');
                            setStartChainageInput(struct.chainage || '');
                            setEndChainageInput(struct.endChainage || '');
                            setInlineStructureLossInput(struct.headLoss?.toString() || '');
                            setInlineInletLoss(struct.inletLoss?.toString() || '');
                            setInlineOutletLoss(struct.outletLoss?.toString() || '');
                            setInlineFrictionLoss(struct.frictionLoss?.toString() || '');
                            setShowInlineLossDetails(false);
                          }
                        } else {
                          setFocusedChainage(null);
                          setInlineStructureTypeInput('');
                          setInlineStructureNameInput('');
                          setStartChainageInput('');
                          setEndChainageInput('');
                          setInlineStructureLossInput('');
                          setInlineInletLoss('');
                          setInlineOutletLoss('');
                          setInlineFrictionLoss('');
                          setShowInlineLossDetails(false);
                        }
                      }}
                    >
                      <option value="">Công trình trên kênh</option>
                      {[...canalStructures].filter(s => s.type === 'inline_structure').sort((a, b) => (Number(a.chainage) || 0) - (Number(b.chainage) || 0)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <button 
                      className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-blue-600" 
                      title="Thêm"
                      onClick={() => {
                        if (!startChainageInput) {
                          toast.error('Vui lòng nhập lý trình đầu.');
                          return;
                        }
                        
                        setCanalStructures(prev => {
                          const newStructs = [...prev, {
                            id: Date.now().toString(),
                            name: inlineStructureNameInput || inlineStructureTypeInput || `Công trình mới`,
                            x: 0,
                            y: 0,
                            angle: 0,
                            status: 'planned' as StructureStatus,
                            type: 'inline_structure',
                            inlineStructureType: inlineStructureTypeInput,
                            chainage: startChainageInput,
                            endChainage: endChainageInput,
                            headLoss: parseFloat(inlineStructureLossInput) || 0
                          }];
                          return newStructs;
                        });
                        toast.success('Thêm công trình thành công.');
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      className="p-1 border-y border-r border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-emerald-600" 
                      title="Cập nhật"
                      onClick={() => {
                        if (!selectedInlineStructureId) {
                          toast.error('Vui lòng chọn công trình để cập nhật.');
                          return;
                        }
                        setCanalStructures(prev => prev.map(s => {
                          if (s.id === selectedInlineStructureId) {
                            return {
                              ...s,
                              name: inlineStructureNameInput || inlineStructureTypeInput || `Công trình`,
                              inlineStructureType: inlineStructureTypeInput,
                              chainage: startChainageInput,
                              endChainage: endChainageInput,
                              headLoss: parseFloat(inlineStructureLossInput) || 0
                            };
                          }
                          return s;
                        }));
                        toast.success('Cập nhật công trình thành công.');
                      }}
                    >
                      <Save size={14} />
                    </button>
                    <button 
                      className="p-1 border-y border-r border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-rose-600 mr-1" 
                      title="Xoá"
                      onClick={() => {
                        if (!selectedInlineStructureId) {
                          toast.error('Vui lòng chọn công trình để xoá.');
                          return;
                        }
                        setCanalStructures(prev => prev.filter(s => s.id !== selectedInlineStructureId));
                        setSelectedInlineStructureId('');
                        setInlineStructureTypeInput('');
                        setInlineStructureNameInput('');
                        setStartChainageInput('');
                        setEndChainageInput('');
                        setInlineStructureLossInput('');
                        toast.success('Đã xoá công trình.');
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                }
              >
                <PropertyGroup title="Thông tin công trình">
                  <PropertyRow label="Loại">
                                          <select 
                        className="w-full px-2 py-1 text-[11px] outline-none text-black bg-white"
                        value={inlineStructureTypeInput}
                        onChange={(e) => setInlineStructureTypeInput(e.target.value)}
                      >
                        <option value="">Chọn loại</option>
                        {canalStructureTypes.filter(c => !c.parentId).map(parent => {
                          const children = canalStructureTypes.filter(c => c.parentId === parent.id);
                          if (children.length > 0) {
                            return (
                              <optgroup key={parent.id} label={parent.name.toUpperCase()} className="font-semibold">
                                {children.map(child => (
                                  <option key={child.id} value={child.name}>
                                    {child.name}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          }
                          return (
                            <option key={parent.id} value={parent.name}>
                              {parent.name}
                            </option>
                          );
                        })}
                      </select>
                  </PropertyRow>
                  <PropertyRow label="Tên công trình">
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 text-[11px] outline-none text-black bg-white" 
                      placeholder="VD: Cống điều tiết" 
                      value={inlineStructureNameInput}
                      onChange={(e) => setInlineStructureNameInput(e.target.value)}
                    />
                  </PropertyRow>
                  <PropertyRow label="Lý trình đầu">
                    <div className="flex items-center w-full bg-white">
                      <input 
                        type="text" 
                        className="flex-1 px-2 py-1 text-[11px] outline-none text-black bg-white" 
                        placeholder="K0+000" 
                        value={startChainageInput}
                        onChange={(e) => setStartChainageInput(e.target.value)}
                      />
                      <button 
                        className={`px-1.5 py-1 transition-colors border-l border-slate-200 ${pickingChainageTarget === 'start' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                        title="Pick điểm trên biểu đồ"
                        onClick={() => setPickingChainageTarget(pickingChainageTarget === 'start' ? null : 'start')}
                      >
                        <i className="bi bi-geo-alt"></i>
                      </button>
                    </div>
                  </PropertyRow>
                  <PropertyRow label="Lý trình cuối">
                    <div className="flex items-center w-full bg-white">
                      <input 
                        type="text" 
                        className={`flex-1 px-2 py-1 text-[11px] outline-none ${!['Cầu máng', 'Xi phông', 'Dốc nước'].includes(inlineStructureTypeInput) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-black bg-white'}`} 
                        placeholder="K0+000" 
                        value={endChainageInput}
                        onChange={(e) => setEndChainageInput(e.target.value)}
                        disabled={!['Cầu máng', 'Xi phông', 'Dốc nước'].includes(inlineStructureTypeInput)}
                      />
                      <button 
                        className={`px-1.5 py-1 transition-colors border-l border-slate-200 ${!['Cầu máng', 'Xi phông', 'Dốc nước'].includes(inlineStructureTypeInput) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : pickingChainageTarget === 'end' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                        title="Pick điểm trên biểu đồ"
                        onClick={() => {
                          if (['Cầu máng', 'Xi phông', 'Dốc nước'].includes(inlineStructureTypeInput)) {
                            setPickingChainageTarget(pickingChainageTarget === 'end' ? null : 'end');
                          }
                        }}
                        disabled={!['Cầu máng', 'Xi phông', 'Dốc nước'].includes(inlineStructureTypeInput)}
                      >
                        <i className="bi bi-geo-alt"></i>
                      </button>
                    </div>
                  </PropertyRow>
                  <PropertyRow label="Tổn thất">
                    <div className="flex items-center w-full bg-white">
                      <input 
                        type="number" 
                        className="flex-1 px-2 py-1 text-[11px] outline-none text-black bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        placeholder="0.00" 
                        value={inlineStructureLossInput}
                        onChange={(e) => setInlineStructureLossInput(e.target.value)}
                      />
                      <button 
                        className={`px-1.5 py-1 border-l border-slate-200 ${showInlineLossDetails ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`} 
                        title="Tính toán chi tiết"
                        onClick={() => setShowInlineLossDetails(!showInlineLossDetails)}
                      >
                        <Calculator size={14} />
                      </button>
                    </div>
                  </PropertyRow>
                  {showInlineLossDetails && (
                    <>
                      <PropertyRow label="Tổn thất cửa vào (m)">
                        <input 
                          type="number" 
                          className="w-full px-2 py-1 text-[11px] outline-none text-black bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          placeholder="0.00" 
                          value={inlineInletLoss}
                          onChange={(e) => setInlineInletLoss(e.target.value)}
                        />
                      </PropertyRow>
                      <PropertyRow label="Tổn thất cửa ra (m)">
                        <input 
                          type="number" 
                          className="w-full px-2 py-1 text-[11px] outline-none text-black bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          placeholder="0.00" 
                          value={inlineOutletLoss}
                          onChange={(e) => setInlineOutletLoss(e.target.value)}
                        />
                      </PropertyRow>
                      <PropertyRow label="Tổn thất dọc đường (m)">
                        <input 
                          type="number" 
                          className="w-full px-2 py-1 text-[11px] outline-none text-black bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          placeholder="0.00" 
                          value={inlineFrictionLoss}
                          onChange={(e) => setInlineFrictionLoss(e.target.value)}
                        />
                      </PropertyRow>
                    </>
                  )}
                </PropertyGroup>
              </PropertiesPanel>

            </div>
            
            {/* Bottom Panel */}
            <div className={`absolute bottom-0 left-0 right-0 border-t border-slate-300 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 z-20 ${isLongitudinalPanelFullscreen ? 'top-0 h-full' : isLongitudinalPanelExpanded ? 'h-72' : 'h-10'}`}>
              <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
                <h3 className="font-semibold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  Mặt cắt dọc kênh chính
                  {hoveredProfileChainage !== null && (
                    <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block tracking-normal normal-case">
                      Lý trình: K{Math.floor(hoveredProfileChainage / 1000)}+{String(Math.floor(hoveredProfileChainage % 1000)).padStart(3, '0')}.{(hoveredProfileChainage % 1).toFixed(2).substring(2)}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded shadow-sm h-7 mr-2 overflow-hidden">
                    <button 
                      onClick={() => setIsProfilePanMode(!isProfilePanMode)}
                      className={`w-8 h-full flex items-center justify-center transition-colors border-r border-slate-200 ${isProfilePanMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      title={isProfilePanMode ? "Tắt kéo màn hình" : "Bật kéo màn hình"}
                    >
                      <i className="bi bi-hand-index-thumb"></i>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded shadow-sm h-7">
                    <button 
                      onClick={() => setProfileChartZoom(prev => Math.max(0.2, prev - 0.5))}
                      className="w-7 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold"
                      title="Thu nhỏ"
                    >
                      -
                    </button>
                    <div className="w-12 text-center text-xs font-medium text-slate-600 border-x border-slate-100 flex items-center justify-center h-full cursor-pointer hover:bg-slate-50" title="Về mặc định" onClick={() => setProfileChartZoom(1)}>
                      {Math.round(profileChartZoom * 100)}%
                    </div>
                    <button 
                      onClick={() => setProfileChartZoom(prev => Math.min(prev + 0.5, 5))}
                      className="w-7 h-full flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold"
                      title="Phóng to"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                    disabled
                    className="p-1 text-slate-300 rounded transition-colors cursor-not-allowed"
                    title="Tính năng đang được bảo trì"
                  >
                    <i className={`bi ${isLongitudinalPanelFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
                  </button>
                  <button 
                    onClick={() => {
                      if (isLongitudinalPanelFullscreen) setIsLongitudinalPanelFullscreen(false);
                      setIsLongitudinalPanelExpanded(!isLongitudinalPanelExpanded);
                    }}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title={isLongitudinalPanelExpanded ? "Thu gọn" : "Mở rộng"}
                  >
                    <i className={`bi ${isLongitudinalPanelExpanded && !isLongitudinalPanelFullscreen ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                  </button>
                </div>
              </div>
            </div>
              {(isLongitudinalPanelExpanded || isLongitudinalPanelFullscreen) && (
                <div className="flex-1 overflow-hidden bg-white">
                  <LongitudinalProfileChart 
                    data={chartData} 
                    terrainData={terrainData}
                    focusedChainage={focusedChainage} 
                    zoom={profileChartZoom} 
                    onZoomChange={setProfileChartZoom} 
                    isPanMode={isProfilePanMode}
                    onHoverChainage={setHoveredProfileChainage}
                    isPickingMode={pickingChainageTarget !== null}
                    onChainagePicked={(chainage) => {
                      if (pickingChainageTarget === 'start') {
                        setStartChainageInput(chainage.toFixed(2));
                      } else if (pickingChainageTarget === 'end') {
                        setEndChainageInput(chainage.toFixed(2));
                      } else if (pickingChainageTarget === 'single') {
                        setChainageInput(chainage.toFixed(2));
                      }
                      setPickingChainageTarget(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {currentStep === 5 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <i className="bi bi-share text-4xl mb-4 text-slate-300 block"></i>
              <p className="text-lg font-medium">Không gian làm việc: Xuất bản vẽ</p>
            </div>
          </div>
        )}
        {currentStep === 6 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <i className="bi bi-building text-4xl mb-4 text-slate-300 block"></i>
              <p className="text-lg font-medium">Không gian làm việc: Cống đầu kênh nhánh</p>
            </div>
          </div>
          )}
        </div>

        {/* Properties Panel */}
        {currentStep === 1 && (
          <PropertiesPanel
            isExpanded={isPropertiesExpanded}
            onToggle={setIsPropertiesExpanded}
            collapsedTitle="Thông số kênh nhánh"
            width="w-[320px]"
            topBar={
              <>
                <select 
                  className="flex-1 text-[11px] border border-slate-400 bg-white pl-2 pr-6 py-1 outline-none text-slate-700"
                  value={selectedStructureId}
                  onChange={(e) => {
                    setSelectedStructureId(e.target.value);
                    if (e.target.value) {
                      setFocusStructureTrigger({ id: e.target.value, ts: Date.now() });
                    }
                  }}
                >
                  <option value="">Thông số kênh nhánh</option>
                  {[...canalStructures].sort((a, b) => (Number(a.chainage) || 0) - (Number(b.chainage) || 0)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button 
                  className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-blue-600" 
                  title="Thêm công trình"
                  onClick={() => {
                    if (importedPoints.length < 2) {
                      toast.error("Cần ít nhất 2 điểm mốc để tính toán lý trình.");
                      return;
                    }
                    // Parse chainage
                    const parsed = parseFloat(chainageInput.replace(/[^\d.]/g, ''));
                    const pos = calculateStructurePosition();
                    if (!pos) {
                      toast.error('Không thể tính toán vị trí.');
                      return;
                    }
                    
                    const { structX, structY, angleDeg } = pos;

                    const mappedStatus: StructureStatus = 
                      offtakeStatus === 'moi' ? 'planned' : 
                      offtakeStatus === 'sua' ? 'repair' : 'existing';

                    setCanalStructures(prev => {
                      const newStructs = [...prev, {
                        id: Date.now().toString(),
                        name: canalNameInput || `Kênh nhánh mới`,
                        x: structX,
                        y: structY,
                        angle: angleDeg,
                        status: mappedStatus,
                        type: 'offtake_irrigation', // Cống lấy nước
                        chainage: chainageInput,
                        length: parseFloat(canalLengthInput) || 0,
                        flowCalcMethod: flowCalcMethodInput,
                        reqFlow: parseFloat(reqFlowInput) || 0,
                        riceArea: parseFloat(riceAreaInput) || 0,
                        fruitArea: parseFloat(fruitAreaInput) || 0,
                        permeability: permeabilityInput,
                        reqWaterLevel: parseFloat(reqWaterLevelInput) || 0,
                        offtakeSide: offtakeSide,
                        offtakeSize: parseFloat(offtakeSizeInput) || 0,
                        offtakeStatus: offtakeStatus
                      }];
                      return newStructs;
                    });
                    
                    toast.success(`Đã đặt công trình tại X: ${structX.toFixed(2)}, Y: ${structY.toFixed(2)}`);
                  }}
                >
                  <Plus size={14} />
                </button>
                <button 
                  className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-emerald-600" 
                  title="Cập nhật"
                  onClick={() => {
                    if (!selectedStructureId) {
                      toast.error('Vui lòng chọn một công trình để cập nhật.');
                      return;
                    }
                    if (importedPoints.length < 2) {
                      toast.error('Cần ít nhất 2 điểm mốc để tính toán lý trình.');
                      return;
                    }
                    
                    const pos = calculateStructurePosition();
                    if (!pos) {
                      toast.error('Không thể tính toán vị trí.');
                      return;
                    }
                    
                    const { structX, structY, angleDeg } = pos;
                    const mappedStatus: StructureStatus = 
                      offtakeStatus === 'moi' ? 'planned' : 
                      offtakeStatus === 'sua' ? 'repair' : 'existing';

                    setCanalStructures(prev => prev.map(s => {
                      if (s.id === selectedStructureId) {
                        return {
                          ...s,
                          name: canalNameInput || `Kênh nhánh mới`,
                          x: structX,
                          y: structY,
                          angle: angleDeg,
                          status: mappedStatus,
                          type: 'offtake_irrigation',
                          chainage: chainageInput,
                          length: parseFloat(canalLengthInput) || 0,
                          flowCalcMethod: flowCalcMethodInput,
                          reqFlow: parseFloat(reqFlowInput) || 0,
                          riceArea: parseFloat(riceAreaInput) || 0,
                          fruitArea: parseFloat(fruitAreaInput) || 0,
                          permeability: permeabilityInput,
                          reqWaterLevel: parseFloat(reqWaterLevelInput) || 0,
                          offtakeSide: offtakeSide,
                          offtakeSize: parseFloat(offtakeSizeInput) || 0,
                          offtakeStatus: offtakeStatus
                        };
                      }
                      return s;
                    }));
                    toast.success('Cập nhật thông số thành công. Hãy bấm Lưu dự án để ghi vào DB.');
                  }}
                >
                  <Save size={14} />
                </button>
                <button 
                  className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center text-rose-600" 
                  title="Xoá"
                  onClick={() => {
                    if (!selectedStructureId) {
                      toast.error('Vui lòng chọn một công trình để xoá.');
                      return;
                    }
                    setCanalStructures(prev => prev.filter(s => s.id !== selectedStructureId));
                    setSelectedStructureId('');
                    toast.success('Đã xoá kênh nhánh khỏi bản vẽ. Hãy bấm Lưu dự án để ghi vào DB.');
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            }
          >
            {/* Group 1: General */}
            <PropertyGroup title="Thông tin chung">
              <PropertyRow label="Tên kênh">
                <input 
                  type="text" 
                  className="w-full px-2 py-1 text-[11px] outline-none text-black" 
                  value={canalNameInput}
                  onChange={(e) => setCanalNameInput(e.target.value)}
                />
              </PropertyRow>
              <PropertyRow label="Lý trình">
                <div className="flex items-center w-full bg-white">
                  <input 
                    type="text" 
                    className="flex-1 px-2 py-1 text-[11px] outline-none text-black" 
                    value={chainageInput}
                    onChange={(e) => setChainageInput(e.target.value)}
                  />
                  <button 
                    className={`px-1.5 py-1 transition-colors border-l border-slate-200 ${pickingChainageTarget === 'single' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                    title="Pick điểm trên biểu đồ"
                    onClick={() => setPickingChainageTarget(pickingChainageTarget === 'single' ? null : 'single')}
                  >
                    <i className="bi bi-geo-alt"></i>
                  </button>
                </div>
              </PropertyRow>
              <PropertyRow label="Chiều dài (m)">
                <input 
                  type="number" 
                  className="w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  value={canalLengthInput}
                  onChange={(e) => setCanalLengthInput(e.target.value)}
                />
              </PropertyRow>
            </PropertyGroup>

            {/* Group 2: Nhu cầu nước */}
            <PropertyGroup title="Nhu cầu nước">
              <PropertyRow label="Phương pháp tính">
                <div className="flex w-full items-center gap-3 px-2 py-1 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="flowCalcMethodInput" value="tinh_toan" checked={flowCalcMethodInput === 'tinh_toan'} onChange={(e) => setFlowCalcMethodInput(e.target.value)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Tính toán
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="flowCalcMethodInput" value="nhap_gia_tri" checked={flowCalcMethodInput === 'nhap_gia_tri'} onChange={(e) => setFlowCalcMethodInput(e.target.value)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Nhập giá trị
                  </label>
                </div>
              </PropertyRow>
              {flowCalcMethodInput === 'nhap_gia_tri' && (
                <PropertyRow label="Lưu lượng nhánh (m3/s)">
                  <input 
                    type="number" 
                    step="any" 
                    className="w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={reqFlowInput}
                    onChange={(e) => setReqFlowInput(e.target.value)}
                  />
                </PropertyRow>
              )}
              {project?.irrigationCoefficient && (
                (() => {
                  try {
                    const crops = JSON.parse(project.irrigationCoefficient);
                    return crops.map((crop: any, index: number) => (
                      <PropertyRow 
                        key={index} 
                        label={
                          <span title={`Diện tích tưới cho ${crop.name || 'cây trồng ' + (index + 1)}`}>
                            Diện tích {crop.name ? crop.name.toLowerCase() : `cây ${index + 1}`} (ha)
                          </span>
                        }
                      >
                        <div className="flex-1 flex items-center">
                          <input 
                            type="number" 
                            step="any" 
                            value={index === 0 ? riceAreaInput : fruitAreaInput}
                            onChange={e => index === 0 ? setRiceAreaInput(e.target.value) : setFruitAreaInput(e.target.value)}
                            disabled={flowCalcMethodInput === 'nhap_gia_tri'}
                            className={`w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${flowCalcMethodInput === 'nhap_gia_tri' ? 'bg-slate-100 text-slate-400' : ''}`}
                          />
                          {crop.coef !== undefined && (
                            <span className="text-[10px] text-slate-500 pr-2 whitespace-nowrap shrink-0 font-medium select-none cursor-default" title="Hệ số tưới">
                              q = {crop.coef}
                            </span>
                          )}
                        </div>
                      </PropertyRow>
                    ));
                  } catch (e) {
                    return null;
                  }
                })()
              )}
              
              <PropertyRow label="Mức độ thấm">
                <select 
                  className={`w-full pl-2 pr-6 py-1 text-[11px] outline-none border-none focus:ring-0 ${flowCalcMethodInput === 'nhap_gia_tri' ? 'bg-slate-100 text-slate-400' : 'bg-white text-black'}`}
                  value={permeabilityInput}
                  onChange={e => setPermeabilityInput(e.target.value)} disabled={flowCalcMethodInput === 'nhap_gia_tri'}
                >
                  {permeabilityBranchOptions.length > 0 ? (
                      permeabilityBranchOptions.map(opt => (
                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                      ))
                  ) : (
                    <>
                      <option value="rat_it">Thấm rất ít</option>
                      <option value="it">Thấm ít</option>
                      <option value="vua">Thấm vừa</option>
                      <option value="nhieu">Thấm nhiều</option>
                      <option value="rat_manh">Thấm rất mạnh</option>
                    </>
                  )}
                </select>
              </PropertyRow>
            </PropertyGroup>

            {/* Group: Mực nước yêu cầu đầu kênh */}
            <PropertyGroup title="Mực nước yêu cầu đầu kênh">
              <PropertyRow label="Mực nước (m)">
                <div className="flex-1 flex items-center pr-1">
                  <input 
                    type="number" 
                    step="0.01" 
                    className={`w-full px-2 py-1 text-[11px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isWaterLevelCalculated ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-black bg-white'}`} 
                    value={reqWaterLevelInput}
                    onChange={e => setReqWaterLevelInput(e.target.value)}
                    disabled={isWaterLevelCalculated}
                  />
                  <button 
                    className={`p-1 rounded hover:bg-slate-100 ${showWaterLevelCalc ? 'text-blue-600' : 'text-slate-400'}`}
                    onClick={() => setShowWaterLevelCalc(!showWaterLevelCalc)}
                    title="Tính toán chi tiết"
                  >
                    <Calculator size={14} />
                  </button>
                </div>
              </PropertyRow>
              
              {showWaterLevelCalc && (
                <div className="bg-slate-50 border-t border-slate-300">
                  <div className="flex border-b border-slate-300 last:border-b-0">
                    <div className="w-[145px] shrink-0 whitespace-nowrap bg-[#f0f0f0] border-r border-slate-300 px-2 py-1 text-[10px] text-slate-600 flex items-center pl-4">Cao độ tưới tự chảy</div>
                    <div className="flex-1 bg-transparent flex">
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full px-2 py-1 text-[10px] outline-none text-black bg-transparent" 
                        placeholder="0.00" 
                        value={calcElevation}
                        onChange={(e) => setCalcElevation(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex border-b border-slate-300 last:border-b-0">
                    <div className="w-[145px] shrink-0 whitespace-nowrap bg-[#f0f0f0] border-r border-slate-300 px-2 py-1 text-[10px] text-slate-600 flex items-center pl-4">Chiều sâu lớp nước</div>
                    <div className="flex-1 bg-transparent flex">
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full px-2 py-1 text-[10px] outline-none text-black bg-transparent" 
                        placeholder="0.00" 
                        value={calcDepth}
                        onChange={(e) => setCalcDepth(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex border-b border-slate-300 last:border-b-0">
                    <div className="w-[145px] shrink-0 whitespace-nowrap bg-[#f0f0f0] border-r border-slate-300 px-2 py-1 text-[10px] text-slate-600 flex items-center pl-4">Độ dốc đáy kênh</div>
                    <div className="flex-1 bg-transparent flex">
                      <input 
                        type="number" 
                        step="0.0001" 
                        className="w-full px-2 py-1 text-[10px] outline-none text-black bg-transparent" 
                        placeholder="0.00" 
                        value={calcSlope}
                        onChange={(e) => setCalcSlope(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex border-b border-slate-300 last:border-b-0">
                    <div className="w-[145px] shrink-0 whitespace-nowrap bg-[#f0f0f0] border-r border-slate-300 px-2 py-1 text-[10px] text-slate-600 flex items-center pl-4">Tổng tổn thất cục bộ</div>
                    <div className="flex-1 bg-transparent flex">
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full px-2 py-1 text-[10px] outline-none text-black bg-transparent" 
                        placeholder="0.00" 
                        value={calcLoss}
                        onChange={(e) => setCalcLoss(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </PropertyGroup>

            {/* Group 3: Công trình */}
            <PropertyGroup title="Cống lấy nước đầu kênh">
              <PropertyRow label="Bờ trích nước">
                <div className="flex-1 px-2 py-1 flex items-center gap-4">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="boTrichNuoc" 
                      value="trai" 
                      checked={offtakeSide === 'trai'}
                      onChange={() => setOfftakeSide('trai')}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300" 
                    />
                    <span className="text-[11px] text-black">Trái</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="boTrichNuoc" 
                      value="phai" 
                      checked={offtakeSide === 'phai'}
                      onChange={() => setOfftakeSide('phai')}
                      className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-slate-300" 
                    />
                    <span className="text-[11px] text-black">Phải</span>
                  </label>
                </div>
              </PropertyRow>
              
              <PropertyRow label="Cửa nhận nước">
                <input 
                  type="number" 
                  className="w-full px-2 py-1 text-[11px] outline-none text-black" 
                  value={offtakeSizeInput}
                  onChange={e => setOfftakeSizeInput(e.target.value)}
                />
              </PropertyRow>

              <PropertyRow label="Cống đầu kênh">
                <select 
                  value={offtakeStatus}
                  onChange={(e) => setOfftakeStatus(e.target.value as any)}
                  className="w-full pl-2 pr-6 py-1 text-[11px] outline-none bg-white text-black border-none focus:ring-0"
                >
                  <option value="moi">Mới</option>
                  <option value="sua">Sửa</option>
                  <option value="da_co">Đã có</option>
                </select>
              </PropertyRow>
            </PropertyGroup>

          </PropertiesPanel>
        )}

        <TerrainDataOffcanvas 
          isOpen={isTerrainDataOpen} 
          initialData={terrainData}
          onClose={() => setIsTerrainDataOpen(false)} 
          onUpdate={async (data) => {
            setTerrainData(data);
            setIsTerrainDataOpen(false);
            if (project?.id) {
              const res = await saveTerrainData(project.id, data);
              if (res.success) {
                toast.success('Đã lưu dữ liệu địa hình thành công');
              } else {
                toast.error('Lỗi khi lưu dữ liệu địa hình');
              }
            }
          }}
        />
      </div>
    </div>
  );
}

const CoordinateWorkspace = ({ 
  points, viewTransform, setViewTransform, isPanMode, showPointDot, showPointName, focusTrigger, activeLandmark, activeStructureId, focusStructureTrigger, canalStructures, onPointClick, onStructureClick
}: { 
  points: {name: string, x: number, y: number}[],
  viewTransform: { zoom: number, x: number, y: number },
  setViewTransform: React.Dispatch<React.SetStateAction<{ zoom: number, x: number, y: number }>>,
  isPanMode: boolean,
  showPointDot: boolean,
  showPointName: boolean,
  focusTrigger: {name: string, ts: number} | null,
  activeLandmark: string,
  activeStructureId?: string,
  focusStructureTrigger?: {id: string, ts: number} | null,
  canalStructures?: { id: string, name: string, x: number, y: number, angle: number, status: StructureStatus, type: any }[],
  onPointClick: (p: {name: string, x: number, y: number}) => void,
  onStructureClick?: (id: string) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [cursor, setCursor] = useState(isPanMode ? 'cursor-grab' : 'cursor-crosshair');

  useEffect(() => {
    setCursor(isPanMode ? 'cursor-grab' : 'cursor-crosshair');
  }, [isPanMode]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (focusTrigger && points.length > 0 && dimensions.width > 0) {
      const p = points.find(point => point.name === focusTrigger.name);
      if (p) {
        const minX = Math.min(...points.map(pt => pt.x));
        const maxX = Math.max(...points.map(pt => pt.x));
        const minY = Math.min(...points.map(pt => pt.y));
        const maxY = Math.max(...points.map(pt => pt.y));
        
        const dataCenterX = (minX + maxX) / 2;
        const dataCenterY = (minY + maxY) / 2;
        const dx = p.x - dataCenterX;
        const dy = p.y - dataCenterY;
        
        const dataWidth = Math.max(maxX - minX, 1);
        const dataHeight = Math.max(maxY - minY, 1);
        const padding = 50; 
        const availableWidth = dimensions.width - padding * 2;
        const availableHeight = dimensions.height - padding * 2;
        
        const scaleX = availableWidth > 0 ? availableWidth / dataWidth : 1;
        const scaleY = availableHeight > 0 ? availableHeight / dataHeight : 1;
        const baseScale = Math.min(scaleX, scaleY);
        const finalScale = baseScale * viewTransform.zoom;
        
        setViewTransform(prev => ({
          ...prev,
          x: -dx * finalScale,
          y: dy * finalScale
        }));
      }
    }
  }, [focusTrigger, dimensions, points, viewTransform.zoom, setViewTransform]);

  useEffect(() => {
    if (focusStructureTrigger && canalStructures && canalStructures.length > 0 && points.length > 0 && dimensions.width > 0) {
      const struct = canalStructures.find(s => s.id === focusStructureTrigger.id);
      if (struct) {
        const minX = Math.min(...points.map(pt => pt.x));
        const maxX = Math.max(...points.map(pt => pt.x));
        const minY = Math.min(...points.map(pt => pt.y));
        const maxY = Math.max(...points.map(pt => pt.y));
        
        const dataCenterX = (minX + maxX) / 2;
        const dataCenterY = (minY + maxY) / 2;
        const dx = struct.x - dataCenterX;
        const dy = struct.y - dataCenterY;
        
        const dataWidth = Math.max(maxX - minX, 1);
        const dataHeight = Math.max(maxY - minY, 1);
        const padding = 50;
        const availableWidth = dimensions.width - padding * 2;
        const availableHeight = dimensions.height - padding * 2;
        const scaleX = availableWidth > 0 ? availableWidth / dataWidth : 1;
        const scaleY = availableHeight > 0 ? availableHeight / dataHeight : 1;
        const baseScale = Math.min(scaleX, scaleY);
        
        const currentZoom = viewTransform.zoom;
        const finalScale = baseScale * currentZoom;
        
        setViewTransform(prev => ({
          ...prev,
          x: -dx * finalScale,
          y: dy * finalScale
        }));
      }
    }
  }, [focusStructureTrigger, canalStructures, dimensions, points, viewTransform.zoom, setViewTransform]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode || e.button === 1 || e.button === 2) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setCursor('cursor-grabbing');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setCursor(isPanMode ? 'cursor-grab' : 'cursor-crosshair');
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const screenCenterX = rect.width / 2;
    const screenCenterY = rect.height / 2;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    
    setViewTransform(prev => {
      const newZoom = Math.max(0.1, Math.min(50, prev.zoom * zoomFactor));
      const factor = newZoom / prev.zoom;
      const newX = mouseX - screenCenterX - (mouseX - screenCenterX - prev.x) * factor;
      const newY = mouseY - screenCenterY - (mouseY - screenCenterY - prev.y) * factor;
      return { zoom: newZoom, x: newX, y: newY };
    });
  };

  if (points.length === 0) return null;

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  const dataWidth = Math.max(maxX - minX, 1);
  const dataHeight = Math.max(maxY - minY, 1);

  const padding = 50; 
  const availableWidth = dimensions.width - padding * 2;
  const availableHeight = dimensions.height - padding * 2;

  const scaleX = availableWidth > 0 ? availableWidth / dataWidth : 1;
  const scaleY = availableHeight > 0 ? availableHeight / dataHeight : 1;
  const baseScale = Math.min(scaleX, scaleY);

  const dataCenterX = (minX + maxX) / 2;
  const dataCenterY = (minY + maxY) / 2;

  const screenCenterX = dimensions.width / 2;
  const screenCenterY = dimensions.height / 2;

  const finalScale = baseScale * viewTransform.zoom;

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative bg-white overflow-hidden ${cursor}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute top-2 left-2 text-xs font-medium text-slate-500 bg-white/80 px-2 py-1 rounded shadow-sm z-20 border border-slate-100 pointer-events-none">
        Đã tải {points.length} điểm | Zoom: {Math.round(viewTransform.zoom * 100)}%
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <path 
          d={points.map((p, i) => {
             const dx = p.x - dataCenterX;
             const dy = p.y - dataCenterY;
             const screenX = screenCenterX + dx * finalScale + viewTransform.x;
             const screenY = screenCenterY - dy * finalScale + viewTransform.y;
             return `${i === 0 ? 'M' : 'L'} ${screenX} ${screenY}`;
          }).join(' ')}
          stroke="#ef4444" 
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {points.map((p, i) => {
        const dx = p.x - dataCenterX;
        const dy = p.y - dataCenterY;
        const screenX = screenCenterX + dx * finalScale + viewTransform.x;
        const screenY = screenCenterY - dy * finalScale + viewTransform.y; // Flip Y

        // Hide points outside viewport for performance
        if (screenX < -20 || screenX > dimensions.width + 20 || screenY < -20 || screenY > dimensions.height + 20) {
          return null;
        }

        return (
          <div 
            key={i}
            className="absolute pointer-events-none group z-10 flex items-center justify-center w-2.5 h-2.5"
            style={{ 
              left: `${screenX}px`, 
              top: `${screenY}px`,
              transform: 'translate(-50%, -50%)' 
            }}
          >
            {showPointDot && (
              <div 
                className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm hover:scale-125 transition-all shrink-0 cursor-pointer pointer-events-auto ${p.name === activeLandmark ? 'bg-red-500 animate-pulse ring-red-200 ring-4' : 'bg-blue-500 hover:bg-rose-500'}`}
                title={`${p.name}: X=${p.x}, Y=${p.y}`}
                onClick={() => onPointClick(p)}
              ></div>
            )}
            {showPointName && (
              <span className={`absolute ${showPointDot ? 'top-full mt-1' : 'top-1/2 -translate-y-1/2'} left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-700 bg-white/80 px-1 py-0.5 rounded shadow-sm border border-slate-200 whitespace-nowrap`}>
                {p.name}
              </span>
            )}
          </div>
        );
      })}

      {/* Render Canal Structures */}
      {canalStructures?.map((struct) => {
        const dx = struct.x - dataCenterX;
        const dy = struct.y - dataCenterY;
        const screenX = screenCenterX + dx * finalScale + viewTransform.x;
        const screenY = screenCenterY - dy * finalScale + viewTransform.y; // Flip Y

        // Render at calculated rotation. Note SVG coordinates Y is flipped, so rotation direction is flipped.
        // We negate the angle to correct for the screen Y-axis flip.
        const renderAngle = -struct.angle;

        return (
          <div 
            key={struct.id}
            className="absolute z-20 flex flex-col items-center justify-center pointer-events-none"
            style={{ 
              left: `${screenX}px`, 
              top: `${screenY}px`,
              transform: `translate(-50%, -50%)`
            }}
          >
            <div
              className={`relative flex items-center justify-center pointer-events-auto cursor-pointer ${activeStructureId === struct.id ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
              title={`${struct.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onStructureClick) onStructureClick(struct.id);
              }}
              style={{
                width: 32,
                height: 32,
                transform: `rotate(${renderAngle}deg)`,
                transformOrigin: 'center'
              }}
            >
              <StructureIcon 
                type={struct.type} 
                status={struct.status} 
                className="w-full h-full text-slate-800"
              />
            </div>
            <span className="mt-1 text-[9px] font-bold text-slate-700 bg-white/80 px-1 py-0.5 rounded shadow-sm border border-slate-200 whitespace-nowrap">
              {struct.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
