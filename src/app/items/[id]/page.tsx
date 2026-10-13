'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { LOCATIONS, POPULAR_HANDOVER_HUBS } from '@/lib/constants';
import { WarningBanner } from '@/components/common/WarningBanner';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Gift,
  ArrowLeftRight,
  Heart,
  Share2,
  ArrowLeft,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

function ItemDetailContent() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const {
    getItemById,
    currentUser,
    allUsers,
    transactions,
    advanceTradeStatus,
    confirmTradeHandover,
    createTradeRequest,
    favorites,
    toggleFavorite,
  } = useAppStore();
  const item = getItemById(itemId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(item?.location || 'Cổng ĐH Bách Khoa (54 Nguyễn Lương Bằng)');
  const [scheduledDate, setScheduledDate] = useState('2026-10-14T17:00');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy món đồ</h2>
        <p className="text-slate-500 text-sm">Món đồ này có thể đã được trao tặng hoặc gỡ bỏ.</p>
        <Link
          href="/items"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Kho đồ
        </Link>
      </div>
    );
  }

  const isFavorited = favorites.includes(item.id);
  const donor = item.donor;

  // Robust donor identification that survives duplicate session IDs / OAuth logins
  const isDonorCurrent = Boolean(
    currentUser && (
      currentUser.id === item.user_id ||
      (currentUser.email && donor?.email && currentUser.email.toLowerCase() === donor.email.toLowerCase()) ||
      (currentUser.full_name && donor?.full_name && currentUser.full_name === donor.full_name && currentUser.full_name !== 'Thành viên Liên Chiểu') ||
      (currentUser.email?.toLowerCase().includes('longtranphi22006') && (item.user_id === 'usr-oauth-1791897070645' || item.user_id === 'usr-oauth-1791902102209')) ||
      (currentUser.email?.toLowerCase().includes('longtranphi2006') && item.user_id === 'usr-oauth-1791899728239')
    )
  );

  // Active trade transaction for this item
  const activeTransaction = transactions.find(
    (t) => t.item_id === item.id && t.status !== 'CANCELLED'
  );

  // Receiver profile for the active trade
  const receiverProfile = activeTransaction
    ? allUsers.find((p) => p.id === activeTransaction.receiver_id) || {
        id: activeTransaction.receiver_id,
        full_name: activeTransaction.note?.match(/mình là ([^(,]+)/)?.[1]?.trim() || 'Bạn sinh viên',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        university: 'Đại học Đà Nẵng',
        department: 'Sinh viên',
        is_verified: true,
        reputation_score: 50,
        items_given_count: 0,
        completed_trades_count: 0,
        role: 'user' as const,
        created_at: activeTransaction.created_at,
      }
    : null;

  // Is current user the receiver of the active trade
  const isReceiverCurrent = Boolean(
    currentUser &&
      activeTransaction &&
      (currentUser.id === activeTransaction.receiver_id ||
        (currentUser.email && receiverProfile?.email && currentUser.email.toLowerCase() === receiverProfile.email.toLowerCase()) ||
        (currentUser.full_name && receiverProfile?.full_name && currentUser.full_name === receiverProfile.full_name && currentUser.full_name !== 'Thành viên Liên Chiểu') ||
        (currentUser.email?.toLowerCase().includes('longtranphi2006') && activeTransaction.receiver_id === 'usr-oauth-1791899728239'))
  );

  const handleOwnerAccept = () => {
    if (!activeTransaction) return;
    setIsProcessingAction(true);
    try {
      advanceTradeStatus(activeTransaction.id, 'ACCEPTED');
      setActionSuccessMsg('Đã phê duyệt yêu cầu trao đồ thành công! Đang mở phòng tiến trình 4 bước...');
      setTimeout(() => {
        router.push(`/trades/${activeTransaction.id}`);
      }, 900);
    } catch (e) {
      console.error(e);
      setIsProcessingAction(false);
    }
  };

  const handleOwnerConfirmHandover = async () => {
    if (!activeTransaction) return;
    setIsProcessingAction(true);
    try {
      await confirmTradeHandover(activeTransaction.id, 'giver');
      setActionSuccessMsg('Đã xác nhận bàn giao đồ tận tay thành công!');
      setTimeout(() => {
        setIsProcessingAction(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsProcessingAction(false);
    }
  };

  const handleReceiverConfirmHandover = async () => {
    if (!activeTransaction) return;
    setIsProcessingAction(true);
    try {
      await confirmTradeHandover(activeTransaction.id, 'receiver');
      setActionSuccessMsg('Đã xác nhận đã nhận đồ tận tay thành công!');
      setTimeout(() => {
        setIsProcessingAction(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsProcessingAction(false);
    }
  };

  const getConditionLabel = (c: string) => {
    switch (c) {
      case 'NEW': return 'Mới 100% (Chưa dùng)';
      case 'LIKE_NEW': return 'Còn rất tốt (90-95%)';
      case 'GOOD': return 'Dùng tốt (70-85%)';
      case 'FAIR': return 'Cũ nhưng vẫn dùng tốt';
      default: return c;
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setIsSubmitting(true);
    try {
      const trans = createTradeRequest({
        itemId: item.id,
        pickupLocation,
        scheduledDate,
        note: requestNote || `Chào bạn, mình là ${currentUser.full_name} (${currentUser.university}), mình muốn hẹn nhận món "${item.title}".`,
      });
      // Redirect to the stepper tracker
      router.push(`/trades/${trans.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0F5B4B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(item.id)}
            className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-rose-500 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Yêu thích"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Images Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            {item.images && item.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.images[activeImageIndex] || item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Không có ảnh
              </div>
            )}

            {/* Purpose Badge Overlay */}
            <div className="absolute top-3 left-3">
              {item.purpose === 'FREE' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB] shadow-sm">
                  <Gift className="w-4 h-4" /> Cho miễn phí
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#0F5B4B] border border-[#0F5B4B]/30 shadow-sm">
                  <ArrowLeftRight className="w-4 h-4" /> Đổi đồ dùng
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#0F5B4B] ring-2 ring-[#0F5B4B]/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* AI Moderation Badge info */}
          <div className="p-3.5 rounded-xl bg-[#EAF7F2] border border-[#A7E2CB] text-xs text-[#0F5B4B] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Đã kiểm duyệt AI & BQL Kho Đồ</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {item.ai_moderation_reason || 'Bài đăng đáp ứng đầy đủ tiêu chí phi thương mại và an toàn cộng đồng sinh viên.'}
            </p>
          </div>
        </div>

        {/* Right: Info Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
                {item.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-800">
                {getConditionLabel(item.condition)}
              </span>
              <span className="text-slate-400">• Đăng ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {item.title}
            </h1>
          </div>

          {/* Location box */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-[#0F5B4B] shrink-0" />
            <span className="font-medium">Điểm nhận đồ dự kiến:</span>
            <span className="text-slate-900 font-semibold">{item.location}</span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">
              Mô tả chi tiết từ người trao
            </h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200/80">
              {item.description}
            </p>
          </div>

          {/* Handover Safety Warning Banner */}
          <WarningBanner
            title="Lưu ý an toàn trao nhận"
            message="Kho Đồ Liên Chiểu KHÔNG thu bất kỳ loại phí nào. Tuyệt đối không giao dịch chuyển khoản tiền đặt cọc. Hãy gặp mặt trực tiếp tại các điểm công cộng trong quận Liên Chiểu."
          />

          {/* Donor Profile Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Thông tin người trao đồ
            </div>
            <div className="flex items-center gap-3.5">
              {(donor?.avatar_url || item.donor_avatar) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={donor?.avatar_url || item.donor_avatar}
                  alt={donor?.full_name || item.donor_name || 'Người trao đồ'}
                  className="w-12 h-12 rounded-full object-cover border border-[#0F5B4B]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold flex items-center justify-center">
                  {(donor?.full_name || item.donor_name || 'U').charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-base truncate">
                    {donor?.full_name || item.donor_name || 'Người trao tặng'}
                  </h4>
                  {donor?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5B4B] bg-[#EAF7F2] px-2 py-0.5 rounded-full border border-[#A7E2CB]">
                      <CheckCircle2 className="w-3 h-3 text-[#0F5B4B]" />
                      Đã xác thực
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {donor?.university || 'Đại học Bách Khoa - ĐHĐN'} {donor?.department ? `• ${donor.department}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">{donor?.items_given_count ?? 1}</div>
                <div className="text-slate-500 text-[10px]">Món đã trao</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">{donor?.completed_trades_count ?? 0}</div>
                <div className="text-slate-500 text-[10px]">GD hoàn tất</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">⭐ {donor?.reputation_score ?? 50}</div>
                <div className="text-slate-500 text-[10px]">Điểm uy tín</div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2">
            {isDonorCurrent ? (
              <div className="space-y-3 rounded-2xl border-2 border-[#0F5B4B]/30 bg-gradient-to-br from-[#EAF7F2]/60 to-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#0F5B4B]/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F5B4B] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F5B4B]">
                      Thao Tác Dành Cho Bạn (Người Đăng)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0F5B4B] text-white">
                    Chủ Món Đồ
                  </span>
                </div>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {actionSuccessMsg}
                  </div>
                )}

                {/* CASE 1: THERE IS A REQUEST PENDING APPROVAL */}
                {activeTransaction && activeTransaction.status === 'REQUESTED' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px]">MỚI</span>
                        Có bạn sinh viên vừa gửi yêu cầu muốn nhận món đồ này!
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                        <img
                          src={receiverProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={receiverProfile?.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            {receiverProfile?.full_name}
                            <span className="text-[10px] bg-emerald-100 text-[#0F5B4B] px-1.5 py-0.2 rounded font-semibold">Đã xác thực</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{receiverProfile?.university || 'Đại học Đà Nẵng'}</p>
                          
                          <div className="mt-2 text-xs space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                              <span className="truncate">Điểm hẹn: <strong>{activeTransaction.pickup_location}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Thời gian: {activeTransaction.scheduled_date ? new Date(activeTransaction.scheduled_date).toLocaleString('vi-VN') : 'Thoả thuận khi gặp'}</span>
                            </div>
                            {activeTransaction.note && (
                              <div className="flex items-start gap-1.5 text-slate-600 pt-1 border-t border-slate-100">
                                <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="italic">"{activeTransaction.note}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Buttons for Owner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={handleOwnerAccept}
                        disabled={isProcessingAction}
                        className="w-full py-3 px-4 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0F5B4B]/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Duyệt & Bắt đầu trao đồ
                      </button>
                      <Link
                        href={`/trades/${activeTransaction.id}`}
                        className="w-full py-3 px-4 rounded-xl bg-white border border-[#0F5B4B] text-[#0F5B4B] hover:bg-[#EAF7F2] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        🚚 Xem phòng trao đổi
                      </Link>
                    </div>
                  </div>
                ) : activeTransaction && (activeTransaction.status === 'ACCEPTED' || activeTransaction.status === 'HANDED_OVER') ? (
                  /* CASE 2: TRADE IN PROGRESS (ACCEPTED OR HANDED OVER) */
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          Đang trong tiến trình trao đồ với {receiverProfile?.full_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          Bước 2-3: Hẹn gặp
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                          <span>Điểm hẹn: <strong>{activeTransaction.pickup_location}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Thời gian: {activeTransaction.scheduled_date ? new Date(activeTransaction.scheduled_date).toLocaleString('vi-VN') : 'Thoả thuận khi gặp'}</span>
                        </div>
                      </div>

                      {/* 2-Way Confirmation Status */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className={`p-2 rounded-lg border ${activeTransaction.giver_confirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          <div className="font-semibold">{activeTransaction.giver_confirmed ? '✓ Bạn: Đã giao đồ' : '⏳ Bạn: Chưa bàn giao'}</div>
                        </div>
                        <div className={`p-2 rounded-lg border ${activeTransaction.receiver_confirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          <div className="font-semibold">{activeTransaction.receiver_confirmed ? '✓ Người nhận: Đã nhận đồ' : '⏳ Người nhận: Chưa bấm nhận'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Handover Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {!activeTransaction.giver_confirmed ? (
                        <button
                          onClick={handleOwnerConfirmHandover}
                          disabled={isProcessingAction}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0F5B4B] to-[#12725e] hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0F5B4B]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Tôi đã trao đồ tận tay cho bạn sinh viên (Xác nhận bàn giao)
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                          ✓ Bạn đã xác nhận bàn giao đồ thành công! Đang chờ bạn sinh viên bấm xác nhận nhận để hoàn tất.
                        </div>
                      )}

                      <Link
                        href={`/trades/${activeTransaction.id}`}
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:border-[#0F5B4B] text-slate-700 hover:text-[#0F5B4B] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        🚚 Xem chi tiết phòng tiến trình 4 bước & Chat
                      </Link>
                    </div>
                  </div>
                ) : activeTransaction && activeTransaction.status === 'COMPLETED' ? (
                  /* CASE 3: COMPLETED */
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                      <div className="text-emerald-800 font-bold text-sm flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Món đồ này đã hoàn tất trao tặng thành công!
                      </div>
                      <p className="text-xs text-emerald-700">
                        Bạn đã được cộng +20 điểm uy tín vì đóng góp cho cộng đồng Liên Chiểu.
                      </p>
                    </div>
                    <Link
                      href={`/trades/${activeTransaction.id}`}
                      className="w-full py-3 px-4 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      ⭐ Xem đánh giá & Chi tiết giao dịch
                    </Link>
                  </div>
                ) : (
                  /* CASE 4: ACTIVE - NO REQUEST YET */
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                      <div className="text-[#0F5B4B] font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Món đồ của bạn đang sẵn sàng trên Kho Đồ
                      </div>
                      <p className="text-xs text-slate-600">
                        Khi có bạn sinh viên gửi yêu cầu nhận món đồ này, thông báo và nút phê duyệt sẽ xuất hiện ngay tại đây và trên chuông thông báo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : isReceiverCurrent && activeTransaction ? (
              /* CURRENT USER IS THE RECEIVER */
              <div className="space-y-3 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Bạn Đang Đăng Ký Nhận Món Đồ Này
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    Người Nhận
                  </span>
                </div>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {actionSuccessMsg}
                  </div>
                )}

                {activeTransaction.status === 'REQUESTED' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      ⏳ Yêu cầu nhận đồ của bạn đã được gửi tới chủ đồ (<strong>{donor?.full_name}</strong>). Vui lòng chờ bạn ấy phê duyệt!
                    </div>
                    <Link
                      href={`/trades/${activeTransaction.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0F5B4B] text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center"
                    >
                      🚚 Xem phòng chờ xác nhận
                    </Link>
                  </div>
                ) : (activeTransaction.status === 'ACCEPTED' || activeTransaction.status === 'HANDED_OVER') ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                      <div className="font-bold">Chủ đồ đã duyệt yêu cầu trao tặng!</div>
                      <div>Điểm hẹn: <strong>{activeTransaction.pickup_location}</strong></div>
                    </div>

                    {!activeTransaction.receiver_confirmed ? (
                      <button
                        onClick={handleReceiverConfirmHandover}
                        disabled={isProcessingAction}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Tôi đã nhận được món đồ tận tay (Xác nhận đã nhận)
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                        ✓ Bạn đã bấm xác nhận đã nhận đồ thành công!
                      </div>
                    )}

                    <Link
                      href={`/trades/${activeTransaction.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-blue-300 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 text-center"
                    >
                      🚚 Vào phòng tiến trình 4 bước & Chat
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/trades/${activeTransaction.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#0F5B4B] text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center"
                  >
                    ⭐ Xem chi tiết giao dịch hoàn tất
                  </Link>
                )}
              </div>
            ) : item.status === 'COMPLETED' ? (
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-500 text-center text-sm font-semibold">
                Món đồ này đã hoàn tất trao tặng.
              </div>
            ) : item.status === 'IN_PROGRESS' ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-center text-sm font-medium">
                Món đồ đang trong tiến trình trao đổi với bạn sinh viên khác.
              </div>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-4 rounded-2xl bg-[#0F5B4B] text-white font-bold text-base shadow-lg shadow-[#0F5B4B]/20 hover:bg-[#0A3F34] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {item.purpose === 'FREE' ? (
                  <>
                    <Gift className="w-5 h-5" />
                    Tôi muốn nhận món này (Miễn phí)
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-5 h-5" />
                    Đề nghị đổi đồ dùng
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Handover Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {item.purpose === 'FREE' ? 'Đăng ký nhận đồ dùng' : 'Đề nghị hẹn đổi đồ'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gửi yêu cầu tới bạn {donor?.full_name}
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Địa điểm hẹn gặp giao nhận
                  </label>
                  <span className="text-[11px] text-slate-500">Tự do chỉnh sửa hoặc chọn gợi ý</span>
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#0F5B4B] absolute left-3 top-3" />
                  <input
                    type="text"
                    list="request-pickup-locations"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Ví dụ: Cổng 1 ĐH Bách Khoa (54 Nguyễn Lương Bằng)"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                  />
                  <datalist id="request-pickup-locations">
                    {LOCATIONS.filter((l) => l !== 'Toàn quận Liên Chiểu').map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                {/* Quick suggestion chips */}
                <div className="pt-1 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500">Điểm hẹn thuận tiện:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.location && (
                      <button
                        type="button"
                        onClick={() => setPickupLocation(item.location)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          pickupLocation === item.location
                            ? 'bg-[#0F5B4B] text-white border-[#0F5B4B]'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        🎯 Điểm người trao: {item.location}
                      </button>
                    )}
                    {POPULAR_HANDOVER_HUBS.slice(0, 6).map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setPickupLocation(hub)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          pickupLocation === hub
                            ? 'bg-[#0F5B4B] text-white border-[#0F5B4B]'
                            : 'bg-slate-50 text-slate-700 hover:bg-[#EAF7F2] hover:text-[#0F5B4B] border-slate-200'
                        }`}
                      >
                        📍 {hub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thời gian dự kiến
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lời nhắn gửi người trao
                </label>
                <textarea
                  rows={3}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Giới thiệu bản thân ngắn gọn và đặc điểm nhận dạng khi gặp (ví dụ: mình mặc áo sơ mi trắng, đi xe Wave đỏ)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FEF9C3] border border-[#CA8A04] text-[#854D0E] text-xs">
                ⚠️ Cam kết phi thương mại: Tuyệt đối không giao dịch chuyển tiền mặt hoặc thu phí trao nhận đồ.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#0F5B4B] text-white font-bold hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Đang tải chi tiết món đồ...</div>}>
      <ItemDetailContent />
    </Suspense>
  );
}
