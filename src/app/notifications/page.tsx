'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Layers,
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead } = useAppStore();

  const handleMarkAll = () => {
    notifications.forEach((n) => markNotificationAsRead(n.id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Thông Báo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cập nhật về các phiên trao đồ, đánh giá và thông báo hệ thống.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5B4B] hover:text-[#0A3F34] cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                notif.is_read
                  ? 'bg-white border-slate-200'
                  : 'bg-[#EAF7F2]/60 border-[#A7E2CB] shadow-xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'trade'
                    ? 'bg-emerald-100 text-[#0F5B4B]'
                    : notif.type === 'review'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-[#0F5B4B]'
                }`}
              >
                {notif.type === 'trade' ? (
                  <Clock className="w-5 h-5" />
                ) : notif.type === 'review' ? (
                  <Star className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm ${
                      notif.is_read ? 'font-semibold text-slate-800' : 'font-bold text-[#0F5B4B]'
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                  {notif.content}
                </p>

                {notif.action_link && (
                  <Link
                    href={notif.action_link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F5B4B] hover:underline mt-2"
                  >
                    Xem chi tiết tiến trình <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!notif.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#0F5B4B] shrink-0 self-center" />
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            Hiện tại bạn không có thông báo nào.
          </div>
        )}
      </div>
    </div>
  );
}
