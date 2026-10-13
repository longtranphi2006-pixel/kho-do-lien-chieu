'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Gift,
  ArrowLeftRight,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
  Inbox,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function TradesListPage() {
  const router = useRouter();
  const { transactions, currentUser, allUsers, getItemById } = useAppStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

  // Multi-alias matching for currentUser
  const myUserIds = useMemo(() => {
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

  // Only get transactions belonging to the current user (as giver or receiver)
  const myTrades = useMemo(() => {
    if (!currentUser) return [];
    return transactions.filter(
      (t) =>
        t.status !== 'CANCELLED' &&
        t.id !== 'tr-001' &&
        t.id !== 'tr-002' &&
        (myUserIds.has(t.giver_id) || myUserIds.has(t.receiver_id))
    );
  }, [transactions, currentUser, myUserIds]);

  const activeTrades = useMemo(
    () => myTrades.filter((t) => t.status !== 'COMPLETED'),
    [myTrades]
  );

  const completedTrades = useMemo(
    () => myTrades.filter((t) => t.status === 'COMPLETED'),
    [myTrades]
  );

  const displayedTrades = useMemo(() => {
    if (activeTab === 'active') return activeTrades;
    if (activeTab === 'completed') return completedTrades;
    return myTrades;
  }, [activeTab, activeTrades, completedTrades, myTrades]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tiến Trình Trao Đổi
            </h1>
            {activeTrades.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0F5B4B] text-xs font-bold border border-emerald-200">
                {activeTrades.length} đang diễn ra
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi quy trình giao nhận 4 bước P2P và xác nhận bàn giao đồ tận tay.
          </p>
        </div>

        <Link
          href="/items"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F5B4B] text-white hover:bg-[#0A3F34] font-semibold text-xs sm:text-sm shadow-sm transition-all"
        >
          <Gift className="w-4 h-4" /> Khám phá Kho đồ
        </Link>
      </div>

      {!currentUser ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-[#0F5B4B] flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Vui lòng đăng nhập để xem tiến trình trao đổi của bạn
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Đăng nhập bằng tài khoản Google để theo dõi các đơn hẹn gặp nhận đồ và món đồ bạn đăng trao tặng.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0F5B4B] text-white font-bold text-sm shadow-md hover:bg-[#0A3F34] transition-all"
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-[#0F5B4B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đang diễn ra ({activeTrades.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-[#0F5B4B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đã hoàn tất ({completedTrades.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0F5B4B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất cả ({myTrades.length})
            </button>
          </div>

          {/* List of Trades */}
          {displayedTrades.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-700">
                {activeTab === 'active'
                  ? 'Hiện không có giao dịch nào đang diễn ra'
                  : activeTab === 'completed'
                  ? 'Chưa có giao dịch nào hoàn tất'
                  : 'Bạn chưa có phiên trao đổi nào'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi bạn gửi yêu cầu nhận đồ hoặc có sinh viên đăng ký nhận món đồ bạn đăng, tiến trình sẽ hiển thị trực tiếp tại đây.
              </p>
              <div className="pt-2">
                <Link
                  href="/items"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#EAF7F2] text-[#0F5B4B] hover:bg-[#0F5B4B] hover:text-white font-bold text-xs transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Tìm đồ dùng cần thiết ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTrades.map((t) => {
                const item = getItemById(t.item_id);
                const isGiver = myUserIds.has(t.giver_id);
                const partnerId = isGiver ? t.receiver_id : t.giver_id;
                const partner = allUsers.find((u) => u.id === partnerId) || {
                  id: partnerId,
                  full_name: isGiver ? 'Bạn sinh viên' : item?.donor_name || 'Người trao tặng',
                  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  university: 'Đại học Đà Nẵng',
                };

                const myConfirmed = isGiver ? t.giver_confirmed : t.receiver_confirmed;
                const otherConfirmed = isGiver ? t.receiver_confirmed : t.giver_confirmed;

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#0F5B4B]/40 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Role & Status Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isGiver
                              ? 'bg-emerald-50 text-[#0F5B4B] border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isGiver ? '🎁 Bạn là Bên Cho' : '📦 Bạn là Bên Nhận'}
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {t.status === 'COMPLETED'
                            ? '✓ Hoàn tất'
                            : t.status === 'REQUESTED'
                            ? '⏳ Chờ phê duyệt'
                            : '🚚 Đang hẹn gặp'}
                        </span>
                      </div>

                      {/* Item Preview */}
                      <div className="flex items-start gap-3 pt-1">
                        <img
                          src={item?.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80'}
                          alt={item?.title || 'Món đồ'}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                            {item?.title || 'Món đồ trao đổi'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {isGiver ? `Tới: ${partner.full_name}` : `Từ: ${partner.full_name}`} • {partner.university || 'ĐH Đà Nẵng'}
                          </p>

                          <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                              <span className="truncate">{t.pickup_location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{t.scheduled_date ? new Date(t.scheduled_date).toLocaleString('vi-VN') : 'Thoả thuận'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2-Way Handover Status Pill */}
                      {t.status !== 'COMPLETED' && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className={`p-1.5 rounded-lg border text-center ${myConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {myConfirmed ? '✓ Bạn đã xác nhận' : '⏳ Bạn chưa bấm'}
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center ${otherConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {otherConfirmed ? '✓ Đối phương đã xác nhận' : '⏳ Đối phương chưa bấm'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={`/trades/${t.id}`}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                      >
                        🚚 Vào phòng tiến trình 4 bước <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
