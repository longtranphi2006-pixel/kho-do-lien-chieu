'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Item, Profile, Transaction } from '@/types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Users,
  Repeat,
  Sparkles,
  Search,
  Download,
  Filter,
  Eye,
  Trash2,
  ArrowUpDown,
  Check,
  AlertTriangle,
  Gift,
  ArrowLeftRight,
  Database,
  ExternalLink,
  BarChart3,
  PieChart,
  Lock,
  Unlock,
  X,
  GraduationCap,
  Info,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    currentUser,
    items,
    allUsers,
    transactions,
    approveItem,
    rejectItem,
    deleteItem,
    toggleLockUser,
    isSupabaseMode,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'analytics' | 'queue' | 'items' | 'users' | 'trades'>('analytics');
  const [itemSearch, setItemSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Image Modal state
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Strict Route Guard: If not admin, show 403 Forbidden screen
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              403 - Khu Vực Hạn Chế
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Trang Quản trị này chỉ dành riêng cho tài khoản có quyền <strong>Quản trị viên (Admin)</strong> của Kho Đồ Liên Chiểu.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            {currentUser ? (
              <div>
                Tài khoản đang đăng nhập: <strong className="text-slate-900">{currentUser.full_name}</strong>
                <div className="text-[11px] text-slate-500">Vai trò: Sinh viên / Người dùng</div>
              </div>
            ) : (
              <div>Bạn chưa đăng nhập vào hệ thống.</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Về trang chủ
            </Link>
            <Link
              href="/auth"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F5B4B] text-white text-xs font-bold hover:bg-[#0A3F34] shadow-sm transition-colors"
            >
              Đăng nhập Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // KPI Calculations
  const totalItems = items.length;
  const activeExchanges = transactions.filter((t) => t.status !== 'COMPLETED').length;
  const completedExchanges = transactions.filter((t) => t.status === 'COMPLETED').length;
  const verifiedUsers = allUsers.filter((u) => u.is_verified).length;
  const pendingModeration = items.filter((i) => i.status === 'PENDING_ADMIN');
  const freeItemsCount = items.filter((i) => i.purpose === 'FREE').length;
  const exchangeItemsCount = items.filter((i) => i.purpose === 'EXCHANGE').length;

  // Category counts for Bar Chart
  const categoriesList = ['Giáo trình & Sách', 'Đồ điện tử & Gia dụng', 'Bàn ghế & Nội thất', 'Thời trang & Đồ dùng khác'];
  const categoryCounts = categoriesList.map((cat) => {
    const count = items.filter((i) => i.category === cat || i.category.includes(cat.split(' ')[0])).length;
    return { name: cat, count, percent: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0 };
  });

  // University counts for Student distribution
  const universitiesList = [
    'Trường Đại học Bách khoa - ĐHĐN',
    'Trường Đại học Sư phạm - ĐHĐN',
    'Trường Cao đẳng Kinh tế - Kế hoạch',
    'Cư dân quận Liên Chiểu',
  ];
  const universityCounts = universitiesList.map((uni) => {
    const count = allUsers.filter((u) => u.university === uni).length;
    return {
      name: uni.replace('Trường Đại học ', 'ĐH ').replace('Trường Cao đẳng ', 'CĐ '),
      count,
      percent: allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0,
    };
  });

  // Filtered Listings
  const filteredListings = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.university.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Trades
  const filteredTrades = transactions.filter((t) => {
    if (tradeSearch.trim()) {
      const q = tradeSearch.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.item?.title && t.item.title.toLowerCase().includes(q)) ||
        (t.pickup_location && t.pickup_location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Export CSV helper for Zero-Code admin
  const handleExportCSV = (tableName: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (tableName === 'items') {
      csvContent += 'ID,TieuDe,DanhMuc,HinhThuc,TrangThai,DiaDiem,NgayTao\n';
      items.forEach((i) => {
        csvContent += `"${i.id}","${i.title}","${i.category}","${i.purpose}","${i.status}","${i.location}","${i.created_at}"\n`;
      });
    } else if (tableName === 'users') {
      csvContent += 'ID,HoTen,Truong,LienHe,DaTrao,UyTin,VaiTro,XacThuc,BiKhoa\n';
      allUsers.forEach((u) => {
        csvContent += `"${u.id}","${u.full_name}","${u.university}","${u.phone || u.email || ''}","${u.items_given_count}","${u.reputation_score}","${u.role}","${u.is_verified}","${!!u.is_locked}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kho_do_${tableName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7F2] text-[#0F5B4B] text-xs font-bold border border-[#A7E2CB] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bảng Quản Trị Hệ Thống • Trực quan 100%
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Trị BQL Kho Đồ Liên Chiểu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Giám sát bài đăng, duyệt tin AI, quản lý thành viên và theo dõi thống kê trực quan bằng chuột.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin: {currentUser.full_name}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#0F5B4B]" />
            {isSupabaseMode ? 'Supabase PostgreSQL' : 'Bộ nhớ Trực tiếp'}
          </span>
        </div>
      </div>

      {/* Visual KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số món đồ
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalItems}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">Đang chia sẻ</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F5B4B] flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trao đổi thành công
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {completedExchanges}
            </div>
            <div className="text-[11px] text-teal-600 font-medium">({activeExchanges} đang giao dịch)</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Thành viên xác thực
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {verifiedUsers}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">Sinh viên & Cư dân</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF9C3] text-[#854D0E] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-[#CA8A04]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Cần duyệt AI / Cờ
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {pendingModeration.length}
            </div>
            <div className="text-[11px] text-amber-700 font-medium">Hàng đợi kiểm duyệt</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold gap-2 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Biểu đồ & Thống kê
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Duyệt bài AI ({pendingModeration.length})
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'items'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Quản lý bài đăng ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý thành viên ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('trades')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'trades'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Lịch sử giao dịch ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Biểu đồ & Thống kê trực quan (Visual Charts) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Chart of Categories */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0F5B4B]" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Phân bổ món đồ theo danh mục
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Tổng: {totalItems} món</span>
              </div>
              <div className="space-y-3 pt-2">
                {categoryCounts.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className="text-[#0F5B4B]">{cat.count} món ({cat.percent}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F5B4B] to-[#147a64] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(cat.percent, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Purpose Ratio & Student Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#0F5B4B]" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Tỷ lệ hình thức chia sẻ
                </h3>
              </div>

              {/* Dual Progress Meter */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    🎁 Cho miễn phí: {freeItemsCount} ({totalItems > 0 ? Math.round((freeItemsCount / totalItems) * 100) : 0}%)
                  </span>
                  <span className="text-teal-700 flex items-center gap-1.5">
                    🔄 Đổi đồ: {exchangeItemsCount} ({totalItems > 0 ? Math.round((exchangeItemsCount / totalItems) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#0F5B4B] h-full"
                    style={{ width: `${totalItems > 0 ? (freeItemsCount / totalItems) * 100 : 50}%` }}
                    title="Cho miễn phí"
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${totalItems > 0 ? (exchangeItemsCount / totalItems) * 100 : 50}%` }}
                    title="Đổi đồ"
                  />
                </div>
              </div>

              {/* University Distribution */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Thành viên theo cơ sở đào tạo tại Đà Nẵng
                </h4>
                <div className="space-y-2">
                  {universityCounts.map((uni, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-medium text-slate-700 truncate pr-2">{uni.name}</span>
                      <span className="font-bold text-slate-900 shrink-0">{uni.count} SV</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Moderation Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Các bài đăng cần xem xét (AI Flagged Items)
              </h2>
              <p className="text-xs text-slate-500">
                Hệ thống AI Gemini tự động quét và đánh dấu bài đăng có nghi vấn thương mại hoặc không nhất quán.
              </p>
            </div>
          </div>

          {pendingModeration.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingModeration.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-amber-300 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                >
                  <div className="flex gap-4 items-start">
                    {item.images[0] ? (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="relative group cursor-pointer shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200 group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Layers className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Cần duyệt
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>

                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                        <span className="text-slate-500">Đăng bởi: <strong>{item.donor?.full_name || 'Người dùng'}</strong></span>
                        <span>•</span>
                        <span className="text-slate-500">{item.location}</span>
                      </div>

                      {item.ai_moderation_reason && (
                        <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <strong>⚠️ Lý do AI gắn cờ:</strong> {item.ai_moderation_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Xem ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => approveItem(item.id)}
                      className="px-4 py-2 rounded-xl bg-[#0F5B4B] text-white hover:bg-[#0A3F34] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" /> Duyệt bài
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectItem(item.id)}
                      className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-rose-200"
                    >
                      <XCircle className="w-4 h-4" /> Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800">Hàng đợi trống!</div>
              <p className="text-xs">Hiện không có bài đăng nào bị gắn cờ cần phê duyệt.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Bảng danh mục đồ dùng */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề, danh mục..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#0F5B4B]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="ALL">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="PENDING_ADMIN">Chờ duyệt</option>
                <option value="COMPLETED">Đã tặng</option>
              </select>
            </div>

            <button
              onClick={() => handleExportCSV('items')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất file CSV (Excel)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Món đồ</th>
                    <th className="p-3">Danh mục</th>
                    <th className="p-3">Hình thức</th>
                    <th className="p-3">Người đăng</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListings.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {it.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.images[0]}
                              alt={it.title}
                              onClick={() => setPreviewItem(it)}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80"
                            />
                          )}
                          <span className="truncate max-w-[200px]">{it.title}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{it.category}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.purpose === 'FREE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {it.purpose === 'FREE' ? '🎁 Cho tặng' : '🔄 Đổi đồ'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{it.donor?.full_name || 'Sinh viên'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : it.status === 'PENDING_ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {it.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setPreviewItem(it)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-[#0F5B4B] hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                        >
                          Xem ảnh
                        </button>
                        {it.status === 'PENDING_ADMIN' && (
                          <button
                            onClick={() => approveItem(it.id)}
                            className="px-2 py-1 rounded-lg bg-[#0F5B4B] text-white hover:bg-[#0A3F34] text-[11px] font-bold cursor-pointer"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(it.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Quản lý thành viên (Users) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm thành viên, trường ĐH..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#0F5B4B]"
              />
            </div>

            <button
              onClick={() => handleExportCSV('users')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất file CSV (Excel)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Thành viên</th>
                    <th className="p-3">Trường / Đơn vị</th>
                    <th className="p-3">Liên hệ</th>
                    <th className="p-3 text-center">Đã trao</th>
                    <th className="p-3 text-center">Giao dịch</th>
                    <th className="p-3 text-center">Uy tín</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3 text-right">Hành động quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar_url}
                              alt={u.full_name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">
                              {u.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block">{u.full_name}</span>
                            {u.is_locked && (
                              <span className="text-[10px] text-rose-600 font-bold">🔒 Tài khoản đang bị khóa</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-xs">{u.university}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{u.phone || u.email}</td>
                      <td className="p-3 text-center font-bold text-[#0F5B4B]">{u.items_given_count}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{u.completed_trades_count}</td>
                      <td className="p-3 text-center font-bold text-amber-600">⭐ {u.reputation_score}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Quản trị' : 'Sinh viên'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => toggleLockUser(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                              u.is_locked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {u.is_locked ? (
                              <>
                                <Unlock className="w-3 h-3" /> Mở khóa
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> Khóa tài khoản
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Lịch sử giao dịch */}
      {activeTab === 'trades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tradeSearch}
                onChange={(e) => setTradeSearch(e.target.value)}
                placeholder="Tìm mã GD, địa điểm..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#0F5B4B]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Mã GD</th>
                    <th className="p-3">Món đồ</th>
                    <th className="p-3">Bên cho đồ</th>
                    <th className="p-3">Bên nhận</th>
                    <th className="p-3">Điểm hẹn</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrades.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-[11px] font-bold text-[#0F5B4B]">{tr.id}</td>
                      <td className="p-3 font-semibold text-slate-900 truncate max-w-[200px]">
                        {tr.item?.title || 'Món đồ'}
                      </td>
                      <td className="p-3 text-slate-600">{tr.giver?.full_name || tr.giver_id}</td>
                      <td className="p-3 text-slate-600">{tr.receiver?.full_name || tr.receiver_id}</td>
                      <td className="p-3 text-slate-500 truncate max-w-[150px]">
                        {tr.pickup_location || 'Cổng trường'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tr.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tr.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/trades/${tr.id}`}
                          className="text-[#0F5B4B] font-bold hover:underline"
                        >
                          Chi tiết ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal (Popup phóng to ảnh bài đăng) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm truncate pr-2">
                {previewItem.title}
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 space-y-3">
              <div className="rounded-2xl overflow-hidden bg-slate-100 max-h-72 flex items-center justify-center border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewItem.images[0]}
                  alt={previewItem.title}
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Danh mục: <strong>{previewItem.category}</strong></span>
                  <span className="font-bold text-[#0F5B4B]">
                    {previewItem.purpose === 'FREE' ? '🎁 Cho tặng miễn phí' : '🔄 Đổi đồ'}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {previewItem.description}
                </p>

                {previewItem.ai_moderation_reason && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    <strong>Đánh giá Gemini AI:</strong> {previewItem.ai_moderation_reason}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex gap-2">
                {previewItem.status === 'PENDING_ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      approveItem(previewItem.id);
                      setPreviewItem(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#0F5B4B] text-white text-xs font-bold hover:bg-[#0A3F34] cursor-pointer"
                  >
                    Duyệt bài này
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    deleteItem(previewItem.id);
                    setPreviewItem(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 border border-rose-200 cursor-pointer"
                >
                  Xóa bài này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
