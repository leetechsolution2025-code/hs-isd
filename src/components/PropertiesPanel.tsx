import React, { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';

interface PropertiesPanelProps {
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  collapsedTitle?: string;
  topBar?: ReactNode;
  children: ReactNode;
  width?: string;
}

export function PropertiesPanel({
  isExpanded,
  onToggle,
  collapsedTitle = "Thuộc tính",
  topBar,
  children,
  width = "w-[320px]"
}: PropertiesPanelProps) {
  return (
    <div className={`absolute right-0 top-0 bottom-0 z-10 transition-all duration-300 bg-[#f0f0f0] border-l border-slate-300 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] ${isExpanded ? width : 'w-10'}`}>
      
      {!isExpanded && (
        <>
          <div className="flex items-center justify-center p-2 border-b border-slate-300 h-[46px]">
            <button 
              onClick={() => onToggle(true)} 
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors shrink-0"
              title="Mở rộng"
            >
              <Settings2 size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <div className="h-full flex flex-col items-center pt-2">
              <span className="text-slate-500 font-bold text-[11px] uppercase [writing-mode:vertical-rl] rotate-180 tracking-[0.2em] whitespace-nowrap">
                {collapsedTitle}
              </span>
            </div>
          </div>
        </>
      )}

      {isExpanded && (
        <div className="flex flex-col h-full">
          {topBar && (
            <div className="p-2 border-b border-slate-300 flex items-center gap-1 bg-[#e4e4e4]">
              {topBar}
              <button 
                onClick={() => onToggle(false)} 
                className="p-1 border border-slate-400 bg-white hover:bg-slate-100 flex items-center justify-center ml-auto text-slate-600 shrink-0"
                title="Thu gọn"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-2 custom-scrollbar select-none">
            <div className="border border-slate-400 bg-white shadow-sm flex flex-col">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PropertyGroup({ title, children, defaultExpanded = true }: { title: string, children: ReactNode, defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="flex flex-col">
      <div 
        className="flex justify-between items-center bg-[#d4d4d4] px-2 py-1 border-b border-slate-400 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[11px] font-bold text-black">{title}</span>
        {expanded ? <ChevronDown size={14} className="text-black" /> : <ChevronRight size={14} className="text-black" />}
      </div>
      {expanded && (
        <div className="flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}

export function PropertyRow({ label, children }: { label: string | ReactNode, children: ReactNode }) {
  return (
    <div className="flex border-b border-slate-300 last:border-b-0">
      <div className="w-[145px] shrink-0 whitespace-nowrap bg-[#f0f0f0] border-r border-slate-300 px-2 py-1 text-[11px] text-black flex items-center">
        {label}
      </div>
      <div className="flex-1 bg-white flex">
        {children}
      </div>
    </div>
  );
}
