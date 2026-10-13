'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Item, Profile, Transaction } from '@/types';
import {
  ShieldAlert,
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
    switchUser,
    isSupabaseMode,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'items' | 'users' | 'trades'>('queue');
  const [itemSearch, setItemSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isAdmin = currentUser?.role === 'admin';

  // KPI Calculations
  const totalItems = items.length;
  const activeExchanges = transactions.filter((t) => t.status !== 'COMPLETED').length;
  const verifiedUsers = allUsers.filter((u) => u.is_verified).length;
  const pendingModeration = items.filter((i) => i.status === 'PENDING_ADMIN');

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
        (u.phone && u.phone.includes(q))
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
      csvContent += 'ID,TieuDe,DanhMuc,MucDich,TinhTrang,DiaDiem,TrangThai,NgayDang\n';
      items.forEach((i) => {
        csvContent += `"${i.id}","${i.title.replace(/"/g, '""')}","${i.category}","${i.purpose}","${i.condition}","${i.location}","${i.status}","${i.created_at}"\n`;
      });
    } else if (tableName === 'users') {
      csvContent += 'ID,HoTen,Truong,Khoa,DiemUyTin,MonDaTrao,GiaoDich,VaiTro,XacThuc\n';
      allUsers.forEach((u) => {
        csvContent += `"${u.id}","${u.full_name}","${u.university}","${u.department || ''}","${u.reputation_score}","${u.items_given_count}","${u.completed_trades_count}","${u.role}","${u.is_verified}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tableName}_kho_do_lien_chieu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Role Check & Easy Switch Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">
                Bạn đang xem ở vai trò {currentUser ? `Sinh viên (${currentUser.full_name})` : 'Khách vãng lai'}.
              </span>
              <p className="text-xs text-amber-700">Trang quản trị BQL chỉ dành cho quản trị viên.</p>
            </div>
          </div>
          <button
            onClick={() => switchUser('usr-admin-lienchieu')}
            className="px-4 py-2 rounded-xl bg-[#0F5B4B] text-white text-xs font-bold hover:bg-[#0A3F34] cursor-pointer whitespace-nowrap"
          >
            Đăng nhập với Quản trị viên (Admin) ngay
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7F2] text-[#0F5B4B] text-xs font-bold border border-[#A7E2CB] mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Trực quan • Không cần kiến thức lập trình
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng Quản Trị BQL Kho Đồ Liên Chiểu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Giám sát hàng đợi AI, phê duyệt bài đăng, và quản lý bảng dữ liệu cộng đồng thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#0F5B4B]" />
            {isSupabaseMode ? 'Supabase PostgreSQL Cloud' : 'Chế độ Demo Tự lưu trữ'}
          </span>
        </div>
      </div>

      {/* Visual KPI Overview (Per Prompt Specification) */}
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
            <div className="text-[11px] text-emerald-600 font-medium">Hoạt động trong kho</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F5B4B] flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trao đổi đang chạy
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activeExchanges}
            </div>
            <div className="text-[11px] text-teal-600 font-medium">Đang hẹn giao nhận</div>
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
          onClick={() => setActiveTab('queue')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Hàng đợi kiểm duyệt AI ({pendingModeration.length})
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
          Bảng Excel: Danh mục đồ dùng ({items.length})
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
          Bảng Excel: Người dùng & Sinh viên ({allUsers.length})
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
          Bảng Excel: Giao dịch trao đổi ({transactions.length})
        </button>
      </div>

      {/* Tab 1: AI Moderation Queue (Per Prompt Specification) */}
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
                  className="bg-white rounded-3xl border border-amber-200/90 shadow-md p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5"
                >
                  {/* Left: Thumbnail & Side-by-side Photo view */}
                  <div className="md:col-span-4 relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    {item.images && item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Không có ảnh
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#CA8A04]">
                      ⚠️ Cần BQL duyệt
                    </span>
                  </div>

                  {/* Center: Info & AI Reasoning */}
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {item.category}
                        </span>
                        <span className="text-slate-400">• Khu vực: {item.location}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Gemini AI Reasoning Alert Card */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Phân tích từ Gemini Vision AI:</span>
                      </div>
                      <p className="leading-relaxed opacity-95">
                        {item.ai_moderation_reason || 'Phát hiện từ khóa có yếu tố thương mại hoặc báo giá tiền tệ.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: 1-Click Action Buttons */}
                  <div className="md:col-span-3 flex flex-col justify-center gap-2.5 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 pt-3 md:pt-0">
                    <button
                      onClick={() => approveItem(item.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0F5B4B] text-white font-bold text-xs sm:text-sm hover:bg-[#0A3F34] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Duyệt bài (Approve)
                    </button>
                    <button
                      onClick={() => rejectItem(item.id, 'Nội dung vi phạm quy tắc phi thương mại của Kho Đồ Liên Chiểu')}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Từ chối (Reject)
                    </button>
                    <Link
                      href={`/items/${item.id}`}
                      className="text-center text-xs font-medium text-slate-500 hover:text-slate-800 py-1"
                    >
                      Xem trang bài đăng ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Hàng đợi kiểm duyệt trống</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                Tất cả bài đăng mới đều đã được thông qua tự động hoặc đã được BQL xử lý.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Excel/Spreadsheet Listings Table */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Tìm theo tiêu đề, danh mục..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#0F5B4B]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white cursor-pointer"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING_ADMIN">PENDING_ADMIN</option>
              </select>
            </div>

            <button
              onClick={() => handleExportCSV('items')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất file CSV (Excel)
            </button>
          </div>

          {/* Spreadsheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Mã</th>
                    <th className="p-3">Ảnh</th>
                    <th className="p-3">Tiêu đề món đồ</th>
                    <th className="p-3">Danh mục</th>
                    <th className="p-3">Mục đích</th>
                    <th className="p-3">Địa điểm</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListings.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{it.id}</td>
                      <td className="p-3">
                        {it.images && it.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.images[0]}
                            alt={it.title}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100" />
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                        <Link href={`/items/${it.id}`} className="hover:text-[#0F5B4B]">
                          {it.title}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-600">{it.category}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.purpose === 'FREE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {it.purpose === 'FREE' ? 'Miễn phí' : 'Đổi đồ'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[150px]">{it.location}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : it.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : it.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {it.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {it.status === 'PENDING_ADMIN' && (
                          <button
                            onClick={() => approveItem(it.id)}
                            className="px-2 py-1 bg-[#0F5B4B] text-white rounded text-[11px] font-semibold hover:bg-[#0A3F34]"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(it.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa món đồ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Tab 3: Excel/Spreadsheet Users Table */}
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
                    <th className="p-3 text-right">Xác thực</th>
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
                          <span className="font-semibold text-slate-900">{u.full_name}</span>
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
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#0F5B4B] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa</span>
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

      {/* Tab 4: Excel/Spreadsheet Transactions Table */}
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
                    <th className="p-3 text-right">Xem</th>
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
    </div>
  );
}
