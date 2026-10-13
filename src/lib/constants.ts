export const CATEGORIES = [
  'Tất cả',
  'Sách & Giáo trình',
  'Đồ gia dụng & Bếp',
  'Thiết bị điện tử',
  'Đồ dùng học tập',
  'Quần áo & Phụ kiện',
  'Đồ thể thao & Xe cộ',
  'Nội thất phòng trọ',
  'Khác',
] as const;

export const LOCATIONS = [
  'Toàn quận Liên Chiểu',
  'Phường Hòa Khánh Bắc',
  'Phường Hòa Khánh Nam',
  'Phường Hòa Minh',
  'Phường Hòa Hiệp Bắc',
  'Phường Hòa Hiệp Nam',
  'Cổng 1 ĐH Bách Khoa (54 Nguyễn Lương Bằng)',
  'Cổng 2 ĐH Bách Khoa (đường Ngô Sĩ Liên)',
  'Cổng ĐH Sư Phạm (459 Tôn Đức Thắng)',
  'CĐ Kinh Tế - Kế Hoạch (143 Nguyễn Lương Bằng)',
  'Ký túc xá DMC 579 (P. Hòa Khánh Nam)',
  'Ký túc xá Phía Tây (Khu Công nghệ cao)',
  'Chợ Hòa Khánh (đường Âu Cơ)',
  'Chợ Nam Ô (P. Hòa Hiệp Nam)',
  'Chợ Hòa Mỹ (P. Hòa Minh)',
  'Khu trọ đường Ngô Sĩ Liên (Hòa Khánh Bắc)',
  'Khu trọ đường Phạm Như Xương (Hòa Khánh Nam)',
  'Khu trọ đường Lạc Long Quân / Đoàn Phú Tứ',
  'Bến xe Trung tâm Đà Nẵng (Tôn Đức Thắng)',
  'Quảng trường UBND Quận Liên Chiểu',
] as const;

export const POPULAR_HANDOVER_HUBS = [
  'Cổng 1 ĐH Bách Khoa',
  'Cổng ĐH Sư Phạm',
  'KTX DMC 579',
  'Chợ Hòa Khánh',
  'Khu trọ Ngô Sĩ Liên',
  'Khu trọ Phạm Như Xương',
  'KTX Phía Tây (Khu CNC)',
  'CĐ Kinh Tế - Kế Hoạch',
  'Phường Hòa Khánh Bắc',
  'Phường Hòa Khánh Nam',
  'Phường Hòa Minh',
];

export const CONDITIONS = [
  { value: 'NEW', label: 'Mới 100%', description: 'Chưa qua sử dụng, còn nguyên hộp hoặc tem mác' },
  { value: 'LIKE_NEW', label: 'Còn rất tốt (90-95%)', description: 'Đã dùng vài lần, không trầy xước, hoạt động hoàn hảo' },
  { value: 'GOOD', label: 'Dùng tốt (70-85%)', description: 'Có dấu hiệu sử dụng nhẹ nhưng mọi chức năng đều tốt' },
  { value: 'FAIR', label: 'Cũ nhưng vẫn dùng được', description: 'Hình thức cũ, phù hợp dùng tạm thời' },
] as const;

export const PURPOSES = [
  { value: 'FREE', label: 'Cho miễn phí', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'EXCHANGE', label: 'Đổi đồ', badgeColor: 'bg-teal-100 text-teal-800 border-teal-200' },
] as const;

export const BRAND_COLORS = {
  primary: '#0F5B4B',
  primaryDark: '#0A3F34',
  mint: '#EAF7F2',
  mintBorder: '#A7E2CB',
  warningBg: '#FEF9C3',
  warningBorder: '#CA8A04',
};
