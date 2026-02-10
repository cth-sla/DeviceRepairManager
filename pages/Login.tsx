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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
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
          window.location.reload(); 
        } else {
          setError('Mật khẩu demo phải có ít nhất 4 ký tự.');
          setLoading(false);
        }
      }, 800);
      return;
    }

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2048")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative Blur Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-800/40 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10 relative z-10">
        <div className="p-8 text-center bg-white/5 border-b border-white/5">
          <div className="inline-flex p-4 rounded-2xl bg-blue-600/20 mb-4 border border-blue-500/30">
            <Package className="text-blue-400" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Device Repair Manager</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-[0.2em] font-medium opacity-80">Hệ thống Quản lý Thiết bị</p>
        </div>

        <div className="p-8">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-2xl flex items-start gap-3 text-blue-100 text-sm">
              <WifiOff className="shrink-0 mt-0.5 text-blue-400" size={18} />
              <div>
                <p className="font-bold">Chế độ Offline</p>
                <p className="opacity-70">Dữ liệu lưu tại trình duyệt. Vui lòng nhập email và mật khẩu bất kỳ (≥ 4 ký tự).</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} className="text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Tài khoản Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all text-white placeholder-slate-500 text-sm"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all text-white placeholder-slate-500 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Đăng nhập hệ thống'
              )}
            </button>
          </form>
        </div>
        
        <div className="px-8 py-5 bg-black/20 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
            © 2026 • Trần Trà
          </p>
        </div>
      </div>
    </div>
  );
};
