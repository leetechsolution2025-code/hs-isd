import re

# 1. Update actions.ts
with open("src/app/actions.ts", "r") as f:
    actions_content = f.read()

# For createUser
# Find: const hashedPassword = await bcrypt.hash('123456aA@', 10)
# Replace with: const hashedPassword = await bcrypt.hash(data.password || 'Pass@123', 10)
actions_content = actions_content.replace(
    "const hashedPassword = await bcrypt.hash('123456aA@', 10)",
    "const hashedPassword = await bcrypt.hash(data.password || 'Pass@123', 10)"
)

# For updateUser
# We should probably hash password if it's provided.
update_pass_code = """
    let dataToUpdate = { ...data }
    if (data.password) {
      const bcrypt = await import('bcryptjs')
      dataToUpdate.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: dataToUpdate.fullName,
        avatarUrl: dataToUpdate.avatarUrl,
        password: dataToUpdate.password,
        gender: dataToUpdate.gender,
"""
actions_content = actions_content.replace(
"""    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        gender: data.gender,""", update_pass_code
)

with open("src/app/actions.ts", "w") as f:
    f.write(actions_content)

# 2. Update AddUserModal.tsx
with open("src/components/AddUserModal.tsx", "r") as f:
    modal_content = f.read()

# Add password field next to Email
password_ui = """
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu đăng nhập</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Mật khẩu"
                      value={formData.password}
                      onChange={handleChange("password")}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Mặc định: Pass@123</p>
                  </div>
"""

# Find: <div>\n                    <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
# Actually, the Email is in a grid grid-cols-2. Let's see what's next to it.
# It is next to "Ngày sinh". Let's put Password below Email, maybe change grid structure.
# Or just put it under Email in the same col?
# Let's just find the form data state.
modal_content = modal_content.replace(
    "isPayingInsurance: true,",
    "isPayingInsurance: true,\n    password: 'Pass@123',"
)
modal_content = modal_content.replace(
    "isPayingInsurance: editUser.isPayingInsurance ?? true,",
    "isPayingInsurance: editUser.isPayingInsurance ?? true,\n          password: '',"
)

# Replace payload creation
payload_code = """
      seniorityAllowance: formData.seniorityAllowance.replace(/\D/g, ''),
      password: formData.password
    }
"""
modal_content = modal_content.replace("seniorityAllowance: formData.seniorityAllowance.replace(/\\D/g, ''),\n    }", payload_code)

# Add UI field
# Currently Email and DateOfBirth are in a 2-col grid.
# I will change it to a 3-col grid or just add another 2-col row.
ui_code = """
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
"""
# Need to replace the DateOfBirth part.
old_ui = """                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-600" value={formData.dateOfBirth} onChange={handleChange("dateOfBirth")} />
                  </div>
                </div>"""

# we replace old_ui with a close div for the previous grid, and the new ui_code
modal_content = modal_content.replace(old_ui, "</div>\n" + ui_code)

with open("src/components/AddUserModal.tsx", "w") as f:
    f.write(modal_content)

