"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Droplets, User, Lock, Eye, EyeOff } from 'lucide-react'
import { authenticateUser } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const formData = new FormData(e.currentTarget)
      const result = await authenticateUser(formData)
      
      if (!result) {
        setError('Lỗi kết nối máy chủ')
        setIsLoading(false)
        return
      }

      if (result.success && result.user) {
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        
        const dept = (result.user.departmentName || '').toLowerCase()
        if (dept.includes('lãnh đạo')) router.push('/board')
        else if (dept.includes('hành chính')) router.push('/administration')
        else if (dept.includes('kế toán')) router.push('/finance')
        else if (dept.includes('khảo sát')) router.push('/survey')
        else if (dept.includes('thiết kế')) router.push('/design')
        else if (dept.includes('thi công')) router.push('/construction')
        else if (result.user.role === 'ADMIN') router.push('/admin')
        else router.push('/design') // Default fallback
      } else {
        setError(result.error || 'Đăng nhập thất bại')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* Left Column - Illustration */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-end justify-start p-8 lg:p-10 pb-8 lg:pb-10">
        <Image 
          src="/illustration.png" 
          alt="HD-ISD Background" 
          fill 
          className="object-cover"
          priority
        />
        
        {/* Lớp phủ màu nhẹ hơn để hình không bị mờ/tối quá */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-cyan-800/30 mix-blend-multiply z-10" />
        
        {/* Gradient từ dưới lên để đảm bảo phần chữ dưới cùng vẫn dễ đọc */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/20 to-transparent z-10" />
        
        <div className="relative z-20 max-w-2xl mb-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg shrink-0">
              <Droplets className="text-blue-600" size={32} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white tracking-tight leading-snug">
                CÔNG TY CỔ PHẦN TƯ VẤN XÂY DỰNG THUỶ LỢI<br/>VÀ CƠ SỞ HẠ TẦNG HẢI DƯƠNG
              </h1>
            </div>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-3 leading-tight whitespace-nowrap">
            Thiết kế hệ thống công trình thủy lợi
          </h2>
          <p className="text-blue-100/90 text-lg">
            Cung cấp các công cụ và giải pháp toàn diện cho thiết kế hạ tầng thuỷ lợi có sự hỗ trợ của trí tuệ nhân tạo
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-hidden bg-white">
        
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 xl:px-40 w-full">
          
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md shrink-0">
              <Droplets className="text-white" size={26} />
            </div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
              CÔNG TY CP TƯ VẤN XD THUỶ LỢI<br/>VÀ CƠ SỞ HẠ TẦNG HẢI DƯƠNG
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 w-full max-w-md mx-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Tên đăng nhập</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    name="email"
                    required
                    defaultValue="admin@haiduong.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    required
                    defaultValue="Pass@123"
                    className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 pb-2">
              <label className="flex items-center text-slate-500 cursor-pointer hover:text-slate-700 transition-colors font-medium">
                <input type="checkbox" className="mr-2.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                Ghi nhớ thông tin đăng nhập
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wide rounded-lg shadow-sm transform transition-all active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="py-8 text-center mt-auto">
          <p className="text-[13px] text-slate-400 font-medium">
            © 2026 Bản quyền thuộc về Dự án HD-ISD
          </p>
        </div>
      </div>
    </div>
  )
}
