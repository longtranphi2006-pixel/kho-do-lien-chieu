'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  HeartHandshake,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { allUsers, switchUser } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('vanan.dut@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('Trường Đại học Bách khoa - ĐHĐN');
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Pick matching mock user or first user
      const matched = allUsers.find(
        (u) =>
          u.email?.toLowerCase() === identifier.toLowerCase() ||
          u.phone === identifier
      ) || allUsers[0];

      switchUser(matched.id);
      router.push('/');
    }, 600);
  };

  const handleOAuthLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      switchUser(allUsers[0].id);
      router.push('/');
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Brand Icon Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#0F5B4B] text-white flex items-center justify-center mx-auto shadow-md shadow-[#0F5B4B]/20">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kho Đồ Liên Chiểu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Nền tảng chia sẻ & đổi đồ dùng sinh viên P2P
          </p>
        </div>

        {/* Strict Figma Trust Badge (Per Design Spec) */}
        <div className="p-3.5 rounded-2xl bg-[#EAF7F2] border border-[#A7E2CB] flex items-start gap-2.5 text-xs text-[#0F5B4B]">
          <ShieldCheck className="w-5 h-5 shrink-0 text-[#0F5B4B] mt-0.5" />
          <p className="leading-relaxed">
            <strong>Bảo chứng an toàn:</strong> Tài khoản của bạn được xác thực để bảo đảm an toàn và chỉ sử dụng cho mục đích của Kho Đồ Liên Chiểu.
          </p>
        </div>

        {/* Tab Toggle: Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Đăng ký thành viên
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Trường / Đơn vị học tập tại Đà Nẵng
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20 truncate"
                  >
                    <option value="Trường Đại học Bách khoa - ĐHĐN">Trường Đại học Bách khoa - ĐHĐN</option>
                    <option value="Trường Đại học Sư phạm - ĐHĐN">Trường Đại học Sư phạm - ĐHĐN</option>
                    <option value="Trường Cao đẳng Kinh tế - Kế hoạch">Cao đẳng Kinh tế - Kế hoạch</option>
                    <option value="Ký túc xá Phía Tây / Khu Công nghệ cao">Ký túc xá Phía Tây / Khu CNC</option>
                    <option value="Cư dân quận Liên Chiểu">Cư dân quận Liên Chiểu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã số sinh viên (MSSV)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Ví dụ: 106210045"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Số điện thoại hoặc Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0905... hoặc sv@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Ẩn/hiện mật khẩu"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản xác thực'}
          </button>
        </form>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold absolute">
              Hoặc tiếp tục với
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="py-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.9 7C.7 9.4 0 12 0 14.7s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.9 7.5 23.5 12 23.5z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('facebook')}
              className="py-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
