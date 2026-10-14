'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Home, Layers, Plus, Bell, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { notifications, currentUser } = useAppStore();
  const myNotifications = currentUser
    ? notifications.filter((n) => n.user_id === currentUser.id && (!currentUser.full_name || !n.title?.includes(currentUser.full_name)))
    : [];
  const unreadCount = myNotifications.filter((n) => !n.is_read).length;

  const navItems = [
    { label: 'Trang chủ', href: '/', icon: Home },
    { label: 'Kho đồ', href: '/items', icon: Layers },
    {
      label: 'Đăng đồ',
      href: currentUser ? '/items/new' : '/auth?redirect=/items/new',
      isCenterAction: true,
      icon: Plus,
    },
    {
      label: 'Thông báo',
      href: currentUser ? '/notifications' : '/auth',
      icon: Bell,
      badge: unreadCount,
    },
    {
      label: currentUser ? 'Hồ sơ' : 'Đăng nhập',
      href: currentUser ? '/profile' : '/auth',
      icon: User,
    },
  ];

  return (
    <nav aria-label="Điều hướng chính di động" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          if (item.isCenterAction) {
            return (
              <div key={item.href} className="relative -top-5">
                <Link
                  href={item.href}
                  className="flex flex-col items-center group cursor-pointer"
                  aria-label="Đăng đồ dùng mới"
                >
                  <div className="w-13 h-13 rounded-full bg-[#0F5B4B] text-white flex items-center justify-center shadow-lg shadow-[#0F5B4B]/35 border-4 border-white group-hover:scale-105 active:scale-95 transition-transform animate-pulse-glow">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F5B4B] mt-0.5">
                    + Đăng đồ
                  </span>
                </Link>
              </div>
            );
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-xl transition-all ${
                isActive ? 'text-[#0F5B4B] font-semibold' : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-[#0F5B4B] stroke-[2.3]' : 'text-slate-500'
                  }`}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'text-[#0F5B4B]' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
