import React, { useState } from 'react'
import { X, FileType, Code } from 'lucide-react'

export interface ExportSettings {
  horizontalScale: number;
  verticalScale: number;
  datumElevation: number | null; // null means auto
  stakePrefix: string;
}

interface ExportSettingsOffcanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onExportLISP: (settings: ExportSettings) => void;
  onExportDXF: (settings: ExportSettings) => void;
  onExportCSV: () => void;
  defaultSettings?: Partial<ExportSettings>;
}

export default function ExportSettingsOffcanvas({
  isOpen,
  onClose,
  onExportLISP,
  onExportDXF,
  onExportCSV,
  defaultSettings
}: ExportSettingsOffcanvasProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    horizontalScale: defaultSettings?.horizontalScale || 1000,
    verticalScale: defaultSettings?.verticalScale || 100,
    datumElevation: defaultSettings?.datumElevation ?? null,
    stakePrefix: defaultSettings?.stakePrefix || '',
  });

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[110]"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl flex flex-col z-[120] transform transition-transform duration-300 translate-x-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <i className="bi bi-gear-fill"></i>
            </div>
            <h2 className="text-base font-semibold text-slate-800">Cấu hình xuất bản vẽ</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-800 border-b border-slate-100 pb-2">Thông số tỷ lệ</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Tỷ lệ ngang (X)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">1:</span>
                  </div>
                  <input 
                    type="number" 
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={settings.horizontalScale}
                    onChange={(e) => setSettings({...settings, horizontalScale: Number(e.target.value) || 1000})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Tỷ lệ đứng (Y)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">1:</span>
                  </div>
                  <input 
                    type="number" 
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={settings.verticalScale}
                    onChange={(e) => setSettings({...settings, verticalScale: Number(e.target.value) || 100})}
                  />
                </div>
              </div>
            </div>


            
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-600">Tiền tố tên cọc</label>
              <input 
                type="text" 
                placeholder="VD: Cọc "
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={settings.stakePrefix}
                onChange={(e) => setSettings({...settings, stakePrefix: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-medium text-slate-800 border-b border-slate-100 pb-2">Hành động xuất</h3>
            
            <button 
              onClick={() => { onExportDXF(settings); onClose(); }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center">
                  <FileType size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">Tải bản vẽ DXF (Khuyên dùng)</p>
                  <p className="text-xs text-slate-500">Mở trực tiếp trên AutoCAD</p>
                </div>
              </div>
              <i className="bi bi-download text-blue-600"></i>
            </button>
            
            <button 
              onClick={() => { onExportLISP(settings); onClose(); }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Code size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Tải AutoCAD Script (.scr)</p>
                  <p className="text-xs text-slate-500">Kéo thả vào AutoCAD để tự vẽ</p>
                </div>
              </div>
              <i className="bi bi-download text-slate-400"></i>
            </button>
            
            <button 
              onClick={() => { onExportCSV(); onClose(); }}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                  <i className="bi bi-filetype-csv text-xl"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Tải dữ liệu thô (CSV)</p>
                  <p className="text-xs text-slate-500">Mở bằng Excel để xem thô</p>
                </div>
              </div>
              <i className="bi bi-download text-slate-400"></i>
            </button>
          </div>

        </div>

      </div>
    </>
  )
}
