-- ==============================================================================
-- KHO ĐỒ LIÊN CHIỂU - SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA DDL
-- Location: Hòa Khánh, Liên Chiểu, Đà Nẵng
-- Architecture: Supabase Cloud Serverless + Row Level Security (RLS)
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE ENUM TYPES & CONSTRAINTS
DO $$ BEGIN
  CREATE TYPE item_purpose_enum AS ENUM ('FREE', 'EXCHANGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_status_enum AS ENUM ('ACTIVE', 'PENDING_ADMIN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trade_status_enum AS ENUM ('REQUESTED', 'ACCEPTED', 'HANDED_OVER', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: PROFILES (User identity & university verification)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  role user_role_enum DEFAULT 'user',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE: ITEMS (Community sharing & bartering listings)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'GOOD',
  purpose item_purpose_enum NOT NULL DEFAULT 'FREE',
  location TEXT NOT NULL DEFAULT 'Phường Hòa Khánh Bắc, Liên Chiểu',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status item_status_enum DEFAULT 'ACTIVE',
  ai_moderation_reason TEXT,
  ai_moderation_score INT DEFAULT 95,
  favorites_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE: TRANSACTIONS (P2P 4-Step Stepper Handover Tracker)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status trade_status_enum DEFAULT 'REQUESTED',
  scheduled_date TIMESTAMPTZ,
  pickup_location TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 6. TABLE: REVIEWS (1-5 Star community ratings & feedback)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE: NOTIFICATIONS (In-app alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_link TEXT,
  type TEXT DEFAULT 'trade',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    email,
    university,
    department,
    is_verified,
    reputation_score,
    role
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'university', 'Trường Đại học Bách khoa - ĐHĐN'),
    COALESCE(new.raw_user_meta_data->>'department', 'Khoa Quản lý Công nghiệp'),
    true,
    0,
    COALESCE((new.raw_user_meta_data->>'role')::user_role_enum, 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles; only owners can update
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Items: Anyone can view active/in_progress items; authenticated users can insert; owners/admins can update/delete
CREATE POLICY "Active items are viewable by everyone."
  ON public.items FOR SELECT USING (status != 'PENDING_ADMIN' OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can create items."
  ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items or admin can."
  ON public.items FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can delete their own items."
  ON public.items FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Transactions: Participants can view and update
CREATE POLICY "Participants can view their transactions."
  ON public.transactions FOR SELECT USING (auth.uid() = giver_id OR auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can create transactions."
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Participants can update transaction status."
  ON public.transactions FOR UPDATE USING (auth.uid() = giver_id OR auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reviews: Anyone can view reviews; participants can create
CREATE POLICY "Reviews are viewable by everyone."
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Reviewers can insert reviews."
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: Only receiver can view/update
CREATE POLICY "Users can view their notifications."
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications."
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. STORAGE BUCKET: item-images (Public Image Hosting)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public item-images bucket access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated uploads to item-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-images');
