"use client"
import React, { useState, useEffect } from 'react'
import StandardPage from '@/components/StandardPage'
import Button from '@/components/Button'
import FullWidthTable from '@/components/FullWidthTable'
import AddUserModal from '@/components/AddUserModal'
import UserDetailOffcanvas from '@/components/UserDetailOffcanvas'

import { Users, Search, Plus, ChevronDown } from 'lucide-react'
import { getCategoryGroups, getCategories, getUsers, deleteUser } from '@/app/actions'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import toast from 'react-hot-toast'

function getInitials(name: string) {
  if (!name || !name.trim()) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return words[0][0].toUpperCase()
}

export default function UsersPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const groups = await getCategoryGroups()
      
      const deptGroup = groups.find((g: any) => g.name.toLowerCase().includes('phòng ban'))
      if (deptGroup) {
        setDepartments(await getCategories(deptGroup.id))
      }

      const statusGroup = groups.find((g: any) => g.name.toLowerCase().includes('trạng thái nhân viên') || g.name.toLowerCase() === 'trạng thái')
      if (statusGroup) {
        setStatuses(await getCategories(statusGroup.id))
      }

      const allUsers = await getUsers()
      setUsers(allUsers)
    }
    loadData()
  }, [])

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    const res = await deleteUser(userToDelete.id)
    setIsDeleting(false)
    setIsConfirmOpen(false)
    if (res.success) {
      toast.success('Đã xóa hồ sơ nhân viên')
      const allUsers = await getUsers()
      setUsers(allUsers)
    } else {
      toast.error('Lỗi khi xóa: ' + res.error)
    }
  }

  return (
    <StandardPage hideTicker
      title="Quản lý người dùng"
      description="Danh sách tài khoản và nhân sự trong hệ thống"
      icon={Users}
      color="violet"
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative min-w-[200px]">
            <select className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer">
              <option value="">Tất cả phòng ban</option>
              {departments.length > 0 ? departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              )) : (
                <>
                  <option value="bdh">Ban Giám đốc</option>
                  <option value="kt">Phòng Kế toán</option>
                  <option value="hcns">Phòng Hành chính Nhân sự</option>
                  <option value="tk">Phòng Thiết kế</option>
                </>
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[160px]">
            <select className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer">
              <option value="">Tất cả trạng thái</option>
              {statuses.length > 0 ? statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              )) : (
                <>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã khóa</option>
                </>
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm họ tên, email, số điện thoại..." 
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>

          <Button variant="primary" onClick={() => {
            setSelectedUser(null)
            setIsAddModalOpen(true)
          }}>
            <Plus size={16} className="mr-1.5" /> Thêm mới
          </Button>
        </div>

        {/* Content Area */}
        <FullWidthTable 
          head={
            <>
              <th className="px-6 py-2.5">Nhân viên</th>
              <th className="px-6 py-2.5">Phòng ban</th>
              <th className="px-6 py-2.5 text-center">Loại</th>
              <th className="px-6 py-2.5 text-center">Trạng thái</th>
              <th className="px-6 py-2.5 text-center">Ngày vào làm</th>
            </>
          }
        >
          {users.length > 0 ? (
            users.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedUser(user)
                  setIsDetailOpen(true)
                }}
              >
                <td className="px-6 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-top" />
                      ) : (
                        getInitials(user.fullName || user.email)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{user.fullName || 'Chưa cập nhật'}</div>
                      <div className="text-[11px] text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-2">
                  <div className="text-sm text-slate-700">{user.department?.name || '---'}</div>
                  {user.level?.name && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{user.level.name}</div>
                  )}
                </td>
                <td className="px-6 py-2 text-center">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                    {user.employeeType?.name || user.role}
                  </span>
                </td>
                <td className="px-6 py-2 text-center">
                  <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Đang làm việc
                  </span>
                </td>
                <td className="px-6 py-2 text-slate-500 text-center">
                  {user.startDate ? new Date(user.startDate).toLocaleDateString('vi-VN') : '---'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                Chưa có dữ liệu nhân viên nào trong hệ thống.
              </td>
            </tr>
          )}
        </FullWidthTable>
      </div>

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedUser(null)
        }} 
        editUser={selectedUser}
      />
      <UserDetailOffcanvas 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        user={selectedUser} 
        onEdit={(user) => {
          setIsDetailOpen(false)
          setSelectedUser(user)
          setIsAddModalOpen(true)
        }}
        onDelete={(user) => {
          setIsDetailOpen(false)
          setUserToDelete(user)
          setIsConfirmOpen(true)
        }}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        title="Xóa hồ sơ nhân viên"
        message={`Bạn có chắc chắn muốn xóa hồ sơ của ${userToDelete?.fullName || userToDelete?.email} không? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        loading={isDeleting}
      />
    </StandardPage>
  )
}
