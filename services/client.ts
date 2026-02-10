import { createClient } from '@supabase/supabase-js';

// --- CẤU HÌNH SUPABASE ---
// Bạn hãy thay thế 2 dòng dưới đây bằng URL và Key từ project Supabase của bạn
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Check if the user has updated the configuration
const isDefaultUrl = SUPABASE_URL === 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co';
const hasPlaceholder = SUPABASE_URL.includes('YOUR_SUPABASE');

export const isSupabaseConfigured = !isDefaultUrl && !hasPlaceholder;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);