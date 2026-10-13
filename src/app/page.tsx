'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { CATEGORIES, LOCATIONS } from '@/lib/constants';
import { ItemCard } from '@/components/common/ItemCard';
import { WarningBanner } from '@/components/common/WarningBanner';
import {
  ShieldCheck,
  Recycle,
  HeartHandshake,
  Gift,
  ArrowLeftRight,
  Search,
  Filter,
  Sparkles,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export default function HomePage() {
  const { items, currentUser } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedPurpose, setSelectedPurpose] = useState<'ALL' | 'FREE' | 'EXCHANGE'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('Toàn quận Liên Chiểu');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Only show active and in-progress items on main feed
      if (item.status === 'REJECTED' || item.status === 'PENDING_ADMIN') return false;

      // Category filter
      if (selectedCategory !== 'Tất cả' && item.category !== selectedCategory) {
        return false;
      }

      // Purpose filter
      if (selectedPurpose !== 'ALL' && item.purpose !== selectedPurpose) {
        return false;
      }

      // Location filter
      if (
        selectedLocation !== 'Toàn quận Liên Chiểu' &&
        !item.location.toLowerCase().includes(selectedLocation.toLowerCase().replace('phường ', ''))
      ) {
        return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchLoc = item.location.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    });
  }, [items, selectedCategory, selectedPurpose, selectedLocation, searchKeyword]);

  const freeItemsCount = items.filter((i) => i.purpose === 'FREE' && i.status === 'ACTIVE').length;
  const exchangeItemsCount = items.filter((i) => i.purpose === 'EXCHANGE' && i.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 md:space-y-10 pb-8">
      {/* Top Trust & Guest Banner */}
      <section className="bg-[#EAF7F2] border-b border-[#A7E2CB]/70 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm text-[#0F5B4B]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0F5B4B] shrink-0" />
            <span className="font-medium">
              {currentUser ? (
                <>
                  Xin chào <strong className="font-bold">{currentUser.full_name}</strong> • Tài khoản của bạn được xác thực để bảo đảm an toàn và chỉ sử dụng cho mục đích của Kho Đồ Liên Chiểu.
                </>
              ) : (
                <>
                  Chào mừng bạn đến với <strong className="font-bold">Kho Đồ Liên Chiểu</strong> • Mạng lưới chia sẻ đồ dùng P2P sinh viên & cư dân Hòa Khánh, Đà Nẵng.
                </>
              )}
            </span>
          </div>
          <Link
            href="/auth"
            className="hidden sm:inline-flex shrink-0 font-semibold underline hover:text-[#0A3F34]"
          >
            {currentUser ? 'Đổi tài khoản' : 'Đăng nhập ngay'}
          </Link>
        </div>
      </section>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-linear-to-br from-[#0F5B4B] to-[#0A3F34] text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl shadow-[#0F5B4B]/15">
          {/* Subtle background graphics */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Cộng Đồng Sinh Viên & Cư Dân Liên Chiểu • Đà Nẵng
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-tight">
              Chia sẻ đồ dùng, gắn kết giảng đường
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Mạng lưới trao đổi sách giáo trình, quạt điện, bàn học và đồ dùng sinh viên phi thương mại 100%. Không bán tiền mặt - chỉ cho tặng và trao đổi hỗ trợ nhau.
            </p>

            {/* Quick Action Hero Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href="#feed-section"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-[#0F5B4B] font-bold text-sm sm:text-base shadow-lg hover:bg-emerald-50 active:scale-98 transition-all"
              >
                <Search className="w-4 h-4 text-[#0F5B4B]" />
                Tôi đang cần đồ
              </a>
              <Link
                href="/items/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500/25 border-2 border-emerald-300 text-white font-bold text-sm sm:text-base hover:bg-emerald-500/40 active:scale-98 transition-all"
              >
                <Gift className="w-4 h-4" />
                Tôi muốn cho đồ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights (Per Design Spec) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Người dùng xác thực
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Sinh viên ĐHBK, ĐH Sư Phạm, CĐ Kinh Tế và cư dân được xác thực MSSV/CCCD để bảo đảm an toàn.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center shrink-0">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Kéo dài vòng đời đồ dùng
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Tái sử dụng giáo trình cũ, đồ gia dụng phòng trọ giúp tiết kiệm chi phí và bảo vệ môi trường.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Chia sẻ trong cộng đồng
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                100% Phi thương mại: Không định giá, không chuyển tiền, chỉ có tấm lòng sẻ chia và kết nối bạn bè.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice Reminder */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WarningBanner
          title="Quy tắc an toàn khi gặp mặt giao nhận đồ"
          message="Hẹn gặp tại nơi đông người như Cổng ĐH Bách Khoa, Cổng ĐH Sư Phạm, KTX DMC hoặc thư viện trường vào ban ngày. Kiểm tra đồ dùng trực tiếp và tuyệt đối không chuyển khoản tiền cọc dưới mọi hình thức."
        />
      </section>

      {/* Main Listing Feed */}
      <section id="feed-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kho đồ dùng đang mở
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Tìm thấy {filteredItems.length} món đồ sẵn sàng trao tặng & đổi tại Liên Chiểu
            </p>
          </div>

          {/* Quick Purpose Filter Switch */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl self-start md:self-auto text-xs font-semibold">
            <button
              onClick={() => setSelectedPurpose('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                selectedPurpose === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              onClick={() => setSelectedPurpose('FREE')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                selectedPurpose === 'FREE'
                  ? 'bg-[#0F5B4B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              Cho miễn phí ({freeItemsCount})
            </button>
            <button
              onClick={() => setSelectedPurpose('EXCHANGE')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                selectedPurpose === 'EXCHANGE'
                  ? 'bg-[#0F5B4B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Đổi đồ ({exchangeItemsCount})
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Search Input + Location Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên đồ dùng, môn học hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-[#0F5B4B] absolute left-3.5 top-3 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-hidden focus:border-[#0F5B4B] focus:bg-white cursor-pointer appearance-none truncate"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm font-medium">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F5B4B] text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#EAF7F2] text-[#0F5B4B] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              Chưa tìm thấy món đồ phù hợp
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Không có món đồ nào khớp với bộ lọc hiện tại. Hãy thử chọn danh mục khác hoặc đăng tin tìm kiếm!
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSelectedPurpose('ALL');
                setSelectedLocation('Toàn quận Liên Chiểu');
                setSearchKeyword('');
              }}
              className="px-5 py-2.5 rounded-full bg-[#0F5B4B] text-white text-sm font-semibold hover:bg-[#0A3F34]"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
