-- ==============================================================================
-- KHO ĐỒ LIÊN CHIỂU - SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Location: Hòa Khánh, Liên Chiểu, Đà Nẵng
-- Architecture: Supabase Cloud Serverless + Realtime + Web Sync
-- ==============================================================================

-- 0. IF TABLES ALREADY EXIST: DROP RESTRICTIVE FOREIGN KEY CONSTRAINTS
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_giver_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_receiver_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_item_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_transaction_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 1. DROP EXISTING CONSTRAINTS IF ANY TO ALLOW CLEAN RE-RUN (OPTIONAL)
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
-- DROP TABLE IF EXISTS public.items CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLE: PROFILES (User identity & university verification)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  university TEXT DEFAULT 'Trường Đại học Bách khoa - ĐHĐN',
  department TEXT,
  student_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  reputation_score INT DEFAULT 0,
  items_given_count INT DEFAULT 0,
  completed_trades_count INT DEFAULT 0,
  role TEXT DEFAULT 'user',
  is_locked BOOLEAN DEFAULT false,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE: ITEMS (Community sharing & bartering listings)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'GOOD',
  purpose TEXT NOT NULL DEFAULT 'FREE',
  location TEXT NOT NULL DEFAULT 'Phường Hòa Khánh Bắc, Liên Chiểu',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'ACTIVE',
  ai_moderation_reason TEXT,
  ai_moderation_score INT DEFAULT 95,
  favorites_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE: TRANSACTIONS (P2P 4-Step Stepper Handover Tracker)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  giver_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  status TEXT DEFAULT 'REQUESTED',
  scheduled_date TIMESTAMPTZ,
  pickup_location TEXT,
  note TEXT,
  giver_confirmed BOOLEAN DEFAULT false,
  receiver_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 5. TABLE: REVIEWS (1-5 Star community ratings & feedback)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE: NOTIFICATIONS (In-app alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_link TEXT,
  type TEXT DEFAULT 'trade',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ENABLE ROW LEVEL SECURITY & OPEN CLIENT ACCESS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read & write via client anon key
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public write profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Public delete profiles" ON public.profiles FOR DELETE USING (true);

CREATE POLICY "Public read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Public write items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Public delete items" ON public.items FOR DELETE USING (true);

CREATE POLICY "Public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public write transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public write reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Public delete reviews" ON public.reviews FOR DELETE USING (true);

CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public write notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Public delete notifications" ON public.notifications FOR DELETE USING (true);

-- 8. ENABLE REALTIME ON ITEMS AND TRANSACTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. SEED INITIAL USERS (Including Admin & Community Students)
INSERT INTO public.profiles (id, full_name, avatar_url, phone, email, university, department, student_id, is_verified, reputation_score, items_given_count, completed_trades_count, role) VALUES
('usr-admin-bql', 'Ban Quản Trị Liên Chiểu', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', '0905999888', 'admin@khodolienchieu.vn', 'Quản trị viên Hệ thống', 'BQL Ký túc xá & Dự án', 'ADMIN-01', true, 999, 50, 80, 'admin'),
('usr-an-bachkhoa', 'Trần Văn An', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80', '0905123456', 'an.tran@dut.udn.vn', 'Trường Đại học Bách khoa - ĐHĐN', 'Khoa Công nghệ Thông tin', '102210123', true, 120, 14, 18, 'user'),
('usr-mai-supham', 'Nguyễn Thị Mai', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', '0914234567', 'mai.nguyen@ued.udn.vn', 'Trường Đại học Sư phạm - ĐHĐN', 'Khoa Ngữ Văn', '201210456', true, 85, 8, 12, 'user'),
('usr-quan-it', 'Lê Hoàng Quân', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80', '0987345678', 'quan.le@fpt.edu.vn', 'Đại học FPT Đà Nẵng', 'Kỹ thuật Phần mềm', 'DE170089', true, 95, 6, 9, 'user'),
('usr-linh-kinhte', 'Phạm Diệu Linh', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', '0935456789', 'linh.pham@due.edu.vn', 'Trường Đại học Kinh tế - ĐHĐN', 'Khoa Quản trị Kinh doanh', '302210789', false, 30, 2, 4, 'user')
ON CONFLICT (id) DO NOTHING;

-- 10. SEED INITIAL ITEMS
INSERT INTO public.items (id, user_id, title, description, category, condition, purpose, location, images, status, ai_moderation_reason, ai_moderation_score, favorites_count) VALUES
('item-01', 'usr-an-bachkhoa', 'Bàn học gấp gọn chân sắt cho phòng trọ', 'Bàn học gấp gọn kích thước 60x40cm, mặt gỗ ép MDF phủ melamin chống nước, chân sắt sơn tĩnh điện chắc chắn. Mình sắp tốt nghiệp dọn trọ nên tặng lại cho bạn sinh viên nào cần.', 'Đồ nội thất & Phòng trọ', 'GOOD', 'FREE', 'Cổng 1 Trường Đại học Bách khoa (54 Nguyễn Lương Bằng)', ARRAY['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'], 'ACTIVE', 'Nội thất sinh viên hợp lệ.', 98, 24),
('item-02', 'usr-mai-supham', 'Nồi cơm điện Midea 1.2L còn dùng tốt', 'Nồi cơm điện cơ dung tích 1.2L phù hợp cho 1-2 người nấu. Nồi nấu cơm nhanh, lòng nồi chống dính có xước dăm nhỏ nhưng không dính cơm.', 'Đồ gia dụng & Bếp', 'GOOD', 'FREE', 'Khu Ký túc xá phía Tây, Hòa Khánh Nam', ARRAY['https://images.unsplash.com/photo-1584990347449-39958bc5e24c?auto=format&fit=crop&w=800&q=80'], 'ACTIVE', 'Đồ gia dụng an toàn.', 97, 18),
('item-03', 'usr-quan-it', 'Bộ giáo trình Giải tích 1 & 2 (ĐHBK Đà Nẵng)', 'Bộ 2 cuốn giáo trình Giải tích 1 và 2 của ĐHBK, sách còn nguyên bìa và sạch sẽ. Muốn đổi lấy giáo trình Cấu trúc dữ liệu và giải thuật hoặc sách tiếng Anh TOEIC.', 'Sách & Giáo trình', 'LIKE_NEW', 'EXCHANGE', 'Khu trọ đường Ngô Sĩ Liên, Hòa Khánh Bắc', ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'], 'IN_PROGRESS', 'Tài liệu học tập hợp lệ.', 99, 8),
('item-04', 'usr-linh-kinhte', 'Quạt đứng Senko lỡ có tuốt năng xoay', 'Quạt lỡ Senko 3 tốc độ gió, chạy êm, gió mát, tuốt năng xoay bình thường. Tặng lại cho bạn nào phòng trọ nóng.', 'Đồ gia dụng & Bếp', 'GOOD', 'FREE', 'Chợ Hòa Khánh (Đường Âu Cơ)', ARRAY['https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80'], 'ACTIVE', 'Thiết bị điện gia dụng cơ bản.', 96, 29),
('item-05', 'usr-an-bachkhoa', 'Giáo trình Lập trình C++ & Cấu trúc Dữ liệu', 'Tặng giáo trình Lập trình căn bản C++ kèm slide in sẵn của thầy Bách Khoa Đà Nẵng. Rất hữu ích cho các bạn sinh viên khối ngành kỹ thuật.', 'Sách & Giáo trình', 'GOOD', 'FREE', 'Phường Hòa Khánh Nam', ARRAY['https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80'], 'ACTIVE', 'Tài liệu học tập sinh viên phù hợp.', 99, 9)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED INITIAL TRANSACTIONS
INSERT INTO public.transactions (id, item_id, giver_id, receiver_id, status, scheduled_date, pickup_location, note, giver_confirmed, receiver_confirmed) VALUES
('tr-001', 'item-03', 'usr-quan-it', 'usr-an-bachkhoa', 'HANDED_OVER', '2026-10-13T16:30:00Z', 'Cổng 1 Trường Đại học Bách khoa (54 Nguyễn Lương Bằng)', 'Hẹn ở ghế đá cổng chính nhé.', false, false)
ON CONFLICT (id) DO NOTHING;
