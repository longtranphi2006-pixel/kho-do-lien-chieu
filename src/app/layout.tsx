import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Kho Đồ Liên Chiểu | Mạng Lưới Chia Sẻ & Đổi Đồ Sinh Viên P2P Đà Nẵng',
  description:
    'Nền tảng chia sẻ đồ dùng miễn phí và đổi đồ P2P phi thương mại dành cho sinh viên ĐHBK, ĐH Sư Phạm và cư dân quận Liên Chiểu, TP. Đà Nẵng.',
  keywords: [
    'Kho đồ Liên Chiểu',
    'Chia sẻ đồ dùng Đà Nẵng',
    'Đổi đồ sinh viên Bách Khoa',
    'Cho đồ cũ Hòa Khánh',
    'P2P bartering Da Nang',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 antialiased selection:bg-[#EAF7F2] selection:text-[#0F5B4B]">
        <AppProvider>
          <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 pb-mobile-nav">{children}</main>
          <Footer />
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
