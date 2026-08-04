"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, Grid3x3, Calculator, Bell, MessageCircleMore, ChevronDown, Settings, LogOut, Shield, Droplets } from "lucide-react"

interface TopbarProps {
  onToggleSidebar?: () => void
  company?: any
}

const getInitials = (name?: string, email?: string) => {
  if (name) {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  if (email) return email.substring(0, 2).toUpperCase()
  return 'U'
}

const DEPT_ROUTES: Record<string, string> = {
  'Ban lãnh đạo': '/board',
  'Phòng hành chính': '/administration',
  'Phòng Tài chính kế toán': '/finance',
  'Phòng Khảo sát': '/survey',
  'Phòng Thiết kế': '/design',
  'Phòng Thi công dự toán': '/construction',
};

export default function Topbar({ onToggleSidebar, company }: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [gridMenuOpen, setGridMenuOpen] = useState(false)
  const [userAccesses, setUserAccesses] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const gridMenuRef = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/user/access?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserAccesses(data)
          }
        })
        .catch(console.error)
    }
  }, [currentUser])

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)) } catch (e) {}
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setGridMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header 
      className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 flex items-center justify-between px-5"
      style={{ height: 62 }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <Menu size={22} />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <div className="flex items-center gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-9 w-9 object-contain rounded-lg shadow-sm border border-slate-200 bg-white" />
          ) : (
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <Droplets className="text-white" size={20} />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h1 className="text-sm md:text-[14px] font-bold text-slate-800 uppercase tracking-tight leading-tight">
              {company?.name || 'CÔNG TY CỔ PHẦN TƯ VẤN XÂY DỰNG THUỶ LỢI VÀ CƠ SỞ HẠ TẦNG HẢI DƯƠNG'}
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">
              {company?.internationalName ? company.internationalName.toLowerCase() : 'the hydraulic and infrastructure consultant hai duong joint stock company'}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        
        {/* Grid Menu */}
        <div className="relative" ref={gridMenuRef}>
          <button 
            onClick={() => setGridMenuOpen(!gridMenuOpen)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${gridMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'}`}
          >
            <i className="bi bi-grid-3x3-gap text-lg" />
          </button>
          
          {gridMenuOpen && (
            <div className="absolute top-[110%] right-0 w-[480px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Quản lý trực tiếp</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chuyển nhanh sang các bộ phận được cấp quyền</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-auto">
                {userAccesses.length > 0 ? (
                  userAccesses.map((acc, idx) => {
                    const route = acc.department?.name ? DEPT_ROUTES[acc.department.name] : null;
                    return (
                      <Link 
                        key={idx} 
                        href={route || '#'}
                        onClick={() => setGridMenuOpen(false)}
                        className="flex flex-col items-center justify-center text-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all gap-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <i className="bi bi-box text-xl" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{acc.department?.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{acc.accessLevel === 2 ? 'Toàn quyền' : 'Chỉ xem'}</div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-500 text-sm">
                    Bạn chưa được cấp quyền truy cập bộ phận nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors">
          <i className="bi bi-calculator text-lg" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors">
          <i className="bi bi-bell text-lg" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors">
          <i className="bi bi-chat-dots text-lg" />
        </button>

        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-[13px] uppercase tracking-wide">
              {getInitials(currentUser?.name, currentUser?.email)}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-[13px] font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight truncate max-w-[120px]">
                {currentUser?.role === 'ADMIN' ? 'Quản trị hệ thống' : (currentUser?.departmentName || 'Nhân viên')}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 ml-1 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-base mb-2 shadow-sm uppercase tracking-wide">
                  {getInitials(currentUser?.name, currentUser?.email)}
                </div>
                <p className="font-bold text-slate-800 truncate w-full">
                  {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}
                </p>
                <p className="text-xs text-slate-500 truncate w-full">
                  {currentUser?.role === 'ADMIN' ? 'Quản trị hệ thống' : (currentUser?.departmentName || 'Nhân viên')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate w-full">{currentUser?.email || ''}</p>
              </div>
              
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left">
                  <Settings size={16} />
                  Thiết lập tài khoản
                </button>
              </div>
              
              <div className="p-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    localStorage.removeItem('currentUser')
                    window.location.href = '/'
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
