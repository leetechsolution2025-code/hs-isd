import React, { useRef, useState } from 'react'
import { X, Upload, Save, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import FullWidthTable from './FullWidthTable'
import { ConfirmDialog } from './ConfirmDialog'

interface TerrainDataOffcanvasProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: (data: any[]) => void
  initialData?: any[]
}

export default function TerrainDataOffcanvas({
  isOpen,
  onClose,
  onUpdate,
  initialData = []
}: TerrainDataOffcanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [terrainData, setTerrainData] = useState<any[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTerrainData(initialData);
      setSelectedRows(new Set());
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const formatNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return parseFloat(num.toFixed(2));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (!result) return;

        let parsedData: any[] = [];

        if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          parsedData = json.slice(1).filter(row => row.length > 0).map(row => ({
            tenMoc: row[0] || '',
            lyTrinh: formatNumber(row[1]),
            khoangCach: formatNumber(row[2]),
            caoDo: formatNumber(row[3])
          }));
        } else if (file.name.endsWith('.txt')) {
          const text = result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          const startIndex = lines[0].toLowerCase().includes('tên') || lines[0].toLowerCase().includes('mốc') ? 1 : 0;
          
          parsedData = lines.slice(startIndex).map(line => {
            const cols = line.split(/[\t,;]+|\s{2,}/);
            return {
              tenMoc: cols[0] || '',
              lyTrinh: formatNumber(cols[1]),
              khoangCach: formatNumber(cols[2]),
              caoDo: formatNumber(cols[3])
            };
          });
        }

        setTerrainData(parsedData);
        setSelectedRows(new Set());
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Có lỗi xảy ra khi đọc file!");
      }
    };

    if (file.name.endsWith('.xlsx')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const allSelected = terrainData.length > 0 && selectedRows.size === terrainData.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < terrainData.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(terrainData.map((_, i) => i)));
    }
  };

  const toggleRow = (index: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const newData = terrainData.filter((_, i) => !selectedRows.has(i));
    setTerrainData(newData);
    setSelectedRows(new Set());
    setIsConfirmDeleteOpen(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 z-[4000] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 bottom-0 w-[420px] bg-white z-[4001] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Dữ liệu địa hình</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {terrainData.length > 0 ? (
            <div className="flex-1 flex flex-col bg-white overflow-hidden px-6 pb-6 pt-0">
              <FullWidthTable
                nestedHead={
                  <tr className="uppercase text-[10px] tracking-wider font-bold text-center border-b border-slate-200">
                    <th className="w-[40px] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="w-[18%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Tên mốc</th>
                    <th className="w-[24%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Lý trình</th>
                    <th className="w-[24%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Khoảng cách</th>
                    <th className="w-[28%] px-2 py-2 border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Cao độ</th>
                  </tr>
                }
              >
                {terrainData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-200 transition-colors text-center text-[12px] text-slate-700 cursor-pointer select-none ${selectedRows.has(index) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleRow(index)}
                  >
                    <td className="px-2 py-1.5 border-r border-slate-200" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleRow(index)}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">{row.tenMoc}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">{row.lyTrinh}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 whitespace-nowrap">{row.khoangCach}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.caoDo}</td>
                  </tr>
                ))}
              </FullWidthTable>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500">
              <p className="text-center mb-4">Chưa có dữ liệu địa hình.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Upload size={16} />
                Tải lên file dữ liệu
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".txt, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain"
            onChange={handleFileUpload}
          />

          {selectedRows.size > 0 ? (
            <>
              <span className="text-sm text-slate-500 shrink-0">
                Đã chọn <span className="font-semibold text-slate-700">{selectedRows.size}</span> dòng
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white font-medium text-sm rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Trash2 size={15} />
                  Xoá ({selectedRows.size})
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors w-1/2 shadow-sm"
              >
                <Upload size={16} />
                Chọn tệp
              </button>
              
              <button 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors w-1/2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={terrainData.length === 0}
                onClick={() => onUpdate && onUpdate(terrainData)}
              >
                <Save size={16} />
                Cập nhật
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteSelected}
        title="Xoá dữ liệu địa hình"
        message={`Bạn có chắc muốn xoá ${selectedRows.size} dòng đã chọn không? Thao tác này không thể hoàn tác.`}
        confirmText="Xoá"
        confirmVariant="danger"
      />
    </>
  )
}
