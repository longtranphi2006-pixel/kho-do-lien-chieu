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
  MessageCircle,
  ArrowLeft,
  Lock,
  User,
  AlertCircle,
  HelpCircle,
  Send,
  XCircle,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { TradeMessage, Transaction } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function TradeStepperContent() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const {
    getTransactionById,
    advanceTradeStatus,
    confirmTradeHandover,
    cancelTrade,
    sendTradeMessage,
    currentUser,
    allUsers,
  } = useAppStore();

  const storeTransaction = getTransactionById(tradeId);
  const [directTransaction, setDirectTransaction] = useState<Transaction | null>(null);
  const [isLoadingDirect, setIsLoadingDirect] = useState(!storeTransaction);

  const [isUpdating, setIsUpdating] = useState(false);
  // Allow user to switch viewing perspective during manual testing if needed
  const [selectedRole, setSelectedRole] = useState<'auto' | 'giver' | 'receiver'>('auto');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Direct Supabase fallback fetch if transaction not found in in-memory store
  useEffect(() => {
    if (storeTransaction) {
      setIsLoadingDirect(false);
      return;
    }

    let isMounted = true;
    const fetchDirect = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        if (isMounted) setIsLoadingDirect(false);
        return;
      }
      try {
        const { data: tData } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', tradeId)
          .maybeSingle();

        if (tData && isMounted) {
          const [itemRes, giverRes, receiverRes] = await Promise.all([
            supabase.from('items').select('*').eq('id', tData.item_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', tData.giver_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', tData.receiver_id).maybeSingle(),
          ]);

          let giver = giverRes.data || undefined;
          if ((!giver || giver.full_name === 'Thành viên Liên Chiểu') && currentUser?.id === tData.giver_id) {
            giver = currentUser;
          }
          let receiver = receiverRes.data || undefined;
          if ((!receiver || receiver.full_name === 'Thành viên Liên Chiểu') && currentUser?.id === tData.receiver_id) {
            receiver = currentUser;
          }

          const fullTx: Transaction = {
            ...tData,
            item: itemRes.data || undefined,
            giver,
            receiver,
          };
          setDirectTransaction(fullTx);
        }
      } catch (err) {
        console.warn('Direct transaction fetch error:', err);
      } finally {
        if (isMounted) setIsLoadingDirect(false);
      }
    };

    fetchDirect();
    return () => {
      isMounted = false;
    };
  }, [tradeId, storeTransaction, currentUser]);

  const transaction = storeTransaction || directTransaction;

  const myUserIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (currentUser) {
      ids.add(currentUser.id);
      allUsers
        .filter(
          (u) =>
            (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (u.full_name && currentUser.full_name && u.full_name === currentUser.full_name && u.full_name !== 'Thành viên Liên Chiểu')
        )
        .forEach((u) => ids.add(u.id));
      if (currentUser.email?.toLowerCase().includes('longtranphi22006') || currentUser.full_name === 'Trần Đức Long') {
        ids.add('usr-oauth-1791897070645');
        ids.add('usr-oauth-1791902102209');
      }
      if (currentUser.email?.toLowerCase().includes('longtranphi2006') || currentUser.full_name?.includes('18.Trần Lê Phi Long')) {
        ids.add('usr-oauth-1791899728239');
      }
    }
    return ids;
  }, [currentUser, allUsers]);

  const item = transaction?.item;
  const giver = transaction?.giver;
  const receiver = transaction?.receiver;
  const status = transaction?.status || 'REQUESTED';

  // Determine effective perspective (Giver vs Receiver)
  const isActuallyGiver = transaction ? myUserIds.has(transaction.giver_id) : false;
  const isActuallyReceiver = transaction ? myUserIds.has(transaction.receiver_id) : false;
  const isParticipant = isActuallyGiver || isActuallyReceiver;

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

  const bothConfirmed = Boolean(transaction?.giver_confirmed && transaction?.receiver_confirmed);
  const isCompleted = status === 'COMPLETED' || bothConfirmed;
  const currentStepIndex = isCompleted ? 3 : getStepIndex(status);

  // Auto-advance trade to COMPLETED if both parties have confirmed
  React.useEffect(() => {
    if (!transaction) return;
    if (bothConfirmed && status !== 'COMPLETED') {
      advanceTradeStatus(transaction.id, 'COMPLETED');
    }
  }, [bothConfirmed, status, transaction?.id, advanceTradeStatus]);

  // Parse chat messages and note from transaction.note
  const { chatMessages, displayNote } = React.useMemo(() => {
    if (!transaction?.note) return { chatMessages: [], displayNote: '' };
    try {
      const parsed = JSON.parse(transaction.note);
      if (typeof parsed === 'object' && parsed !== null) {
        const msgs = Array.isArray(parsed.messages) ? parsed.messages : [];
        const initialNote = parsed.initialNote ? String(parsed.initialNote).trim() : '';
        return { chatMessages: msgs, displayNote: initialNote };
      }
    } catch {}
    // If note is plain text, render it as initial message from receiver
    return {
      chatMessages: [
        {
          id: 'msg-initial',
          sender_id: transaction.receiver_id,
          sender_name: receiver?.full_name || 'Người nhận',
          sender_avatar: receiver?.avatar_url,
          content: transaction.note,
          created_at: transaction.created_at,
        },
      ],
      displayNote: transaction.note.trim(),
    };
  }, [transaction?.note, transaction?.receiver_id, transaction?.created_at, receiver]);

  const handleAdvance = (nextStatus: TradeStatus) => {
    if (!transaction) return;
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
    if (!transaction) return;
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

  // Rule: "chỉ dc hủy trước bước xác nhận của ng kia"
  const otherAlreadyConfirmed = isActuallyGiver
    ? Boolean(transaction?.receiver_confirmed)
    : isActuallyReceiver
    ? Boolean(transaction?.giver_confirmed)
    : Boolean(transaction?.giver_confirmed || transaction?.receiver_confirmed);

  const canCancel =
    Boolean(transaction) &&
    isParticipant &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED' &&
    !otherAlreadyConfirmed;

  const isCancelled = status === 'CANCELLED';

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!transaction || !chatInput.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    try {
      await sendTradeMessage(transaction.id, chatInput.trim());
      setChatInput('');
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!transaction) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelTrade(transaction.id, cancelReason);
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError(err?.message || 'Lỗi khi hủy giao dịch');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoadingDirect && !transaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F5B4B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 font-medium text-sm">Đang tải thông tin phiên trao đổi...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy phiên trao đổi</h2>
        <p className="text-slate-500 text-sm">Mã giao dịch #{tradeId} không tồn tại hoặc đã được chuyển giao.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay về Trang chủ
        </Link>
      </div>
    );
  }

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

      {/* Perspective Simulator Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-300">
              {isParticipant ? 'Tư cách tham gia của bạn:' : 'Trạng thái theo dõi:'}
            </div>
            <div className="font-bold text-emerald-400 text-sm">
              {isParticipant
                ? effectiveRole === 'giver'
                  ? `👤 Bên Cho (Người A) - ${giver?.full_name || 'Chủ đồ'}`
                  : `👤 Bên Nhận (Người B) - ${receiver?.full_name || 'Người xin đồ'}`
                : `🔒 Người xem (Giao dịch giữa ${giver?.full_name || 'Người A'} & ${receiver?.full_name || 'Người B'})`}
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

        {displayNote && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-[#0F5B4B] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Ghi chú hẹn: </span>
              <span>{displayNote}</span>
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

        {/* CANCELLED STATE */}
        {isCancelled && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="font-extrabold text-rose-950 text-base sm:text-lg">
              Phiên trao đổi này đã được hủy
            </div>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              Một trong hai bên đã hủy giao dịch. Món đồ đã được tự động mở lại trên Kho đồ Liên Chiểu để sinh viên khác tiếp tục nhận.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/items"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold hover:bg-[#0A3F34] shadow-sm"
              >
                Khám phá Kho đồ
              </Link>
              <Link
                href="/trades"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50"
              >
                Danh sách trao đổi của tôi
              </Link>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETED */}
        {isCompleted && !isCancelled && (
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

        {/* CANCELLATION FOOTER BAR (chỉ dc hủy trước bước xác nhận của ng kia) */}
        {!isCompleted && !isCancelled && isParticipant && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              {canCancel ? (
                <span>Cần thay đổi lịch hẹn hoặc không thể trao đổi được nữa?</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Đối phương đã bấm xác nhận bàn giao đồ. Không thể hủy giao dịch lúc này.
                </span>
              )}
            </div>

            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Hủy phiên trao đổi
              </button>
            )}
          </div>
        )}
      </div>

      {/* P2P PRIVATE CHAT SECTION (Chỉ giữa 2 người trao đổi với nhau) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
        {/* Chat Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F5B4B] flex items-center justify-center text-white shrink-0 shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Kênh Chat Trực Tiếp P2P
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Riêng tư 2 bên
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isActuallyGiver
                  ? `Nhắn tin trực tiếp với bạn nhận: ${receiver?.full_name || 'Người nhận'}`
                  : `Nhắn tin trực tiếp với chủ món đồ: ${giver?.full_name || 'Người trao tặng'}`}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng trao đổi</span>
          </div>
        </div>

        {/* Chat Body */}
        {isParticipant ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Messages Scroll Area */}
            <div className="h-64 sm:h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
                  <MessageSquare className="w-8 h-8 stroke-[1.5]" />
                  <p className="text-xs">Chưa có tin nhắn nào trong phiên này.</p>
                  <p className="text-[11px] text-slate-400">
                    Hãy gửi lời chào hoặc hẹn địa điểm gặp mặt cụ thể tại đây!
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = myUserIds.has(msg.sender_id);
                  const isGiverMsg = msg.sender_id === transaction.giver_id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-0.5">
                          {msg.sender_avatar ? (
                            <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {(msg.sender_name || 'U').charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[78%] sm:max-w-[65%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                          <span className="font-semibold text-slate-600">
                            {isMine ? 'Bạn' : msg.sender_name || 'Đối tác'}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            {isGiverMsg ? 'Bên Cho' : 'Bên Nhận'}
                          </span>
                          <span>•</span>
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : 'Vừa xong'}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMine
                              ? 'bg-[#0F5B4B] text-white rounded-tr-xs shadow-xs'
                              : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>

                      {isMine && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 overflow-hidden shrink-0 mt-0.5 border border-[#0F5B4B]/30">
                          {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} alt="Tôi" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#0F5B4B]">
                              {(currentUser?.full_name || 'T').charAt(0)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => setChatInput('Mình đã đến điểm hẹn rồi nhé!')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] text-slate-600 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                📍 Đã đến điểm hẹn
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Mình đang mặc áo khoác ở cổng chính.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] text-slate-600 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                👕 Mô tả vị trí / áo
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Khoảng 5-10 phút nữa mình có mặt ạ!')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] text-slate-600 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                ⏳ 5-10 phút nữa đến
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Bạn đến điểm hẹn chưa ạ?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] text-slate-600 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              >
                👋 Bạn đến chưa?
              </button>
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin với đối tác trao đồ..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F5B4B] text-xs sm:text-sm bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMsg}
                className="px-4 py-2.5 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Gửi
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
            <Lock className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="font-semibold text-slate-700">Khung chat riêng tư P2P</div>
            <p>Tính năng trò chuyện chỉ dành riêng cho 2 bên tham gia trong giao dịch này.</p>
          </div>
        )}
      </div>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Xác nhận hủy phiên trao đổi
                </h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Bạn có chắc chắn muốn hủy phiên trao đổi món <strong>"{item?.title}"</strong> không?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                ℹ️ <strong>Lưu ý:</strong> Khi bạn hủy, món đồ sẽ được đưa trở lại Kho Đồ Liên Chiểu ở trạng thái sẵn sàng để các bạn sinh viên khác có thể nhận.
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Lý do hủy (tùy chọn)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Bận lịch học đột xuất, không đến được..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0F5B4B]"
              />
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {cancelError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isCancelling ? 'Đang hủy...' : 'Đồng ý hủy giao dịch'}
              </button>
            </div>
          </div>
        </div>
      )}
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
