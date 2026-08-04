"use client"
import React from 'react'
import StandardPage from '@/components/StandardPage'
import { FileText } from 'lucide-react'

export default function RulesPage() {
  return (
    <StandardPage hideTicker
      title="Nội quy lao động"
      description="Quản lý các quy định và nội quy lao động của công ty"
      icon={FileText}
      color="rose"
    >
      <div className="flex items-center justify-center h-full text-slate-400">
        Nội dung quy định, nội quy lao động sẽ được xây dựng tại đây.
      </div>
    </StandardPage>
  )
}
