"use client"
import StandardPage from '@/components/StandardPage'
import AdminLayoutClient from '@/components/AdminLayoutClient'
import { useState, useEffect } from 'react'
import { Search, Plus, ChevronDown, Trash2 } from 'lucide-react'
import { getCategoryGroups, getCategories, getUsers, getProjects, deleteProjects } from '@/app/actions'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from 'react-hot-toast'
import FullWidthTable from '@/components/FullWidthTable'
import ProjectCreateOffcanvas from '@/components/ProjectCreateOffcanvas'
import DesignFullscreenModal from '@/components/DesignFullscreenModal'

export default function DesignPage() {
  const [departmentName, setDepartmentName] = useState("Tổng quan")
  const [phases, setPhases] = useState<{id: string, name: string}[]>([])
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false)
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false)
  const [editProject, setEditProject] = useState<any>(null)
  const [designUsers, setDesignUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const [filterLocation, setFilterLocation] = useState("")
  const [filterPhase, setFilterPhase] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const locations = Array.from(new Set(projects.map(p => p.location).filter(Boolean))).sort()

  const filteredProjects = projects.filter(p => {
    if (filterLocation && p.location !== filterLocation) return false;
    if (filterPhase && p.phaseId !== filterPhase) return false;
    if (filterType && p.type !== filterType) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      const matchSummary = p.summary?.toLowerCase().includes(q);
      const matchCode = p.code?.toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchSummary && !matchCode) return false;
    }
    return true;
  });

  const fetchProjectsList = async () => {
    const allProjects = await getProjects()
    setProjects(allProjects)
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProjects.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteProjects(selectedIds)
    setIsDeleting(false)
    setIsConfirmDeleteOpen(false)
    if (res.success) {
      toast.success(`Đã xoá ${selectedIds.length} dự án.`)
      setSelectedIds([])
      fetchProjectsList()
    } else {
      toast.error("Lỗi khi xoá: " + res.error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const groups = await getCategoryGroups()
      const phaseGroup = groups.find((g: any) => g.name === "Giai đoạn")
      if (phaseGroup) {
        const categories = await getCategories(phaseGroup.id)
        setPhases(categories.filter((c: any) => c.isActive))
      }

      const allUsers = await getUsers()
      setDesignUsers(allUsers.filter((u: any) => u.department?.name?.toLowerCase().includes("thiết kế")))
      
      await fetchProjectsList()
    }
    fetchData()

    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.departmentName) {
          setDepartmentName(user.departmentName)
        }
      } catch (e) {}
    }
  }, [])

  return (
    <AdminLayoutClient role="USER">
      <StandardPage 
        title={departmentName}
        description={`Không gian làm việc chung của ${departmentName}`}
        useCard={true}
      >
        <div className="flex flex-col h-full gap-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3 shrink-0">
            {/* Địa điểm */}
            <div className="relative min-w-[130px]">
              <select className="w-full appearance-none px-3 py-1.5 pr-8 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                <option value="">Địa điểm</option>
                {locations.map(loc => (
                  <option key={loc} value={loc as string}>{loc as string}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Giai đoạn */}
            <div className="relative min-w-[130px]">
              <select 
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 pr-8 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Giai đoạn</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Loại dự án */}
            <div className="relative min-w-[160px]">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 pr-8 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Loại dự án</option>
                <option value="HEADWORKS">Công trình đầu mối</option>
                <option value="CANAL">Hệ thống kênh tưới</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Trạng thái */}
            <div className="relative min-w-[150px]">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 pr-8 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Trạng thái</option>
                <option value="chưa thực hiện">Chưa thực hiện</option>
                <option value="đang thực hiện">Đang thực hiện</option>
                <option value="đã hoàn thành">Đã hoàn thành</option>
                <option value="tạm dừng">Tạm dừng</option>
                <option value="huỷ bỏ">Huỷ bỏ</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Hộp tìm kiếm */}
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..." 
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Nút Thêm mới */}
            <button 
              onClick={() => {
                setEditProject(null)
                setIsOffcanvasOpen(true)
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
            >
              <Plus size={16} />
              Thêm mới
            </button>
            
            {/* Nút xoá (chỉ hiện khi có item được chọn) */}
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="flex items-center justify-center w-[34px] h-[34px] bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shrink-0 shadow-sm"
                title="Xoá đã chọn"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          <FullWidthTable
            head={
              <>
                <th className="px-4 sm:px-6 py-3 font-semibold w-16 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={filteredProjects.length > 0 && selectedIds.length === filteredProjects.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 sm:px-6 py-3 font-semibold">Tên dự án</th>
                <th className="px-4 sm:px-6 py-3 font-semibold w-40">Địa điểm</th>
                <th className="px-4 sm:px-6 py-3 font-semibold w-40">Giai đoạn</th>
                <th className="px-4 sm:px-6 py-3 font-semibold">Tóm tắt nhiệm vụ dự án</th>
              </>
            }
          >
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-slate-400">
                  {projects.length === 0 ? "Chưa có dữ liệu tổng quan" : "Không tìm thấy kết quả phù hợp"}
                </td>
              </tr>
            ) : (
              filteredProjects.map((p, i) => (
                <tr 
                  key={p.id} 
                  onClick={() => {
                    setEditProject(p)
                    setIsOffcanvasOpen(true)
                  }}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  <td className="px-4 sm:px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelect(p.id)}
                    />
                  </td>
                  <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">
                    {p.name}
                    {p.category && <div className="text-[13px] text-slate-500 font-normal mt-0.5">{p.category}</div>}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-slate-600">{p.location || '-'}</td>
                  <td className="px-4 sm:px-6 py-3 text-slate-600">
                    {p.phase?.name || '-'}
                    {p.status && (
                      <div className="mt-1.5">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium first-letter:uppercase">
                          {p.status}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-slate-600 truncate max-w-[300px]" title={p.summary || ''}>{p.summary || '-'}</td>
                </tr>
              ))
            )}
          </FullWidthTable>
        </div>
      </StandardPage>

      <ProjectCreateOffcanvas 
        isOpen={isOffcanvasOpen} 
        onClose={() => setIsOffcanvasOpen(false)} 
        phases={phases}
        users={designUsers}
        onSuccess={fetchProjectsList}
        editProject={editProject}
        onDesign={() => {
          setIsDesignModalOpen(true)
          setIsOffcanvasOpen(false)
        }}
      />

      <DesignFullscreenModal 
        isOpen={isDesignModalOpen} 
        onClose={() => setIsDesignModalOpen(false)} 
        project={editProject}
        onSuccess={fetchProjectsList}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Xác nhận xoá dự án"
        message={`Bạn có chắc chắn muốn xoá ${selectedIds.length} dự án đã chọn? Mọi dữ liệu liên quan cũng sẽ bị xoá và không thể khôi phục.`}
        confirmLabel="Xoá ngay"
        cancelLabel="Huỷ"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </AdminLayoutClient>
  )
}
