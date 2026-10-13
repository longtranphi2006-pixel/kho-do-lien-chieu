'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ShieldCheck, UserCheck, RefreshCw, Database, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { currentUser, switchUser, allUsers, isSupabaseMode } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside aria-label="Bảng điều khiển thử nghiệm" className="fixed bottom-20 md:bottom-6 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2 sm:p-2.5 transition-all text-xs text-slate-700">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 font-semibold text-[#0F5B4B] hover:text-[#0A3F34] cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Chế độ Thử nghiệm:</span>
          <span className="bg-[#EAF7F2] px-2 py-0.5 rounded-md border border-[#A7E2CB] font-bold">
            {currentUser ? (currentUser.role === 'admin' ? '🛡️ Admin' : '🎓 Sinh viên') : 'Chưa đăng nhập'} {currentUser ? `(${currentUser.full_name.split(' ').slice(-1)[0]})` : ''}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {isOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2 min-w-[220px]">
            <div className="text-[11px] text-slate-500 font-medium">Chuyển đổi người dùng thử:</div>
            <div className="grid grid-cols-1 gap-1">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    currentUser?.id === user.id
                      ? 'bg-[#0F5B4B] text-white font-semibold'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="truncate">{user.full_name}</span>
                  <span className="text-[10px] opacity-80 shrink-0 ml-1">
                    {user.role === 'admin' ? 'Admin' : user.university.includes('Sư phạm') ? 'Sư phạm' : 'Bách Khoa'}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-[#0F5B4B]" />
                {isSupabaseMode ? 'Supabase Live Cloud' : 'Bộ nhớ Demo Sẵn sàng'}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
