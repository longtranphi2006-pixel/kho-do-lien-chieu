# HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH 24/7 "KHO ĐỒ LIÊN CHIỂU" (ZERO-CODE-KNOWLEDGE CLOUD DEPLOYMENT)

Hệ thống được thiết kế theo kiến trúc **Cloud Serverless 24/7**, không yêu cầu cài đặt phần mềm trên máy tính quản trị viên, tự động mở rộng theo nhu cầu của sinh viên quận Liên Chiểu (ĐHBK, ĐH Sư Phạm, CĐ Kinh Tế - Kế Hoạch...).

---

## 1. TỔNG QUAN KIẾN TRÚC ĐÁM MÂY (CLOUD ARCHITECTURE)
- **Frontend & Serverless API:** [Vercel](https://vercel.com) (Toàn cầu, miễn phí trọn đời cho dự án cộng đồng, tự động cấu hình HTTPS SSL).
- **Cơ sở dữ liệu & Xác thực (Auth):** [Supabase Cloud](https://supabase.com) (PostgreSQL Database, Supabase Auth, Storage bucket hình ảnh).
- **AI Kiểm duyệt nội dung (AI Moderation):** [Google Gemini 1.5 Flash API](https://aistudio.google.com/) (Tự động nhận diện từ khóa thương mại, nội dung độc hại, phân tích ảnh).

---

## 2. BƯỚC 1: KHỞI TẠO CƠ SỞ DỮ LIỆU TRÊN SUPABASE (3 PHÚT)
1. Truy cập [https://supabase.com](https://supabase.com) và bấm **Sign In / Sign Up** bằng tài khoản GitHub hoặc Google.
2. Bấm **"New Project"**:
   - Name: `kho-do-lien-chieu`
   - Database Password: *Nhập mật khẩu an toàn và lưu lại*
   - Region: Chọn **Singapore (ap-southeast-1)** (gần Đà Nẵng nhất, tốc độ phản hồi < 40ms).
   - Pricing Plan: **Free Plan**.
3. Bấm **"Create new project"** và đợi 1 phút để Supabase chuẩn bị máy chủ.
4. Chạy tệp SQL khởi tạo:
   - Trong bảng điều khiển Supabase bên trái, chọn **SQL Editor** (biểu tượng `>_`).
   - Mở tệp `schema.sql` trong mã nguồn dự án, sao chép toàn bộ nội dung.
   - Dán vào trình soạn thảo SQL của Supabase và bấm **"RUN"**.
   - Thông báo *Success* sẽ xuất hiện: Tất cả bảng (`profiles`, `items`, `transactions`, `reviews`, `notifications`), phân quyền RLS, trigger tự động và bucket lưu trữ ảnh `item-images` đã sẵn sàng!
5. Lấy API Keys:
   - Vào **Project Settings** > **API**.
   - Lưu lại 3 giá trị:
     - `Project URL` (Ví dụ: `https://xyzcompany.supabase.co`)
     - `anon public` key
     - `service_role secret` key

---

## 3. BƯỚC 2: LẤY KHÓA AI GOOGLE GEMINI (1 PHÚT)
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập tài khoản Google và bấm **"Get API key"** > **"Create API key in new project"**.
3. Sao chép chuỗi mã `GEMINI_API_KEY`.

---

## 4. BƯỚC 3: ĐẨY LÊN VERCEL & TRIỂN KHAI HOÀN TẤT (2 PHÚT)
### Cách A: Triển khai trực tiếp qua GitHub (Khuyên dùng)
1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn:
   ```bash
   git add .
   git commit -m "Kho Do Lien Chieu production release"
   git push origin main
   ```
2. Đăng nhập [https://vercel.com](https://vercel.com), bấm **"Add New..."** > **"Project"**.
3. Chọn kho lưu trữ `kho-do-lien-chieu` và bấm **"Import"**.
4. Trong phần **Environment Variables**, điền 4 biến môi trường sau:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(URL lấy từ Supabase)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(anon key lấy từ Supabase)*
   - `SUPABASE_SERVICE_ROLE_KEY` = *(service_role key lấy từ Supabase)*
   - `GEMINI_API_KEY` = *(Khóa lấy từ Google AI Studio)*
5. Bấm nút **"Deploy"**.
6. Sau khoảng 60 giây, trang web sẽ trực tiếp hoạt động với tên miền miễn phí dạng: `https://kho-do-lien-chieu.vercel.app`.

---

## 5. BƯỚC 4: QUẢN TRỊ VIÊN ĐĂNG NHẬP & SỬ DỤNG BẢNG ĐIỀU KHIỂN
1. Truy cập trang web trực tiếp trên điện thoại hoặc máy tính.
2. Truy cập `/auth` hoặc bấm biểu tượng quản trị:
   - Tài khoản BQL: `admin@khodolienchieu.vn` (có sẵn vai trò `admin`).
3. Truy cập `/admin`:
   - Xem tổng quan các chỉ số KPI: Tổng món đồ, phiên trao đổi đang diễn ra, số lượng thành viên đã xác thực.
   - Duyệt hoặc từ chối các bài đăng bị hệ thống AI gắn cờ cảnh báo (có giải trình AI chi tiết).
   - Xem bảng tính kiểu Excel cho danh sách đồ dùng, người dùng và các giao dịch.
   - Bấm **"Xuất file CSV (Excel)"** để tải báo cáo về máy tính mà không cần bất kỳ kỹ năng lập trình nào!
