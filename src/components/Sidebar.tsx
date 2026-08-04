"use client"

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Droplets, Users, Settings, Database, LogOut, LayoutDashboard, ChevronDown, ChevronRight, Component, Circle } from 'lucide-react'

// Define navigation items based on roles or sections
export const ADMIN_NAV_ITEMS = [
  { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { 
    name: 'Quản trị hệ thống', 
    icon: Component,
    subItems: [
      { name: 'Quản lý danh mục', href: '/admin/categories', icon: Circle },
      { name: 'Phân quyền người dùng', href: '/admin/roles', icon: Circle },
      { name: 'Nội quy lao động', href: '/admin/rules', icon: Circle },
    ]
  },
  { name: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
]

export const USER_NAV_ITEMS = [
  { name: 'Tổng quan', href: '/design', icon: LayoutDashboard },
  { name: 'Quản lý dữ liệu', href: '/projects', icon: Database },
]

interface SidebarProps {
  role?: 'ADMIN' | 'USER'
  company?: any
}

function NavItem({ item, pathname }: { item: any, pathname: string }) {
  const [expanded, setExpanded] = useState(
    item.subItems?.some((sub: any) => pathname === sub.href) || false
  )

  const isActive = pathname === item.href
  const Icon = item.icon
  const hasSubItems = !!item.subItems

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
            expanded ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon size={18} />
            <span className="font-medium text-sm">{item.name}</span>
          </div>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {expanded && (
          <div className="pl-9 pr-4 mt-1">
            {item.subItems.map((sub: any) => {
              const SubIcon = sub.icon
              const isSubActive = pathname === sub.href
              return (
                <a
                  key={sub.href}
                  href={sub.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isSubActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <SubIcon size={6} className={isSubActive ? 'fill-blue-600' : 'fill-slate-400'} strokeWidth={3} />
                  <span>{sub.name}</span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <a 
      key={item.href}
      href={item.href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-600 font-semibold' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{item.name}</span>
    </a>
  )
}

export default function Sidebar({ role = 'USER', company }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = role === 'ADMIN' ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS

  return (
    <div className="w-72 bg-white text-slate-800 flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40">
      <div className="px-6 py-4 bg-slate-50/50">
        <p className="text-[13px] text-slate-500 leading-relaxed text-center">
          {company?.slogan || 'Giải pháp tư vấn toàn diện, nền tảng cho những công trình thủy lợi trường tồn.'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => (
          <NavItem key={i} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors text-left"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
