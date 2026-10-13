'use client';

import React from 'react';
import Link from 'next/link';
import { Item } from '@/types';
import { useAppStore } from '@/lib/store';
import { Heart, MapPin, CheckCircle, Gift, ArrowLeftRight, Clock } from 'lucide-react';
import { Badge } from '@/components/common/Badge';

interface ItemCardProps {
  item: Item;
  showAdminActions?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, showAdminActions = false }) => {
  const { favorites, toggleFavorite, allUsers } = useAppStore();
  const isFavorited = favorites.includes(item.id);
  const matchedUser = allUsers.find((u) => u.id === item.user_id);
  const donor =
    item.donor && item.donor.full_name !== 'Thành viên Liên Chiểu'
      ? item.donor
      : matchedUser && matchedUser.full_name !== 'Thành viên Liên Chiểu'
      ? matchedUser
      : item.donor || matchedUser;
  const donorName =
    (donor?.full_name && donor.full_name !== 'Thành viên Liên Chiểu' ? donor.full_name : item.donor_name) ||
    donor?.full_name ||
    'Người dùng';
  const donorAvatar = donor?.avatar_url || item.donor_avatar;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'NEW': return 'Mới 100%';
      case 'LIKE_NEW': return 'Còn rất tốt';
      case 'GOOD': return 'Dùng tốt';
      case 'FAIR': return 'Cũ còn dùng';
      default: return cond;
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <Link href={`/items/${item.id}`} className="block relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {item.images && item.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Không có ảnh
          </div>
        )}

        {/* Purpose Tag Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {item.purpose === 'FREE' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB] shadow-xs backdrop-blur-xs">
              <Gift className="w-3.5 h-3.5" />
              Cho miễn phí
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#0F5B4B] border border-[#0F5B4B]/30 shadow-xs backdrop-blur-xs">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Đổi đồ
            </span>
          )}

          {item.status === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              <Clock className="w-3 h-3" />
              Đang trao đổi
            </span>
          )}

          {item.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
              Đã trao xong
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label="Yêu thích món đồ"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs text-slate-600 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
            }`}
          />
        </button>

        {/* Multiple photos indicator */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
            +{item.images.length - 1} ảnh
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Category & Condition */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-emerald-800/80 bg-emerald-50 px-2 py-0.5 rounded-md">
            {item.category}
          </span>
          <span className="text-slate-500 text-[11px]">
            {getConditionLabel(item.condition)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/items/${item.id}`} className="group-hover:text-[#0F5B4B] transition-colors">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>
        </Link>

        {/* Location Tag */}
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3 mt-auto">
          <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>

        {/* Donor footer */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {donorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={donorAvatar}
                alt={donorName}
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#EAF7F2] text-[#0F5B4B] text-[10px] font-bold flex items-center justify-center shrink-0">
                {donorName.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-xs text-slate-700 font-medium truncate">
              {donorName}
            </span>
            {donor?.is_verified && (
              <span title="Đã xác thực sinh viên/cư dân">
                <CheckCircle className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>{item.favorites_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
