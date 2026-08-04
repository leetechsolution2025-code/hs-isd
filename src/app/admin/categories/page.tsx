"use client"
// Force rebuild 1

import React, { useState, useEffect } from 'react'
import StandardPage from '@/components/StandardPage'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { FolderTree, Plus, Pencil, Search, ChevronRight, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { 
  getCategoryGroups, 
  createCategoryGroup, 
  updateCategoryGroup, 
  deleteCategoryGroups,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/app/actions'

export default function CategoriesPage() {
  // Data State
  const [groups, setGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Selection State
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [categoryPath, setCategoryPath] = useState<any[]>([])
  const activeParentId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : null
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)

  // Form States
  const [groupFormData, setGroupFormData] = useState({ name: '' })
  const [categoryFormData, setCategoryFormData] = useState({ name: '', orderIndex: 1, isActive: true, A1: '', m1: '' })

  // Initial Fetch
  useEffect(() => {
    loadGroups()
  }, [])

  // Load details when active group changes
  useEffect(() => {
    if (activeGroupId) {
      setCategoryPath([])
      loadCategories(activeGroupId, null)
    } else {
      setCategories([])
      setCategoryPath([])
    }
  }, [activeGroupId])

  // Fetchers
  const loadGroups = async () => {
    setLoading(true)
    const data = await getCategoryGroups()
    setGroups(data)
    if (data.length > 0 && !activeGroupId) {
      setActiveGroupId(data[0].id)
    }
    setLoading(false)
  }

  const loadCategories = async (groupId: string, parentId: string | null = null) => {
    setLoadingDetails(true)
    const data = await getCategories(groupId, parentId)
    setCategories(data)
    setLoadingDetails(false)
  }

  // Group Handlers
  const toggleSelectGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSaveGroup = async () => {
    if (!groupFormData.name.trim()) return
    
    if (editingGroup) {
      await updateCategoryGroup(editingGroup.id, groupFormData.name)
    } else {
      await createCategoryGroup(groupFormData.name)
    }
    setIsGroupModalOpen(false)
    loadGroups()
  }

  const handleDeleteGroups = async () => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedGroupIds.length} nhóm danh mục này không?`)) {
      await deleteCategoryGroups(selectedGroupIds)
      setSelectedGroupIds([])
      if (selectedGroupIds.includes(activeGroupId as string)) {
        setActiveGroupId(null)
      }
      loadGroups()
    }
  }

  // Category Handlers
  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim() || !activeGroupId) return
    
    let metadata: string | undefined = undefined;
    if (isActiveGroupMainCanalPerm) {
      metadata = JSON.stringify({ 
        A1: categoryFormData.A1 === '' ? null : Number(categoryFormData.A1), 
        m1: categoryFormData.m1 === '' ? null : Number(categoryFormData.m1) 
      });
    }
    
    const { A1, m1, ...validData } = categoryFormData;
    
    if (editingCategory) {
      await updateCategory(editingCategory.id, { ...validData, metadata })
    } else {
      await createCategory({ ...validData, groupId: activeGroupId, parentId: activeParentId, metadata })
    }
    setIsCategoryModalOpen(false)
    loadCategories(activeGroupId, activeParentId)
    loadGroups() // To update counts
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) {
      await deleteCategory(id)
      if (activeGroupId) loadCategories(activeGroupId, activeParentId)
      loadGroups() // To update counts
    }
  }

  // Render Helpers
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const activeGroup = groups.find(g => g.id === activeGroupId)
  const isActiveGroupMainCanalPerm = activeGroup?.name?.toLowerCase().includes('độ thấm kênh chính')

  return (
    <StandardPage hideTicker
      title="Quản lý danh mục"
      description="Quản lý danh mục dùng chung cho toàn hệ thống"
      icon={FolderTree}
      color="blue"
    >
      <div className="flex h-full gap-6">
        {/* L E F T   C O L U M N */}
        <div className="w-1/3 flex flex-col h-full relative">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
              Nhóm danh mục
            </h3>
            <div className="flex items-center gap-1.5">
              {selectedGroupIds.length > 0 && (
                <Button variant="danger" size="icon" title="Xóa đã chọn" onClick={handleDeleteGroups}>
                  <Trash2 size={14} />
                </Button>
              )}
              {selectedGroupIds.length === 1 && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  title="Chỉnh sửa"
                  onClick={() => {
                    const g = groups.find(x => x.id === selectedGroupIds[0])
                    setEditingGroup(g)
                    setGroupFormData({ name: g.name })
                    setIsGroupModalOpen(true)
                  }}
                >
                  <Pencil size={14} />
                </Button>
              )}
              <Button 
                variant="primary" 
                size="icon" 
                title="Thêm mới"
                onClick={() => {
                  setEditingGroup(null)
                  setGroupFormData({ name: '' })
                  setIsGroupModalOpen(true)
                }}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhóm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-0 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>

          {/* Group List */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} /> Đang tải...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center p-8 text-sm text-slate-400">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredGroups.map(group => {
                  const isActive = activeGroupId === group.id
                  const isSelected = selectedGroupIds.includes(group.id)
                  const count = group._count?.categories || 0
                  
                  return (
                    <div 
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 text-sm text-left border rounded-lg group transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-blue-100 font-medium' 
                          : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div 
                          className="flex items-center justify-center cursor-pointer shrink-0" 
                          onClick={(e) => toggleSelectGroup(group.id, e)}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all"
                          />
                        </div>
                        <span className="truncate pr-2">{group.name}</span>
                      </div>
                      <div className={`flex items-center gap-2 shrink-0 ${!isActive && 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'text-blue-500 bg-blue-100' : 'text-slate-400 bg-slate-100'}`}>
                          {count}
                        </span>
                        <ChevronRight size={16} className={isActive ? 'text-blue-400' : 'text-slate-300'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px my-8 bg-slate-200 shadow-[inset_1px_0_1px_rgba(0,0,0,0.05)]" />

        {/* R I G H T   C O L U M N */}
        <div className="w-2/3 flex flex-col h-full relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {categoryPath.length > 0 && (
                <button 
                  onClick={() => {
                    const newPath = [...categoryPath]
                    newPath.pop()
                    setCategoryPath(newPath)
                    const newParentId = newPath.length > 0 ? newPath[newPath.length - 1].id : null
                    if (activeGroupId) loadCategories(activeGroupId, newParentId)
                  }}
                  className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
                {categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].name : 'Chi tiết danh mục'}
              </h3>
            </div>
            {activeGroupId && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryFormData({ name: '', orderIndex: categories.length + 1, isActive: true, A1: '', m1: '' })
                  setIsCategoryModalOpen(true)
                }}
              >
                <Plus size={16} className="mr-1.5" /> Thêm mới
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tên danh mục</th>
                  <th className="px-4 py-3 font-medium w-24 text-center">Thứ tự</th>
                  <th className="px-4 py-3 font-medium w-32 text-center">Trạng thái</th>
                  <th className="px-4 py-3 font-medium w-24 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDetails ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin mr-2" size={20} /> Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : !activeGroupId ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Vui lòng chọn một nhóm danh mục bên trái
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Chưa có danh mục nào
                    </td>
                  </tr>
                ) : (
                  categories.map(category => (
                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            const newPath = [...categoryPath, category]
                            setCategoryPath(newPath)
                            if (activeGroupId) loadCategories(activeGroupId, category.id)
                          }}
                          title="Bấm để xem danh mục con"
                        >
                          {category.name}
                          {category.children && category.children.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{category.children.length}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-center">{category.orderIndex}</td>
                      <td className="px-4 py-3 text-center">
                        {category.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                            Đang ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="text-slate-400 hover:text-blue-600 transition-colors" 
                            title="Sửa"
                            onClick={() => {
                              setEditingCategory(category)
                              let parsedMeta: any = { A1: '', m1: '' };
                              if (category.metadata) {
                                try { parsedMeta = JSON.parse(category.metadata); } catch(e) {}
                              }
                              setCategoryFormData({ 
                                name: category.name, 
                                orderIndex: category.orderIndex, 
                                isActive: category.isActive,
                                A1: parsedMeta.A1 ?? '',
                                m1: parsedMeta.m1 ?? ''
                              })
                              setIsCategoryModalOpen(true)
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            className="text-slate-400 hover:text-red-600 transition-colors" 
                            title="Xóa"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? "Cập nhật Nhóm danh mục" : "Thêm mới Nhóm danh mục"}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleSaveGroup}>Lưu lại</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhóm <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={groupFormData.name}
              onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
              placeholder="Nhập tên nhóm..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Cập nhật Danh mục" : "Thêm mới Danh mục"}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleSaveCategory}>Lưu lại</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
              placeholder="Nhập tên danh mục..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự</label>
              <input 
                type="number" 
                value={categoryFormData.orderIndex}
                onChange={(e) => setCategoryFormData({...categoryFormData, orderIndex: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={categoryFormData.isActive}
                  onChange={(e) => setCategoryFormData({...categoryFormData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">Đang hoạt động</span>
              </label>
            </div>
          </div>
          
          {isActiveGroupMainCanalPerm && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hệ số A1</label>
                <input 
                  type="number" 
                  step="any"
                  value={categoryFormData.A1}
                  onChange={(e) => setCategoryFormData({...categoryFormData, A1: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hệ số m1</label>
                <input 
                  type="number" 
                  step="any"
                  value={categoryFormData.m1}
                  onChange={(e) => setCategoryFormData({...categoryFormData, m1: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

    </StandardPage>
  )
}
