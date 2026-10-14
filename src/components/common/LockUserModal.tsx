'use client';

import React, { useState } from 'react';
import { Profile } from '@/types';
import {
  Lock,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export type LockDuration = '1_HOUR' | '1_DAY' | '1_WEEK' | '1_MONTH' | 'PERMANENT' | 'CUSTOM';

interface LockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile | null;
  onConfirmLock: (params: {
    userId: string;
    duration: LockDuration;
    customUntil?: string;
    reason: string;
  }) => void;
}

const DURATION_OPTIONS: Array<{
  value: LockDuration;
  label: string;
  sublabel: string;
  icon: any;
}> = [
  { value: '1_HOUR', label: '1 Tiếng', sublabel: 'Cảnh cáo ngắn hạn', icon: Clock },
  { value: '1_DAY', label: '1 Ngày (24h)', sublabel: 'Tạm ngưng 1 ngày', icon: Clock },
  { value: '1_WEEK', label: '1 Tuần (7 ngày)', sublabel: 'Vi phạm mức trung bình', icon: Calendar },
  { value: '1_MONTH', label: '1 Tháng (30 ngày)', sublabel: 'Tạm khóa dài hạn', icon: Calendar },
  { value: 'PERMANENT', label: 'Vĩnh viễn', sublabel: 'Khóa không thời hạn', icon: Lock },
  { value: 'CUSTOM', label: 'Tùy chọn', sublabel: 'Tự chọn ngày giờ', icon: Calendar },
];

const QUICK_REASONS = [
  'Đòi tiền cọc / giao dịch tiền mặt trái quy chế',
  'Đăng bán hàng thương mại, kinh doanh sinh lời',
  'Đăng tải chất cấm, vũ khí, hàng nguy hiểm',
  'Ngôn từ thù hằn, xúc phạm hoặc quấy rối thành viên',
  'Lừa đảo, hàng giả, không đến điểm hẹn nhiều lần',
  'Vi phạm quy chế an toàn cộng đồng sinh viên',
];

export const LockUserModal: React.FC<LockUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmLock,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<LockDuration>('1_DAY');
  const [customDateTime, setCustomDateTime] = useState(() => {
    const nextDate = new Date(Date.now() + 86400000 * 3);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    const hh = String(nextDate.getHours()).padStart(2, '0');
    const min = String(nextDate.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  });
  const [reason, setReason] = useState(QUICK_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? `${reason} (${customReason.trim()})` : reason;

    if (selectedDuration === 'CUSTOM' && !customDateTime) {
      alert('Vui lòng chọn ngày giờ mở khóa cho tùy chọn tùy chỉnh.');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirmLock({
        userId: user.id,
        duration: selectedDuration,
        customUntil: selectedDuration === 'CUSTOM' ? new Date(customDateTime).toISOString() : undefined,
        reason: finalReason,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-700" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Khóa Tài Khoản Thành Viên
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Chế độ Vãng lai
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vô hiệu hóa toàn bộ quyền giao dịch, chỉ cho phép xem nội dung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Target User Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F5B4B]/10 overflow-hidden shrink-0 border border-[#0F5B4B]/20 flex items-center justify-center font-bold text-[#0F5B4B]">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user.full_name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate text-sm">{user.full_name}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {user.university || 'Thành viên Liên Chiểu'} {user.email ? `• ${user.email}` : ''}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono text-[10px] border border-slate-200">
              ID: {user.id}
            </span>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              1. Chọn thời gian khóa tài khoản:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{opt.label}</span>
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</span>
                  </button>
                );
              })}
            </div>

            {selectedDuration === 'CUSTOM' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chọn thời điểm mở khóa cụ thể:
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>
            )}
          </div>

          {/* Reason Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              2. Lý do khóa tài khoản:
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {QUICK_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-xs ${
                    reason === r
                      ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="lock-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-600 shrink-0"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <input
              type="text"
              placeholder="Ghi chú thêm lý do chi tiết cho thành viên (tùy chọn)..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:outline-none focus:border-rose-600 focus:bg-white"
            />
          </div>

          {/* Warning Explaining Guest Mode */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Hiệu lực khóa:</strong> Người dùng bị khóa sẽ không thể đăng đồ mới, không thể yêu cầu nhận đồ, không thể chat hay xác nhận giao dịch. Họ chỉ có quyền duyệt xem như <strong>Khách vãng lai</strong>.
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {isSubmitting ? 'Đang khóa...' : 'Xác nhận khóa tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
