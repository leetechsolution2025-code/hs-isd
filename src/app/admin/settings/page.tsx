"use client"
import React from 'react'
import StandardPage from '@/components/StandardPage'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <StandardPage hideTicker
      title="Cài đặt hệ thống"
      description="Cấu hình các tham số và tùy chọn chung của ứng dụng"
      icon={Settings}
      color="indigo"
    >
      <div className="flex items-center justify-center h-full text-slate-400">
        Nội dung cài đặt hệ thống sẽ được xây dựng tại đây.
      </div>
    </StandardPage>
  )
}
