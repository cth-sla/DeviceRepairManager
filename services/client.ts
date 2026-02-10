import { createClient } from '@supabase/supabase-js';

// --- CẤU HÌNH KẾT NỐI SUPABASE ---
// 1. Vào trang Dashboard của Supabase: https://supabase.com/dashboard/project/_/settings/api
// 2. Copy "Project URL" và "anon public" Key
// 3. Thay thế vào 2 biến bên dưới:

const SUPABASE_URL = 'https://yzrydnloiidjbrfxwcvh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnlkbmxvaWlkamJyZnh3Y3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDUxNTUsImV4cCI6MjA4NjI4MTE1NX0.01FPx6H6Pwo21yXwnRqyZIuMF4gtKbn6k_AcmoVWNTM';

// --- KIỂM TRA TRẠNG THÁI CẤU HÌNH ---
// Biến này dùng để xác định app sẽ chạy Online (Supabase) hay Offline (LocalStorage)
const isDefaultUrl = SUPABASE_URL === 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co';
const hasPlaceholder = SUPABASE_URL.includes('YOUR_SUPABASE');

export const isSupabaseConfigured = !isDefaultUrl && !hasPlaceholder;

// Tạo client kết nối
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lưu ý: Để database hoạt động, hãy chạy file `supabase_schema.sql` trong SQL Editor của Supabase.
