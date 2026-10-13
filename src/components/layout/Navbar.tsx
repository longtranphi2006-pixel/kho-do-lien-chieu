'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Search,
  Bell,
  PlusCircle,
  Shield,
  Layers,
  HeartHandshake,
  User,
  LogOut,
  ChevronDown,
  Clock,
  ArrowRight,
  Flame,
  CheckCheck,
  Star,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { currentUser, allUsers, transactions, notifications, markNotificationAsRead, logout } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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

  const myTransactionIds = React.useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      transactions
        .filter((t) => myUserIds.has(t.giver_id) || myUserIds.has(t.receiver_id))
        .map((t) => t.id)
    );
  }, [currentUser, myUserIds, transactions]);

  // Filter notifications for this user (or general)
  const myNotifications = notifications.filter(
    (n) =>
      !currentUser ||
      myUserIds.has(n.user_id) ||
      n.user_id === 'usr-admin-bql' ||
      (n.action_link && Array.from(myTransactionIds).some((tid) => n.action_link?.includes(tid)))
  );
  const unreadCount = myNotifications.filter((n) => !n.is_read).length;
  const urgentTradeNotifs = myNotifications.filter((n) => n.type === 'trade' && !n.is_read);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-[#0F5B4B] flex items-center justify-center text-white shadow-md shadow-[#0F5B4B]/20 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#0F5B4B] uppercase leading-tight">
                  Kho Đồ Liên Chiểu
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Chia sẻ đồ dùng P2P • Hòa Khánh, ĐN
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center flex-1 max-w-md mx-4 relative"
            >
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giáo trình, quạt, bàn học, nồi cơm..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white focus:ring-2 focus:ring-[#0F5B4B]/20 transition-all"
              />
            </form>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0F5B4B] hover:bg-[#EAF7F2] transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                href="/items"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0F5B4B] hover:bg-[#EAF7F2] transition-colors"
              >
                Kho đồ
              </Link>
              <Link
                href="/trades"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0F5B4B] hover:bg-[#EAF7F2] transition-colors"
              >
                Tiến trình trao đổi
              </Link>
              {mounted && currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <Shield className="w-4 h-4 text-amber-700" />
                  Quản trị Admin
                </Link>
              )}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="md:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notification Bell with Quick Action Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowProfileMenu(false);
                  }}
                  className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#0F5B4B] transition-colors cursor-pointer"
                  aria-label="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Popover */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-fade-in text-sm">
                    {/* Popover Header */}
                    <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Bell className="w-4 h-4 text-[#0F5B4B]" />
                        <span>Thông báo của bạn</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            myNotifications.forEach((n) => markNotificationAsRead(n.id));
                          }}
                          className="text-[11px] font-semibold text-[#0F5B4B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Đọc hết
                        </button>
                      )}
                    </div>

                    {/* 🚨 HIGHLIGHT PINNED: Urgent trade requests on top */}
                    {urgentTradeNotifs.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50/50 border-b border-amber-200">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          <span>Yêu cầu nhận đồ cần bạn duyệt ngay</span>
                        </div>
                        {urgentTradeNotifs.slice(0, 1).map((notif) => (
                          <div key={`pop-urgent-${notif.id}`} className="space-y-1.5">
                            <div className="font-bold text-slate-900 text-xs line-clamp-1">
                              {notif.title}
                            </div>
                            <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {notif.content}
                            </div>
                            {notif.action_link && (
                              <Link
                                href={notif.action_link}
                                onClick={() => {
                                  markNotificationAsRead(notif.id);
                                  setShowNotifMenu(false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F5B4B] text-white text-xs font-bold hover:bg-[#0A3F34] shadow-xs mt-1"
                              >
                                <span>Vào xem & duyệt đơn ngay</span>
                                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Notifications List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {myNotifications.length > 0 ? (
                        myNotifications.slice(0, 5).map((notif) => (
                          <Link
                            key={`pop-${notif.id}`}
                            href={notif.action_link || '/notifications'}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setShowNotifMenu(false);
                            }}
                            className={`block p-3 transition-colors hover:bg-slate-50 ${
                              !notif.is_read ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                                  notif.type === 'trade'
                                    ? 'bg-emerald-100 text-[#0F5B4B]'
                                    : notif.type === 'review'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-teal-100 text-[#0F5B4B]'
                                }`}
                              >
                                {notif.type === 'trade' ? (
                                  <Clock className="w-3.5 h-3.5" />
                                ) : notif.type === 'review' ? (
                                  <Star className="w-3.5 h-3.5" />
                                ) : (
                                  <Bell className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <div
                                    className={`text-xs truncate ${
                                      notif.is_read ? 'font-medium text-slate-800' : 'font-bold text-[#0F5B4B]'
                                    }`}
                                  >
                                    {notif.title}
                                  </div>
                                  {!notif.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-[#0F5B4B] shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {notif.content}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Chưa có thông báo nào
                        </div>
                      )}
                    </div>

                    {/* Popover Footer */}
                    <div className="pt-2 px-3 border-t border-slate-100 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotifMenu(false)}
                        className="text-xs font-bold text-[#0F5B4B] hover:underline inline-flex items-center gap-1 py-1"
                      >
                        <span>Xem toàn bộ trung tâm thông báo</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop "+ Đăng đồ" button */}
              <Link
                href="/items/new"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F5B4B] text-white text-sm font-semibold hover:bg-[#0A3F34] shadow-sm shadow-[#0F5B4B]/20 transition-all hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Đăng đồ</span>
              </Link>

              {/* User Avatar & Dropdown / Login button */}
              {mounted && currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {currentUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-[#0F5B4B]/40"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold text-xs flex items-center justify-center">
                        {currentUser.full_name.charAt(0)}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-fade-in text-sm">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-semibold text-slate-900 truncate">
                          {currentUser.full_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {currentUser.university}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#0F5B4B] bg-[#EAF7F2] px-2 py-0.5 rounded-full">
                          ⭐ {currentUser.reputation_score} điểm đóng góp
                        </div>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B]"
                      >
                        <User className="w-4 h-4" />
                        Hồ sơ cá nhân
                      </Link>

                      <Link
                        href="/items"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B]"
                      >
                        <Layers className="w-4 h-4" />
                        Kho đồ cộng đồng
                      </Link>

                      {currentUser.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B]"
                        >
                          <Shield className="w-4 h-4" />
                          Bảng quản trị BQL
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                            router.push('/auth');
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất tài khoản
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : mounted ? (
                <Link
                  href="/auth"
                  className="px-4 py-2 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-semibold hover:bg-[#0A3F34] shadow-sm transition-all"
                >
                  Đăng nhập
                </Link>
              ) : (
                <div className="w-16 h-8" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center p-4 pt-16">
          <div className="bg-white rounded-2xl w-full max-w-lg p-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Tìm kiếm đồ dùng</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Đóng
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên đồ dùng cần tìm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <button
                type="submit"
                className="mt-3 w-full py-2.5 rounded-xl bg-[#0F5B4B] text-white font-medium text-sm hover:bg-[#0A3F34]"
              >
                Tìm kiếm ngay
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
