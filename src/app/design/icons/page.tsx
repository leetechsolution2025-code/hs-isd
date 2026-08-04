"use client";

import React from 'react';
import StandardPage from '@/components/StandardPage';
import { StructureIcon, StructureType, StructureStatus } from '@/components/icons/StructureIcon';

const structures: { type: StructureType; label: string; group: string }[] = [
  { group: 'Trạm bơm', type: 'pump_irrigation', label: 'Tưới' },
  { group: 'Trạm bơm', type: 'pump_drainage', label: 'Tiêu' },
  { group: 'Trạm bơm', type: 'pump_combined', label: 'Tưới tiêu kết hợp' },

  { group: 'Cống đầu mối', type: 'intake_irrigation', label: 'Tưới' },
  { group: 'Cống đầu mối', type: 'intake_drainage', label: 'Tiêu' },
  { group: 'Cống đầu mối', type: 'intake_combined', label: 'Tưới tiêu kết hợp' },

  { group: 'Trên hệ thống kênh', type: 'offtake_irrigation', label: 'Cống lấy nước trên kênh tưới' },
  { group: 'Trên hệ thống kênh', type: 'drainage_under_canal', label: 'Cống tiêu dưới kênh tưới' },

  { group: 'Giao cắt', type: 'culvert_road', label: 'Cống luồn dưới đường' },
  { group: 'Giao cắt', type: 'culvert_canal', label: 'Cống luồn qua kênh' },
  { group: 'Giao cắt', type: 'bridge_auto', label: 'Cầu ô tô' },
  { group: 'Giao cắt', type: 'bridge_rough', label: 'Cầu thô sơ' },
  { group: 'Giao cắt', type: 'aqueduct', label: 'Cầu máng' },

  { group: 'Tràn', type: 'weir_in', label: 'Tràn vào kênh' },
  { group: 'Tràn', type: 'weir_out', label: 'Tràn từ kênh ra' },

  { group: 'Điều tiết, đo đạc', type: 'gate_regulate', label: 'Cống điều tiết' },
  { group: 'Điều tiết, đo đạc', type: 'check_structure', label: 'Công trình dâng nước' },
  { group: 'Điều tiết, đo đạc', type: 'drop_structure', label: 'Bậc/dốc nước' },
  { group: 'Điều tiết, đo đạc', type: 'measure_structure', label: 'Công trình đo nước' },
  { group: 'Điều tiết, đo đạc', type: 'hydropower', label: 'Trạm thuỷ điện' },
];

const statuses: { value: StructureStatus; label: string }[] = [
  { value: 'planned', label: 'Dự định xây dựng' },
  { value: 'existing', label: 'Đã có' },
  { value: 'repair', label: 'Cũ cần sửa chữa' },
  { value: 'abandoned', label: 'Bỏ đi' }
];

export default function IconLibraryPage() {
  return (
    <StandardPage title="Thư viện Ký hiệu Công trình" description="Tiêu chuẩn ký hiệu trên bản vẽ mạng lưới thuỷ lợi">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-slate-200">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200 font-bold text-slate-700 w-[250px]">Hạng mục</th>
              {statuses.map(s => (
                <th key={s.value} className="px-4 py-3 border-r border-slate-200 text-center font-bold text-slate-700">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {structures.map((item, idx) => {
              const showGroup = idx === 0 || structures[idx - 1].group !== item.group;
              return (
                <React.Fragment key={item.type}>
                  {showGroup && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={5} className="px-4 py-2 font-bold text-blue-700 uppercase text-xs">
                        {item.group}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 border-r border-slate-200">
                      <div className="font-medium text-slate-800">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.type}</div>
                    </td>
                    {statuses.map(s => (
                      <td key={s.value} className="px-4 py-3 border-r border-slate-200 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <StructureIcon 
                            type={item.type} 
                            status={s.value} 
                            className="w-10 h-10 text-slate-700 hover:text-blue-600 transition-colors" 
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </StandardPage>
  );
}
