"use client"
import { Droplets } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { saveProject } from '@/app/actions'
import { useState } from 'react'

export function Header() {
  const { getNodes, getEdges } = useReactFlow()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const nodes = getNodes()
    const edges = getEdges()
    
    // We assume a single project for now, pass null to create or update latest
    // In a real app we'd have a ProjectId context
    const projectId = localStorage.getItem('projectId') || null
    
    const result = await saveProject(projectId, nodes, edges)
    if (result.success && result.projectId) {
      localStorage.setItem('projectId', result.projectId)
      // Optional: show a toast notification here
      alert("Đã lưu dự án thành công!")
    } else {
      alert("Lưu dự án thất bại.")
    }
    setIsSaving(false)
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center px-6 shadow-sm z-10 relative">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-inner">
          <Droplets size={20} />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          HD-ISD
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-md shadow-blue-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu dự án'}
        </button>
      </div>
    </header>
  )
}
