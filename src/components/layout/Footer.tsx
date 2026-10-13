import React from 'react';
import Link from 'next/link';
import { HeartHandshake, ShieldCheck, MapPin, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F5B4B] flex items-center justify-center text-white">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                KHO ĐỒ LIÊN CHIỂU
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Nền tảng chia sẻ và đổi đồ dùng sinh viên P2P phi thương mại tại quận Liên Chiểu, TP. Đà Nẵng.
              Kết nối sinh viên ĐH Bách Khoa, ĐH Sư Phạm, CĐ Kinh Tế - Kế Hoạch và người dân địa phương để kéo dài vòng đời đồ dùng.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              100% Phi thương mại • Không mua bán bằng tiền mặt
            </div>
          </div>

          {/* Hubs in Lien Chieu */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Điểm giao lưu & trao đổi</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                Cổng ĐH Bách Khoa (54 Nguyễn Lương Bằng)
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                Cổng ĐH Sư Phạm (459 Tôn Đức Thắng)
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                Ký túc xá Phía Tây (Khu Công nghệ cao)
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                Ký túc xá DMC 579 Hòa Khánh Nam
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5B4B] shrink-0" />
                Chợ Hòa Khánh & KCN Hòa Khánh
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Liên kết nhanh</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/items" className="hover:text-emerald-400 transition-colors">
                  Kho đồ cộng đồng
                </Link>
              </li>
              <li>
                <Link href="/items/new" className="hover:text-emerald-400 transition-colors">
                  Đăng đồ dùng (+ AI Kiểm duyệt)
                </Link>
              </li>
              <li>
                <Link href="/trades/tr-001" className="hover:text-emerald-400 transition-colors">
                  Quy trình Stepper Trao đổi
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Bảng Quản trị Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 Kho Đồ Liên Chiểu. Dự án hỗ trợ cộng đồng sinh viên Đà Nẵng.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Phát triển với tinh thần sẻ chia</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>tại Hòa Khánh, Liên Chiểu</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
