'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { ItemCard } from '@/components/common/ItemCard';
import {
  CheckCircle2,
  Award,
  Sparkles,
  Layers,
  Clock,
  Star,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
  Edit3,
  Gift,
  ArrowRight,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Building,
  User,
  Hash,
  Shield,
  Save,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Compass,
  Info,
  Sliders,
  Check,
  Trash2,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';

const PRESET_AVATARS = [
  { label: 'Nam SV Bách Khoa', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nữ SV Sư Phạm', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nam SV IT', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nữ SV Kinh Tế', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Sinh viên năng động', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
  { label: 'Ban Quản Trị / BQL', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
];

const TARGET_GROUPS = [
  { value: 'Sinh viên', label: '🎓 Sinh viên', desc: 'Đang theo học tại các trường Đại học, Cao đẳng' },
  { value: 'Học sinh', label: '🧑‍🎓 Học sinh', desc: 'Học sinh THPT, THCS trên địa bàn' },
  { value: 'Thanh niên', label: '💼 Thanh niên', desc: 'Thanh niên công nhân, người đi làm trẻ tuổi' },
  { value: 'Người dân', label: '🏘️ Người dân', desc: 'Cư dân sinh sống tại địa phương quận Liên Chiểu' },
  { value: 'Khác', label: '👥 Khác', desc: 'Tình nguyện viên, đối tác cộng đồng' },
];

const UNIVERSITY_OPTIONS = [
  'Trường Đại học Bách khoa - ĐHĐN',
  'Trường Đại học Sư phạm - ĐHĐN',
  'Trường Đại học Kinh tế - ĐHĐN',
  'Trường Đại học CNTT & TT Việt - Hàn (VKU)',
  'Trường Cao đẳng Kinh tế - Kế hoạch Đà Nẵng',
  'Trường Cao đẳng FPT Polytechnic Đà Nẵng',
  'Trường THPT Nguyễn Trãi (Liên Chiểu)',
  'Trường THPT Liên Chiểu',
  'Cư dân / Thanh niên quận Liên Chiểu',
  'Ban Quản Lý Kho Đồ Liên Chiểu',
];

const LIEN_CHIEU_AREAS = [
  'Phường Hòa Khánh Bắc',
  'Phường Hòa Khánh Nam',
  'Phường Hòa Minh',
  'Phường Hòa Hiệp Bắc',
  'Phường Hòa Hiệp Nam',
  'Ký túc xá DMC 579 (Hòa Khánh Nam)',
  'Ký túc xá Phía Tây (Khu công nghệ cao)',
  'Khu đô thị Golden Hills / Eco Charm',
  'Khu vực lân cận quận Liên Chiểu',
];

const CONTACT_PREFERENCES = [
  {
    value: 'CHAT' as const,
    label: '💬 Chat trong web Kho Đồ',
    desc: 'Ưu tiên nhắn tin trực tiếp trên web (Khuyên dùng - an toàn bảo mật, không lộ số)',
  },
  {
    value: 'PHONE' as const,
    label: '📞 Điện thoại trực tiếp',
    desc: 'Cho phép đối tác gọi điện thoại khi cả hai bắt đầu hẹn gặp nhận đồ',
  },
  {
    value: 'BOTH' as const,
    label: '🤝 Cả hai phương thức',
    desc: 'Nhắn tin qua web trước, gọi điện thoại khi tới điểm hẹn giao đồ',
  },
];

const processAvatarFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp tải lên không phải hình ảnh'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const size = 400;
        let width = img.width;
        let height = img.height;
        let sx = 0;
        let sy = 0;
        let sWidth = width;
        let sHeight = height;

        // Square center crop
        if (width > height) {
          sWidth = height;
          sx = (width - height) / 2;
        } else {
          sHeight = width;
          sy = (height - width) / 2;
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ProfilePage() {
  const { currentUser, items, transactions, reviews, updateProfile, updateItem, deleteItem } = useAppStore();
  const [activeTab, setActiveTab] = useState<'items' | 'trades' | 'reviews'>('items');

  // Edit Profile Modal State (10 User-Specified Fields)
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [targetGroup, setTargetGroup] = useState('Sinh viên');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [livingArea, setLivingArea] = useState('Phường Hòa Khánh Bắc');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preferredContact, setPreferredContact] = useState<'CHAT' | 'PHONE' | 'BOTH'>('CHAT');

  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center mx-auto">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
          Chưa đăng nhập tài khoản
        </h2>
        <p className="text-slate-500 text-sm">
          Vui lòng đăng nhập tài khoản sinh viên hoặc cư dân Liên Chiểu để xem hồ sơ và điểm uy tín.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0F5B4B] text-white font-bold text-sm hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setFullName(currentUser.full_name || '');
    setAvatarUrl(currentUser.avatar_url || '');
    setBio(currentUser.bio || '');
    setTargetGroup(currentUser.target_group || 'Sinh viên');
    setUniversity(currentUser.university || '');
    setDepartment(currentUser.department || '');
    setStudentId(currentUser.student_id || '');
    setLivingArea(currentUser.living_area || currentUser.address || 'Phường Hòa Khánh Bắc');
    setPhone(currentUser.phone || '');
    setEmail(currentUser.email || '');
    setPassword(currentUser.password || '');
    setPreferredContact(currentUser.preferred_contact || 'CHAT');
    setSaveSuccessMsg(false);
    setShowEditModal(true);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('edit=true')) {
      handleOpenEdit();
    }
  }, [currentUser]);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await processAvatarFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error(err);
      alert('Không thể đọc ảnh tải lên.');
    } finally {
      setIsProcessingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim(),
      bio: bio.trim(),
      target_group: targetGroup,
      university: university.trim(),
      department: department.trim(),
      student_id: studentId.trim(),
      living_area: livingArea,
      address: livingArea,
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim() ? password.trim() : currentUser.password,
      preferred_contact: preferredContact,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setShowEditModal(false);
    }, 900);
  };

  // Items posted by current user
  const userItems = items.filter((i) => i.user_id === currentUser.id);

  // Transactions involving current user (deduplicated per item so each item has at most 1 progress)
  const userTrades = React.useMemo(() => {
    if (!currentUser) return [];
    const raw = transactions.filter(
      (t) =>
        t.status !== 'CANCELLED' &&
        t.id !== 'tr-001' &&
        t.id !== 'tr-002' &&
        (t.giver_id === currentUser.id || t.receiver_id === currentUser.id)
    );

    const result: typeof raw = [];
    const giverItemIds = new Set<string>();

    raw.forEach((t) => {
      if (t.giver_id === currentUser.id) {
        if (!giverItemIds.has(t.item_id)) {
          const itemTrades = raw.filter(
            (other) => other.giver_id === currentUser.id && other.item_id === t.item_id
          );
          const activeTrade = itemTrades.find(
            (x) => x.status === 'ACCEPTED' || x.status === 'HANDED_OVER'
          );
          const chosen = activeTrade || itemTrades[0];
          result.push(chosen);
          giverItemIds.add(t.item_id);
        }
      } else {
        result.push(t);
      }
    });

    return result;
  }, [transactions, currentUser]);

  // Reviews for this user
  const userReviews = reviews.filter((r) => r.reviewee_id === currentUser.id);

  const [profileActionMsg, setProfileActionMsg] = useState<string | null>(null);

  const isItemTrading = (itemId: string) => {
    return transactions.some(
      (t) => t.item_id === itemId && (t.status === 'ACCEPTED' || t.status === 'HANDED_OVER')
    );
  };

  const handleToggleHideItem = (itemId: string, currentStatus: string) => {
    const isHidden = currentStatus === 'HIDDEN';
    const nextStatus = isHidden ? 'ACTIVE' : 'HIDDEN';
    updateItem(itemId, { status: nextStatus });
    setProfileActionMsg(
      isHidden
        ? 'Đã mở lại hiển thị món đồ lên Kho Đồ công khai.'
        : 'Đã tạm thời ẩn món đồ khỏi danh sách công khai.'
    );
    setTimeout(() => setProfileActionMsg(null), 3500);
  };

  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    if (isItemTrading(itemId)) {
      alert(
        'Món đồ đang trong tiến trình giao dịch hẹn gặp với bạn sinh viên. Không thể sửa hoặc xóa khi đang giao dịch để đảm bảo uy tín và tránh tranh chấp!'
      );
      return;
    }
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa món đồ "${itemTitle}" khỏi danh sách Kho Đồ?\n\n(Lưu ý: Món đồ sẽ bị gỡ bỏ hoàn toàn khỏi kho đồ)`
    );
    if (!confirmed) return;

    try {
      deleteItem(itemId);
      setProfileActionMsg('Đã xóa món đồ khỏi kho đồ thành công.');
      setTimeout(() => setProfileActionMsg(null), 3500);
    } catch (e: any) {
      alert(e?.message || 'Có lỗi khi xóa món đồ');
    }
  };

  const contactPrefLabel =
    currentUser.preferred_contact === 'PHONE'
      ? '📞 Ưu tiên gọi điện thoại'
      : currentUser.preferred_contact === 'BOTH'
      ? '🤝 Nhắn tin & Gọi điện'
      : '💬 Ưu tiên chat trên web';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Subtle accent header line */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-linear-to-r from-[#0F5B4B] via-emerald-500 to-teal-400" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
          {/* Avatar with click to edit */}
          <div className="relative group cursor-pointer shrink-0" onClick={handleOpenEdit}>
            {currentUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#0F5B4B] shadow-md shadow-[#0F5B4B]/10 group-hover:brightness-95 transition-all"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#EAF7F2] text-[#0F5B4B] font-bold text-2xl flex items-center justify-center border-2 border-[#0F5B4B]">
                {currentUser.full_name.charAt(0)}
              </div>
            )}

            {/* Always visible small camera pill on avatar */}
            <div className="absolute -bottom-1 -left-1 bg-white border border-slate-200 text-[#0F5B4B] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-[10px] font-bold hover:bg-[#EAF7F2] transition-colors">
              <Camera className="w-3 h-3 text-[#0F5B4B]" />
              <span>Đổi ảnh</span>
            </div>

            {currentUser.is_verified && (
              <div
                className="absolute -bottom-2 -right-2 bg-[#0F5B4B] text-white p-1.5 rounded-full shadow-md z-10"
                title="Đã xác thực danh tính"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentUser.full_name}
              </h1>

              {/* Quick edit button next to name */}
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F5B4B] border border-[#0F5B4B]/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Chỉnh sửa thông tin tài khoản"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa thông tin</span>
              </button>

              {/* Role Badge */}
              {currentUser.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                  Quản trị viên Ban Quản Trị
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã xác thực
                </span>
              )}

              {/* Reputation Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                ⭐ {currentUser.reputation_score} điểm uy tín
              </span>
            </div>

            {/* Bio quote if provided */}
            {currentUser.bio && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0 mt-0.5" />
                <span>&ldquo;{currentUser.bio}&rdquo;</span>
              </div>
            )}

            {/* Badges row: Target Group, Organization, Living Area, Contact Preference */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {currentUser.target_group && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                  {currentUser.target_group === 'Sinh viên' ? '🎓' : currentUser.target_group === 'Học sinh' ? '🧑‍🎓' : currentUser.target_group === 'Người dân' ? '🏘️' : '👥'} {currentUser.target_group}
                </span>
              )}

              {currentUser.university && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                  <GraduationCap className="w-3 h-3 text-[#0F5B4B]" />
                  <span>{currentUser.university}</span>
                  {currentUser.department && <span className="text-slate-400">• {currentUser.department}</span>}
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{currentUser.living_area || currentUser.address || 'Quận Liên Chiểu'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                <span>{contactPrefLabel}</span>
              </span>
            </div>
          </div>

          {/* Header Action Buttons - Highly Visible */}
          <div className="flex flex-wrap sm:flex-col items-stretch gap-2.5 shrink-0 sm:self-center w-full sm:w-auto">
            <button
              onClick={handleOpenEdit}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#0F5B4B]/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5]" />
              <span>Tùy chỉnh thông tin</span>
            </button>
            <Link
              href="/items/new"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border-2 border-[#0F5B4B] bg-white hover:bg-[#EAF7F2] text-[#0F5B4B] text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Gift className="w-4 h-4 text-[#0F5B4B]" />
              <span>+ Đăng đồ mới</span>
            </Link>
          </div>
        </div>

        {/* Detailed Info Grid Header with Privacy Legend */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#0F5B4B]" />
            <span>Chi tiết hồ sơ & Thiết lập liên hệ</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Công khai
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" /> Riêng tư bảo mật
            </span>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {/* Living Area (Public at area level) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Khu vực sinh sống</span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Công khai</span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5 truncate">
                {currentUser.living_area || currentUser.address || 'Liên Chiểu, Đà Nẵng'}
              </div>
            </div>
          </div>

          {/* Target Group & Institution (Public) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Nhóm đối tượng & Đơn vị</span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Công khai</span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5 truncate">
                {currentUser.target_group || 'Sinh viên'} {currentUser.university ? `• ${currentUser.university}` : ''}
              </div>
            </div>
          </div>

          {/* Preferred Contact (Public option, hidden number) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Ưu tiên liên hệ</span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Công khai</span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5 truncate">
                {contactPrefLabel}
              </div>
            </div>
          </div>

          {/* Phone (Private) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Số điện thoại</span>
                <span className="text-[9px] text-slate-500 font-bold bg-slate-200/60 px-1 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Riêng tư
                </span>
              </div>
              <div className="font-bold text-slate-800 mt-0.5">
                {currentUser.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>

          {/* Email (Private) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Email tài khoản</span>
                <span className="text-[9px] text-slate-500 font-bold bg-slate-200/60 px-1 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Riêng tư
                </span>
              </div>
              <div className="font-bold text-slate-800 truncate mt-0.5" title={currentUser.email}>
                {currentUser.email || 'Chưa liên kết email'}
              </div>
            </div>
          </div>

          {/* Student ID / Code (Public) */}
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Mã số sinh viên (MSSV)</span>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Công khai</span>
              </div>
              <div className="font-bold text-slate-800 font-mono mt-0.5">
                {currentUser.student_id || 'Không bắt buộc'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Counter */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-[#0F5B4B]">
              {currentUser.items_given_count}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Món đã trao tặng
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-[#0F5B4B]">
              {currentUser.completed_trades_count}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Giao dịch hoàn tất
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 text-center border border-emerald-100">
            <div className="text-xl sm:text-3xl font-extrabold text-[#0F5B4B]">
              {currentUser.reputation_score}
            </div>
            <div className="text-xs sm:text-sm text-emerald-800 font-bold mt-0.5">
              ⭐ Điểm đóng góp
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200 text-sm font-semibold gap-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'items'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Món đồ đang cho ({userItems.length})
        </button>

        <button
          onClick={() => setActiveTab('trades')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'trades'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lịch sử trao đổi ({userTrades.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-[#0F5B4B] text-[#0F5B4B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đánh giá từ cộng đồng ({userReviews.length})
        </button>
      </div>

      {/* Tab: Items */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {profileActionMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {profileActionMsg}
            </div>
          )}

          {userItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <SlidersHorizontal className="w-4 h-4 text-[#0F5B4B] shrink-0" />
                <span>
                  <strong>Quản lý kho đồ cá nhân:</strong> Chỉ bạn mới có quyền Sửa, Ẩn hoặc Xóa món đồ của mình. Khi đang có phiên giao dịch hẹn gặp, hệ thống sẽ khóa tính năng Sửa/Xóa để bảo vệ quyền lợi hai bên.
                </span>
              </div>
              <Link
                href="/items/new"
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs transition-colors text-center"
              >
                + Đăng món mới
              </Link>
            </div>
          )}

          {userItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userItems.map((item) => {
                const tradingNow = isItemTrading(item.id);
                const isHidden = item.status === 'HIDDEN';
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Item Image & Badges */}
                    <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                            item.purpose === 'FREE'
                              ? 'bg-emerald-600/90 text-white'
                              : 'bg-indigo-600/90 text-white'
                          }`}
                        >
                          {item.purpose === 'FREE' ? '🎁 Tặng 0đ' : '🔄 Đổi đồ'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        {isHidden ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/95 text-white shadow-xs backdrop-blur-md">
                            <EyeOff className="w-3 h-3" /> Đã ẩn
                          </span>
                        ) : tradingNow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/95 text-white shadow-xs backdrop-blur-md">
                            <Clock className="w-3 h-3 animate-spin" /> Đang giao dịch
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/90 text-white shadow-xs backdrop-blur-md">
                            <Check className="w-3 h-3" /> Đã trao xong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/95 text-white shadow-xs backdrop-blur-md">
                            <Sparkles className="w-3 h-3" /> Mở nhận
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                          {item.category}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5" title={item.title}>
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>

                      {/* Trade Lock Notice */}
                      {tradingNow && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5 font-medium">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Đang trong phiên giao dịch hẹn gặp (Khóa Sửa/Xóa)</span>
                        </div>
                      )}

                      {/* Management Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          {/* Sửa */}
                          {tradingNow ? (
                            <button
                              type="button"
                              disabled
                              title="Không thể sửa khi đang có giao dịch hẹn gặp"
                              className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1 cursor-not-allowed border border-slate-200"
                            >
                              <Lock className="w-3 h-3" /> Sửa
                            </button>
                          ) : (
                            <Link
                              href={`/items/${item.id}?edit=true`}
                              className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200"
                            >
                              <Edit3 className="w-3 h-3 text-[#0F5B4B]" /> Sửa
                            </Link>
                          )}

                          {/* Ẩn / Hiện */}
                          <button
                            type="button"
                            onClick={() => handleToggleHideItem(item.id, item.status)}
                            title={isHidden ? 'Mở lại trên kho đồ' : 'Tạm ẩn khỏi kho'}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                              isHidden
                                ? 'bg-emerald-50 text-[#0F5B4B] border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-amber-800 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <Eye className="w-3 h-3 text-[#0F5B4B]" /> Hiện
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-amber-700" /> Ẩn
                              </>
                            )}
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            disabled={tradingNow}
                            title={tradingNow ? 'Không thể xóa khi đang có giao dịch' : 'Xóa món đồ khỏi kho'}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
                              tradingNow
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer'
                            }`}
                          >
                            {tradingNow ? <Lock className="w-3 h-3" /> : <Trash2 className="w-3 h-3 text-rose-600" />} Xóa
                          </button>
                        </div>

                        {/* Chi tiết */}
                        <Link
                          href={`/items/${item.id}`}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#EAF7F2] text-[#0F5B4B] hover:text-[#0F5B4B] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          Xem chi tiết & Quản lý giao dịch
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <Gift className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-bold">Bạn chưa đăng món đồ nào</div>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Chia sẻ sách vở, giáo trình, quạt, đèn bàn hay đồ dùng không còn dùng đến để tích lũy điểm uy tín!
              </p>
              <Link
                href="/items/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white font-bold text-xs hover:bg-[#0A3F34]"
              >
                + Đăng món đồ đầu tiên
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab: Trades */}
      {activeTab === 'trades' && (
        <div className="space-y-3">
          {userTrades.length > 0 ? (
            userTrades.map((trade) => {
              const isGiver = trade.giver_id === currentUser.id;
              const otherUser = isGiver ? trade.receiver : trade.giver;
              return (
                <div
                  key={trade.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0F5B4B] flex items-center justify-center font-bold text-sm shrink-0">
                      {isGiver ? '🎁' : '🤝'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {trade.item?.title || 'Món đồ trao đổi'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isGiver ? 'Trao cho' : 'Nhận từ'}:{' '}
                        <strong>{otherUser?.full_name || 'Thành viên Liên Chiểu'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        trade.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : trade.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {trade.status === 'COMPLETED'
                        ? 'Đã hoàn tất'
                        : trade.status === 'CANCELLED'
                        ? 'Đã hủy'
                        : 'Đang tiến hành'}
                    </span>
                    <Link
                      href={`/trades/${trade.id}`}
                      className="text-xs font-bold text-[#0F5B4B] hover:underline"
                    >
                      Chi tiết →
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Chưa có giao dịch trao đổi nào được ghi nhận.
            </div>
          )}
        </div>
      )}

      {/* Tab: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {userReviews.length > 0 ? (
            userReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                  <span>Người đánh giá:</span>
                  <strong className="text-slate-800">
                    {rev.reviewer?.full_name || 'Thành viên Liên Chiểu'}
                  </strong>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Bạn chưa có đánh giá nào từ cộng đồng.
            </div>
          )}
        </div>
      )}

      {/* EDIT PROFILE MODAL (ALL 10 USER-SPECIFIED FIELDS WITH PRIVACY BADGES) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl animate-fade-in space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#0F5B4B]" />
                  Tùy chỉnh thông tin cá nhân
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật thông tin hồ sơ theo tiêu chuẩn an toàn cộng đồng Kho Đồ Liên Chiểu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã lưu và cập nhật thông tin hồ sơ thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs sm:text-sm">
              {/* SECTION 1: CÔNG KHAI TRÊN HỒ SƠ */}
              <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-100/80">
                  <span className="text-xs font-bold text-[#0F5B4B] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#0F5B4B]" />
                    1. Thông tin công khai trên hồ sơ
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    🟢 Công khai
                  </span>
                </div>

                {/* 1. Avatar Picker */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Ảnh đại diện (Avatar) <span className="text-slate-400 font-normal text-xs">• Công khai</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0F5B4B] shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0F5B4B] font-bold text-xl flex items-center justify-center border-2 border-[#0F5B4B]">
                          {fullName.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleAvatarFileSelected}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingAvatar}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#0F5B4B]" />
                          <span>{isProcessingAvatar ? 'Đang nén...' : 'Tải ảnh từ máy'}</span>
                        </button>
                        <span className="text-[11px] text-slate-400">hoặc chọn mẫu bên dưới</span>
                      </div>

                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Hoặc dán link ảnh trực tiếp (https://...)"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-[#0F5B4B]"
                      />
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div className="pt-1">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Ảnh mẫu có sẵn:</div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(p.url)}
                          className={`p-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            avatarUrl === p.url
                              ? 'border-[#0F5B4B] bg-emerald-50 ring-2 ring-[#0F5B4B]/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span className="text-[9px] font-semibold text-slate-600 line-clamp-1">
                            {p.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Tên hiển thị */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Tên hiển thị <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Công khai</span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập tên hiển thị của bạn..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                    />
                  </div>
                </div>

                {/* 3. Giới thiệu bản thân (Bio - 1-2 câu ngắn) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Giới thiệu bản thân <span className="text-slate-400 font-normal text-xs">(1–2 câu ngắn)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Công khai ({bio.length}/160)</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ví dụ: Sinh viên năm 2 ĐH Bách Khoa, sẵn sàng chia sẻ giáo trình, đồ điện tử và kết nối bạn bè..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20 resize-none text-xs sm:text-sm"
                  />
                </div>

                {/* 4. Nhóm đối tượng (Sinh viên / Học sinh / Thanh niên / Người dân / Khác) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Nhóm đối tượng
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tùy chọn công khai</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TARGET_GROUPS.map((tg) => (
                      <button
                        key={tg.value}
                        type="button"
                        onClick={() => setTargetGroup(tg.value)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          targetGroup === tg.value
                            ? 'border-[#0F5B4B] bg-[#0F5B4B] text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs">{tg.label}</span>
                        <span className={`text-[10px] line-clamp-1 ${targetGroup === tg.value ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {tg.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Trường học hoặc đơn vị (Không bắt buộc) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Trường học hoặc đơn vị <span className="text-slate-400 font-normal text-xs">(Không bắt buộc)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tùy chọn công khai</span>
                  </div>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      list="uni-list-options"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="Nhập hoặc chọn trường học / đơn vị của bạn..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                    />
                    <datalist id="uni-list-options">
                      {UNIVERSITY_OPTIONS.map((u, idx) => (
                        <option key={idx} value={u} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Khoa/Lớp & MSSV (bổ trợ cho sinh viên) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-600 text-xs">
                      Khoa / Ngành / Lớp <span className="text-slate-400">(Nếu có)</span>
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Khoa Công nghệ Thông tin..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-600 text-xs">
                      Mã số sinh viên (MSSV) <span className="text-slate-400">(Nếu có)</span>
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="102220xxx..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B]"
                    />
                  </div>
                </div>

                {/* 6. Khu vực sinh sống tại Liên Chiểu (Công khai ở mức khu vực, không lộ địa chỉ cụ thể) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Khu vực sinh sống
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Công khai ở mức khu vực</span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={livingArea}
                      onChange={(e) => setLivingArea(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                    >
                      {LIEN_CHIEU_AREAS.map((area) => (
                        <option key={area} value={area}>
                          📍 {area}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    💡 Chỉ hiển thị khu vực chung tại Liên Chiểu. Không bắt buộc và không hiển thị địa chỉ nhà riêng cụ thể để bảo vệ an toàn cho bạn.
                  </p>
                </div>
              </div>

              {/* SECTION 2: RIÊNG TƯ & BẢO MẬT TÀI KHOẢN */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    2. Thông tin riêng tư & Quản lý tài khoản
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" /> Riêng tư bảo mật
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bảo mật thông tin:</strong> Số điện thoại và Email được mã hóa, không công khai với người lạ và chỉ hiển thị khi đôi bên đã xác nhận thỏa thuận giao dịch.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 7. Số điện thoại */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">
                        Số điện thoại
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold">Riêng tư</span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0905 xxx xxx"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B]"
                      />
                    </div>
                  </div>

                  {/* 8. Email */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">
                        Email tài khoản
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold">Riêng tư</span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B]"
                      />
                    </div>
                  </div>
                </div>

                {/* 9. Mật khẩu (Không hiển thị / Đổi mật khẩu) */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Mật khẩu đăng nhập <span className="text-slate-400 font-normal text-xs">(Điền nếu muốn đổi mật khẩu mới)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">Không hiển thị</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (Để trống nếu giữ nguyên mật khẩu cũ)"
                      className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#0F5B4B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PHƯƠNG THỨC LIÊN HỆ ƯU TIÊN */}
              <div className="space-y-3 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                <div className="flex items-center justify-between pb-1 border-b border-teal-100">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#0F5B4B]" />
                    3. Phương thức liên hệ ưu tiên
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Hiển thị lựa chọn, không lộ số
                  </span>
                </div>

                <div className="space-y-2">
                  {CONTACT_PREFERENCES.map((cp) => (
                    <label
                      key={cp.value}
                      onClick={() => setPreferredContact(cp.value)}
                      className={`p-3 rounded-2xl border flex items-start gap-3 transition-all cursor-pointer ${
                        preferredContact === cp.value
                          ? 'border-[#0F5B4B] bg-white ring-2 ring-[#0F5B4B]/20 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="contact_preference"
                        checked={preferredContact === cp.value}
                        onChange={() => setPreferredContact(cp.value)}
                        className="mt-0.5 text-[#0F5B4B] focus:ring-[#0F5B4B]"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-800">{cp.label}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{cp.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold shadow-md shadow-[#0F5B4B]/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
