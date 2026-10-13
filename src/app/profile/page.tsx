'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, items, transactions, reviews } = useAppStore();
  const [activeTab, setActiveTab] = useState<'items' | 'trades' | 'reviews'>('items');

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
        <div className="absolute top-0 left-0 right-0 h-3 bg-linear-to-r from-[#0F5B4B] to-emerald-500" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
          {/* Avatar */}
          <div className="relative">
            {currentUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#0F5B4B] shadow-md shadow-[#0F5B4B]/10"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#EAF7F2] text-[#0F5B4B] font-bold text-2xl flex items-center justify-center">
                {currentUser.full_name.charAt(0)}
              </div>
            )}
            {currentUser.is_verified && (
              <div
                className="absolute -bottom-2 -right-2 bg-[#0F5B4B] text-white p-1.5 rounded-full shadow-md"
                title="Đã xác thực sinh viên/cư dân"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentUser.full_name}
              </h1>

              {/* Verified Pill */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã xác thực
              </span>

              {/* Active Member Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Thành viên tích cực
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

          {/* New Item Post Action */}
          <Link
            href="/items/new"
            className="sm:self-center px-4 py-2.5 rounded-full bg-[#0F5B4B] text-white text-xs sm:text-sm font-bold hover:bg-[#0A3F34] shadow-sm flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            + Đăng đồ mới
          </Link>
        </div>

        {/* Stats Counter (Per Prompt Specification) */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-[#0F5B4B]">
              {currentUser.items_given_count}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Món đã trao
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
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="text-xs text-slate-500 font-medium">
                  Gửi bởi bạn cùng trao đổi
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Chưa có đánh giá nào được ghi nhận. Hãy hoàn tất một phiên trao nhận để nhận đánh giá đầu tiên!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
