'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ReportTargetType, ReportReason } from '@/types';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  DollarSign,
  Ban,
  MessageSquareWarning,
  HelpCircle,
  CheckCircle2,
  Send,
  Lock,
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetDetails?: string;
  targetUserId?: string;
  targetUserName?: string;
}

const REPORT_REASONS: Array<{
  value: ReportReason;
  label: string;
  desc: string;
  icon: any;
}> = [
  {
    value: 'COMMERCIAL_MONEY',
    label: 'Tiền bạc & Mua bán thương mại',
    desc: 'Yêu cầu trả tiền mặt, đòi tiền cọc, ép giá, buôn bán sinh lời vi phạm quy tắc trao đổi 0đ P2P.',
    icon: DollarSign,
  },
  {
    value: 'PROHIBITED_SUBSTANCE',
    label: 'Chất cấm, vũ khí & Hàng nguy hiểm',
    desc: 'Chất kích thích, thuốc lá điện tử/pod, vũ khí, hóa chất độc hại, hàng cấm theo pháp luật.',
    icon: Ban,
  },
  {
    value: 'VIOLENCE_HARASSMENT',
    label: 'Bạo lực, đe dọa & Quấy rối',
    desc: 'Đe dọa an toàn, xúc phạm danh dự, kỳ thị, ngôn từ thù hằn hoặc quấy rối trong tin nhắn/hẹn gặp.',
    icon: MessageSquareWarning,
  },
  {
    value: 'FRAUD_SCAM',
    label: 'Lừa đảo & Gian lận',
    desc: 'Hàng giả, gian lận điểm uy tín, không đến điểm hẹn, mạo danh sinh viên trường khác.',
    icon: AlertTriangle,
  },
  {
    value: 'OTHER',
    label: 'Lý do khác',
    desc: 'Vi phạm quy chế cộng đồng khác của Kho Đồ Liên Chiểu (vui lòng mô tả chi tiết bên dưới).',
    icon: HelpCircle,
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetDetails,
  targetUserId,
  targetUserName,
}) => {
  const { currentUser, submitReport } = useAppStore();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('COMMERCIAL_MONEY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const targetTypeLabel =
    targetType === 'ITEM'
      ? 'Bài đăng món đồ'
      : targetType === 'USER'
      ? 'Tài khoản người dùng'
      : targetType === 'TRADE'
      ? 'Phiên giao dịch'
      : 'Tin nhắn hội thoại';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Vui lòng nhập mô tả chi tiết hoặc bằng chứng vi phạm để Admin có căn cứ xử lý.');
      return;
    }

    setIsSubmitting(true);
    try {
      submitReport({
        targetType,
        targetId,
        targetTitle,
        targetDetails,
        targetUserId,
        targetUserName,
        reason: selectedReason,
        description: description.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi khi gửi báo cáo: ' + (err?.message || 'Vui lòng thử lại sau'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Accent Top Bar */}
        <div className="h-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Báo Cáo Vi Phạm
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Chuyển Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối tượng: <strong className="text-slate-800">{targetTypeLabel}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Info Summary */}
        <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Nội dung bị báo cáo:</span>
            {targetUserName && (
              <span className="text-slate-700 font-semibold">Bởi: {targetUserName}</span>
            )}
          </div>
          <div className="font-bold text-slate-900 text-sm line-clamp-1">
            {targetTitle}
          </div>
          {targetDetails && (
            <p className="text-[11px] text-slate-500 italic line-clamp-2 border-t border-slate-200/60 pt-1 mt-1">
              "{targetDetails}"
            </p>
          )}
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Đã gửi báo cáo vi phạm tới Ban Quản Trị
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Cảm ơn bạn đã chung tay bảo vệ môi trường chia sẻ văn minh tại Liên Chiểu. Admin sẽ xác minh và xử lý nghiêm đối với trường hợp này.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 pt-3 space-y-4">
            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Chọn lý do vi phạm cụ thể:
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const Icon = r.icon;
                  const isChecked = selectedReason === r.value;
                  return (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-rose-400 bg-rose-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.value}
                        checked={isChecked}
                        onChange={() => setSelectedReason(r.value)}
                        className="mt-1 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-rose-600' : 'text-slate-400'}`} />
                          <span>{r.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {r.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Mô tả chi tiết sự việc / Bằng chứng:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng cung cấp chi tiết như nội dung trao đổi, hành vi vi phạm, hoặc lý do bạn báo cáo để Admin dễ dàng xác minh..."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-200 resize-none text-slate-800"
              />
            </div>

            {/* Admin Policy Callout */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Quy trình bảo mật:</strong> Báo cáo của bạn được gửi ẩn danh và bảo mật tuyệt đối với đối phương. Ban Quản Trị Admin có toàn quyền xác minh, <strong>ẩn/xóa bài đăng vi phạm</strong> hoặc <strong>khóa tài khoản</strong> theo quy định.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Đang gửi báo cáo...' : 'Gửi Báo Cáo Tới Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
