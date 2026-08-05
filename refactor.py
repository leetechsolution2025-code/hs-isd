import re

with open("src/components/AddUserModal.tsx", "r") as f:
    content = f.read()

# 1. Add createUser import
content = content.replace("getCategories } from '@/app/actions'", "getCategories, createUser } from '@/app/actions'")

# 2. Add formData state
state_code = """
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
      alert('Vui lòng nhập họ và tên')
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
    }
    const res = await createUser(payload)
    setIsSaving(false)
    if (res.success) {
      alert('Tạo hồ sơ thành công!')
      onClose()
      window.location.reload()
    } else {
      alert('Lỗi: ' + res.error)
    }
  }
"""
content = content.replace("const fileInputRef = useRef<HTMLInputElement>(null)", state_code + "\n  const fileInputRef = useRef<HTMLInputElement>(null)")

# 3. Add onClick to save button
content = content.replace("""headerActions={
        <Button variant="primary">
          Tạo hồ sơ
        </Button>
      }""", """headerActions={
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Tạo hồ sơ'}
        </Button>
      }""")

# 4. Replace currency inputs
currency_fields = [
    ("Lương cơ bản", "baseSalary"),
    ("Phụ cấp ăn trưa", "lunchAllowance"),
    ("Phụ cấp xăng xe", "fuelAllowance"),
    ("Phụ cấp điện thoại", "phoneAllowance"),
    ("Phụ cấp thâm niên", "seniorityAllowance")
]
for label, field in currency_fields:
    target = f'<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\n                      <div className="relative">\n                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0"'
    replacement = f'<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\n                      <div className="relative">\n                        <input type="text" className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={{formData.{field}}} onChange={{handleCurrencyChange("{field}")}}'
    content = content.replace(target, replacement)

# 5. Replace normal selects
select_fields = [
    ("Phòng ban", "departmentId"),
    ("Cấp bậc", "levelId"),
    ("Loại nhân viên", "employeeTypeId"),
    ("Loại hợp đồng", "contractTypeId")
]
for label, field in select_fields:
    # Need to match the select opening tag to add value/onChange
    target_start = f'<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\n                      <div className="relative">\n                        <select className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"'
    replacement_start = f'<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\n                      <div className="relative">\n                        <select className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer" value={{formData.{field}}} onChange={{handleChange("{field}")}}'
    content = content.replace(target_start, replacement_start)

# 6. Replace simple text/date inputs (just a few of them)
text_inputs = [
    ("Ngày sinh", "dateOfBirth", "date"),
    ("Số CCCD", "idCardNumber", "text"),
    ("Ngày cấp", "idCardIssueDate", "date"),
    ("Quê quán", "hometown", "text"),
    ("Địa chỉ thường trú", "permanentAddress", "text"),
    ("Tên người thân", "emergencyContactName", "text"),
    ("Số điện thoại", "emergencyContactPhone", "text"),
    ("Mối quan hệ", "emergencyContactRelation", "text"),
    ("Ngày bắt đầu", "startDate", "date"),
    ("Địa điểm làm việc", "workLocation", "text"),
    ("Số hợp đồng", "contractNumber", "text"),
    ("Ngày ký", "contractSignDate", "date"),
    ("Ngày hết hạn", "contractEndDate", "date"),
    ("Số bảo hiểm xã hội", "socialInsuranceNumber", "text"),
    ("Mã số thuế", "taxCode", "text"),
    ("Số tài khoản", "bankAccountNumber", "text"),
    ("Tên ngân hàng", "bankName", "text"),
    ("Chi nhánh", "bankBranch", "text")
]

for label, field, type in text_inputs:
    if type == "text":
        pattern = rf'(<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\s+<input type="text" className=".*?" placeholder=".*?")'
    else:
        pattern = rf'(<label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>\s+<input type="date" className=".*?")'
    
    match = re.search(pattern, content)
    if match:
        old_str = match.group(1)
        new_str = old_str + f' value={{formData.{field}}} onChange={{handleChange("{field}")}}'
        content = content.replace(old_str, new_str)

# 7. Checkbox "Đóng bảo hiểm"
checkbox_target = '<input type="checkbox" className="sr-only peer" defaultChecked />'
checkbox_replacement = '<input type="checkbox" className="sr-only peer" checked={formData.isPayingInsurance} onChange={handleChange("isPayingInsurance")} />'
content = content.replace(checkbox_target, checkbox_replacement)

# 8. Radio "Giới tính"
radio_target1 = '<input type="radio" name="gender" value="male" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" defaultChecked />'
radio_replace1 = '<input type="radio" name="gender" value="male" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" checked={formData.gender === "male"} onChange={handleChange("gender")} />'
radio_target2 = '<input type="radio" name="gender" value="female" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />'
radio_replace2 = '<input type="radio" name="gender" value="female" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" checked={formData.gender === "female"} onChange={handleChange("gender")} />'
content = content.replace(radio_target1, radio_replace1)
content = content.replace(radio_target2, radio_replace2)

with open("src/components/AddUserModal.tsx", "w") as f:
    f.write(content)

