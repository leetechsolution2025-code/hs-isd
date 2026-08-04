"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Grip } from "lucide-react";

interface PageHeaderProps {
  /** Tên phòng ban / tiêu đề trang */
  title: string;
  /** Mô tả ngắn */
  description?: string;
  /** Icon component (từ lucide-react) */
  icon?: any;
  /** Màu accent cho icon box: "rose" | "indigo" | "emerald" | "amber" | "blue" | "violet" | "cyan" */
  color?: "rose" | "indigo" | "emerald" | "amber" | "blue" | "violet" | "cyan";
  children?: React.ReactNode;
  /** Cho phép quay lại (nếu có logic fromAdmin) */
  showBackButton?: boolean;
  onBack?: () => void;
}

const WEEKDAYS = [
  "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư",
  "Thứ Năm", "Thứ Sáu", "Thứ Bảy",
];

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  rose: { bg: "bg-rose-50 border border-rose-200", icon: "text-rose-500" },
  indigo: { bg: "bg-indigo-50 border border-indigo-200", icon: "text-indigo-500" },
  emerald: { bg: "bg-emerald-50 border border-emerald-200", icon: "text-emerald-500" },
  amber: { bg: "bg-amber-50 border border-amber-200", icon: "text-amber-500" },
  blue: { bg: "bg-blue-50 border border-blue-200", icon: "text-blue-500" },
  violet: { bg: "bg-violet-50 border border-violet-200", icon: "text-violet-500" },
  cyan: { bg: "bg-cyan-50 border border-cyan-200", icon: "text-cyan-500" },
};

function PageHeaderInner({ title, description, icon: Icon = Grip, color = "rose", children, showBackButton, onBack }: PageHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";

  const day = now ? String(now.getDate()).padStart(2, "0") : "00";
  const month = now ? String(now.getMonth() + 1).padStart(2, "0") : "00";
  const year = now ? now.getFullYear() : "";

  const dateStr = now
    ? `${WEEKDAYS[now.getDay()]}, ngày ${day} tháng ${month} năm ${year}`
    : "";

  const colors = COLOR_MAP[color] ?? COLOR_MAP.rose;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#F1F5F9]/80 backdrop-blur-md sticky top-0 z-10 transition-all border-b border-slate-200">
      {/* ── LEFT: Icon box + Tên phòng ban + mô tả ── */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon box */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${colors.bg}`}>
          <Icon size={22} className={colors.icon} strokeWidth={2} />
        </div>

        {/* Text */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight m-0">{title}</h1>
            {showBackButton && (
              <button
                onClick={onBack || (() => router.back())}
                className="flex items-center gap-1 px-2 py-0.5 border border-slate-200 rounded-md bg-white text-slate-700 text-[11px] font-semibold cursor-pointer shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft size={12} /> <span className="hidden sm:inline">Quay lại</span>
              </button>
            )}
          </div>
          {description && <p className="text-[13px] text-slate-500 mt-0.5 mb-0 leading-snug">{description}</p>}
        </div>
      </div>

      {/* ── RIGHT: Đồng hồ + ngày tháng + actions ── */}
      <div className="flex items-center gap-6">
        {children}
        <div className="flex flex-col text-right">
          <span className="text-xl font-bold text-slate-700 leading-none tracking-tight font-mono">{timeStr}</span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-1">{dateStr}</span>
        </div>
      </div>
    </div>
  );
}

export default function PageHeader(props: PageHeaderProps) {
  return (
    <Suspense fallback={<div className="h-[88px] w-full" />}>
      <PageHeaderInner {...props} />
    </Suspense>
  );
}
