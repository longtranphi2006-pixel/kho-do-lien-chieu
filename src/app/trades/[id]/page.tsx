'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Lock,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

function TradeStepperContent() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const { getTransactionById, advanceTradeStatus, confirmTradeHandover, currentUser } = useAppStore();
  const transaction = getTransactionById(tradeId);

  const [isUpdating, setIsUpdating] = useState(false);
  // Allow user to switch viewing perspective during manual testing if needed
  const [selectedRole, setSelectedRole] = useState<'auto' | 'giver' | 'receiver'>('auto');

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

  // Determine effective perspective (Giver vs Receiver)
  const isActuallyGiver = currentUser?.id === transaction.giver_id;
  const isActuallyReceiver = currentUser?.id === transaction.receiver_id;

  let effectiveRole: 'giver' | 'receiver' = 'giver';
  if (selectedRole === 'giver') {
    effectiveRole = 'giver';
  } else if (selectedRole === 'receiver') {
    effectiveRole = 'receiver';
  } else {
    // 'auto': default based on logged-in account
    if (isActuallyReceiver) {
      effectiveRole = 'receiver';
    } else {
      effectiveRole = 'giver';
    }
  }

  // 4 Stepper Steps mapping
  const steps = [
    { id: '1', key: 'POSTED', label: '1. Đã đăng bài', desc: 'Món đồ sẵn sàng chia sẻ' },
    { id: '2', key: 'MATCHED', label: '2. Đã có người nhận', desc: 'Người nhận yêu cầu, chủ đồ duyệt' },
    { id: '3', key: 'HANDING_OVER', label: '3. Đang chờ trao đồ', desc: 'Gặp mặt trao nhận trực tiếp' },
    { id: '4', key: 'COMPLETED', label: '4. Hoàn tất', desc: 'Hai bên cùng xác nhận (+20đ)' },
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

  const bothConfirmed = Boolean(transaction.giver_confirmed && transaction.receiver_confirmed);
  const isCompleted = status === 'COMPLETED' || bothConfirmed;
  const currentStepIndex = isCompleted ? 3 : getStepIndex(status);

  // Auto-advance trade to COMPLETED if both parties have confirmed
  React.useEffect(() => {
    if (bothConfirmed && status !== 'COMPLETED') {
      advanceTradeStatus(transaction.id, 'COMPLETED');
    }
  }, [bothConfirmed, status, transaction.id, advanceTradeStatus]);

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

  const handleConfirmRole = (role: 'giver' | 'receiver') => {
    setIsUpdating(true);
    confirmTradeHandover(transaction.id, role);
    setTimeout(() => {
      setIsUpdating(false);
      const updated = getTransactionById(tradeId);
      if (updated?.status === 'COMPLETED' || (updated?.giver_confirmed && updated?.receiver_confirmed)) {
        router.push(`/trades/${transaction.id}/completed`);
      }
    }, 450);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button & ID */}
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
          Tiến Trình Trao Nhận 4 Bước (Xác nhận 2 chiều P2P)
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Theo dõi tiến độ trao đổi món đồ
        </h1>
      </div>

      {/* Perspective Simulator Banner (Helps user test both roles seamlessly) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">
              Bạn đang thao tác với tư cách:
            </div>
            <div className="font-bold text-emerald-400 text-sm">
              {effectiveRole === 'giver'
                ? `👤 Bên Cho (Người A) - ${giver?.full_name || 'Chủ đồ'}`
                : `👤 Bên Nhận (Người B) - ${receiver?.full_name || 'Người xin đồ'}`}
            </div>
          </div>
        </div>

        {/* Perspective Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl self-start sm:self-auto">
          <span className="text-[11px] text-slate-300 px-2 font-medium">Chuyển vai trò test:</span>
          <button
            type="button"
            onClick={() => setSelectedRole('giver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              effectiveRole === 'giver'
                ? 'bg-[#0F5B4B] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Bên Cho (A)
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('receiver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              effectiveRole === 'receiver'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Bên Nhận (B)
          </button>
        </div>
      </div>

      {/* Visual 4-Step Stepper Bar */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((s, idx) => {
            const isFinished = currentStepIndex > idx || isCompleted;
            const isCurrent = currentStepIndex === idx && !isCompleted;

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

      {/* Donor & Receiver Side-by-Side Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donor Summary Card (A) */}
        <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
          effectiveRole === 'giver'
            ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bên Cho (Người A)
              </span>
              {effectiveRole === 'giver' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F5B4B] text-white font-bold">
                  Góc nhìn hiện tại
                </span>
              )}
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Chủ bài đăng
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {giver?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={giver.avatar_url}
                alt={giver.full_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#0F5B4B]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold flex items-center justify-center">
                {giver?.full_name?.charAt(0) || 'G'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {giver?.full_name || 'Người trao tặng'}
                </h4>
                {giver?.is_verified && (
                  <span title="Đã xác thực sinh viên">
                    <CheckCircle2 className="w-4 h-4 text-[#0F5B4B] shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {giver?.university || 'Đại học Bách Khoa - ĐHĐN'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đã trao: <strong>{giver?.items_given_count ?? 0} món</strong></span>
            <span>Uy tín: <strong>⭐ {giver?.reputation_score ?? 50}</strong></span>
          </div>
        </div>

        {/* Receiver Summary Card (B) */}
        <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
          effectiveRole === 'receiver'
            ? 'bg-teal-50/50 border-teal-300 ring-2 ring-teal-500/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bên Nhận (Người B)
              </span>
              {effectiveRole === 'receiver' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                  Góc nhìn hiện tại
                </span>
              )}
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
              Người yêu cầu
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {receiver?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiver.avatar_url}
                alt={receiver.full_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
                {receiver?.full_name?.charAt(0) || 'R'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {receiver?.full_name || 'Người nhận'}
                </h4>
                {receiver?.is_verified && (
                  <span title="Đã xác thực sinh viên">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {receiver?.university || 'Sinh viên Liên Chiểu'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Đã nhận: <strong>{receiver?.completed_trades_count ?? 0} món</strong></span>
            <span>Uy tín: <strong>⭐ {receiver?.reputation_score ?? 50}</strong></span>
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

      {/* Role-Based Action Box (Strict confirmation logic) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Xác nhận tiến trình trao đồ
            </h3>
            <p className="text-xs text-slate-500">
              Mỗi bước chỉ được thực hiện bởi đúng bên có thẩm quyền theo quy định P2P.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Trạng thái: {status}
          </span>
        </div>

        {/* STEP 1: REQUESTED */}
        {status === 'REQUESTED' && (
          <div className="space-y-4">
            {effectiveRole === 'giver' ? (
              // Giver has authority to ACCEPT
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-start gap-2 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">
                      Bạn (Bên Cho) nhận được yêu cầu từ {receiver?.full_name}:
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      Bạn có đồng ý chia sẻ món đồ này cho {receiver?.full_name} ({receiver?.university}) để bắt đầu cuộc hẹn trao nhận không?
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleAdvance('ACCEPTED')}
                    disabled={isUpdating}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#0F5B4B] text-white font-bold text-sm hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
                  >
                    ✓ Chấp nhận đề nghị & Tiến hành cuộc hẹn
                  </button>
                  <button
                    onClick={() => handleAdvance('CANCELLED')}
                    disabled={isUpdating}
                    className="py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Từ chối yêu cầu
                  </button>
                </div>
              </div>
            ) : (
              // Receiver CANNOT accept their own request
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">
                      Bạn (Bên Nhận) đã gửi yêu cầu nhận món đồ này
                    </div>
                    <div className="text-xs text-amber-800 mt-1">
                      Yêu cầu đang chờ <strong>{giver?.full_name} (Bên Cho)</strong> duyệt và chấp thuận. Bạn không thể tự duyệt thay cho chủ bài đăng.
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Đang chờ {giver?.full_name} chấp thuận yêu cầu...
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ACCEPTED */}
        {status === 'ACCEPTED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#EAF7F2] border border-[#A7E2CB] text-slate-800 space-y-2">
              <div className="font-bold text-sm text-[#0F5B4B]">
                ✓ Đề nghị trao đổi đã được chấp thuận!
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hai bên hãy mang đồ đến điểm hẹn: <strong>{transaction.pickup_location || 'Cổng ĐH Bách Khoa Đà Nẵng'}</strong>.
              </p>
            </div>

            {effectiveRole === 'giver' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Khi bạn mang đồ đi đến điểm hẹn, nhấn nút bên dưới để chuyển sang bước gặp mặt:
                </p>
                <button
                  onClick={() => handleAdvance('HANDED_OVER')}
                  disabled={isUpdating}
                  className="w-full py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm sm:text-base hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
                >
                  🚚 Tôi đã mang đồ đi trao (Bước 3: Đang chờ trao)
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Bạn đang trên đường đến điểm hẹn gặp {giver?.full_name}:
                </p>
                <button
                  onClick={() => handleAdvance('HANDED_OVER')}
                  disabled={isUpdating}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 text-white font-bold text-sm sm:text-base hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
                >
                  🏃 Tôi đang đến điểm hẹn gặp {giver?.full_name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: HANDED_OVER (Two-Way Confirmation per user request) */}
        {status === 'HANDED_OVER' && !isCompleted && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#0F5B4B] shrink-0 mt-0.5" />
              <div>
                <strong>Quy trình xác nhận 2 chiều (Chống gian lận):</strong>
                <p className="mt-0.5 text-slate-600">
                  Cả Bên Cho và Bên Nhận phải <strong>tự xác nhận phần của mình</strong>. Người này không thể bấm thay cho người kia. Khi cả hai bên đều bấm xác nhận, giao dịch mới chính thức hoàn tất.
                </p>
              </div>
            </div>

            {/* 2-Way Confirmation Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Bên Cho (Giver) Confirmation */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                transaction.giver_confirmed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    1. Xác nhận Bên Cho (Người A)
                  </span>
                  {transaction.giver_confirmed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" /> Đã xác nhận
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Chưa xác nhận
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  {transaction.giver_confirmed ? (
                    <div className="text-emerald-800 font-medium">
                      ✓ {giver?.full_name} đã xác nhận bàn giao đồ tận tay cho {receiver?.full_name}.
                    </div>
                  ) : (
                    <div>
                      {giver?.full_name} cần xác nhận đã trao đồ tận tay cho {receiver?.full_name}.
                    </div>
                  )}
                </div>

                {/* Giver Action Button */}
                {!transaction.giver_confirmed && (
                  <div>
                    {effectiveRole === 'giver' ? (
                      <button
                        onClick={() => handleConfirmRole('giver')}
                        disabled={isUpdating}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0F5B4B] text-white font-bold text-xs hover:bg-[#0A3F34] shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        ✓ Tôi ({giver?.full_name}) xác nhận ĐÃ BÀN GIAO đồ
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Chỉ {giver?.full_name} mới được bấm nút này
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card 2: Bên Nhận (Receiver) Confirmation */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                transaction.receiver_confirmed
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    2. Xác nhận Bên Nhận (Người B)
                  </span>
                  {transaction.receiver_confirmed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" /> Đã xác nhận
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Chưa xác nhận
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  {transaction.receiver_confirmed ? (
                    <div className="text-emerald-800 font-medium">
                      ✓ {receiver?.full_name} đã xác nhận nhận đồ và kiểm tra đúng mô tả.
                    </div>
                  ) : (
                    <div>
                      {receiver?.full_name} cần xác nhận đã nhận đồ từ {giver?.full_name}.
                    </div>
                  )}
                </div>

                {/* Receiver Action Button */}
                {!transaction.receiver_confirmed && (
                  <div>
                    {effectiveRole === 'receiver' ? (
                      <button
                        onClick={() => handleConfirmRole('receiver')}
                        disabled={isUpdating}
                        className="w-full py-2.5 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        ✓ Tôi ({receiver?.full_name}) xác nhận ĐÃ NHẬN đồ
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Chỉ {receiver?.full_name} mới được bấm nút này
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Overall Status Banner */}
            <div className="pt-2">
              {transaction.giver_confirmed && transaction.receiver_confirmed ? (
                <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-center font-bold text-sm">
                  🎉 Cả hai bên đã xác nhận hoàn tất! Đang chuyển tiếp sang trang đánh giá...
                </div>
              ) : transaction.giver_confirmed || transaction.receiver_confirmed ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>
                    Đã có 1 bên xác nhận. Đang chờ đối tác còn lại bấm xác nhận để hoàn tất toàn bộ giao dịch.
                  </span>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500">
                  Vui lòng gặp mặt tại điểm hẹn, kiểm tra đồ dùng và cả hai bên cùng bấm xác nhận.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETED */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="font-extrabold text-emerald-950 text-base sm:text-lg">
              🎉 Giao dịch trao nhận đã hoàn tất thành công!
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Cả Bên Cho và Bên Nhận đều đã hoàn tất xác nhận và được cộng điểm uy tín đóng góp vào tài khoản.
            </p>
            <div className="pt-1">
              <Link
                href={`/trades/${transaction.id}/completed`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20"
              >
                Xem trang chúc mừng & đánh giá (+20 điểm) <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
