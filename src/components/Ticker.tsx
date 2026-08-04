"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Megaphone } from "lucide-react";
import "./Ticker.css";

interface TickerItem {
  text: string;
  link?: string;
  title?: string;
  type: string;
}

export default function Ticker({ pageTitle, customNews }: { pageTitle?: string, customNews?: TickerItem[] }) {
  const pathname = usePathname();
  const [news, setNews] = useState<TickerItem[]>([]);

  let module = "general";
  let colorClass = "bg-blue-50 text-blue-600 border-b border-blue-100";
  let title = "THÔNG BÁO:";

  if (pathname?.includes("/design")) {
    module = "design";
    colorClass = "bg-indigo-50 text-indigo-600 border-b border-indigo-100";
    title = "THIẾT KẾ:";
  } else if (pathname?.includes("/admin")) {
    module = "admin";
    colorClass = "bg-emerald-50 text-emerald-600 border-b border-emerald-100";
    title = "QUẢN TRỊ:";
  }

  if (pageTitle) {
    title = pageTitle.toUpperCase() + ":";
  }

  useEffect(() => {
    fetch(`/api/ticker?module=${module}`)
      .then(res => {
        if (!res.ok) throw new Error("API not found")
        return res.json()
      })
      .then(json => {
        if (json.data && json.data.length > 0) {
          setNews(json.data);
        }
      })
      .catch(err => {
        console.warn("Ticker API not found, using dummy data");
      });
  }, [module]);

  const displayNews = customNews || news;
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(50);

  useEffect(() => {
    if (wrapperRef.current && contentRef.current) {
      const distance = contentRef.current.scrollWidth;
      const speed = 70; // px per second
      setDuration(Math.max(distance / speed, 10)); // Ensure > 0
    }
  }, [displayNews]);

  const formatTickerText = (text: string) => {
    if (!text) return "";
    return text.replace(/(^|[^\w])([+-]?\d+(?:[.,]\d+)*(?:\s*[đ₫%])?)(?![^<]*>)/gi, '$1<span class="ticker-number">$2</span>');
  };

  return (
    <div className={`dynamic-ticker-container flex items-center shrink-0 px-4 ${colorClass}`}>
      <div className="flex items-center mr-4 font-bold whitespace-nowrap shrink-0 text-[13px] gap-2 tracking-wide">
        <Megaphone size={16} />
        {title}
      </div>
      <div ref={wrapperRef} className="dynamic-ticker-scroll-wrapper grow overflow-hidden text-[13px]">
        <div ref={contentRef} className="dynamic-ticker-content" style={{ animationDuration: `${duration}s` }}>
          {displayNews.length > 0 ? (
            displayNews.map((item, idx) => (
              <span key={idx} className="mr-12 text-slate-700 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                <span dangerouslySetInnerHTML={{ __html: formatTickerText(item.text) }} />
              </span>
            ))
          ) : (
            <span className="mr-12 text-slate-600">Đang cập nhật dữ liệu...</span>
          )}
        </div>
      </div>
    </div>
  );
}
