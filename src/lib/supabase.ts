import { createClient } from '@supabase/supabase-js';

// Fallback to active Supabase project credentials so mobile/Vercel/PWA always connects
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://frrtfguyolxwyzkrqxxm.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycnRmZ3V5b2x4d3l6a3JxeHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTE1MzcsImV4cCI6MjEwNzQ2NzUzN30.pc5iz7hixgsdqq9Ln0swIfrawVjzgwHkScYC8D15A0A';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('your-project')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

