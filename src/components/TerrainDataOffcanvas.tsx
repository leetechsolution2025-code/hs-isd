import React, { useRef, useState } from 'react'
import { X, Save, Trash2, Plus } from 'lucide-react'
import FullWidthTable from './FullWidthTable'
import { ConfirmDialog } from './ConfirmDialog'

interface TerrainDataOffcanvasProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: (
    data: any[],
    extra?: {
      name: string;
      chainage: number;
      datum: number;
      centerOffset: number;
      centerElevation: number;
    }
  ) => void
  initialData?: any[]
  stakeName?: string
  stakeChainage?: number
  stakeDatum?: number
  centerOffset?: number
  centerElevation?: number
}

export default function TerrainDataOffcanvas({
  isOpen,
  onClose,
  onUpdate,
  initialData = [],
  stakeName = '',
  stakeChainage = 0,
  stakeDatum = 0,
  centerOffset = 0,
  centerElevation = 0
}: TerrainDataOffcanvasProps) {
  const [terrainData, setTerrainData] = useState<any[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Editable stake metadata states
  const [nameVal, setNameVal] = useState(stakeName);
  const [chainageVal, setChainageVal] = useState(stakeChainage);
  const [datumVal, setDatumVal] = useState(stakeDatum);
  const [centerOffsetVal, setCenterOffsetVal] = useState(centerOffset);
  const [centerElevationVal, setCenterElevationVal] = useState(centerElevation);

  React.useEffect(() => {
    if (isOpen) {
      setTerrainData(initialData);
      setSelectedRows(new Set());
      setNameVal(stakeName);
      setChainageVal(stakeChainage);
      setDatumVal(stakeDatum);
      setCenterOffsetVal(centerOffset);
      setCenterElevationVal(centerElevation);
    }
  }, [isOpen, initialData, stakeName, stakeChainage, stakeDatum, centerOffset, centerElevation]);

  if (!isOpen) return null;

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

  const handleCellChange = (index: number, key: string, value: any) => {
    setTerrainData(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-[4000] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main panel container */}
      <div className={`fixed top-0 right-0 bottom-0 w-[400px] bg-white z-[4001] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
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

        {/* Stake parameters editing fields */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Tên cọc</span>
            <input
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Lý trình (m)</span>
            <input
              type="number"
              step="0.01"
              value={chainageVal}
              onChange={(e) => setChainageVal(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Mức so sánh (m)</span>
            <input
              type="number"
              step="0.01"
              value={datumVal}
              onChange={(e) => setDatumVal(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Tọa độ tim (X, Y)</span>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.01"
                placeholder="X"
                value={centerOffsetVal}
                onChange={(e) => setCenterOffsetVal(parseFloat(e.target.value) || 0)}
                className="w-1/2 bg-white border border-slate-300 rounded px-1.5 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800 text-center"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Y"
                value={centerElevationVal}
                onChange={(e) => setCenterElevationVal(parseFloat(e.target.value) || 0)}
                className="w-1/2 bg-white border border-slate-300 rounded px-1.5 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800 text-center"
              />
            </div>
          </div>
        </div>

        {/* Content area: survey points table */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {terrainData.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 pt-2">
              <FullWidthTable
                nestedHead={
                  <tr className="uppercase text-[10px] tracking-wider font-bold text-center border-b border-slate-200 bg-[#fafafa]">
                    <th className="w-[45px] px-2 py-2 border-r border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0] bg-[#fafafa]">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="w-[45%] px-2 py-2 border-r border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0] bg-[#fafafa]">Khoảng cách (m)</th>
                    <th className="w-[45%] px-2 py-2 sticky top-0 z-10 shadow-[0_1px_0_#e2e8f0] bg-[#fafafa]">Cao độ (m)</th>
                  </tr>
                }
              >
                {terrainData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-200 transition-colors text-center text-[12px] text-slate-700 cursor-pointer select-none ${selectedRows.has(index) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleRow(index)}
                  >
                    <td className="px-2 py-1 border-r border-slate-200" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => toggleRow(index)}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 border-r border-slate-200" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        step="0.01"
                        value={row.khoangCach}
                        onChange={(e) => handleCellChange(index, 'khoangCach', e.target.value)}
                        className="w-full text-center px-1 py-0.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded outline-none bg-transparent font-medium text-slate-900"
                      />
                    </td>
                    <td className="px-1 py-0.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        step="0.01"
                        value={row.caoDo}
                        onChange={(e) => handleCellChange(index, 'caoDo', e.target.value)}
                        className="w-full text-center px-1 py-0.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded outline-none bg-transparent font-medium text-slate-900"
                      />
                    </td>
                  </tr>
                ))}
              </FullWidthTable>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-50">
              <p className="text-center">Chưa có điểm khảo sát nào.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          {selectedRows.size > 0 ? (
            <>
              <span className="text-xs text-slate-500 shrink-0 font-medium">
                Đã chọn <span className="font-semibold text-slate-700">{selectedRows.size}</span> dòng
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white font-medium text-xs rounded hover:bg-red-600 transition-colors shadow-sm"
                >
                  <Trash2 size={13} />
                  Xoá ({selectedRows.size})
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setTerrainData(prev => [
                    ...prev,
                    {
                      khoangCach: 0,
                      caoDo: 0
                    }
                  ]);
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors shadow-sm w-1/2"
              >
                <Plus size={14} />
                Thêm dòng
              </button>

              <button
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white font-semibold text-xs rounded hover:bg-blue-700 transition-colors w-1/2 shadow-sm"
                onClick={() => {
                  if (onUpdate) {
                    onUpdate(terrainData, {
                      name: nameVal,
                      chainage: chainageVal,
                      datum: datumVal,
                      centerOffset: centerOffsetVal,
                      centerElevation: centerElevationVal
                    });
                  }
                }}
              >
                <Save size={14} />
                Cập nhật
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteSelected}
        title="Xoá dòng đã chọn"
        message={`Bạn có chắc muốn xoá ${selectedRows.size} dòng đã chọn không?`}
        confirmLabel="Xoá"
        variant="danger"
      />
    </>
  )
}
