"use client";
import React, { useState, useMemo } from 'react';
import StandardPage from '@/components/StandardPage';
 
import { Shield, Search, Mic, ChevronRight, Check, XCircle, Eye, CheckCircle2, User as UserIcon, Building2, Users, Receipt, TrendingUp, Megaphone, Truck, ShoppingCart, Award } from 'lucide-react';

type UserData = {
  id: string;
  fullName: string | null;
  email: string;
  employeeCode: string | null;
  role: string;
  avatarUrl: string | null;
  department: { name: string } | null;
  permission?: any;
  departmentAccesses?: { departmentId: string, accessLevel: number }[];
};

type Department = {
  id: string;
  name: string;
};

// functional permissions mock
const FUNCTIONAL_PERMISSIONS = [
  { id: 'crm', label: 'Quản lý khách hàng (CRM)', icon: UserIcon },
  { id: 'chat', label: 'Nhắn tin nội bộ', icon: Mic },
  { id: 'notify', label: 'Thông báo hệ thống', icon: Megaphone },
  { id: 'task', label: 'Quản lý công việc', icon: TrendingUp },
  { id: 'report', label: 'Xem báo cáo', icon: TrendingUp },
  { id: 'plan', label: 'Lập kế hoạch', icon: Receipt },
  { id: 'approve', label: 'Duyệt yêu cầu', icon: CheckCircle2 },
  { id: 'oem', label: 'Bán hàng OEM', icon: ShoppingCart },
  { id: 'price', label: 'Hiển thị giá sản phẩm', icon: Award },
  { id: 'budget', label: 'Duyệt ngân sách', icon: Receipt },
];

