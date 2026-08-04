"use client"

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { getCompanyInfo } from '@/app/actions'

export default function AdminLayoutClient({ children, role = 'ADMIN' }: { children: React.ReactNode, role?: 'ADMIN' | 'USER' }) {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    getCompanyInfo().then(data => {
      setCompany(data)
    })
  }, [])

  if (!mounted) return null

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Topbar company={company} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {sidebarOpen && (
          <div className="h-full border-r border-slate-200 shrink-0">
            <Sidebar company={company} role={role} />
          </div>
        )}

        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  )
}
