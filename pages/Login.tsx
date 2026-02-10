import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/client';
import { useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // For updating context state in offline mode
  // In a real app we might expose a specific login function in context, 
  // but here we force a reload or rely on the localStorage check in AuthProvider
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- OFFLINE MODE HANDLER ---
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        // Simple mock validation
        if (email && password.length >= 4) {
          const mockSession = {
            access_token: 'offline-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'offline-refresh',
            user: {
              id: 'offline-admin',
              aud: 'authenticated',
              role: 'authenticated',
              email: email,
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString(),
            }
          };
          localStorage.setItem('device_mgr_offline_session', JSON.stringify(mockSession));
          // Force page reload to pick up the "session" in AuthContext
          window.location.reload(); 
        } else {
          setError('Mật khẩu demo phải có ít nhất 4 ký tự.');
          setLoading(false);
        }
      }, 800);
      return;
    }

    // --- ONLINE SUPABASE HANDLER ---
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      navigate('/'); 
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Email hoặc mật khẩu không chính xác.' 
        : 'Có lỗi xảy ra khi đăng nhập.');
    } finally {
      if (isSupabaseConfigured) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 bg-slate-900 text-center">
          <div className="inline-flex p-3 rounded-full bg-slate-800 mb-4">
            <Package className="text-blue-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white">Device Repair Manager</h1>
          <p className="text-slate-400 mt-2">Hệ thống Quản lý Thiết bị</p>
        </div>

        <div className="p-8">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800 text-sm">
              <WifiOff className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold">Chế độ Offline (Demo)</p>
                <p>Hệ thống chưa kết nối Supabase. Dữ liệu sẽ được lưu trên trình duyệt của bạn.</p>
                <p className="mt-1 text-xs opacity-75">Đăng nhập bằng email bất kỳ.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
        
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            © 2026 Trần Trà.
          </p>
        </div>
      </div>
    </div>
  );
};