"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Info, Globe, AlignJustify, User, Pencil, Check, X, Image as ImageIcon, Database } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import StandardPage from '@/components/StandardPage'
import { getCompanyInfo, updateCompanyInfo } from '@/app/actions'

export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    getCompanyInfo().then(data => {
      setCompany(data)
      setFormData(data)
    })
  }, [])

  if (!mounted) return null

  const handleSave = async () => {
    const result = await updateCompanyInfo(formData)
    if (result.success) {
      setCompany(result.company)
      setIsEditing(false)
    } else {
      alert(result.error || "Có lỗi xảy ra")
    }
  }

  const handleCancel = () => {
    setFormData(company)
    setIsEditing(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File quá lớn, vui lòng chọn file dưới 2MB")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData({ ...formData, logoUrl: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <StandardPage hideTicker
      title="Thông tin công ty"
      description="Quản lý và cập nhật các thông tin cơ bản của hệ thống"
      icon={Database}
      color="indigo"
      paddingClassName="p-4 sm:p-8 max-w-5xl mx-auto w-full"
    >
      <div className="flex flex-col gap-0 h-full">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 gap-4 -mx-6 -mt-6 mb-2 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800 uppercase flex-1">
            {isEditing ? (
              <input 
                type="text" 
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 normal-case font-normal"
                value={formData?.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            ) : (
              company?.name || 'Đang tải...'
            )}
          </h2>
          
          <div className="flex gap-2 shrink-0">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <X size={16} /> Hủy
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  <Check size={16} /> Lưu
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Pencil size={16} /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          {/* Logo Row */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <ImageIcon size={16} className="text-slate-400" />
              <span>Logo Công ty</span>
            </div>
            <div className="flex-1 text-slate-700 flex items-center gap-4">
              {(formData?.logoUrl || company?.logoUrl) ? (
                <img 
                  src={formData?.logoUrl || company?.logoUrl} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain rounded bg-white border border-slate-200 p-1"
                />
              ) : (
                <div className="h-10 px-3 bg-slate-100 text-slate-400 rounded flex items-center justify-center text-sm border border-slate-200 border-dashed">
                  Trống
                </div>
              )}
              {isEditing && (
                <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  Tải lên
                </label>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <span className="font-mono text-slate-400 ml-1">#</span>
              <span>Mã số thuế</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.taxCode || ''} onChange={e => setFormData({...formData, taxCode: e.target.value})} /> : company?.taxCode}
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <MapPin size={16} className="text-slate-400" />
              <span>Địa chỉ Thuế</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.taxAddress || ''} onChange={e => setFormData({...formData, taxAddress: e.target.value})} /> : company?.taxAddress}
            </div>
          </div>

          {/* Row 4 */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <MapPin size={16} className="text-slate-400" />
              <span>Địa chỉ</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /> : company?.address}
            </div>
          </div>

          {/* Slogan */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <Info size={16} className="text-slate-400" />
              <span>Khẩu hiệu</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.slogan || ''} onChange={e => setFormData({...formData, slogan: e.target.value})} /> : company?.slogan}
            </div>
          </div>

          {/* Row 5 */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <Globe size={16} className="text-slate-400" />
              <span>Tên quốc tế</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.internationalName || ''} onChange={e => setFormData({...formData, internationalName: e.target.value})} /> : company?.internationalName}
            </div>
          </div>

          {/* Row 6 */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <AlignJustify size={16} className="text-slate-400" />
              <span>Tên viết tắt</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.shortName || ''} onChange={e => setFormData({...formData, shortName: e.target.value})} /> : company?.shortName}
            </div>
          </div>

          {/* Row 7 */}
          <div className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-48 flex items-center gap-2 text-slate-500 font-medium shrink-0">
              <User size={16} className="text-slate-400" />
              <span>Người đại diện</span>
            </div>
            <div className="flex-1 text-slate-700">
              {isEditing ? <input type="text" className="w-full bg-white border border-slate-300 rounded px-2 py-1" value={formData?.representative || ''} onChange={e => setFormData({...formData, representative: e.target.value})} /> : company?.representative}
            </div>
          </div>
        </div>
      </div>
    </StandardPage>
  )
}
