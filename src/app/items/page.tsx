'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { CATEGORIES, LOCATIONS, CONDITIONS } from '@/lib/constants';
import { ItemCard } from '@/components/common/ItemCard';
import { Search, SlidersHorizontal, Gift, ArrowLeftRight, X, ArrowUpDown } from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCat = searchParams.get('category') || 'Tất cả';

  const { items } = useAppStore();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCat);
  const [location, setLocation] = useState('Toàn quận Liên Chiểu');
  const [purpose, setPurpose] = useState<'ALL' | 'FREE' | 'EXCHANGE'>('ALL');
  const [condition, setCondition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (item.status === 'REJECTED' || item.status === 'PENDING_ADMIN' || item.status === 'COMPLETED' || item.status === 'HIDDEN') return false;
        if (category !== 'Tất cả' && item.category !== category) return false;
        if (purpose !== 'ALL' && item.purpose !== purpose) return false;
        if (condition !== 'ALL' && item.condition !== condition) return false;
        if (location !== 'Toàn quận Liên Chiểu') {
          const cleanLoc = location.toLowerCase().replace('phường ', '').replace(/\(.*?\)/g, '').trim();
          const itemLoc = item.location.toLowerCase();
          if (!itemLoc.includes(cleanLoc) && !cleanLoc.includes(itemLoc)) {
            return false;
          }
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const aTitle = a.title.toLowerCase().includes(q);
          const bTitle = b.title.toLowerCase().includes(q);
          if (aTitle && !bTitle) return -1;
          if (!aTitle && bTitle) return 1;
        }
        if (sortBy === 'popular') {
          return b.favorites_count - a.favorites_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [items, category, purpose, condition, location, search, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setCategory('Tất cả');
    setLocation('Toàn quận Liên Chiểu');
    setPurpose('ALL');
    setCondition('ALL');
    setSortBy('newest');
  };

  const hasActiveFilters =
    search ||
    category !== 'Tất cả' ||
    location !== 'Toàn quận Liên Chiểu' ||
    purpose !== 'ALL' ||
    condition !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kho Đồ Cộng Đồng Liên Chiểu
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Khám phá sách vở, giáo trình Bách Khoa, quạt điện, và vật dụng học tập sinh viên.
          </p>
        </div>

        {/* Purpose pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPurpose('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              purpose === 'ALL'
                ? 'bg-[#0F5B4B] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setPurpose('FREE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              purpose === 'FREE'
                ? 'bg-[#0F5B4B] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            Cho miễn phí
          </button>
          <button
            onClick={() => setPurpose('EXCHANGE')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              purpose === 'EXCHANGE'
                ? 'bg-[#0F5B4B] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Đổi đồ
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Từ khóa tìm kiếm..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Tất cả' ? 'Mọi danh mục' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white truncate"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="popular">Yêu thích nhiều nhất</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Đang lọc: {filteredItems.length} kết quả</span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Không tìm thấy món đồ phù hợp</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Thử thay đổi từ khóa hoặc bộ lọc khu vực để tìm kiếm các món đồ khác.
          </p>
          <button
            onClick={clearFilters}
            className="px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-sm font-semibold hover:bg-[#0A3F34]"
          >
            Xem toàn bộ kho đồ
          </button>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải kho đồ...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
