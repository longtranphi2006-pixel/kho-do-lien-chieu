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
  Edit3,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { currentUser, allUsers, transactions, notifications, markNotificationAsRead, logout, isUserLocked } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const notifMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const myUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentUser) {
      ids.add(currentUser.id);
      if (currentUser.email && currentUser.email.trim()) {
        const cleanEmail = currentUser.email.trim().toLowerCase();
        allUsers
          .filter((u) => u.email && u.email.trim().toLowerCase() === cleanEmail)
          .forEach((u) => ids.add(u.id));
      }
    }
    return ids;
  }, [currentUser, allUsers]);

  const myUserNames = React.useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.full_name) {
      names.add(currentUser.full_name.toLowerCase());
    }
    allUsers
      .filter((u) => myUserIds.has(u.id) && u.full_name && u.full_name !== 'Thành viên Liên Chiểu')
      .forEach((u) => names.add(u.full_name.toLowerCase()));
    return names;
  }, [currentUser, myUserIds, allUsers]);

  // Filter notifications strictly for this user (empty for guests)
  const myNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => {
      // Must be sent to one of currentUser's IDs, or admin if user is admin
      const isForMe = myUserIds.has(n.user_id) || (currentUser.role === 'admin' && n.user_id === 'usr-admin-bql');
      if (!isForMe) return false;

      // Never show notifications of messages sent by oneself
      if (n.title?.startsWith('Tin nhắn mới từ')) {
        const lowerTitle = n.title.toLowerCase();
        for (const name of myUserNames) {
          if (name && lowerTitle.includes(name)) return false;
        }
      }
      return true;
    });
  }, [notifications, currentUser, myUserIds, myUserNames]);
  const unreadCount = myNotifications.filter((n) => !n.is_read).length;
  const urgentTradeNotifs = myNotifications.filter((n) => n.type === 'trade' && !n.is_read);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  const isCurrentLocked = mounted && currentUser ? isUserLocked(currentUser) : false;

  return (
    <>
      {/* Banner thông báo tài khoản bị khóa */}
      {isCurrentLocked && currentUser && (
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 text-white px-4 py-2.5 text-xs sm:text-sm font-medium sticky top-0 z-50 shadow-md border-b border-rose-800 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">🔒</span>
              <div className="truncate">
                <strong>Tài khoản bị tạm khóa chức năng (Chế độ vãng lai):</strong>{' '}
                <span className="text-rose-100">
                  {currentUser.locked_until
                    ? `Hiệu lực đến ${new Date(currentUser.locked_until).toLocaleString('vi-VN')}`
                    : 'Hiệu lực vĩnh viễn'}
                  .{currentUser.lock_reason ? ` Lý do: "${currentUser.lock_reason}".` : ''} Bạn chỉ có thể xem nội dung, không thể đăng bài, yêu cầu nhận đồ hay trao đổi.
                </span>
              </div>
            </div>
            <Link
              href="/profile"
              className="shrink-0 underline hover:text-rose-100 font-bold text-xs whitespace-nowrap bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      )}

      <header className={`sticky ${isCurrentLocked ? 'top-[41px]' : 'top-0'} z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0F5B4B] flex items-center justify-center text-white shadow-md shadow-[#0F5B4B]/20 shrink-0 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-[#0F5B4B] uppercase leading-tight truncate">
                  Kho Đồ Liên Chiểu
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-tight truncate max-w-[145px] xs:max-w-[200px] sm:max-w-none">
                  Chia sẻ đồ dùng cộng đồng • Liên Chiểu, Đà Nẵng
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
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="md:hidden p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notification Bell with Quick Action Dropdown - Logged in users only */}
              {mounted && currentUser && (
                <div className="relative shrink-0" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowProfileMenu(false);
                  }}
                  className="relative p-1.5 rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#0F5B4B] transition-colors cursor-pointer shrink-0"
                  aria-label="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
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
            )}

            {/* Desktop "+ Đăng đồ" button */}
            {isCurrentLocked ? (
              <button
                type="button"
                onClick={() => alert('Tài khoản của bạn đang bị khóa tất cả các chức năng và chỉ được hoạt động ở chế độ vãng lai.')}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 text-slate-500 text-sm font-semibold cursor-not-allowed transition-all"
                title="Tài khoản đang bị khóa chức năng (chế độ vãng lai)"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <span>+ Đăng đồ (Đã khóa)</span>
              </button>
            ) : (
              <Link
                href={currentUser ? "/items/new" : "/auth?redirect=/items/new"}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F5B4B] text-white text-sm font-semibold hover:bg-[#0A3F34] shadow-sm shadow-[#0F5B4B]/20 transition-all hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Đăng đồ</span>
              </Link>
            )}

              {/* User Avatar & Dropdown / Login button */}
              {mounted && currentUser ? (
                <div className="relative shrink-0" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifMenu(false);
                    }}
                    className="flex items-center gap-1 p-0.5 sm:p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    aria-label="Tài khoản cá nhân"
                  >
                    {currentUser.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-[#0F5B4B]/50 shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold text-xs flex items-center justify-center border-2 border-[#0F5B4B]/40 shadow-xs">
                        {currentUser.full_name.charAt(0)}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in text-sm">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate">
                          {currentUser.full_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {currentUser.university}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#0F5B4B] bg-[#EAF7F2] px-2 py-0.5 rounded-full">
                          ⭐ {currentUser.reputation_score} điểm đóng góp
                        </div>
                        {isCurrentLocked && (
                          <div className="mt-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                            <span>🔒</span> Chế độ vãng lai (Đang bị khóa)
                          </div>
                        )}
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-[#0F5B4B]" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        href="/profile?edit=true"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#0F5B4B] font-bold hover:bg-[#EAF7F2] transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-[#0F5B4B]" />
                        <span>Sửa thông tin tài khoản</span>
                      </Link>

                      <Link
                        href="/items"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] font-medium transition-colors"
                      >
                        <Layers className="w-4 h-4 text-slate-500" />
                        <span>Kho đồ cộng đồng</span>
                      </Link>

                      {currentUser.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-700" />
                          <span>Bảng quản trị BQL</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                            router.push('/auth');
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : mounted ? (
                <Link
                  href="/auth"
                  className="px-3.5 py-1.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-semibold hover:bg-[#0A3F34] shadow-sm transition-all shrink-0"
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
