import React from 'react'
import { X, Edit2, Printer, Trash2 } from 'lucide-react'
import Button from './Button'

interface UserDetailOffcanvasProps {
  isOpen: boolean
  onClose: () => void
  user: any | null
  onEdit?: (user: any) => void
  onDelete?: (user: any) => void
}

function getInitials(name: string) {
  if (!name || !name.trim()) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return words[0][0].toUpperCase()
}

export default function UserDetailOffcanvas({ isOpen, onClose, user, onEdit, onDelete }: UserDetailOffcanvasProps) {
  if (!isOpen) return null

  const isAdmin = user?.email === 'admin@haiduong.com'

  const handleDeleteClick = () => {
    if (!user) return
    onDelete?.(user)
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 z-[4000] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 bottom-0 w-[400px] bg-white z-[4001] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-800">Thông tin chi tiết</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {user ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl mb-4 overflow-hidden shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-top" />
                ) : (
                  getInitials(user.fullName || user.email)
                )}
              </div>
              <h3 className="font-bold text-xl text-slate-900">{user.fullName || 'Chưa cập nhật'}</h3>
              <p className="text-slate-500 font-mono mt-1">{user.employeeCode || '---'}</p>
              <div className="mt-3 flex flex-row flex-wrap justify-center items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {user.department?.name || 'Chưa xếp phòng ban'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {user.level?.name || 'Chưa xếp cấp bậc'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin liên hệ</h4>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Email</span>
                    <span className="text-sm font-medium text-slate-800">{user.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Giới tính</span>
                    <span className="text-sm font-medium text-slate-800">{user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : '---'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Ngày sinh</span>
                    <span className="text-sm font-medium text-slate-800">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Công việc & Hợp đồng</h4>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Cấp bậc</span>
                    <span className="text-sm font-medium text-slate-800">{user.level?.name || '---'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Loại nhân viên</span>
                    <span className="text-sm font-medium text-slate-800">{user.employeeType?.name || '---'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Ngày vào làm</span>
                    <span className="text-sm font-medium text-slate-800">
                      {user.startDate ? new Date(user.startDate).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Loại hợp đồng</span>
                    <span className="text-sm font-medium text-slate-800">{user.contractType?.name || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Không tìm thấy thông tin
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <Button 
            variant="danger" 
            className="flex-none justify-center px-3" 
            onClick={handleDeleteClick} 
            title={isAdmin ? "Tài khoản quản trị hệ thống không thể xóa" : "Xóa hồ sơ"}
            disabled={isAdmin}
          >
            <Trash2 size={16} />
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 justify-center" 
            onClick={() => onEdit?.(user)}
            title={isAdmin ? "Tài khoản quản trị hệ thống không thể sửa" : ""}
            disabled={isAdmin}
          >
            <Edit2 size={16} className="mr-2" />
            Sửa
          </Button>
          <Button variant="primary" className="flex-1 justify-center bg-slate-800 hover:bg-slate-900 focus:ring-slate-800">
            <Printer size={16} className="mr-2" />
            In hồ sơ
          </Button>
        </div>
      </div>
    </>
  )
}
