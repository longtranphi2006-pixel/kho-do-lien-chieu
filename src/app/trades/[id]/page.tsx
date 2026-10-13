'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { TradeStatus } from '@/types';
import { WarningBanner } from '@/components/common/WarningBanner';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Gift,
  ArrowLeftRight,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Check,
  Sparkles,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

function TradeStepperContent() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const { getTransactionById, advanceTradeStatus, currentUser } = useAppStore();
  const transaction = getTransactionById(tradeId);

  const [isUpdating, setIsUpdating] = useState(false);

  if (!transaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy phiên trao đổi</h2>
        <p className="text-slate-500 text-sm">Mã giao dịch không tồn tại hoặc đã được chuyển giao.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay về Trang chủ
        </Link>
      </div>
    );
  }

  const { item, giver, receiver, status } = transaction;

  // 4 Stepper Steps mapping
  const steps = [
    { id: '1', key: 'POSTED', label: '1. Đã đăng bài', desc: 'Món đồ sẵn sàng chia sẻ' },
    { id: '2', key: 'MATCHED', label: '2. Đã có người nhận', desc: 'Hai bên thống nhất thời gian' },
    { id: '3', key: 'HANDING_OVER', label: '3. Đang chờ trao đồ', desc: 'Gặp mặt trao nhận trực tiếp' },
    { id: '4', key: 'COMPLETED', label: '4. Hoàn tất', desc: 'Xác nhận & nhận +20 điểm' },
  ];

  const getStepIndex = (st: TradeStatus) => {
    switch (st) {
      case 'REQUESTED': return 1; // Step 2 active
      case 'ACCEPTED': return 1; // Step 2 completed / moving to 3
      case 'HANDED_OVER': return 2; // Step 3 active
      case 'COMPLETED': return 3; // Step 4 complete
      default: return 0;
    }
  };

  const currentStepIndex = getStepIndex(status);

  const handleAdvance = (nextStatus: TradeStatus) => {
    setIsUpdating(true);
    advanceTradeStatus(transaction.id, nextStatus);
    setTimeout(() => {
      setIsUpdating(false);
      if (nextStatus === 'COMPLETED') {
        router.push(`/trades/${transaction.id}/completed`);
      }
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F5B4B]"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
        </Link>
        <span className="text-xs text-slate-400 font-mono">Mã GD: #{transaction.id}</span>
      </div>

      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7F2] text-[#0F5B4B] text-xs font-bold border border-[#A7E2CB] mb-2">
          <Clock className="w-3.5 h-3.5" />
          Tiến Trình Trao Nhận 4 Bước (P2P Stepper)
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Theo dõi tiến độ trao đổi món đồ
        </h1>
      </div>

      {/* Visual 4-Step Stepper Bar (Per Prompt Requirement) */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((s, idx) => {
            const isFinished = currentStepIndex > idx || status === 'COMPLETED';
            const isCurrent = currentStepIndex === idx && status !== 'COMPLETED';

            return (
              <div key={s.id} className="flex flex-col items-center text-center relative z-10">
                {/* Circle Icon */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                    isFinished
                      ? 'bg-[#0F5B4B] text-white shadow-md shadow-[#0F5B4B]/25'
                      : isCurrent
                      ? 'bg-[#EAF7F2] text-[#0F5B4B] border-2 border-[#0F5B4B] ring-4 ring-[#EAF7F2]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isFinished ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : idx + 1}
                </div>

                {/* Step Name */}
                <div className={`mt-2 font-bold text-xs sm:text-sm leading-tight ${
                  isCurrent ? 'text-[#0F5B4B]' : isFinished ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {s.label}
                </div>

                {/* Subtitle */}
                <div className="hidden sm:block text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Summary Banner */}
      {item && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          {item.images && item.images.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-slate-200"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB]">
                {item.purpose === 'FREE' ? 'Cho miễn phí' : 'Đổi đồ'}
              </span>
              <span className="text-xs text-slate-500">{item.category}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#0F5B4B]" />
              <span className="truncate">{transaction.pickup_location || item.location}</span>
            </div>
          </div>
        </div>
      )}

      {/* Donor & Receiver Side-by-Side Summary Cards (Per Design Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donor Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Người trao tặng (Donor)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold">
              Bên cho
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {giver?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={giver.avatar_url}
                alt={giver.full_name}
                className="w-12 h-12 rounded-full object-cover border border-[#0F5B4B]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold flex items-center justify-center">
                {giver?.full_name?.charAt(0) || 'G'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {giver?.full_name}
                </h4>
                {giver?.is_verified && (
                  <span title="Đã xác thực">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5B4B] shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {giver?.university}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đã trao: <strong>{giver?.items_given_count || 12} món</strong></span>
            <span>Uy tín: <strong>⭐ {giver?.reputation_score || 120}</strong></span>
          </div>
        </div>

        {/* Receiver Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Người nhận đồ (Receiver)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-[#0F5B4B] font-semibold">
              Bên nhận
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {receiver?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiver.avatar_url}
                alt={receiver.full_name}
                className="w-12 h-12 rounded-full object-cover border border-[#0F5B4B]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold flex items-center justify-center">
                {receiver?.full_name?.charAt(0) || 'R'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {receiver?.full_name}
                </h4>
                {receiver?.is_verified && (
                  <span title="Đã xác thực">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5B4B] shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {receiver?.university}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đã nhận: <strong>{receiver?.completed_trades_count || 5} món</strong></span>
            <span>Uy tín: <strong>⭐ {receiver?.reputation_score || 80}</strong></span>
          </div>
        </div>
      </div>

      {/* Appointment Location & Reminder */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Chi tiết cuộc hẹn giao nhận</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#0F5B4B] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-800">Điểm hẹn:</div>
              <div className="text-slate-600">{transaction.pickup_location || 'Cổng ĐH Bách Khoa Đà Nẵng'}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#0F5B4B] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-800">Thời gian dự kiến:</div>
              <div className="text-slate-600">
                {transaction.scheduled_date
                  ? new Date(transaction.scheduled_date).toLocaleString('vi-VN')
                  : 'Hẹn trực tiếp qua trao đổi'}
              </div>
            </div>
          </div>
        </div>

        {transaction.note && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-[#0F5B4B] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Ghi chú hẹn: </span>
              <span>{transaction.note}</span>
            </div>
          </div>
        )}
      </div>

      {/* Safety Warning */}
      <WarningBanner
        title="Lưu ý khi đến điểm hẹn"
        message="Hãy kiểm tra đồ dùng kỹ lưỡng ngay tại chỗ. Nếu đồ dùng không đúng như cam kết, bạn hoàn toàn có thể từ chối nhận mà không phát sinh bất kỳ chi phí nào."
      />

      {/* Mutual Confirmation Action Buttons (Per Prompt Specification) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          Xác nhận tiến trình trao đồ
        </h3>

        {status === 'REQUESTED' && (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600">
              Người nhận đã gửi yêu cầu. Người trao đồ vui lòng xác nhận chấp thuận để bắt đầu cuộc hẹn.
            </p>
            <button
              onClick={() => handleAdvance('ACCEPTED')}
              disabled={isUpdating}
              className="w-full py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm sm:text-base hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
            >
              Chấp nhận đề nghị trao đổi (Bước 2: Đã có người nhận)
            </button>
          </div>
        )}

        {status === 'ACCEPTED' && (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600">
              Hai bên đã thống nhất. Khi chuẩn bị hoặc đang đến điểm hẹn, nhấn nút bên dưới:
            </p>
            <button
              onClick={() => handleAdvance('HANDED_OVER')}
              disabled={isUpdating}
              className="w-full py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm sm:text-base hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
            >
              Tôi đã mang đồ đi trao (Bước 3: Đang chờ trao)
            </button>
          </div>
        )}

        {status === 'HANDED_OVER' && (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600">
              Món đồ đã được trao tại điểm hẹn. Vui lòng bấm xác nhận hoàn tất để hệ thống ghi nhận và trao thưởng +20 điểm đóng góp:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleAdvance('COMPLETED')}
                disabled={isUpdating}
                className="py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm sm:text-base hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
              >
                ✓ Xác nhận đã trao đồ (Người trao)
              </button>
              <button
                onClick={() => handleAdvance('COMPLETED')}
                disabled={isUpdating}
                className="py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm sm:text-base hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                ✓ Xác nhận hoàn tất & nhận đồ (Người nhận)
              </button>
            </div>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <div className="font-bold text-emerald-900 text-base">
              🎉 Giao dịch trao nhận đã hoàn tất thành công!
            </div>
            <Link
              href={`/trades/${transaction.id}/completed`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold hover:bg-[#0A3F34]"
            >
              Xem trang chúc mừng & đánh giá (+20 điểm) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradeStepperPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Đang tải tiến trình trao đổi...</div>}>
      <TradeStepperContent />
    </Suspense>
  );
}
