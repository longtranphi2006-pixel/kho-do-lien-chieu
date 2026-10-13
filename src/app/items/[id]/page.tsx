'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
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

  const { getItemById, currentUser, createTradeRequest, favorites, toggleFavorite } = useAppStore();
  const item = getItemById(itemId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(item?.location || 'Cổng ĐH Bách Khoa (54 Nguyễn Lương Bằng)');
  const [scheduledDate, setScheduledDate] = useState('2026-10-14T17:00');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isDonorCurrent = currentUser.id === item.user_id;

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
              {donor?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={donor.avatar_url}
                  alt={donor.full_name}
                  className="w-12 h-12 rounded-full object-cover border border-[#0F5B4B]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#EAF7F2] text-[#0F5B4B] font-bold flex items-center justify-center">
                  {donor?.full_name?.charAt(0) || 'U'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-base truncate">
                    {donor?.full_name}
                  </h4>
                  {donor?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5B4B] bg-[#EAF7F2] px-2 py-0.5 rounded-full border border-[#A7E2CB]">
                      <CheckCircle2 className="w-3 h-3 text-[#0F5B4B]" />
                      Đã xác thực
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {donor?.university} {donor?.department ? `• ${donor.department}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">{donor?.items_given_count || 0}</div>
                <div className="text-slate-500 text-[10px]">Món đã trao</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">{donor?.completed_trades_count || 0}</div>
                <div className="text-slate-500 text-[10px]">GD hoàn tất</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="font-bold text-[#0F5B4B] text-sm">⭐ {donor?.reputation_score || 100}</div>
                <div className="text-slate-500 text-[10px]">Điểm uy tín</div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2">
            {isDonorCurrent ? (
              <div className="p-3.5 rounded-xl bg-slate-100 text-slate-600 text-center text-sm font-medium">
                Đây là món đồ bạn đang đăng trao tặng. Bạn có thể theo dõi người nhận trong mục Trao đổi.
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa điểm hẹn gặp giao nhận
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Ví dụ: Cổng 1 ĐH Bách Khoa (54 Nguyễn Lương Bằng)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20"
                />
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
