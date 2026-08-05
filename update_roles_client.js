const fs = require('fs');
let content = fs.readFileSync('src/app/admin/roles/RolesClient.tsx', 'utf8');

// Add toast and useRouter
content = content.replace(
  "import { Shield", 
  "import { toast } from 'sonner';\nimport { Shield"
);

// Update UserData type
content = content.replace(
  "department: { name: string } | null;",
  "department: { name: string } | null;\n  permission?: Record<string, boolean>;\n  departmentAccesses?: { departmentId: string, accessLevel: number }[];"
);

// Add state for saving
content = content.replace(
  "const [detailTab, setDetailTab] = useState<'roles' | 'departments'>('roles');",
  "const [detailTab, setDetailTab] = useState<'roles' | 'departments'>('roles');\n  const [isSaving, setIsSaving] = useState(false);"
);

// Initialize state from initialUsers
const initCode = `
  const [userFunctionalPerms, setUserFunctionalPerms] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialUsers.forEach(u => {
      if (u.permission) {
        Object.entries(u.permission).forEach(([k, v]) => {
          if (typeof v === 'boolean') {
            init[\`\${u.id}_\${k}\`] = v;
          }
        });
      }
    });
    return init;
  });

  const [userDeptAccess, setUserDeptAccess] = useState<Record<string, 0 | 1 | 2>>(() => {
    const init: Record<string, 0 | 1 | 2> = {};
    initialUsers.forEach(u => {
      if (u.departmentAccesses) {
        u.departmentAccesses.forEach(a => {
          init[\`\${u.id}_\${a.departmentId}\`] = a.accessLevel as 0 | 1 | 2;
        });
      }
    });
    return init;
  });

  const [localRoles, setLocalRoles] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    initialUsers.forEach(u => {
      init[u.id] = u.role;
    });
    return init;
  });
`;

content = content.replace(
  /const \[userFunctionalPerms, setUserFunctionalPerms\] = useState<Record<string, boolean>>\(\{\}\);\n  const \[userDeptAccess, setUserDeptAccess\] = useState<Record<string, 0 \| 1 \| 2>>\(\{\}\); \/\/ 0: None, 1: View, 2: Full/,
  initCode
);

// Update filter to use localRoles
content = content.replace(
  "const matchRole = activeTab === 'all' || \n                       (activeTab === 'admin' && u.role === 'ADMIN') || \n                       (activeTab === 'user' && u.role === 'USER');",
  "const matchRole = activeTab === 'all' || \n                       (activeTab === 'admin' && (localRoles[u.id] || u.role) === 'ADMIN') || \n                       (activeTab === 'user' && (localRoles[u.id] || u.role) === 'USER');"
);

// Save function
const saveCode = `
  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const perms = FUNCTIONAL_PERMISSIONS.reduce((acc, p) => {
        acc[p.id] = userFunctionalPerms[\`\${selectedUserId}_\${p.id}\`] || false;
        return acc;
      }, {} as Record<string, boolean>);

      const deptAcc = departments.map(d => ({
        departmentId: d.id,
        accessLevel: userDeptAccess[\`\${selectedUserId}_\${d.id}\`] || 0
      })).filter(d => d.accessLevel > 0);

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role: localRoles[selectedUserId],
          functionalPerms: perms,
          deptAccesses: deptAcc
        })
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('Đã lưu phân quyền thành công');
    } catch (e) {
      toast.error('Lỗi khi lưu phân quyền');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
`;
content = content.replace("const toggleFunctionalPerm", saveCode + "\n\n  const toggleFunctionalPerm");

// Update JSX to use localRoles and add Save button
content = content.replace(
  "color=\"indigo\"\n      useCard={false}",
  "color=\"indigo\"\n      useCard={false}\n      headerActions={\n        <button \n          onClick={handleSave}\n          disabled={isSaving || !selectedUserId}\n          className=\"bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50\"\n        >\n          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}\n        </button>\n      }"
);

// Fix role display in list
content = content.replace(
  "const isAdmin = user.role === 'ADMIN';",
  "const isAdmin = localRoles[user.id] === 'ADMIN';"
);

// Fix role display in details header
content = content.replace(
  "{selectedUser.role === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}",
  "{localRoles[selectedUser.id] === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}"
);
content = content.replace(
  "selectedUser.role === 'ADMIN' ? 'bg-amber-100",
  "localRoles[selectedUser.id] === 'ADMIN' ? 'bg-amber-100"
);

// Fix role toggles in roles tab
content = content.replace(
  /selectedUser.role === 'USER'/g,
  "localRoles[selectedUser.id] === 'USER'"
);
content = content.replace(
  /selectedUser.role === 'ADMIN'/g,
  "localRoles[selectedUser.id] === 'ADMIN'"
);

// Add click handler to role boxes
content = content.replace(
  "className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'USER' ? 'border-blue-500 bg-blue-50'",
  "onClick={() => setLocalRoles(prev => ({ ...prev, [selectedUser.id]: 'USER' }))}\n                          className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'USER' ? 'border-blue-500 bg-blue-50'"
);
content = content.replace(
  "className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'ADMIN' ? 'border-amber-500 bg-amber-50'",
  "onClick={() => setLocalRoles(prev => ({ ...prev, [selectedUser.id]: 'ADMIN' }))}\n                        className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'ADMIN' ? 'border-amber-500 bg-amber-50'"
);

fs.writeFileSync('src/app/admin/roles/RolesClient.tsx', content);
