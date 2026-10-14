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
} from 'lucide-react';

const PRESET_AVATARS = [
  { label: 'Nam SV Bách Khoa', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nữ SV Sư Phạm', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nam SV IT', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Nữ SV Kinh Tế', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Sinh viên năng động', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
  { label: 'Ban Quản Trị / BQL', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
];

const UNIVERSITY_OPTIONS = [
  'Trường Đại học Bách khoa - ĐHĐN',
  'Trường Đại học Sư phạm - ĐHĐN',
  'Trường Đại học Kinh tế - ĐHĐN',
  'Trường Đại học CNTT & TT Việt - Hàn (VKU)',
  'Trường Cao đẳng Kinh tế - Kế hoạch Đà Nẵng',
  'Trường Cao đẳng FPT Polytechnic Đà Nẵng',
  'Cư dân / Cựu sinh viên sinh sống tại Liên Chiểu',
  'Ban Quản Lý & Phát Triển Cộng Đồng Liên Chiểu',
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
  const { currentUser, items, transactions, reviews, updateProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<'items' | 'trades' | 'reviews'>('items');

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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
    setUniversity(currentUser.university || '');
    setDepartment(currentUser.department || '');
    setStudentId(currentUser.student_id || '');
    setPhone(currentUser.phone || '');
    setAddress(currentUser.address || '');
    setSaveSuccessMsg(false);
    setShowEditModal(true);
  };

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
      university: university.trim(),
      department: department.trim(),
      student_id: studentId.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setShowEditModal(false);
    }, 900);
  };

  // Items posted by current user
  const userItems = items.filter((i) => i.user_id === currentUser.id);

  // Transactions involving current user
  const userTrades = transactions.filter(
    (t) => t.giver_id === currentUser.id || t.receiver_id === currentUser.id
  );

  // Reviews for this user
  const userReviews = reviews.filter((r) => r.reviewee_id === currentUser.id);

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

            {/* University & Department */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <GraduationCap className="w-4 h-4 text-[#0F5B4B] shrink-0" />
              <span className="font-semibold text-slate-800">{currentUser.university}</span>
              {currentUser.department && (
                <span className="text-slate-500">• {currentUser.department}</span>
              )}
            </div>

            {/* Address */}
            {currentUser.address && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{currentUser.address}</span>
              </div>
            )}
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

        {/* Detailed Info Grid Header */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#0F5B4B]" />
            <span>Thông tin cá nhân & Điểm hẹn</span>
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-xs font-bold text-[#0F5B4B] hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
          >
            <Edit3 className="w-3 h-3" />
            <span>Chỉnh sửa</span>
          </button>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Mã số SV / Định danh</div>
              <div className="font-bold text-slate-800 font-mono mt-0.5">
                {currentUser.student_id || 'Chưa cập nhật'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Số điện thoại liên lạc</div>
              <div className="font-bold text-slate-800 mt-0.5">
                {currentUser.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-[#0F5B4B] flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Email tài khoản</div>
              <div className="font-bold text-slate-800 truncate mt-0.5" title={currentUser.email}>
                {currentUser.email || 'Chưa liên kết email'}
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

      {/* Tab 1: User Items */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {userItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <Gift className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 text-sm">Bạn chưa đăng món đồ nào lên kho.</p>
              <Link
                href="/items/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold"
              >
                + Đăng món đồ đầu tiên
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Trades History */}
      {activeTab === 'trades' && (
        <div className="space-y-3">
          {userTrades.length > 0 ? (
            userTrades.map((trade) => {
              const otherUser =
                trade.giver_id === currentUser.id ? trade.receiver : trade.giver;
              return (
                <Link
                  key={trade.id}
                  href={`/trades/${trade.id}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-mono">
                        Mã #{trade.id} • {new Date(trade.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {trade.item?.title || 'Món đồ trao đổi'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Bạn cùng trao đổi: <strong className="text-slate-800">{otherUser?.full_name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        trade.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {trade.status === 'COMPLETED' ? 'Hoàn tất ✓' : 'Đang tiến hành'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Bạn chưa có lịch sử giao dịch nào.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Community Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {userReviews.length > 0 ? (
            userReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          rev.rating >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1.5">
                      {rev.rating}.0
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
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

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl animate-fade-in space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#0F5B4B]" />
                  Tùy chỉnh thông tin cá nhân
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật họ tên, ảnh đại diện, trường lớp và địa chỉ nhận đồ của bạn
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
                <span>Đã cập nhật thông tin hồ sơ thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
              {/* 1. Avatar Picker */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Ảnh đại diện (Avatar)
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
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                      placeholder="Hoặc dán đường dẫn ảnh trực tiếp (https://...)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#0F5B4B]"
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
                            ? 'border-[#0F5B4B] bg-emerald-50/70 ring-2 ring-[#0F5B4B]/20'
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

              {/* 2. Full Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                </div>
              </div>

              {/* 3. University / Organization */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Trường / Cơ sở đào tạo / Tổ chức
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    list="uni-list"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Trường Đại học Bách khoa - ĐHĐN..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                  <datalist id="uni-list">
                    {UNIVERSITY_OPTIONS.map((u, idx) => (
                      <option key={idx} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 4. Department & Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Khoa / Viện / Lớp
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Khoa Công nghệ Thông tin..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Mã số sinh viên (MSSV)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="102220..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                </div>
              </div>

              {/* 5. Phone Number & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Số điện thoại liên lạc
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0905 xxx xxx"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Địa chỉ / Điểm hẹn nhận đồ quen thuộc
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="KTX Phía Tây, Hòa Khánh..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold shadow-md shadow-[#0F5B4B]/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
