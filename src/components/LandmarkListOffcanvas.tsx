import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import FullWidthTable from './FullWidthTable';
import { ConfirmDialog } from './ConfirmDialog';

interface LandmarkPoint {
  name: string;
  x: number;
  y: number;
}

interface LandmarkListOffcanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (data: LandmarkPoint[]) => void;
  onDelete?: () => void;
  initialData?: LandmarkPoint[];
}

export default function LandmarkListOffcanvas({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  initialData = []
}: LandmarkListOffcanvasProps) {
  const [points, setPoints] = useState<LandmarkPoint[]>(initialData);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPoints(initialData);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (onUpdate) onUpdate(points);
    onClose();
  };

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    setPoints([]);
    if (onDelete) onDelete();
    onClose();
    setIsConfirmOpen(false);
  };

  const handleCellChange = (index: number, field: keyof LandmarkPoint, value: string) => {
    const updated = [...points];
    if (field === 'name') {
      updated[index][field] = value;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    setPoints(updated);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 z-[4000] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 bottom-0 w-[400px] bg-white z-[4001] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Danh sách điểm mốc</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {points.length > 0 ? (
            <div className="flex-1 flex flex-col bg-white overflow-hidden px-6 pb-6 pt-0">
              <FullWidthTable
                nestedHead={
                  <tr className="uppercase text-[10px] tracking-wider font-bold text-center border-b border-slate-200">
                    <th className="w-[10%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">STT</th>
                    <th className="w-[30%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Tên mốc</th>
                    <th className="w-[30%] px-2 py-2 border-r border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Tọa độ X</th>
                    <th className="w-[30%] px-2 py-2 border-slate-200 bg-[#fafafa] sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0]">Tọa độ Y</th>
                  </tr>
                }
              >
                {points.map((row, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors text-center text-[12px] text-slate-700">
                    <td className="px-2 py-1.5 border-r border-slate-200 font-medium">{index + 1}</td>
                    <td className="px-0 py-0 border-r border-slate-200">
                      <input 
                        type="text" 
                        value={row.name} 
                        onChange={(e) => handleCellChange(index, 'name', e.target.value)}
                        className="w-full h-full px-2 py-1.5 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-0 py-0 border-r border-slate-200">
                      <input 
                        type="number" 
                        value={row.x} 
                        onChange={(e) => handleCellChange(index, 'x', e.target.value)}
                        className="w-full h-full px-2 py-1.5 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-0 py-0">
                      <input 
                        type="number" 
                        value={row.y} 
                        onChange={(e) => handleCellChange(index, 'y', e.target.value)}
                        className="w-full h-full px-2 py-1.5 text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </FullWidthTable>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500">
              <p className="text-center mb-4">Chưa có dữ liệu điểm mốc.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors w-1/2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={points.length === 0}
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Xoá danh sách
          </button>
          
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors w-1/2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={points.length === 0}
            onClick={handleUpdate}
          >
            <Save size={16} />
            Cập nhật
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Xác nhận xoá điểm mốc"
        message="Bạn có chắc chắn muốn xóa toàn bộ danh sách điểm mốc này không?"
        confirmLabel="OK"
        cancelLabel="Huỷ"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
