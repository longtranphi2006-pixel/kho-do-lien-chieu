'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, currentUser, allUsers, transactions } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'trades' | 'unread' | 'reviews'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const myUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentUser) {
      ids.add(currentUser.id);
      allUsers
        .filter(
          (u) =>
            (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (u.full_name && currentUser.full_name && u.full_name === currentUser.full_name && u.full_name !== 'Thành viên Liên Chiểu')
        )
        .forEach((u) => ids.add(u.id));
      if (currentUser.email?.toLowerCase().includes('longtranphi22006') || currentUser.full_name === 'Trần Đức Long') {
        ids.add('usr-oauth-1791897070645');
        ids.add('usr-oauth-1791902102209');
      }
      if (currentUser.email?.toLowerCase().includes('longtranphi2006') || currentUser.full_name?.includes('18.Trần Lê Phi Long')) {
        ids.add('usr-oauth-1791899728239');
      }
    }
    return ids;
  }, [currentUser, allUsers]);

  // Match any notification referencing a transaction that involves currentUser (as giver or receiver)
  const myTransactionIds = React.useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      transactions
        .filter((t) => myUserIds.has(t.giver_id) || myUserIds.has(t.receiver_id))
        .map((t) => t.id)
    );
  }, [currentUser, myUserIds, transactions]);

  // Filter notifications relevant to current user
  const myNotifications = currentUser
    ? notifications.filter(
        (n) =>
          myUserIds.has(n.user_id) ||
          n.user_id === 'usr-admin-bql' ||
          (n.action_link && Array.from(myTransactionIds).some((tid) => n.action_link?.includes(tid)))
      )
    : [];

  // High priority action items (Trade requests / pending stepper approvals that are unread or actionable)
  const urgentTradeNotifs = myNotifications.filter(
    (n) => n.type === 'trade' && !n.is_read
  );

  // Other notifications
  const filteredNotifications = myNotifications.filter((n) => {
    if (activeTab === 'trades') return n.type === 'trade';
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'reviews') return n.type === 'review';
    return true;
  });

  const handleMarkAll = () => {
    myNotifications.forEach((n) => markNotificationAsRead(n.id));
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (!mounted) {
        return date.toLocaleDateString('vi-VN');
      }
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Gần đây';
    }
  };

  if (mounted && !currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0F5B4B] flex items-center justify-center mx-auto">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          Chưa đăng nhập tài khoản
        </h2>
        <p className="text-slate-500 text-sm">
          Vui lòng đăng nhập tài khoản để nhận và theo dõi các thông báo trao đổi đồ dùng của bạn.
        </p>
        <Link
          href="/auth?redirect=/notifications"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0F5B4B] text-white font-bold text-sm hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Thông Báo
            </h1>
            {myNotifications.some((n) => !n.is_read) && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                {myNotifications.filter((n) => !n.is_read).length} mới
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi yêu cầu nhận đồ, tiến trình trao nhận P2P và thông báo từ cộng đồng.
          </p>
        </div>

        {myNotifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAll}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* 🚨 SECTION 1: URGENT / ACTION REQUIRED (Pinned at the very top with vibrant highlight) */}
      {urgentTradeNotifs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <Flame className="w-4 h-4 text-amber-600" />
            Đơn trao đổi & yêu cầu cần bạn phản hồi ngay ({urgentTradeNotifs.length})
          </div>

          <div className="space-y-3">
            {urgentTradeNotifs.map((notif) => (
              <div
                key={`urgent-${notif.id}`}
                className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50/60 to-white border-2 border-amber-300 shadow-md shadow-amber-500/10 transition-all hover:shadow-lg"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-xs">
                    ⚡ CẦN XỬ LÝ NGAY
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatTime(notif.created_at)}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#0F5B4B] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#0F5B4B]/30">
                    <Clock className="w-6 h-6 stroke-[2.3]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {notif.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                      {notif.content}
                    </p>

                    {notif.action_link && (
                      <div className="mt-3.5 flex items-center gap-2">
                        <Link
                          href={notif.action_link}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 transition-all hover:gap-2.5"
                        >
                          <span>Vào xem & duyệt đơn ngay</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[#0F5B4B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({myNotifications.length})
        </button>

        <button
          onClick={() => setActiveTab('trades')}
          className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'trades'
              ? 'bg-[#0F5B4B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Đơn trao đổi ({myNotifications.filter((n) => n.type === 'trade').length})
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-[#0F5B4B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Chưa đọc</span>
          {myNotifications.filter((n) => !n.is_read).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {myNotifications.filter((n) => !n.is_read).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-[#0F5B4B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Đánh giá ({myNotifications.filter((n) => n.type === 'review').length})
        </button>
      </div>

      {/* 📋 SECTION 2: NOTIFICATION LIST (Chronological Newest First) */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const isTrade = notif.type === 'trade';
            const isReview = notif.type === 'review';

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 sm:p-4.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  notif.is_read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : isTrade
                    ? 'bg-amber-50/60 border-amber-300/80 shadow-xs ring-1 ring-amber-400/30'
                    : 'bg-[#EAF7F2]/60 border-[#A7E2CB] shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isTrade
                      ? 'bg-emerald-100 text-[#0F5B4B]'
                      : isReview
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-[#0F5B4B]'
                  }`}
                >
                  {isTrade ? (
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  ) : isReview ? (
                    <Star className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm ${
                          notif.is_read
                            ? 'font-semibold text-slate-800'
                            : 'font-extrabold text-[#0F5B4B]'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {isTrade && !notif.is_read && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Đơn hàng
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {notif.content}
                  </p>

                  {notif.action_link && (
                    <div className="mt-2.5">
                      <Link
                        href={notif.action_link}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !notif.is_read && isTrade
                            ? 'bg-[#0F5B4B] text-white hover:bg-[#0A3F34] shadow-xs'
                            : 'bg-slate-100 text-[#0F5B4B] hover:bg-emerald-100'
                        }`}
                      >
                        <span>Xem chi tiết tiến trình</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0F5B4B] shrink-0 self-center" />
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-sm space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">Không có thông báo nào</div>
            <p className="text-xs text-slate-400">
              Các thông báo liên quan đến đồ dùng và trao đổi của bạn sẽ xuất hiện ở đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

