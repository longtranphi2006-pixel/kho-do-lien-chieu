'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Item,
  ItemStatus,
  Profile,
  Transaction,
  TradeStatus,
  ModerationResult,
  ReportItem,
  ReportTargetType,
  ReportReason,
  ReportStatus,
} from '@/types';
import {
  AiModerationConfig,
  DEFAULT_AI_CONFIG,
  getAiModerationConfig,
  saveAiModerationConfig,
} from '@/lib/aiConfig';
import { LockUserModal } from '@/components/common/LockUserModal';
import { AdminConfirmModal } from '@/components/common/AdminConfirmModal';
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
  EyeOff,
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
  Sliders,
  Cpu,
  Save,
  Plus,
  Play,
  RotateCcw,
  Tag,
  FileText,
  Ban,
  DollarSign,
  MessageSquareWarning,
  Flag,
} from 'lucide-react';

function AdminDashboardPageContent() {
  const searchParams = useSearchParams();
  const {
    currentUser,
    items,
    allUsers,
    transactions,
    approveItem,
    rejectItem,
    deleteItem,
    toggleLockUser,
    lockUser,
    unlockUser,
    isUserLocked,
    reports,
    resolveReport,
    adminHideItem,
    adminRestoreItem,
    cancelTrade,
    restoreTrade,
    deletedItemIds,
    isSupabaseMode,
  } = useAppStore();

  // Optimistic UI state for 0ms instant response on Admin actions
  const [optimisticItemStatus, setOptimisticItemStatus] = useState<Record<string, ItemStatus | 'DELETED'>>({});
  const [optimisticTradeStatus, setOptimisticTradeStatus] = useState<Record<string, TradeStatus>>({});
  const [, setActionProcessing] = useState<Record<string, boolean>>({});

  const [userToLock, setUserToLock] = useState<Profile | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // In-app Confirmation Modal State (Reliable across desktop & mobile)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
    iconType?: 'trash' | 'lock' | 'unlock' | 'warning' | 'info';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (config: {
    title: string;
    message: string;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
    iconType?: 'trash' | 'lock' | 'unlock' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModalConfig({
      isOpen: true,
      confirmText: config.confirmText || 'Xác nhận',
      cancelText: config.cancelText || 'Hủy bỏ',
      variant: config.variant || 'danger',
      ...config,
    });
  };

  const formatLockedStatus = (u: Profile) => {
    if (!isUserLocked(u)) return null;
    if (!u.locked_until) return 'Khóa vĩnh viễn';
    const until = new Date(u.locked_until);
    const diffHours = Math.round((until.getTime() - Date.now()) / (1000 * 3600));
    if (diffHours <= 1) return 'Khóa còn < 1 giờ';
    if (diffHours < 24) return `Khóa còn ${diffHours} giờ`;
    const diffDays = Math.round(diffHours / 24);
    return `Khóa đến ${until.toLocaleDateString('vi-VN')} (${diffDays} ngày)`;
  };

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'queue' | 'items' | 'users' | 'trades' | 'reports' | 'ai-rules'
  >('analytics');

  // Sync tab from URL query params (e.g. /admin?tab=reports)
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (
      tabParam === 'reports' ||
      tabParam === 'queue' ||
      tabParam === 'items' ||
      tabParam === 'users' ||
      tabParam === 'trades' ||
      tabParam === 'ai-rules' ||
      tabParam === 'analytics'
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);
  const [itemSearch, setItemSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reports state
  const [reportTypeFilter, setReportTypeFilter] = useState<'ALL' | ReportTargetType>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | ReportStatus>('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [reportActionMsg, setReportActionMsg] = useState<string | null>(null);

  // Preview Image Modal state
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  // AI Moderation Rules State
  const [aiConfig, setAiConfig] = useState<AiModerationConfig>(DEFAULT_AI_CONFIG);
  const [isSavingAiConfig, setIsSavingAiConfig] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [newBlacklistWord, setNewBlacklistWord] = useState('');

  // AI Sandbox Testing State
  const [sandboxTitle, setSandboxTitle] = useState('Bán lại bàn học kèm ghế giá 100k');
  const [sandboxDesc, setSandboxDesc] = useState('Mình mua mới 300k, giờ pass lại giá rẻ tiền mặt cho bạn nào cần.');
  const [sandboxPurpose, setSandboxPurpose] = useState<'FREE' | 'TRADE'>('FREE');
  const [sandboxCategory, setSandboxCategory] = useState('Gia dụng & Đời sống');
  const [isTestingSandbox, setIsTestingSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<ModerationResult | null>(null);

  useEffect(() => {
    getAiModerationConfig().then((cfg) => {
      setAiConfig(cfg);
    });
  }, []);

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

  // Target group counts for user distribution (Người dùng theo nhóm đối tượng)
  const targetGroupsList = [
    'Trường Đại học Bách khoa - ĐHĐN',
    'Trường Đại học Sư phạm - ĐHĐN',
    'Trường Cao đẳng Kinh tế - Kế hoạch',
    'Cư dân quận Liên Chiểu',
    'Ký túc xá Phía Tây / Khu Công nghệ cao',
  ];
  const userGroupCounts = targetGroupsList.map((group) => {
    const count = allUsers.filter(
      (u) => u.university === group || (group.includes('Ký túc xá') && u.university?.includes('Ký túc xá'))
    ).length;
    return {
      name: group.replace('Trường Đại học ', 'ĐH ').replace('Trường Cao đẳng ', 'CĐ '),
      count,
      percent: allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0,
    };
  });

  // Filtered Listings
  const filteredListings = items.filter((item) => {
    if (deletedItemIds.has(item.id) || optimisticItemStatus[item.id] === 'DELETED') return false;
    const currentStatus = optimisticItemStatus[item.id] || item.status;
    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) return false;
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

  // Filtered Users (exclude system config records)
  const filteredUsers = allUsers.filter((u) => {
    if (u.id.startsWith('sys-')) return false;
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

  // Filtered Reports
  const filteredReports = reports.filter((r) => {
    if (reportTypeFilter !== 'ALL' && r.target_type !== reportTypeFilter) return false;
    if (reportStatusFilter !== 'ALL' && r.status !== reportStatusFilter) return false;
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      const matchReporter = (r.reporter_name || '').toLowerCase().includes(q);
      const matchTitle = (r.target_title || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchDetails = (r.target_details || '').toLowerCase().includes(q);
      const matchUser = (r.target_user_name || '').toLowerCase().includes(q);
      return matchReporter || matchTitle || matchDesc || matchDetails || matchUser;
    }
    return true;
  });

  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING').length;

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
    } else if (tableName === 'reports') {
      csvContent += 'ID,Loai,DoiTuong,LyDo,NguoiBaoCao,TrangThai,NgayTao\n';
      reports.forEach((r) => {
        csvContent += `"${r.id}","${r.target_type}","${r.target_title || r.target_id}","${r.reason_text}","${r.reporter_name || ''}","${r.status}","${r.created_at}"\n`;
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

  // AI Rules Studio Handlers
  const handleToggleRule = (key: keyof AiModerationConfig) => {
    setAiConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddBlacklistWord = () => {
    if (!newBlacklistWord.trim()) return;
    const word = newBlacklistWord.trim().toLowerCase();
    if (!aiConfig.customBlacklist.includes(word)) {
      setAiConfig((prev) => ({
        ...prev,
        customBlacklist: [...prev.customBlacklist, word],
      }));
    }
    setNewBlacklistWord('');
  };

  const handleRemoveBlacklistWord = (word: string) => {
    setAiConfig((prev) => ({
      ...prev,
      customBlacklist: prev.customBlacklist.filter((w) => w !== word),
    }));
  };

  const handleSaveAiConfig = async () => {
    setIsSavingAiConfig(true);
    setSaveSuccessMsg(null);
    try {
      await saveAiModerationConfig(aiConfig, currentUser?.full_name || 'Admin');
      setSaveSuccessMsg('Đã lưu thành công bộ quy tắc AI! Mọi bài đăng mới sẽ được áp dụng luật này ngay lập tức.');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAiConfig(false);
    }
  };

  const handleResetDefaultAiConfig = () => {
    triggerConfirm({
      title: 'Khôi phục quy tắc AI',
      message: 'Bạn có chắc chắn muốn khôi phục về bộ quy tắc AI mặc định của hệ thống không?',
      confirmText: 'Khôi phục mặc định',
      variant: 'warning',
      iconType: 'warning',
      onConfirm: () => {
        setAiConfig(DEFAULT_AI_CONFIG);
      },
    });
  };

  const handleRunSandboxTest = async () => {
    if (!sandboxTitle.trim()) return;
    setIsTestingSandbox(true);
    setSandboxResult(null);
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sandboxTitle,
          description: sandboxDesc,
          category: sandboxCategory,
          purpose: sandboxPurpose,
          images: [],
        }),
      });
      const data: ModerationResult = await res.json();
      setSandboxResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingSandbox(false);
    }
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

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Xử lý Báo cáo vi phạm
          {pendingReportsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
              {pendingReportsCount}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">({reports.length})</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai-rules')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'ai-rules'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Bộ lọc & Kiểm duyệt bài
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            Tự động
          </span>
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

              {/* Target Group Distribution */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Người dùng theo nhóm đối tượng
                </h4>
                <div className="space-y-2">
                  {userGroupCounts.map((group, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-medium text-slate-700 truncate pr-2">{group.name}</span>
                      <span className="font-bold text-slate-900 shrink-0">{group.count} người</span>
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
                        {(() => {
                          const itemStatus = optimisticItemStatus[it.id] || it.status;
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                itemStatus === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : itemStatus === 'PENDING_ADMIN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : itemStatus === 'HIDDEN'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {itemStatus === 'HIDDEN' ? '🔒 Đóng băng' : itemStatus}
                            </span>
                          );
                        })()}
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
                        {(optimisticItemStatus[it.id] || it.status) === 'HIDDEN' ? (
                          <button
                            onClick={() => {
                              setOptimisticItemStatus((prev) => ({ ...prev, [it.id]: 'ACTIVE' }));
                              adminRestoreItem(it.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            title="Mở khóa đóng băng để món đồ trở lại kho đồ công khai"
                          >
                            <Eye className="w-3 h-3" /> Mở đóng băng
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setOptimisticItemStatus((prev) => ({ ...prev, [it.id]: 'HIDDEN' }));
                              adminHideItem(it.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            title="Đóng băng tạm khóa món đồ này"
                          >
                            <EyeOff className="w-3 h-3" /> Đóng băng
                          </button>
                        )}
                        <button
                          onClick={() => {
                            triggerConfirm({
                              title: 'Xóa hoàn toàn món đồ',
                              message: `Bạn có chắc chắn muốn xóa hoàn toàn món đồ "${it.title}" khỏi kho đồ?`,
                              subMessage: 'Món đồ sẽ biến mất vĩnh viễn khỏi toàn bộ hệ thống và không thể khôi phục.',
                              confirmText: 'Xóa vĩnh viễn',
                              variant: 'danger',
                              iconType: 'trash',
                              onConfirm: () => {
                                setOptimisticItemStatus((prev) => ({ ...prev, [it.id]: 'DELETED' }));
                                deleteItem(it.id);
                              },
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95"
                          title="Xóa hoàn toàn món đồ khỏi kho"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa hoàn toàn
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
                placeholder="Tìm thành viên, nhóm đối tượng..."
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
                    <th className="p-3">Nhóm đối tượng / Đơn vị</th>
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
                            {isUserLocked(u) && (
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <Lock className="w-2.5 h-2.5" /> {formatLockedStatus(u)}
                                </span>
                                {u.lock_reason && (
                                  <span className="text-[10px] text-rose-600 truncate max-w-xs" title={u.lock_reason}>
                                    Lý do: {u.lock_reason}
                                  </span>
                                )}
                              </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {isUserLocked(u) ? (
                              <button
                                type="button"
                                onClick={() => unlockUser(u.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                title="Bấm để mở khóa tài khoản thành viên"
                              >
                                <Unlock className="w-3 h-3" /> Mở khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToLock(u);
                                  setIsLockModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                title="Khóa tài khoản và chọn thời gian khóa"
                              >
                                <Lock className="w-3 h-3" /> Khóa tài khoản
                              </button>
                            )}
                          </div>
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
                        {(() => {
                          const tradeStatus = optimisticTradeStatus[tr.id] || tr.status;
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tradeStatus === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tradeStatus === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tradeStatus === 'CANCELLED' ? '🔒 Đã hủy / Đưa về ban đầu' : tradeStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {(() => {
                          const tradeStatus = optimisticTradeStatus[tr.id] || tr.status;
                          return tradeStatus !== 'CANCELLED' && tradeStatus !== 'COMPLETED' ? (
                            <button
                              type="button"
                              onClick={() => {
                                triggerConfirm({
                                  title: 'Hủy giao dịch & Trả về trạng thái ban đầu',
                                  message: `Hủy giao dịch #${tr.id} và đưa món đồ về trạng thái ban đầu (như lúc mới đăng)?`,
                                  subMessage: 'Phiên giao dịch sẽ bị hủy bỏ và người dùng khác có thể tiếp tục nhận món đồ này.',
                                  confirmText: 'Hủy & Trả về ban đầu',
                                  variant: 'danger',
                                  iconType: 'warning',
                                  onConfirm: async () => {
                                    const tradesToCancel = tr.item_id ? transactions.filter((t) => t.item_id === tr.item_id) : [tr];
                                    setOptimisticTradeStatus((prev) => {
                                      const next = { ...prev };
                                      tradesToCancel.forEach((t) => {
                                        next[t.id] = 'CANCELLED';
                                      });
                                      return next;
                                    });
                                    if (tr.item_id) {
                                      setOptimisticItemStatus((prev) => ({ ...prev, [tr.item_id]: 'ACTIVE' }));
                                    }
                                    await cancelTrade(tr.id, 'Hủy giao dịch & Trả về trạng thái ban đầu bởi Admin');
                                  },
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95"
                              title="Hủy giao dịch và đưa món đồ về trạng thái ban đầu"
                            >
                              <RotateCcw className="w-3 h-3" /> Hủy & Trả về ban đầu
                            </button>
                          ) : tradeStatus === 'CANCELLED' ? (
                            <button
                              type="button"
                              onClick={() => {
                                triggerConfirm({
                                  title: 'Mở lại giao dịch',
                                  message: `Mở lại phiên giao dịch #${tr.id}?`,
                                  subMessage: 'Phiên giao dịch sẽ được mở lại cho 2 bên tiếp tục trao đổi.',
                                  confirmText: 'Mở lại GD',
                                  variant: 'success',
                                  iconType: 'unlock',
                                  onConfirm: async () => {
                                    setOptimisticTradeStatus((prev) => ({ ...prev, [tr.id]: 'ACCEPTED' }));
                                    await restoreTrade(tr.id);
                                  },
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95"
                              title="Mở lại phiên giao dịch"
                            >
                              <Unlock className="w-3 h-3" /> Mở lại GD
                            </button>
                          ) : null;
                        })()}
                        <Link
                          href={`/trades/${tr.id}`}
                          className="text-[#0F5B4B] font-bold hover:underline inline-block px-1"
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

      {/* Tab 5: Xử lý Báo cáo vi phạm (Reports Management) */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action notification toast */}
          {reportActionMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-md animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{reportActionMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportActionMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Banner & Stats */}
          <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-rose-200 text-xs font-bold backdrop-blur-xs border border-white/10">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                  Trung Tâm Xử Lý Vi Phạm • Toàn Quyền Quản Trị
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Xử Lý Báo Cáo Vi Phạm Cộng Đồng
                </h2>
                <p className="text-xs sm:text-sm text-rose-100/90 max-w-2xl leading-relaxed">
                  Tiếp nhận và giải quyết các khiếu nại về tiền bạc thương mại, chất cấm/vũ khí, bạo lực/quấy rối, lừa đảo đối với <strong>Bài đăng, Tài khoản, Giao dịch</strong> và <strong>Tin nhắn</strong>.
                </p>
                <div className="pt-2 flex flex-wrap gap-3 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                    Tổng báo cáo: <strong>{reports.length}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-500/40 backdrop-blur-xs border border-rose-400/40 text-amber-200 font-bold">
                    Chờ duyệt: <strong>{pendingReportsCount}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/30 backdrop-blur-xs border border-emerald-400/30 text-emerald-200">
                    Đã giải quyết: <strong>{reports.filter(r => r.status === 'RESOLVED').length}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setReportActionMsg('Đang làm mới và đồng bộ dữ liệu báo cáo...');
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('focus'));
                    }
                    setTimeout(() => {
                      setReportActionMsg('Đã cập nhật danh sách báo cáo vi phạm mới nhất từ đám mây.');
                    }, 800);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Nhấn để tải báo cáo mới nhất từ đám mây"
                >
                  <RotateCcw className="w-4 h-4 text-rose-200" /> Đồng bộ đám mây
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV('reports')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Xuất file CSV
                </button>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, người báo cáo, nội dung, ID..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-600 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <select
                value={reportTypeFilter}
                onChange={(e) => setReportTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Tất cả đối tượng</option>
                <option value="ITEM">📦 Bài đăng (Item)</option>
                <option value="USER">👤 Tài khoản (User)</option>
                <option value="TRADE">🔄 Giao dịch (Trade)</option>
                <option value="MESSAGE">💬 Tin nhắn (Chat)</option>
              </select>

              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">⏳ Chờ xử lý</option>
                <option value="RESOLVED">✅ Đã xử lý vi phạm</option>
                <option value="DISMISSED">❌ Đã bác bỏ</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Không có báo cáo nào khớp bộ lọc</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hiện tại tất cả hoạt động trong hệ thống đều tuân thủ đúng quy định hoặc chưa có phản ánh vi phạm nào.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                // 1. Comprehensive trade ID extraction from all fields (title, id, details, description)
                const extractedTradeId =
                  report.target_title?.match(/(tr-\d+)/)?.[1] ||
                  report.target_id?.match(/(tr-\d+)/)?.[1] ||
                  report.target_details?.match(/(tr-\d+)/)?.[1] ||
                  report.description?.match(/(tr-\d+)/)?.[1];

                // 2. Direct item identification
                const directItem =
                  items.find((i) => i.id === report.target_id) ||
                  items.find((i) => report.target_title && i.title.trim().toLowerCase() === report.target_title.trim().toLowerCase());
                const directItemId = directItem?.id || (report.target_type === 'ITEM' ? report.target_id : undefined);

                // 3. User identification
                const targetUser = allUsers.find(
                  (u) =>
                    u.id === report.target_user_id ||
                    u.id === report.target_id ||
                    (directItem && u.id === directItem.user_id)
                );

                // 4. Comprehensive candidate trades matching
                const candidateTrades = transactions.filter((t) => {
                  if (t.id === report.target_id) return true;
                  if (extractedTradeId && t.id === extractedTradeId) return true;
                  if (report.target_type === 'TRADE' && t.id === report.target_id) return true;
                  if (directItemId && t.item_id === directItemId) return true;
                  if (report.target_id && t.item_id === report.target_id) return true;
                  if (directItem && t.item?.title && t.item.title.trim().toLowerCase() === directItem.title.trim().toLowerCase()) return true;
                  if (report.target_type === 'MESSAGE' && (t.note?.includes(report.target_id) || (report.target_details && t.note?.includes(report.target_details)))) return true;
                  if (report.target_title && report.target_title.includes(t.id)) return true;
                  if (targetUser && (t.giver_id === targetUser.id || t.receiver_id === targetUser.id)) {
                    if (directItemId && t.item_id === directItemId) return true;
                    if (report.target_type === 'USER' && t.status !== 'CANCELLED' && t.status !== 'COMPLETED') return true;
                  }
                  return false;
                });

                // Stable trade selection: always anchor to newest trade for this report/item so room ID does NOT jitter
                const targetTrade = [...candidateTrades].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                const actualTradeId = extractedTradeId || targetTrade?.id || (report.target_type === 'TRADE' ? report.target_id : undefined);
                const currentTrade = actualTradeId ? (transactions.find((t) => t.id === actualTradeId) || targetTrade) : targetTrade;

                const resolvedTargetItem = directItem || (currentTrade ? items.find((i) => i.id === currentTrade.item_id) : undefined);
                const actualItemId = resolvedTargetItem?.id || currentTrade?.item_id || targetTrade?.item_id || directItemId;
                const itm = actualItemId ? (items.find((i) => i.id === actualItemId) || resolvedTargetItem) : null;

                // 0ms Optimistic status determination
                const isItemDeleted = Boolean(
                  actualItemId && (deletedItemIds.has(actualItemId) || optimisticItemStatus[actualItemId] === 'DELETED')
                );
                const effectiveItemStatus = actualItemId
                  ? (optimisticItemStatus[actualItemId] || itm?.status || (isItemDeleted ? 'DELETED' : 'ACTIVE'))
                  : itm?.status;
                const isItemHidden = effectiveItemStatus === 'HIDDEN';

                const isTradeCancelled = Boolean(
                  actualTradeId &&
                    (optimisticTradeStatus[actualTradeId] === 'CANCELLED' ||
                      (candidateTrades.length > 0 && candidateTrades.every((t) => (optimisticTradeStatus[t.id] || t.status) === 'CANCELLED')) ||
                      (currentTrade?.status === 'CANCELLED' && optimisticTradeStatus[actualTradeId] !== 'ACCEPTED'))
                );

                return (
                  <div
                    key={report.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                      report.status === 'PENDING'
                        ? 'border-rose-200 bg-rose-50/20'
                        : report.status === 'RESOLVED'
                        ? 'border-emerald-200/80'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    {/* Top Row: Target type, violation badge, status, timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Target Type badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          report.target_type === 'ITEM'
                            ? 'bg-blue-100 text-blue-800'
                            : report.target_type === 'USER'
                            ? 'bg-purple-100 text-purple-800'
                            : report.target_type === 'TRADE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {report.target_type === 'ITEM' && '📦 Bài đăng'}
                          {report.target_type === 'USER' && '👤 Tài khoản'}
                          {report.target_type === 'TRADE' && '🔄 Giao dịch'}
                          {report.target_type === 'MESSAGE' && '💬 Tin nhắn'}
                        </span>

                        {/* Violation Reason */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {report.reason_text}
                        </span>

                        {/* Status */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          report.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 font-bold animate-pulse'
                            : report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {report.status === 'PENDING' && '⏳ Đang chờ Admin xử lý'}
                          {report.status === 'RESOLVED' && '✅ Đã xử lý'}
                          {report.status === 'DISMISSED' && '❌ Bác bỏ'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {new Date(report.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Middle Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Target details & User info (7 cols) */}
                      <div className="lg:col-span-7 space-y-2">
                        <div className="text-xs">
                          <span className="text-slate-500 font-medium">Đối tượng bị báo cáo: </span>
                          <span className="font-bold text-slate-900">
                            {report.target_title || report.target_id}
                          </span>
                        </div>

                        {report.target_user_name && (
                          <div className="text-xs text-slate-600">
                            Người liên quan: <strong className="text-slate-800">{report.target_user_name}</strong>
                            {targetUser?.is_locked && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                🔒 Đang bị khóa
                              </span>
                            )}
                          </div>
                        )}

                        {report.target_details && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                            <strong>Trích xuất nội dung:</strong> &ldquo;{report.target_details}&rdquo;
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-slate-800">
                          <div className="font-bold text-rose-900 mb-1 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> Mô tả chi tiết / Bằng chứng người báo cáo cung cấp:
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{report.description}</p>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Người gửi báo cáo: <strong>{report.reporter_name || 'Người dùng ẩn danh'}</strong> ({report.reporter_id})
                        </div>

                        {report.admin_notes && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                            <strong>Ghi chú xử lý của Admin:</strong> {report.admin_notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Direct Actions for Admin (5 cols) */}
                      <div className="lg:col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3 flex flex-col justify-between">
                        {report.status === 'PENDING' ? (
                          <>
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                                <ShieldCheck className="w-4 h-4 text-[#0F5B4B]" />
                                Hành Động Can Thiệp Trực Tiếp
                              </div>
                              <p className="text-[11px] text-slate-500 mb-3">
                                Admin có quyền ẩn/xóa bài, khóa tài khoản hoặc hủy giao dịch:
                              </p>

                              <div className="space-y-3">
                                {/* Actions for Item */}
                                {(report.target_type === 'ITEM' || resolvedTargetItem || targetTrade?.item_id) && actualItemId && (
                                  <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-[#0F5B4B]" /> Món đồ / Bài viết liên quan:
                                      </span>
                                      {isItemDeleted && (
                                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                          Đã xóa hoàn toàn
                                        </span>
                                      )}
                                      {!isItemDeleted && isItemHidden && (
                                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          Đang đóng băng
                                        </span>
                                      )}
                                    </div>

                                    {isItemDeleted ? (
                                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>Món đồ đã được <strong>xóa hoàn toàn</strong> khỏi kho đồ (Vĩnh viễn).</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {(resolvedTargetItem || targetTrade?.item_id || itm) && (
                                          <Link
                                            href={`/items/${resolvedTargetItem?.id || targetTrade?.item_id || itm?.id || actualItemId}`}
                                            target="_blank"
                                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                                          >
                                            <ExternalLink className="w-3 h-3" /> Xem bài viết
                                          </Link>
                                        )}

                                        {isItemHidden ? (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (!actualItemId) return;
                                              // 0ms Optimistic UI update
                                              setOptimisticItemStatus((prev) => ({ ...prev, [actualItemId]: 'ACTIVE' }));
                                              setReportActionMsg(`Đã mở lại sản phẩm "${itm?.title || actualItemId}" lên kho đồ.`);
                                              setActionProcessing((prev) => ({ ...prev, ['freeze_' + actualItemId]: true }));
                                              try {
                                                await adminRestoreItem(actualItemId);
                                              } catch (err: any) {
                                                setOptimisticItemStatus((prev) => {
                                                  const copy = { ...prev };
                                                  delete copy[actualItemId];
                                                  return copy;
                                                });
                                                setReportActionMsg('Lỗi: ' + (err?.message || 'Không thể mở lại'));
                                              } finally {
                                                setActionProcessing((prev) => ({ ...prev, ['freeze_' + actualItemId]: false }));
                                              }
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                            title="Mở đóng băng để sản phẩm quay lại kho đồ"
                                          >
                                            <Eye className="w-3.5 h-3.5" /> Mở lại sản phẩm (Mở đóng băng)
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (!actualItemId) return;
                                              // 0ms Optimistic UI update
                                              setOptimisticItemStatus((prev) => ({ ...prev, [actualItemId]: 'HIDDEN' }));
                                              setReportActionMsg(`Đã đóng băng tạm khóa món đồ "${itm?.title || actualItemId}".`);
                                              setActionProcessing((prev) => ({ ...prev, ['freeze_' + actualItemId]: true }));
                                              try {
                                                await adminHideItem(actualItemId);
                                              } catch (err: any) {
                                                setOptimisticItemStatus((prev) => {
                                                  const copy = { ...prev };
                                                  delete copy[actualItemId];
                                                  return copy;
                                                });
                                                setReportActionMsg('Lỗi: ' + (err?.message || 'Không thể đóng băng'));
                                              } finally {
                                                setActionProcessing((prev) => ({ ...prev, ['freeze_' + actualItemId]: false }));
                                              }
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                            title="Đóng băng món đồ này khỏi kho đồ"
                                          >
                                            <EyeOff className="w-3.5 h-3.5" /> Đóng băng món đồ (Tạm khóa)
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!actualItemId) {
                                              setReportActionMsg('Không tìm thấy mã món đồ để xóa.');
                                              return;
                                            }
                                            const itemTitle = itm?.title || actualItemId;
                                            triggerConfirm({
                                              title: 'Xóa hoàn toàn khỏi kho đồ',
                                              message: `Bạn có chắc chắn muốn xóa hoàn toàn món đồ "${itemTitle}" khỏi kho đồ?`,
                                              subMessage: 'Món đồ sẽ biến mất vĩnh viễn khỏi toàn bộ hệ thống và không thể khôi phục.',
                                              confirmText: 'Xóa vĩnh viễn',
                                              variant: 'danger',
                                              iconType: 'trash',
                                              onConfirm: async () => {
                                                // 0ms Optimistic UI update
                                                setOptimisticItemStatus((prev) => ({ ...prev, [actualItemId]: 'DELETED' }));
                                                setReportActionMsg(`Đã xóa hoàn toàn món đồ "${itemTitle}" khỏi kho đồ.`);
                                                setActionProcessing((prev) => ({ ...prev, ['del_' + actualItemId]: true }));
                                                try {
                                                  await deleteItem(actualItemId);
                                                } catch (err: any) {
                                                  setOptimisticItemStatus((prev) => {
                                                    const copy = { ...prev };
                                                    delete copy[actualItemId];
                                                    return copy;
                                                  });
                                                  setReportActionMsg('Lỗi khi xóa bài: ' + (err?.message || 'Không thể thực hiện'));
                                                } finally {
                                                  setActionProcessing((prev) => ({ ...prev, ['del_' + actualItemId]: false }));
                                                }
                                              },
                                            });
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                          title="Xóa vĩnh viễn khỏi kho đồ"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" /> Xóa hoàn toàn khỏi kho đồ
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actions for Trade */}
                                {(actualTradeId || report.target_type === 'TRADE' || report.target_type === 'MESSAGE' || report.target_type === 'ITEM' || targetTrade) && (
                                  <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <Repeat className="w-3 h-3 text-[#0F5B4B]" /> Phiên giao dịch liên quan:
                                      </span>
                                      {actualTradeId ? (
                                        isTradeCancelled ? (
                                          <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                            Đã hủy / Đưa về ban đầu
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                            Đang hoạt động
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                          Chưa phát sinh GD
                                        </span>
                                      )}
                                    </div>

                                    {actualTradeId ? (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <Link
                                          href={`/trades/${actualTradeId}`}
                                          target="_blank"
                                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                                        >
                                          <ExternalLink className="w-3 h-3" /> Vào phòng giao dịch (#{actualTradeId})
                                        </Link>

                                        {isTradeCancelled ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              triggerConfirm({
                                                title: 'Mở lại phiên giao dịch',
                                                message: `Mở lại phiên giao dịch #${actualTradeId}?`,
                                                subMessage: 'Phiên giao dịch sẽ được kích hoạt lại cho các bên tiếp tục trao đổi.',
                                                confirmText: 'Mở lại giao dịch',
                                                variant: 'success',
                                                iconType: 'unlock',
                                                onConfirm: async () => {
                                                  // 0ms Optimistic UI update
                                                  setOptimisticTradeStatus((prev) => ({ ...prev, [actualTradeId]: 'ACCEPTED' }));
                                                  setReportActionMsg(`Đã mở lại phiên giao dịch #${actualTradeId}.`);
                                                  setActionProcessing((prev) => ({ ...prev, ['trade_' + actualTradeId]: true }));
                                                  try {
                                                    await restoreTrade(actualTradeId);
                                                  } catch (err: any) {
                                                    setOptimisticTradeStatus((prev) => {
                                                      const copy = { ...prev };
                                                      delete copy[actualTradeId];
                                                      return copy;
                                                    });
                                                    setReportActionMsg('Lỗi khi mở lại: ' + (err?.message || 'Không thể thực hiện'));
                                                  } finally {
                                                    setActionProcessing((prev) => ({ ...prev, ['trade_' + actualTradeId]: false }));
                                                  }
                                                },
                                              });
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                            title="Mở lại phiên giao dịch"
                                          >
                                            <Unlock className="w-3.5 h-3.5" /> Mở lại giao dịch
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              triggerConfirm({
                                                title: 'Hủy giao dịch & Trả về trạng thái ban đầu',
                                                message: `Bạn có chắc muốn HỦY giao dịch #${actualTradeId} và đưa trạng thái món đồ về ban đầu (như lúc mới đăng)?`,
                                                subMessage: 'Phiên giao dịch sẽ bị hủy hoàn toàn, người tham gia không thể tiếp tục giao dịch, và món đồ sẽ xuất hiện lại trên kho đồ.',
                                                confirmText: 'Hủy GD & Về ban đầu',
                                                variant: 'danger',
                                                iconType: 'lock',
                                                onConfirm: async () => {
                                                  // 0ms Optimistic UI update: mark all candidate trades as CANCELLED to prevent flickering
                                                  const tradesToCancel = candidateTrades && candidateTrades.length > 0 ? candidateTrades : [{ id: actualTradeId }];
                                                  setOptimisticTradeStatus((prev) => {
                                                    const next = { ...prev };
                                                    tradesToCancel.forEach((t: any) => {
                                                      next[t.id] = 'CANCELLED';
                                                    });
                                                    return next;
                                                  });
                                                  if (actualItemId) {
                                                    setOptimisticItemStatus((prev) => ({ ...prev, [actualItemId]: 'ACTIVE' }));
                                                  }
                                                  setReportActionMsg(`Đã hủy giao dịch #${actualTradeId} và đưa món đồ về trạng thái ban đầu.`);
                                                  setActionProcessing((prev) => ({ ...prev, ['trade_' + actualTradeId]: true }));
                                                  try {
                                                    await cancelTrade(actualTradeId, 'Hủy giao dịch & Trả về trạng thái ban đầu bởi Admin');
                                                  } catch (err: any) {
                                                    setOptimisticTradeStatus((prev) => {
                                                      const copy = { ...prev };
                                                      tradesToCancel.forEach((t: any) => {
                                                        delete copy[t.id];
                                                      });
                                                      return copy;
                                                    });
                                                    setReportActionMsg('Lỗi khi hủy giao dịch: ' + (err?.message || 'Không thể thực hiện'));
                                                  } finally {
                                                    setActionProcessing((prev) => ({ ...prev, ['trade_' + actualTradeId]: false }));
                                                  }
                                                },
                                              });
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg bg-rose-700 text-white hover:bg-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                            title="Hủy giao dịch và đưa trạng thái món đồ về ban đầu"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" /> Hủy giao dịch & Trả về trạng thái ban đầu
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5">
                                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          Món đồ này hiện chưa phát sinh giao dịch nào (chưa có người nhận đồ).
                                        </span>
                                        <span className="text-[10px] text-slate-400 italic shrink-0">Không có GD để hủy</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actions for User */}
                                {(report.target_type === 'USER' || report.target_user_id || targetUser) && (
                                  <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                      <Users className="w-3 h-3 text-[#0F5B4B]" /> Tài khoản liên quan:
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {targetUser && (
                                        isUserLocked(targetUser) ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              unlockUser(targetUser.id);
                                              setReportActionMsg(`Đã mở khóa tài khoản ${targetUser.full_name}.`);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                                          >
                                            <Unlock className="w-3.5 h-3.5" /> Mở khóa tài khoản ({formatLockedStatus(targetUser)})
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setUserToLock(targetUser);
                                              setIsLockModalOpen(true);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer bg-rose-700 text-white hover:bg-rose-800 shadow-2xs"
                                          >
                                            <Lock className="w-3.5 h-3.5" /> Khóa tài khoản vi phạm
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Resolve Report status row */}
                            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold text-slate-600">Đóng hồ sơ báo cáo:</div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    resolveReport(report.id, 'DISMISS', 'Báo cáo không đủ bằng chứng hoặc không vi phạm quy chế.');
                                    setReportActionMsg('Đã bác bỏ báo cáo.');
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                                >
                                  Bác bỏ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    resolveReport(report.id, 'RESOLVE', 'Admin đã tiếp nhận và áp dụng chế tài xử lý.');
                                    setReportActionMsg('Đã xử lý xong báo cáo vi phạm.');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#0F5B4B] text-white hover:bg-[#0A3F34] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Đã xử lý vi phạm
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Report Already Resolved or Dismissed - Lock all action buttons per rule */
                          <div className="h-full flex flex-col justify-center items-center text-center p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {report.status === 'RESOLVED' ? <Check className="w-6 h-6 stroke-[3]" /> : <ShieldCheck className="w-6 h-6" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-900">
                                {report.status === 'RESOLVED' ? 'Vi phạm đã được xử lý' : 'Báo cáo đã được bác bỏ'}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Hồ sơ này đã hoàn tất đóng. Mọi biện pháp can thiệp (ẩn, xóa, hủy) đã bị khóa.
                              </p>
                            </div>
                            {report.admin_notes && (
                              <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 w-full text-left">
                                <span className="font-bold text-slate-900">Ghi chú của Admin: </span>
                                {report.admin_notes}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">
                              Xử lý lúc: {new Date(report.resolved_at || report.created_at).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Cài đặt Quy tắc AI (Google Gemini Moderation Studio) */}
      {activeTab === 'ai-rules' && (
        <div className="space-y-6 animate-fade-in">
          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-3 shadow-md animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Hero Studio Banner */}
          <div className="bg-gradient-to-r from-[#0F5B4B] via-[#0D4B3E] to-[#0A3F34] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-bold backdrop-blur-xs border border-white/10">
                  <Cpu className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                  Google Gemini AI Studio • Kiểm duyệt Đa phương thức (Vision)
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Trung Tâm Huấn Luyện & Cài Đặt Quy Tắc AI
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                  Ban Quản Trị có toàn quyền bật/tắt các tiêu chuẩn kiểm duyệt, tự gõ thêm luật riêng bằng tiếng Việt hoặc điều chỉnh độ nhạy của AI mà không cần viết một dòng mã nguồn nào.
                </p>
                <div className="pt-1 text-[11px] text-emerald-200/80">
                  Cập nhật lần cuối: <strong>{new Date(aiConfig.updatedAt).toLocaleString('vi-VN')}</strong> bởi <strong>{aiConfig.updatedBy}</strong>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaultAiConfig}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Khôi phục Mặc định
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiConfig}
                  disabled={isSavingAiConfig}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAiConfig ? 'Đang lưu quy tắc...' : 'Lưu Thay Đổi Ngay'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Left Controls (7 cols) + Right Sandbox (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Controls & Rules (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* BLOCK 1: Core Policy Switches */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0F5B4B]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      1. Tiêu Chuẩn Kiểm Duyệt Cốt Lõi (Bật / Tắt)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Click để bật/tắt</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Switch 1: Commercial */}
                  <div
                    onClick={() => handleToggleRule('blockCommercial')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockCommercial
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Chặn Rao Bán / Thu Tiền</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Cấm thu tiền mặt, chuyển khoản, báo giá (50k, 100k, vnd...).
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockCommercial ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockCommercial ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 2: Prohibited Goods */}
                  <div
                    onClick={() => handleToggleRule('blockProhibitedGoods')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockProhibitedGoods
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Cấm Vũ Khí, Thuốc Lá, Vape, 18+
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Chặn hung khí, chất kích thích, cồn, nội dung không lành mạnh.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockProhibitedGoods ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockProhibitedGoods ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 3: Food */}
                  <div
                    onClick={() => handleToggleRule('blockFoodFresh')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockFoodFresh
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Cấm Đồ Ăn Tươi / Nấu Chín
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Tránh ôi thiu. Chỉ chấp nhận đồ khô đóng gói còn hạn sử dụng.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockFoodFresh ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockFoodFresh ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 4: Prescription Drugs */}
                  <div
                    onClick={() => handleToggleRule('blockPrescriptionDrugs')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockPrescriptionDrugs
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Cấm Thuốc Kê Đơn & Dược Phẩm
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Chặn chia sẻ thuốc men, thực phẩm chức năng không kiểm định.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockPrescriptionDrugs ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockPrescriptionDrugs ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 5: Open Cosmetics */}
                  <div
                    onClick={() => handleToggleRule('blockCosmeticsOpen')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockCosmeticsOpen
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Cấm Mỹ Phẩm Chiết / Kem Trộn
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Bảo vệ sức khỏe sinh viên khỏi hàng trôi nổi, mỹ phẩm mở nắp cũ.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockCosmeticsOpen ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockCosmeticsOpen ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 6: Student Usefulness */}
                  <div
                    onClick={() => handleToggleRule('requireStudentUsefulness')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.requireStudentUsefulness
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Ưu Tiên Đồ Dùng Sinh Viên
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Sách vở, giáo trình, quạt, bàn ghế, đồ sinh hoạt thiết thực.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.requireStudentUsefulness ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.requireStudentUsefulness ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 7: QR & Bank Detection in Photos */}
                  <div
                    onClick={() => handleToggleRule('blockPhoneAndBankingInImage')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockPhoneAndBankingInImage
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Vision AI: Soi Mã QR & STK Ngân Hàng
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Quét ảnh tìm mã QR nạp tiền hoặc số tài khoản lừa đảo tiền cọc.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockPhoneAndBankingInImage ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockPhoneAndBankingInImage ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>

                  {/* Switch 8: Stock Images */}
                  <div
                    onClick={() => handleToggleRule('blockStockImages')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      aiConfig.blockStockImages
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        Cảnh Báo Ảnh Mạng / Shopee
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Yêu cầu ảnh chụp thật tại phòng trọ thay vì ảnh quảng cáo sàn TMĐT.
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      aiConfig.blockStockImages ? 'bg-[#0F5B4B]' : 'bg-slate-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                        aiConfig.blockStockImages ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCK 2: Custom Rules Written by Admin */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#0F5B4B]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      2. Quy Tắc Riêng Do BQL Tự Gõ Thêm
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
                    AI Gemini đọc trực tiếp
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Gõ bất kỳ yêu cầu nào bạn muốn AI tuân theo bằng tiếng Việt tự nhiên. AI sẽ hiểu ngữ cảnh và áp dụng ngay vào các bài đăng tiếp theo:
                </p>
                <textarea
                  rows={5}
                  value={aiConfig.customRules}
                  onChange={(e) => setAiConfig({ ...aiConfig, customRules: e.target.value })}
                  placeholder="Ví dụ:&#10;1. Các loại quạt điện, bàn ủi phải còn hoạt động bình thường và an toàn.&#10;2. Sách giáo trình phải nêu rõ trường và năm xuất bản..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/15 leading-relaxed bg-slate-50/50"
                />
              </div>

              {/* BLOCK 3: Blacklist Keywords */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-rose-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      3. Danh Sách Từ Khóa Bị Cấm ({aiConfig.customBlacklist.length} từ)
                    </h3>
                  </div>
                </div>

                {/* Add word form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBlacklistWord}
                    onChange={(e) => setNewBlacklistWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBlacklistWord();
                      }
                    }}
                    placeholder="Nhập từ khóa cấm mới (VD: giá rẻ, cọc trước...)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0F5B4B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlacklistWord}
                    className="px-4 py-2.5 rounded-xl bg-[#0F5B4B] text-white text-xs font-bold hover:bg-[#0A3F34] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm từ
                  </button>
                </div>

                {/* Tag Badges */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
                  {aiConfig.customBlacklist.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"
                    >
                      <Tag className="w-3 h-3 text-rose-500" />
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlacklistWord(word)}
                        className="hover:text-rose-900 cursor-pointer ml-0.5 text-xs font-bold"
                        title="Xóa từ khóa này"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* BLOCK 4: Confidence Slider */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#0F5B4B]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      4. Ngưỡng Điểm AI Tự Động Duyệt Bài
                    </h3>
                  </div>
                  <span className="text-base font-extrabold text-[#0F5B4B] bg-[#EAF7F2] px-3 py-1 rounded-full border border-[#A7E2CB]">
                    {aiConfig.autoApproveConfidence}%
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={aiConfig.autoApproveConfidence}
                    onChange={(e) => setAiConfig({ ...aiConfig, autoApproveConfidence: Number(e.target.value) })}
                    className="w-full accent-[#0F5B4B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>50% (Dễ tính - Tự duyệt nhiều)</span>
                    <span className="font-bold text-slate-700">85% (Khuyên dùng)</span>
                    <span>95% (Khắt khe - Chuyển BQL nhiều)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  💡 <strong>Cơ chế:</strong> Nếu bài đăng đạt từ <strong>{aiConfig.autoApproveConfidence}%</strong> điểm tin cậy trở lên, AI sẽ duyệt tự động lên sàn ngay (<span className="text-emerald-700 font-bold">ACTIVE</span>). Dưới ngưỡng này sẽ đưa vào hàng đợi để BQL xem xét thủ công (<span className="text-amber-700 font-bold">PENDING_ADMIN</span>).
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaultAiConfig}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Khôi phục mặc định
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiConfig}
                  disabled={isSavingAiConfig}
                  className="px-6 py-2.5 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white text-xs font-bold shadow-md shadow-[#0F5B4B]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAiConfig ? 'Đang lưu vào hệ thống...' : 'Lưu Tất Cả Quy Tắc'}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Status & Live Sandbox Tester (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* AI Server Live Status Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold text-slate-900 text-sm">Hạ Tầng AI Trực Tuyến</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Hoạt động 100%
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 divide-y divide-slate-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Mô hình AI:</span>
                    <strong className="text-slate-800">Google Gemini Flash Multimodal</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Khả năng thị giác (Vision):</span>
                    <strong className="text-emerald-700">✓ Đang soi ảnh thực tế</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Thời gian phản hồi:</span>
                    <strong className="text-slate-800">~1.2 giây / bài đăng</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Cơ chế bảo vệ:</span>
                    <strong className="text-slate-800">Tự động chuyển mô hình dự phòng</strong>
                  </div>
                </div>
              </div>

              {/* LIVE AI SANDBOX / TESTER */}
              <div className="bg-gradient-to-b from-white to-slate-50 p-5 sm:p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#0F5B4B]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Công Cụ Thử Nghiệm Bộ Lọc Bài Đăng
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Kiểm tra trước
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập bài đăng mẫu để kiểm tra xem hệ thống sẽ áp dụng các tiêu chuẩn kiểm duyệt vừa cài đặt như thế nào:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tiêu đề bài đăng:
                    </label>
                    <input
                      type="text"
                      value={sandboxTitle}
                      onChange={(e) => setSandboxTitle(e.target.value)}
                      placeholder="VD: Bán lại quạt điện giá 50k..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0F5B4B] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mô tả chi tiết:
                    </label>
                    <textarea
                      rows={3}
                      value={sandboxDesc}
                      onChange={(e) => setSandboxDesc(e.target.value)}
                      placeholder="VD: Đồ còn mới, ib mình gửi STK chuyển khoản..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0F5B4B] bg-white leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Hình thức:</label>
                      <select
                        value={sandboxPurpose}
                        onChange={(e) => setSandboxPurpose(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="FREE">🎁 Cho miễn phí</option>
                        <option value="TRADE">🔄 Đổi đồ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Danh mục:</label>
                      <select
                        value={sandboxCategory}
                        onChange={(e) => setSandboxCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="Gia dụng & Đời sống">Gia dụng & Đời sống</option>
                        <option value="Sách & Giáo trình">Sách & Giáo trình</option>
                        <option value="Đồ điện tử & Công nghệ">Đồ điện tử & Công nghệ</option>
                        <option value="Quần áo & Phụ kiện">Quần áo & Phụ kiện</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSandboxTest}
                    disabled={isTestingSandbox || !sandboxTitle.trim()}
                    className="w-full py-3 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white text-xs font-bold shadow-md shadow-[#0F5B4B]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingSandbox ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Hệ thống đang kiểm duyệt nội dung...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 text-emerald-300" />
                        Kiểm Tra Tiêu Chuẩn Duyệt Bài
                      </>
                    )}
                  </button>
                </div>

                {/* Sandbox Result Output Box */}
                {sandboxResult && (
                  <div className={`p-4 rounded-2xl border space-y-2 animate-fade-in ${
                    sandboxResult.status === 'ACTIVE'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        {sandboxResult.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">KẾT QUẢ: ĐẠT TIÊU CHUẨN (CHO PHÉP ĐĂNG)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-800">KẾT QUẢ: CẦN DUYỆT LẠI (CÓ DẤU HIỆU VI PHẠM)</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white/80 shadow-xs">
                        Độ tin cậy: {sandboxResult.confidence}%
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed pt-1 border-t border-slate-200/50">
                      <strong>Đánh giá nội dung:</strong> {sandboxResult.reasoning}
                    </div>

                    {sandboxResult.detected_tags && sandboxResult.detected_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sandboxResult.detected_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-white/80 text-[10px] font-semibold text-slate-700 border border-slate-200/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                    const itemToDelete = previewItem;
                    triggerConfirm({
                      title: 'Xóa bài đăng này',
                      message: `Bạn có chắc muốn xóa vĩnh viễn bài đăng "${itemToDelete.title}"?`,
                      subMessage: 'Hành động này không thể hoàn tác.',
                      confirmText: 'Xóa bài này',
                      variant: 'danger',
                      iconType: 'trash',
                      onConfirm: () => {
                        deleteItem(itemToDelete.id);
                        setPreviewItem(null);
                      },
                    });
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

      {/* Modal Khóa Tài Khoản với tùy chọn thời gian */}
      <LockUserModal
        isOpen={isLockModalOpen}
        onClose={() => {
          setIsLockModalOpen(false);
          setUserToLock(null);
        }}
        user={userToLock}
        onConfirmLock={({ userId, duration, customUntil, reason }) => {
          lockUser({ userId, duration, customUntil, reason });
          setReportActionMsg(`Đã khóa tài khoản thành viên thành công. Người dùng chỉ còn quyền ở chế độ vãng lai.`);
        }}
      />

      {/* In-app React Confirmation Modal (Hoạt động mượt mà 100% trên cả Desktop lẫn Mobile) */}
      <AdminConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        subMessage={confirmModalConfig.subMessage}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
        iconType={confirmModalConfig.iconType}
        isLoading={confirmModalConfig.isLoading}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center p-12 text-center text-slate-500 font-medium">Đang tải trang quản trị...</div>}>
      <AdminDashboardPageContent />
    </Suspense>
  );
}
