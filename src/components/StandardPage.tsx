import React, { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import Ticker from "@/components/Ticker";

interface StandardPageProps {
  title: string;
  description?: string;
  icon?: any;
  color?: "blue" | "emerald" | "violet" | "rose" | "amber" | "cyan" | "indigo";
  children: ReactNode;
  /** Nội dung hiển thị bên phải header (nếu có) */
  headerActions?: ReactNode;
  /** Tùy chỉnh màu nền trang, mặc định là #F1F5F9 */
  background?: string;
  /** Tự động bọc nội dung trong Card trắng? Mặc định true */
  useCard?: boolean;
  /** Padding cho vùng nội dung, mặc định là p-2 (8px) */
  paddingClassName?: string;
  /** Tùy chọn nút Quay lại */
  showBackButton?: boolean;
  onBack?: () => void;
  /** Ẩn Ticker */
  hideTicker?: boolean;
}

export default function StandardPage({
  title,
  description,
  icon,
  color = "indigo",
  children,
  headerActions,
  background = "#F1F5F9",
  useCard = true,
  paddingClassName = "p-2",
  showBackButton,
  onBack,
  hideTicker,
}: StandardPageProps) {
  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden relative" style={{ background }}>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        color={color}
        showBackButton={showBackButton}
        onBack={onBack}
      >
        {headerActions}
      </PageHeader>
      
      {!hideTicker && <Ticker />}

      <div className={`flex-1 flex flex-col min-h-0 ${paddingClassName}`}>
        {useCard ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex-1 overflow-auto min-h-0">
            {children}
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
