import React, { useState, useEffect, useRef } from 'react'
import Modal from '@/components/Modal'
import Button from '@/components/Button'
import { User, FileSignature, History, Paperclip, Upload, X, ChevronDown } from 'lucide-react'
import { getCategoryGroups, getCategories, createUser, updateUser } from '@/app/actions'
import toast from 'react-hot-toast'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  editUser?: any
}

function removeVietnameseTones(str: string) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
  str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
  str = str.replace(/đ/g,"d");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  str = str.replace(/\s+/g, "");
  return str;
}

function getInitials(name: string) {
  if (!name.trim()) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return words[0][0].toUpperCase()
}

export default function AddUserModal({ isOpen, onClose, editUser }: AddUserModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'contracts' | 'history' | 'documents'>('general')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isEmailUnlocked, setIsEmailUnlocked] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [empId, setEmpId] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [employeeTypes, setEmployeeTypes] = useState<any[]>([])
  const [contractTypes, setContractTypes] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  
  
  const [formData, setFormData] = useState({
    gender: 'male',
    dateOfBirth: '',
    idCardNumber: '',
    idCardIssueDate: '',
    hometown: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    departmentId: '',
    levelId: '',
    employeeTypeId: '',
    startDate: '',
    workLocation: '',
    contractTypeId: '',
    contractNumber: '',
    contractSignDate: '',
    contractEndDate: '',
    socialInsuranceNumber: '',
    taxCode: '',
    isPayingInsurance: true,
    password: 'Pass@123',
    baseSalary: '',
    lunchAllowance: '',
    fuelAllowance: '',
    phoneAllowance: '',
    seniorityAllowance: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranch: ''
  })

  const handleChange = (field: string) => (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCurrencyChange = (field: string) => (e: any) => {
    const raw = e.target.value.replace(/\D/g, '')
    const val = raw ? new Intl.NumberFormat('vi-VN').format(Number(raw)) : ''
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!fullName) {
      toast.error('Vui lòng nhập họ và tên')
      return
    }
    setIsSaving(true)
    const payload = {
      ...formData,
      fullName,
      email,
      employeeCode: empId,
      avatarUrl,
      baseSalary: formData.baseSalary.replace(/\D/g, ''),
      lunchAllowance: formData.lunchAllowance.replace(/\D/g, ''),
      fuelAllowance: formData.fuelAllowance.replace(/\D/g, ''),
      phoneAllowance: formData.phoneAllowance.replace(/\D/g, ''),
      
      seniorityAllowance: formData.seniorityAllowance.replace(/\D/g, ''),
      password: formData.password
    }

    let res
    if (editUser) {
      res = await updateUser(editUser.id, payload)
    } else {
      res = await createUser(payload)
    }
    
    setIsSaving(false)
    if (res.success) {
      toast.success(editUser ? 'Cập nhật hồ sơ thành công!' : 'Tạo hồ sơ thành công!')
      onClose()
      window.location.reload()
    } else {
      toast.error('Lỗi: ' + res.error)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (editUser) {
        setEmpId(editUser.employeeCode || '')
        setFullName(editUser.fullName || '')
        setEmail(editUser.email || '')
        setIsEmailUnlocked(true)
        setAvatarUrl(editUser.avatarUrl || null)
        setFormData({
          gender: editUser.gender || 'male',
          dateOfBirth: editUser.dateOfBirth ? new Date(editUser.dateOfBirth).toISOString().slice(0, 10) : '',
          idCardNumber: editUser.idCardNumber || '',
          idCardIssueDate: editUser.idCardIssueDate ? new Date(editUser.idCardIssueDate).toISOString().slice(0, 10) : '',
          hometown: editUser.hometown || '',
          permanentAddress: editUser.permanentAddress || '',
          emergencyContactName: editUser.emergencyContactName || '',
          emergencyContactPhone: editUser.emergencyContactPhone || '',
          emergencyContactRelation: editUser.emergencyContactRelation || '',
          departmentId: editUser.departmentId || '',
          levelId: editUser.levelId || '',
          employeeTypeId: editUser.employeeTypeId || '',
          startDate: editUser.startDate ? new Date(editUser.startDate).toISOString().slice(0, 10) : '',
          workLocation: editUser.workLocation || '',
          contractTypeId: editUser.contractTypeId || '',
          contractNumber: editUser.contractNumber || '',
          contractSignDate: editUser.contractSignDate ? new Date(editUser.contractSignDate).toISOString().slice(0, 10) : '',
          contractEndDate: editUser.contractEndDate ? new Date(editUser.contractEndDate).toISOString().slice(0, 10) : '',
          socialInsuranceNumber: editUser.socialInsuranceNumber || '',
          taxCode: editUser.taxCode || '',
          isPayingInsurance: editUser.isPayingInsurance ?? true,
          password: '',
          baseSalary: editUser.baseSalary ? new Intl.NumberFormat('vi-VN').format(editUser.baseSalary) : '',
          lunchAllowance: editUser.lunchAllowance ? new Intl.NumberFormat('vi-VN').format(editUser.lunchAllowance) : '',
          fuelAllowance: editUser.fuelAllowance ? new Intl.NumberFormat('vi-VN').format(editUser.fuelAllowance) : '',
          phoneAllowance: editUser.phoneAllowance ? new Intl.NumberFormat('vi-VN').format(editUser.phoneAllowance) : '',
          seniorityAllowance: editUser.seniorityAllowance ? new Intl.NumberFormat('vi-VN').format(editUser.seniorityAllowance) : '',
          bankAccountNumber: editUser.bankAccountNumber || '',
          bankName: editUser.bankName || '',
          bankBranch: editUser.bankBranch || ''
        })
      } else {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randomPart = Math.floor(Math.random() * 9000 + 1000)
        setEmpId(`EMP-${datePart}-${randomPart}`)
        setFullName('')
        setEmail('')
        setIsEmailUnlocked(false)
        setAvatarUrl(null)
        setFormData({
          gender: 'male', dateOfBirth: '', idCardNumber: '', idCardIssueDate: '', hometown: '', permanentAddress: '',
          emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
          departmentId: '', levelId: '', employeeTypeId: '', startDate: '', workLocation: '',
          contractTypeId: '', contractNumber: '', contractSignDate: '', contractEndDate: '',
          socialInsuranceNumber: '', taxCode: '', isPayingInsurance: true,
    password: 'Pass@123',
          baseSalary: '', lunchAllowance: '', fuelAllowance: '', phoneAllowance: '', seniorityAllowance: '',
          bankAccountNumber: '', bankName: '', bankBranch: ''
        })
      }
    }
  }, [isOpen, editUser])

  useEffect(() => {
    if (isOpen) {
      async function loadCategories() {
        const groups = await getCategoryGroups()
        
        const deptGroup = groups.find((g: any) => g.name.toLowerCase().includes('phòng ban'))
        if (deptGroup) setDepartments(await getCategories(deptGroup.id))
        
        const levelGroup = groups.find((g: any) => g.name.toLowerCase().includes('cấp bậc'))
        if (levelGroup) setLevels(await getCategories(levelGroup.id))
        
        const empTypeGroup = groups.find((g: any) => g.name.toLowerCase().includes('loại nhân viên') || g.name.toLowerCase() === 'loại nhân sự')
        if (empTypeGroup) setEmployeeTypes(await getCategories(empTypeGroup.id))
        
        const contractTypeGroup = groups.find((g: any) => g.name.toLowerCase().includes('loại hợp đồng'))
        if (contractTypeGroup) setContractTypes(await getCategories(contractTypeGroup.id))
      }
      loadCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (!fullName) {
      setEmail('')
      setEmailError('')
      setIsEmailUnlocked(false)
      return
    }

    if (!isEmailUnlocked) {
      setEmail(removeVietnameseTones(fullName) + '@haiduong.com')
    }
  }, [fullName, isEmailUnlocked])

  useEffect(() => {
    if (!email) {
      setEmailError('')
      return
    }

    const timeout = setTimeout(() => {
      // Fake collision logic
      if (email === 'nguyenxuantai@haiduong.com' || email === 'leanhvan@haiduong.com') {
        setEmailError('Email này đã tồn tại trong DB. Vui lòng nhập email khác.')
        setIsEmailUnlocked(true)
      } else {
        setEmailError('')
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [email])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: User },
    { id: 'contracts', label: 'Hợp đồng lao động', icon: FileSignature },
    { id: 'history', label: 'Lịch sử công tác', icon: History },
    { id: 'documents', label: 'Tài liệu đính kèm', icon: Paperclip }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editUser ? "Cập nhật hồ sơ nhân viên" : "Thêm mới hồ sơ nhân viên"}
      maxWidth="full"
      headerActions={
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : (editUser ? 'Cập nhật' : 'Tạo hồ sơ')}
        </Button>
      }
    >
      <div className="flex flex-1 h-full min-h-0">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex-shrink-0 flex flex-col p-6">
          
          {/* Profile Summary */}
          <div className="mb-6 flex flex-col items-start">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-medium mb-4 shadow-sm overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover object-top" />
              ) : (
                getInitials(fullName)
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-lg line-clamp-2">{fullName || 'Nhân viên mới'}</h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">#{empId || 'EMP-...'}</p>
          </div>
          
          <hr className="border-slate-200 mb-6" />

          <nav className="flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          {activeTab === 'general' && (
            <div className="max-w-4xl pb-12">
              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Thông tin cá nhân</h2>
              
              <div className="space-y-6">
                
                {/* Avatar and Emp ID */}
                <div className="flex gap-8 items-start">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh nhân viên</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-[120px] h-[160px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-blue-400 cursor-pointer transition-colors relative overflow-hidden group shrink-0"
                    >
                      {avatarUrl ? (
                        <>
                          <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover object-top" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <Upload size={20} className="mb-1" />
                            <span className="text-[10px] font-medium">Đổi ảnh</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="text-xs font-medium text-center px-2">Tải ảnh 3x4</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div className="flex-1 pt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên</label>
                    <input 
                      type="text" 
                      className="w-full max-w-sm px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono" 
                      value={empId} 
                      readOnly 
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Mã nhân viên được hệ thống tự động sinh khi lưu.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                      placeholder="Nhập họ và tên đầy đủ"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
                    <div className="flex items-center gap-6 h-10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="male" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" checked={formData.gender === "male"} onChange={handleChange("gender")} />
                        <span className="text-sm text-slate-700">Nam</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="female" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" checked={formData.gender === "female"} onChange={handleChange("gender")} />
                        <span className="text-sm text-slate-700">Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                    <input 
                      type="email" 
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all ${
                        isEmailUnlocked 
                          ? emailError 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white' 
                          : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
                      }`}
                      placeholder="Tự sinh theo Họ và tên" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={!isEmailUnlocked}
                    />
                    {emailError ? (
                      <p className="text-xs text-red-600 mt-1.5">{emailError}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1.5">
                        {isEmailUnlocked ? 'Bạn có thể chỉnh sửa email này.' : 'Được tự động sinh. Khóa mặc định.'}
                      </p>
                    )}
                  </div>
</div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu đăng nhập</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.password}
                      onChange={handleChange("password")}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">{editUser ? 'Để trống nếu không muốn đổi mật khẩu' : 'Mật khẩu khởi tạo tài khoản'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-600" value={formData.dateOfBirth} onChange={handleChange("dateOfBirth")} />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số CCCD</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Nhập số Căn cước công dân" value={formData.idCardNumber} onChange={handleChange("idCardNumber")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày cấp</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-600" value={formData.idCardIssueDate} onChange={handleChange("idCardIssueDate")} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quê quán</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành phố" value={formData.hometown} onChange={handleChange("hometown")} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Số nhà, Tên đường..." value={formData.permanentAddress} onChange={handleChange("permanentAddress")} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-6 mt-10 border-b border-slate-200 pb-2">Liên hệ khẩn cấp</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên người thân</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Nhập họ và tên người liên hệ" value={formData.emergencyContactName} onChange={handleChange("emergencyContactName")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Nhập số điện thoại" value={formData.emergencyContactPhone} onChange={handleChange("emergencyContactPhone")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mối quan hệ</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Vd: Vợ, Chồng, Bố, Mẹ..." value={formData.emergencyContactRelation} onChange={handleChange("emergencyContactRelation")} />
                </div>
              </div>

            </div>
          )}
          
          {activeTab === 'contracts' && (
            <div className="max-w-4xl pb-12">
              <h2 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-2">Chi tiết Hợp đồng & Công việc</h2>
              
              <div className="space-y-10">
                {/* Section 1: Công việc */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Công việc</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select required className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer" value={formData.departmentId} onChange={handleChange("departmentId")}>
                          <option value="">Chọn phòng ban</option>
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select required className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer" value={formData.levelId} onChange={handleChange("levelId")}>
                          <option value="">Chọn cấp bậc</option>
                          {levels.length > 0 ? levels.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          )) : (
                            <>
                              <option value="1">Thực tập sinh</option>
                              <option value="2">Nhân viên</option>
                              <option value="3">Chuyên viên</option>
                              <option value="4">Trưởng nhóm</option>
                              <option value="5">Trưởng phòng</option>
                              <option value="6">Giám đốc</option>
                            </>
                          )}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Loại nhân viên</label>
                      <div className="relative">
                        <select className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer" value={formData.employeeTypeId} onChange={handleChange("employeeTypeId")}>
                          <option value="">Chọn loại nhân viên</option>
                          {employeeTypes.length > 0 ? employeeTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          )) : (
                            <>
                              <option value="ft">Chính thức (Full-time)</option>
                              <option value="pt">Bán thời gian (Part-time)</option>
                              <option value="tv">Thử việc</option>
                              <option value="ts">Thực tập sinh</option>
                            </>
                          )}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600" value={formData.startDate} onChange={handleChange("startDate")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm làm việc</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vd: Trụ sở chính" value={formData.workLocation} onChange={handleChange("workLocation")} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Hợp đồng lao động */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Hợp đồng lao động</h3>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Loại hợp đồng</label>
                      <div className="relative">
                        <select className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer" value={formData.contractTypeId} onChange={handleChange("contractTypeId")}>
                          <option value="">Chọn loại HĐ</option>
                          {contractTypes.length > 0 ? contractTypes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          )) : (
                            <>
                              <option value="1">HĐ Không xác định thời hạn</option>
                              <option value="2">HĐ Xác định thời hạn (12 tháng)</option>
                              <option value="3">HĐ Xác định thời hạn (24 tháng)</option>
                              <option value="4">HĐ Xác định thời hạn (36 tháng)</option>
                              <option value="5">HĐ Thử việc</option>
                            </>
                          )}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số hợp đồng</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vd: HD-2024-001" value={formData.contractNumber} onChange={handleChange("contractNumber")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ngày ký</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600" value={formData.contractSignDate} onChange={handleChange("contractSignDate")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600" value={formData.contractEndDate} onChange={handleChange("contractEndDate")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số bảo hiểm xã hội</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập số BHXH" value={formData.socialInsuranceNumber} onChange={handleChange("socialInsuranceNumber")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mã số thuế</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập MST" value={formData.taxCode} onChange={handleChange("taxCode")} />
                    </div>
                    <div className="pb-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={formData.isPayingInsurance} onChange={handleChange("isPayingInsurance")} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Đóng bảo hiểm</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 3: Lương và phúc lợi */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Lương và phúc lợi</h3>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lương cơ bản</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.baseSalary} onChange={handleCurrencyChange("baseSalary")} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phụ cấp ăn trưa</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.lunchAllowance} onChange={handleCurrencyChange("lunchAllowance")} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phụ cấp xăng xe</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.fuelAllowance} onChange={handleCurrencyChange("fuelAllowance")} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phụ cấp điện thoại</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.phoneAllowance} onChange={handleCurrencyChange("phoneAllowance")} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phụ cấp thâm niên</label>
                      <div className="relative">
                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.seniorityAllowance} onChange={handleCurrencyChange("seniorityAllowance")} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Tài khoản nhận thu nhập */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Tài khoản nhận thu nhập</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nhập số tài khoản" value={formData.bankAccountNumber} onChange={handleChange("bankAccountNumber")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tên ngân hàng</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vd: Vietcombank" value={formData.bankName} onChange={handleChange("bankName")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chi nhánh</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Vd: Chi nhánh Hà Nội" value={formData.bankBranch} onChange={handleChange("bankBranch")} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử công tác</h2>
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 flex flex-col items-center">
                <History size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">Chưa có bản ghi lịch sử công tác nào.</p>
                <Button variant="outline">
                  + Thêm lịch sử
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Tài liệu đính kèm</h2>
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 flex flex-col items-center transition-colors hover:bg-slate-100 hover:border-blue-300 cursor-pointer">
                <Paperclip size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">Kéo thả file tài liệu vào đây hoặc nhấn để chọn file</p>
                <Button variant="outline">
                  Chọn tệp tài liệu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
