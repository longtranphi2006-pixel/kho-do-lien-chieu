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
  Users,
} from 'lucide-react';
import { TradeStatus } from '@/types';

interface UnifiedTradeCard {
  id: string;
  itemId: string;
  item: any;
  isGiver: boolean;
  status: TradeStatus;
  activeTradeId?: string;
  partner: {
    id: string;
    full_name: string;
    avatar_url: string;
    university?: string;
  };
  pickupLocation?: string;
  scheduledDate?: string;
  pendingRequesters: Array<{
    id: string;
    full_name: string;
    avatar_url: string;
    university?: string;
  }>;
  totalPendingCount: number;
  myConfirmed: boolean;
  otherConfirmed: boolean;
  isWaitlist: boolean;
}

export default function TradesListPage() {
  const router = useRouter();
  const { transactions, currentUser, allUsers, getItemById } = useAppStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

  // Multi-alias matching for currentUser
  const myUserIds = useMemo(() => {
    const ids = new Set<string>();
    if (currentUser) {
      ids.add(currentUser.id);
      if (currentUser.email && currentUser.email.trim()) {
        const cleanEmail = currentUser.email.trim().toLowerCase();
        allUsers
          .filter((u) => u.email && u.email.trim().toLowerCase() === cleanEmail)
          .forEach((u) => ids.add(u.id));
      }
    }
    return ids;
  }, [currentUser, allUsers]);

  // UNIFIED TRADES: Group by item so each item (đơn hàng) only has 1 progress card
  const unifiedTrades = useMemo<UnifiedTradeCard[]>(() => {
    if (!currentUser) return [];

    const userTransactions = transactions.filter(
      (t) =>
        t.status !== 'CANCELLED' &&
        t.id !== 'tr-001' &&
        t.id !== 'tr-002' &&
        (myUserIds.has(t.giver_id) || myUserIds.has(t.receiver_id))
    );

    const cards: UnifiedTradeCard[] = [];

    // 1. Group Giver items by item_id
    const giverTradesByItem = new Map<string, typeof transactions>();
    // 2. Receiver items
    const receiverTrades: typeof transactions = [];

    userTransactions.forEach((t) => {
      if (myUserIds.has(t.giver_id)) {
        const list = giverTradesByItem.get(t.item_id) || [];
        list.push(t);
        giverTradesByItem.set(t.item_id, list);
      } else if (myUserIds.has(t.receiver_id)) {
        receiverTrades.push(t);
      }
    });

    // Process Giver Items: Each item produces 1 active card (if ongoing or pending) + completed cards
    giverTradesByItem.forEach((itemList, itemId) => {
      const item = getItemById(itemId);

      // Completed transactions for this item
      const completed = itemList.filter((t) => t.status === 'COMPLETED');
      completed.forEach((t) => {
        const partner = allUsers.find((u) => u.id === t.receiver_id) || {
          id: t.receiver_id,
          full_name: 'Bạn sinh viên',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          university: 'Đại học Đà Nẵng',
        };
        cards.push({
          id: t.id,
          itemId,
          item,
          isGiver: true,
          status: 'COMPLETED',
          activeTradeId: t.id,
          partner,
          pickupLocation: t.pickup_location,
          scheduledDate: t.scheduled_date,
          pendingRequesters: [],
          totalPendingCount: 0,
          myConfirmed: true,
          otherConfirmed: true,
          isWaitlist: false,
        });
      });

      // Active or Pending for this item (AT MOST 1 CARD)
      const activeTrade = itemList.find(
        (t) => t.status === 'ACCEPTED' || t.status === 'HANDED_OVER'
      );
      const pendingList = itemList.filter((t) => t.status === 'REQUESTED');

      if (activeTrade) {
        // Owner has chosen someone: 1 active trade session
        const partner = allUsers.find((u) => u.id === activeTrade.receiver_id) || {
          id: activeTrade.receiver_id,
          full_name: 'Bạn sinh viên',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          university: 'Đại học Đà Nẵng',
        };
        const pendingRequesters = pendingList.map((p) => {
          const u = allUsers.find((user) => user.id === p.receiver_id);
          return {
            id: p.receiver_id,
            full_name: u?.full_name || 'Bạn sinh viên',
            avatar_url: u?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            university: u?.university,
          };
        });

        cards.push({
          id: activeTrade.id,
          itemId,
          item,
          isGiver: true,
          status: activeTrade.status,
          activeTradeId: activeTrade.id,
          partner,
          pickupLocation: activeTrade.pickup_location,
          scheduledDate: activeTrade.scheduled_date,
          pendingRequesters,
          totalPendingCount: pendingList.length,
          myConfirmed: Boolean(activeTrade.giver_confirmed),
          otherConfirmed: Boolean(activeTrade.receiver_confirmed),
          isWaitlist: false,
        });
      } else if (pendingList.length > 0) {
        // Multiple or single requests pending, NO trade accepted yet: Exactly 1 card for this item
        const firstReq = pendingList[0];
        const pendingRequesters = pendingList.map((p) => {
          const u = allUsers.find((user) => user.id === p.receiver_id);
          return {
            id: p.receiver_id,
            full_name: u?.full_name || 'Bạn sinh viên',
            avatar_url: u?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            university: u?.university,
          };
        });

        cards.push({
          id: `item-pending-${itemId}`,
          itemId,
          item,
          isGiver: true,
          status: 'REQUESTED',
          activeTradeId: firstReq.id,
          partner: pendingRequesters[0],
          pickupLocation: firstReq.pickup_location,
          scheduledDate: firstReq.scheduled_date,
          pendingRequesters,
          totalPendingCount: pendingList.length,
          myConfirmed: false,
          otherConfirmed: false,
          isWaitlist: false,
        });
      }
    });

    // Process Receiver Trades:
    receiverTrades.forEach((t) => {
      const item = getItemById(t.item_id);
      const partner = allUsers.find((u) => u.id === t.giver_id) || {
        id: t.giver_id,
        full_name: item?.donor_name || 'Người trao tặng',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        university: 'Đại học Đà Nẵng',
      };

      const isOtherActive = transactions.some(
        (other) =>
          other.item_id === t.item_id &&
          other.id !== t.id &&
          (other.status === 'ACCEPTED' || other.status === 'HANDED_OVER')
      );

      cards.push({
        id: t.id,
        itemId: t.item_id,
        item,
        isGiver: false,
        status: t.status,
        activeTradeId: t.id,
        partner,
        pickupLocation: t.pickup_location,
        scheduledDate: t.scheduled_date,
        pendingRequesters: [],
        totalPendingCount: 0,
        myConfirmed: Boolean(t.receiver_confirmed),
        otherConfirmed: Boolean(t.giver_confirmed),
        isWaitlist: t.status === 'REQUESTED' && isOtherActive,
      });
    });

    return cards;
  }, [transactions, currentUser, myUserIds, allUsers, getItemById]);

  const activeTrades = useMemo(
    () => unifiedTrades.filter((t) => t.status !== 'COMPLETED'),
    [unifiedTrades]
  );

  const completedTrades = useMemo(
    () => unifiedTrades.filter((t) => t.status === 'COMPLETED'),
    [unifiedTrades]
  );

  const displayedTrades = useMemo(() => {
    if (activeTab === 'active') return activeTrades;
    if (activeTab === 'completed') return completedTrades;
    return unifiedTrades;
  }, [activeTab, activeTrades, completedTrades, unifiedTrades]);

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
                {activeTrades.length} đơn hàng đang diễn ra
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
              Tất cả ({unifiedTrades.length})
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
                  ? 'Hiện không có đơn hàng nào đang diễn ra'
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
              {displayedTrades.map((card) => {
                const item = card.item;
                const isGiver = card.isGiver;
                const isPendingSelection = isGiver && card.status === 'REQUESTED';

                return (
                  <div
                    key={card.id}
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
                            card.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPendingSelection
                              ? 'bg-amber-100 text-amber-800'
                              : card.isWaitlist
                              ? 'bg-amber-100 text-amber-800'
                              : card.status === 'REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {card.status === 'COMPLETED'
                            ? '✓ Hoàn tất'
                            : isPendingSelection
                            ? `⏳ Chờ bạn chọn người nhận (${card.totalPendingCount})`
                            : card.isWaitlist
                            ? '⏳ Hàng chờ dự phòng'
                            : card.status === 'REQUESTED'
                            ? '⏳ Chờ chủ món phê duyệt'
                            : '🚚 Đang hẹn gặp trao nhận'}
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

                          {/* Subtitle / Partner Info */}
                          {isPendingSelection ? (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                {card.totalPendingCount === 1 ? (
                                  <span>1 bạn đăng ký: <strong>{card.partner.full_name}</strong></span>
                                ) : (
                                  <span>
                                    Có <strong>{card.totalPendingCount} bạn đăng ký</strong>: {card.pendingRequesters.slice(0, 2).map((r) => r.full_name).join(', ')}
                                    {card.totalPendingCount > 2 ? ` và ${card.totalPendingCount - 2} bạn khác` : ''}
                                  </span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {isGiver ? `Trao cho: ${card.partner.full_name}` : `Nhận từ: ${card.partner.full_name}`} • {card.partner.university || 'ĐH Đà Nẵng'}
                              {isGiver && card.totalPendingCount > 0 && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full ml-1 border border-amber-200">
                                  +{card.totalPendingCount} chờ dự phòng
                                </span>
                              )}
                            </p>
                          )}

                          <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                              <span className="truncate">{card.pickupLocation}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{card.scheduledDate ? new Date(card.scheduledDate).toLocaleString('vi-VN') : 'Thoả thuận'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Case 1: Giver with Pending Requesters (Notice Callout) */}
                      {isPendingSelection && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                          <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            Món đồ này đang có <strong>{card.totalPendingCount} bạn sinh viên</strong> đăng ký nhận. Hãy xem hồ sơ, lời nhắn và bấm nút bên dưới để chọn bạn nhận đồ.
                          </div>
                        </div>
                      )}

                      {/* Case 2: Receiver in waitlist */}
                      {!isGiver && card.isWaitlist && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            Chủ món đang hẹn giao với một bạn sinh viên khác. Bạn đang ở <strong>hàng chờ dự phòng</strong> nếu giao dịch đó bị hủy.
                          </div>
                        </div>
                      )}

                      {/* 2-Way Handover Status Pill (Only when trade is active/accepted) */}
                      {card.status !== 'COMPLETED' && !isPendingSelection && !card.isWaitlist && card.status !== 'REQUESTED' && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className={`p-1.5 rounded-lg border text-center ${card.myConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {card.myConfirmed ? '✓ Bạn đã xác nhận' : '⏳ Bạn chưa bấm'}
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center ${card.otherConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {card.otherConfirmed ? '✓ Đối phương đã xác nhận' : '⏳ Đối phương chưa bấm'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 border-t border-slate-100">
                      {isPendingSelection ? (
                        <Link
                          href={`/items/${card.itemId}`}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                        >
                          <Users className="w-4 h-4" />
                          Xem danh sách & Chọn người trao đồ ({card.totalPendingCount} bạn) <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : card.status === 'COMPLETED' ? (
                        <Link
                          href={`/trades/${card.activeTradeId}`}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-[#EAF7F2] text-[#0F5B4B] font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          ⭐ Xem chi tiết giao dịch hoàn tất <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : !isGiver && (card.status === 'REQUESTED' || card.isWaitlist) ? (
                        <Link
                          href={`/items/${card.itemId}`}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-[#EAF7F2] text-[#0F5B4B] font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          Xem chi tiết món đồ & Hàng chờ <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href={`/trades/${card.activeTradeId}`}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0F5B4B] hover:bg-[#0A3F34] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                        >
                          🚚 Vào phòng tiến trình 4 bước <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
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