export default function RolesClient({ 
  initialUsers,
  departments
}: { 
  initialUsers: UserData[];
  departments: Department[];
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUsers[0]?.id || null);
  const [detailTab, setDetailTab] = useState<'roles' | 'departments'>('roles');
  const [isSaving, setIsSaving] = useState(false);

  // Mocks for permissions (since we don't save them to DB yet)
  
  const [userFunctionalPerms, setUserFunctionalPerms] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialUsers.forEach(u => {
      if (u.permission) {
        Object.entries(u.permission).forEach(([k, v]) => {
          if (typeof v === 'boolean') {
            init[`${u.id}_${k}`] = v;
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
          init[`${u.id}_${a.departmentId}`] = a.accessLevel as 0 | 1 | 2;
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


  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      const matchSearch = (u.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = activeTab === 'all' || 
                       (activeTab === 'admin' && (localRoles[u.id] || u.role) === 'ADMIN') || 
                       (activeTab === 'user' && (localRoles[u.id] || u.role) === 'USER');
      return matchSearch && matchRole;
    });
  }, [initialUsers, search, activeTab]);

  const selectedUser = initialUsers.find(u => u.id === selectedUserId);

  
  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const perms = FUNCTIONAL_PERMISSIONS.reduce((acc, p) => {
        acc[p.id] = userFunctionalPerms[`${selectedUserId}_${p.id}`] || false;
        return acc;
      }, {} as Record<string, boolean>);

      const deptAcc = departments.map(d => ({
        departmentId: d.id,
        accessLevel: userDeptAccess[`${selectedUserId}_${d.id}`] || 0
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
      alert('Đã lưu phân quyền thành công');
    } catch (e) {
      alert('Lỗi khi lưu phân quyền');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };


  const toggleFunctionalPerm = (permId: string) => {
    setUserFunctionalPerms(prev => ({
      ...prev,
      [`${selectedUserId}_${permId}`]: !prev[`${selectedUserId}_${permId}`]
    }));
  };

  const cycleDeptAccess = (deptId: string) => {
    setUserDeptAccess(prev => {
      const current = prev[`${selectedUserId}_${deptId}`] || 0;
      const next = (current + 1) % 3 as 0 | 1 | 2;
      return { ...prev, [`${selectedUserId}_${deptId}`]: next };
    });
  };

  const getDeptAccessLabel = (level: 0 | 1 | 2) => {
    if (level === 2) return { text: 'Toàn quyền', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    if (level === 1) return { text: 'Chỉ xem', className: 'bg-blue-100 text-blue-700', icon: Eye };
    return { text: 'Không có quyền', className: 'bg-slate-100 text-slate-500', icon: XCircle };
  };

  return (
    <StandardPage 
      hideTicker
      title="Phân quyền người dùng"
      description="Quản lý và phân quyền chức năng cho các nhóm người dùng"
      icon={Shield}
      color="indigo"
      useCard={false}
      headerActions={
        <button 
          onClick={handleSave}
          disabled={isSaving || !selectedUserId}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      }
    >
      <div className="flex gap-4 h-full">
        
        {/* LEFT COLUMN - USER LIST */}
        <div className="w-[380px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm nhân viên..."
                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" size={16} />
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm border border-blue-200' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả ({initialUsers.length})
              </button>
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm border border-blue-200' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('admin')}
              >
                Quản trị ({initialUsers.filter(u => u.role === 'ADMIN').length})
              </button>
              <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'user' ? 'bg-white text-blue-600 shadow-sm border border-blue-200' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('user')}
              >
                Nhân viên ({initialUsers.filter(u => u.role === 'USER').length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1">
            {filteredUsers.map(user => {
              const isSelected = user.id === selectedUserId;
              const initials = (user.fullName || user.email).substring(0, 2).toUpperCase();
              const isAdmin = localRoles[user.id] === 'ADMIN';

              return (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0 ${isAdmin ? 'bg-amber-500' : 'bg-blue-500'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {user.fullName || 'Chưa cập nhật tên'}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isAdmin ? 'Quản trị' : 'Nhân viên'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user.department?.name || user.email}</p>
                  </div>
                  <ChevronRight size={16} className={isSelected ? 'text-blue-500' : 'text-slate-300'} />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN - USER DETAILS & PERMS */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
          {selectedUser ? (
            <>
              {/* Header Info */}
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold shadow-md">
                  {(selectedUser.fullName || selectedUser.email).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-800">{selectedUser.fullName || 'Chưa cập nhật tên'}</h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${localRoles[selectedUser.id] === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {localRoles[selectedUser.id] === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedUser.email} &bull; {selectedUser.department?.name || 'Chưa có bộ phận'} &bull; {selectedUser.employeeCode || 'Chưa có mã'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4 border-b border-slate-200 bg-slate-50 flex gap-2">
                <button 
                  className={`flex items-center gap-2 px-6 py-2.5 font-medium text-sm rounded-t-lg transition-colors relative top-[1px] ${detailTab === 'roles' ? 'bg-white text-blue-600 border border-slate-200 border-b-white' : 'text-slate-500 border border-transparent hover:text-slate-700'}`}
                  onClick={() => setDetailTab('roles')}
                >
                  <Shield size={16} /> Vai trò & Quyền hạn
                </button>
                <button 
                  className={`flex items-center gap-2 px-6 py-2.5 font-medium text-sm rounded-t-lg transition-colors relative top-[1px] ${detailTab === 'departments' ? 'bg-white text-blue-600 border border-slate-200 border-b-white' : 'text-slate-500 border border-transparent hover:text-slate-700'}`}
                  onClick={() => setDetailTab('departments')}
                >
                  <Building2 size={16} /> Truy cập bộ phận
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-6 bg-white">
                {detailTab === 'roles' && (
                  <div className="space-y-8">
                    {/* System Roles */}
                    <section>
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Vai trò hệ thống</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setLocalRoles(prev => ({ ...prev, [selectedUser.id]: 'USER' }))}
                          className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'USER' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localRoles[selectedUser.id] === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                              <UserIcon size={20} />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${localRoles[selectedUser.id] === 'USER' ? 'text-blue-900' : 'text-slate-700'}`}>Nhân viên</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Truy cập theo phân quyền được cấp</p>
                            </div>
                          </div>
                          {localRoles[selectedUser.id] === 'USER' && <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check size={14} /></div>}
                        </div>
                        
                        <div onClick={() => setLocalRoles(prev => ({ ...prev, [selectedUser.id]: 'ADMIN' }))}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${localRoles[selectedUser.id] === 'ADMIN' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localRoles[selectedUser.id] === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Shield size={20} />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${localRoles[selectedUser.id] === 'ADMIN' ? 'text-amber-900' : 'text-slate-700'}`}>Quản trị viên</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Toàn quyền quản lý tổ chức & tài khoản</p>
                            </div>
                          </div>
                          {localRoles[selectedUser.id] === 'ADMIN' && <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white"><Check size={14} /></div>}
                        </div>
                      </div>
                    </section>

                    {/* Functional Perms */}
                    <section>
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Quyền chức năng</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {FUNCTIONAL_PERMISSIONS.map(perm => {
                          const isAdmin = localRoles[selectedUser.id] === 'ADMIN';
                          const isActive = isAdmin || (userFunctionalPerms[`${selectedUser.id}_${perm.id}`] || false);
                          const Icon = perm.icon;
                          return (
                            <div key={perm.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <Icon size={16} />
                                </div>
                                <span className="font-medium text-sm text-slate-700">{perm.label}</span>
                              </div>
                              <button 
                                onClick={() => { if (!isAdmin) toggleFunctionalPerm(perm.id) }}
                                disabled={isAdmin}
                                className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? 'bg-blue-500' : 'bg-slate-200'} ${isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'left-6' : 'left-1'}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                )}

                {detailTab === 'departments' && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mức độ truy cập theo bộ phận - Click để thay đổi</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {departments.map(dept => {
                        const level = userDeptAccess[`${selectedUser.id}_${dept.id}`] || 0;
                        const label = getDeptAccessLabel(level);
                        const Icon = Building2;
                        
                        return (
                          <div 
                            key={dept.id} 
                            onClick={() => cycleDeptAccess(dept.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${level === 2 ? 'border-emerald-200 bg-emerald-50/50' : level === 1 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${level > 0 ? 'bg-white text-slate-700 shadow-sm border border-slate-200' : 'bg-slate-100 text-slate-400'}`}>
                                <Icon size={16} />
                              </div>
                              <span className={`font-medium text-sm ${level > 0 ? 'text-slate-800' : 'text-slate-600'}`}>{dept.name}</span>
                            </div>
                            
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${label.className} transition-colors`}>
                              <label.icon size={14} />
                              {label.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
              <Shield size={48} className="opacity-20" />
              <p>Chọn một nhân viên để xem và phân quyền</p>
            </div>
          )}
        </div>
        
      </div>
    </StandardPage>
  );
}
