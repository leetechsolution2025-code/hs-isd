import React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';

export interface ToolbarProps {
  sourceFlow?: string;
  setSourceFlow?: (val: string) => void;
  reinforcementFactor?: string;
  setReinforcementFactor?: (val: string) => void;
  permeabilityLevel?: string;
  setPermeabilityLevel?: (val: string) => void;
  permeabilityMainOptions?: {id: string, name: string}[];
  applyToAll?: boolean;
  setApplyToAll?: (val: boolean) => void;
  onClearSegments?: () => void;
  children?: React.ReactNode;
}

export default function Toolbar({
  sourceFlow = '',
  setSourceFlow,
  reinforcementFactor = '',
  setReinforcementFactor,
  permeabilityLevel = 'rat_it',
  setPermeabilityLevel,
  permeabilityMainOptions = [],
  applyToAll = false,
  setApplyToAll,
  onClearSegments,
  children
}: ToolbarProps) {
  return (
    <div className="h-12 border-b border-slate-300 bg-white flex items-center px-4 shrink-0 shadow-sm gap-6 text-[12px]">
      {children !== undefined ? children : (
        <>
          {/* Lưu lượng tạo nguồn */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Lưu lượng tạo nguồn (m³/s):</span>
            <input 
              type="number" 
              step="any"
              className="w-20 px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500"
              value={sourceFlow}
              onChange={(e) => setSourceFlow && setSourceFlow(e.target.value)}
            />
          </div>

          {/* Hệ số gia cố */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Hệ số gia cố:</span>
            <input 
              type="number" 
              step="any"
              className="w-20 px-2 py-1 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
              value={reinforcementFactor}
              onChange={(e) => setReinforcementFactor && setReinforcementFactor(e.target.value)}
            />
          </div>

          {/* Mức độ thấm */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Mức độ thấm:</span>
            <select 
              className="w-32 pl-2 pr-7 py-1 border border-slate-300 rounded outline-none focus:border-blue-500"
              value={permeabilityLevel}
              onChange={(e) => {
                if (setPermeabilityLevel) setPermeabilityLevel(e.target.value);
                if (applyToAll && onClearSegments) onClearSegments();
              }}
            >
              {permeabilityMainOptions.length > 0 ? (
                permeabilityMainOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
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
          </div>

          {/* Áp dụng toàn tuyến */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-slate-600 font-medium">Áp dụng toàn tuyến</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={applyToAll} onChange={() => {
                const next = !applyToAll;
                if (setApplyToAll) setApplyToAll(next);
                if (next && onClearSegments) onClearSegments();
              }} />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex-1"></div>

          {/* Point Config */}
          <div className="flex items-center border-l border-slate-200 pl-4">
            <div className="flex items-stretch bg-white border border-slate-300 rounded overflow-hidden shadow-sm">
              <input 
                type="text"
                placeholder="Tên cọc"
                className="w-20 px-2 py-1 outline-none text-center text-slate-700 border-r border-slate-300"
              />
              <div className="flex items-center border-r border-slate-300 px-2 bg-white">
                <input 
                  type="text"
                  placeholder="Lý trình"
                  className="w-16 outline-none text-right text-slate-700 bg-transparent"
                />
                <span className="text-slate-500 ml-1">m</span>
              </div>
              <button className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-r border-slate-300" title="Thêm">
                <Plus size={14} />
              </button>
              <button className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-slate-50 border-r border-slate-300" title="Cập nhật">
                <Save size={14} />
              </button>
              <button className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-50" title="Xoá">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
