import React from 'react';

export type StructureType = 
  | 'pump_irrigation' 
  | 'pump_drainage' 
  | 'pump_combined'
  | 'intake_irrigation' 
  | 'intake_drainage' 
  | 'intake_combined'
  | 'offtake_irrigation'
  | 'drainage_under_canal'
  | 'culvert_road'
  | 'culvert_canal'
  | 'bridge_auto'
  | 'bridge_rough'
  | 'aqueduct'
  | 'weir_in'
  | 'weir_out'
  | 'gate_regulate'
  | 'check_structure'
  | 'drop_structure'
  | 'measure_structure'
  | 'hydropower';

export type StructureStatus = 'planned' | 'existing' | 'repair' | 'abandoned';

interface StructureIconProps extends React.SVGProps<SVGSVGElement> {
  type: StructureType;
  status?: StructureStatus;
}

export const StructureIcon: React.FC<StructureIconProps> = ({ 
  type, 
  status = 'planned', 
  className = '', 
  ...props 
}) => {
  const renderBaseSymbol = () => {
    switch (type) {
      // 1. Trạm bơm
      case 'pump_irrigation':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 6 A6 6 0 0 0 12 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8 L12 12 M7 11 L12 16 M10 16 L12 14" stroke="currentColor" strokeWidth="1" />
            <path d="M18 12 L24 12 M21 9 L24 12 L21 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'pump_drainage':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 6 A6 6 0 0 0 12 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8 L12 12 M7 11 L12 16 M10 16 L12 14" stroke="currentColor" strokeWidth="1" />
            <path d="M6 12 L0 12 M3 9 L0 12 L3 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        );
      case 'pump_combined':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 6 A6 6 0 0 0 12 18 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8 L12 12 M7 11 L12 16 M10 16 L12 14" stroke="currentColor" strokeWidth="1" />
            <path d="M18 10 L24 10 M21 7 L24 10 L21 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14 L0 14 M3 11 L0 14 L3 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        );
        
      // 2. Cống đầu mối
      case 'intake_irrigation':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8 L17 16 M8 7 L16 17 M9 6 L15 18 M6 9 L18 15 M7 11 L17 13 M6 12 L18 12 M7 14 L17 10 M8 16 L16 8 M9 18 L15 6" stroke="currentColor" strokeWidth="1" />
            <path d="M18 12 L24 12 M21 9 L24 12 L21 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'intake_drainage':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8 L17 16 M8 7 L16 17 M9 6 L15 18 M6 9 L18 15 M7 11 L17 13 M6 12 L18 12 M7 14 L17 10 M8 16 L16 8 M9 18 L15 6" stroke="currentColor" strokeWidth="1" />
            <path d="M6 12 L0 12 M3 9 L0 12 L3 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        );
      case 'intake_combined':
        return (
          <g>
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8 L17 16 M8 7 L16 17 M9 6 L15 18 M6 9 L18 15 M7 11 L17 13 M6 12 L18 12 M7 14 L17 10 M8 16 L16 8 M9 18 L15 6" stroke="currentColor" strokeWidth="1" />
            <path d="M18 10 L24 10 M21 7 L24 10 L21 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14 L0 14 M3 11 L0 14 L3 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        );

      // 4. Các công trình trên hệ thống
      case 'offtake_irrigation':
        return (
          <g>
            {/* Đoạn thẳng nhánh hướng ra ngoài dài thêm nữa (y2=-12) */}
            <line x1="12" y1="7.5" x2="12" y2="-12" stroke="currentColor" strokeWidth="2" />
            {/* Chấm tròn đỏ to nằm sát ngoài tim kênh (r=4.5, mép dưới chạm y=12) */}
            <circle cx="12" cy="7.5" r="4.5" fill="#ef4444" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'drainage_under_canal':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 24 L10 20 M12 24 L14 20" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );

      // Giao cắt
      case 'culvert_road':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12 A 4 4 0 0 1 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" />
            <circle cx="16" cy="12" r="1.5" fill="currentColor" />
          </g>
        );
      case 'culvert_canal':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8 A 4 4 0 0 1 12 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="8" r="1.5" fill="currentColor" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </g>
        );
      case 'bridge_auto':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="4" x2="10" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="4" x2="14" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="4" x2="6" y2="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="20" x2="6" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="4" x2="18" y2="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="20" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'bridge_rough':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="20" x2="8" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="16" y2="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="20" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'aqueduct':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <rect x="8" y="8" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="10" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="14" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="10" x2="4" y2="14" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="14" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
        
      // Tràn
      case 'weir_in':
        return (
          <g>
            <line x1="0" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 16 Q 12 6 18 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'weir_out':
        return (
          <g>
            <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 8 Q 12 18 18 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="13" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );

      // Điều tiết, đo đạc
      case 'gate_regulate':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 8.5 L15.5 15.5 M8.5 15.5 L15.5 8.5" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'check_structure':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'drop_structure':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M4 8 L12 8 L12 16 L20 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'measure_structure':
        return (
          <g>
            <line x1="0" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14 L6 8 L16 8 L16 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="18" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14.5" y1="18" x2="17.5" y2="18" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      case 'hydropower':
        return (
          <g>
            <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 12 Q 9.5 8 12 12 T 17 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 overflow-visible ${className}`} {...props}>
      {renderBaseSymbol()}
      
      {/* Wrapper cho trạng thái */}
      {status !== 'planned' && (
        <rect x="1" y="1" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      )}
      
      {status === 'repair' && (
        <g>
          <path d="M10 21 L14 24 M10 24 L14 21" stroke="currentColor" strokeWidth="1.2" />
        </g>
      )}
      
      {status === 'abandoned' && (
        <g>
          <path d="M1 1 L23 23 M23 1 L1 23" stroke="currentColor" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
};
