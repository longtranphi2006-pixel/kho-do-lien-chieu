'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  CheckCircle2,
  Sparkles,
  Star,
  Heart,
  ArrowRight,
  ShieldCheck,
  Award,
  Home,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function TradeCompletedContent() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const { getTransactionById, submitReview, currentUser } = useAppStore();
  const transaction = getTransactionById(tradeId);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F5B4B', '#A7E2CB', '#CA8A04', '#10B981'],
      });
    } catch {
      // ignore
    }
  }, []);

  const otherPerson =
    transaction?.giver_id === currentUser.id ? transaction?.receiver : transaction?.giver;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const revieweeId =
      transaction.giver_id === currentUser.id ? transaction.receiver_id : transaction.giver_id;

    submitReview({
      transactionId: transaction.id,
      revieweeId,
      rating,
      comment: comment || 'Giao dịch đúng giờ, thân thiện và nhiệt tình hỗ trợ bạn bè!',
    });

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl text-center space-y-5 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-100/50 blur-2xl pointer-events-none" />

        {/* Big Checkmark */}
        <div className="w-20 h-20 rounded-full bg-[#EAF7F2] text-[#0F5B4B] border-4 border-[#A7E2CB] flex items-center justify-center mx-auto shadow-lg shadow-[#0F5B4B]/15 animate-bounce">
          <CheckCircle2 className="w-12 h-12 stroke-[2.3]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Giao dịch hoàn tất thành công
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cảm ơn bạn đã sẻ chia!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            Món đồ đã đến tay bạn sinh viên tại Liên Chiểu. Bạn đã góp phần kéo dài vòng đời đồ dùng và xây dựng cộng đồng gắn kết.
          </p>
        </div>

        {/* Reward Notice (+20 Điểm đóng góp) Per Design Spec */}
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-[#0F5B4B] to-[#0A3F34] text-white flex items-center justify-between gap-4 shadow-md shadow-[#0F5B4B]/20">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                Phần thưởng cộng đồng
              </div>
              <div className="font-extrabold text-lg sm:text-xl text-amber-300">
                +20 Điểm đóng góp
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs">
            Huy hiệu Thành viên tích cực 🌟
          </span>
        </div>

        {/* Review Section */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmitReview} className="pt-4 border-t border-slate-100 space-y-4 text-left">
            <div>
              <h3 className="font-bold text-slate-900 text-base text-center">
                Đánh giá trải nghiệm cùng {otherPerson?.full_name || 'bạn cùng trao đổi'}
              </h3>
              <p className="text-xs text-slate-500 text-center mt-0.5">
                Đánh giá của bạn giúp cộng đồng sinh viên Liên Chiểu thêm văn minh và tin cậy.
              </p>
            </div>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  aria-label={`${star} sao`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lời nhắn gửi bạn cùng trao đổi
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ví dụ: Bạn rất đúng giờ, đồ dùng còn rất mới và hữu ích, cảm ơn bạn nhiều nhé!..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:ring-2 focus:ring-[#0F5B4B]/20 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#0F5B4B] text-white font-bold text-sm sm:text-base hover:bg-[#0A3F34] shadow-md shadow-[#0F5B4B]/20 cursor-pointer"
            >
              Gửi đánh giá cộng đồng ⭐
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-2">
            <div className="font-bold">Đã lưu đánh giá của bạn thành công! 🎉</div>
            <p className="text-xs text-emerald-800">
              Điểm uy tín đã được cập nhật vào hồ sơ thành viên.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </Link>
          <Link
            href="/profile"
            className="flex-1 py-3 rounded-xl bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB] font-semibold text-sm hover:bg-emerald-100 flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" /> Xem hồ sơ & điểm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TradeCompletedPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Đang tải kết quả giao dịch...</div>}>
      <TradeCompletedContent />
    </Suspense>
  );
}
