import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/client';
import { Session } from '@supabase/supabase-js';
import { Loader2, Package } from 'lucide-react';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
  isOfflineMode: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      if (!isSupabaseConfigured) {
        const offlineSession = localStorage.getItem('device_mgr_offline_session');
        if (offlineSession) {
           setSession(JSON.parse(offlineSession));
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error session:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setLoading(false);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('device_mgr_offline_session');
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut, isOfflineMode: !isSupabaseConfigured }}>
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
           <div className="flex flex-col items-center gap-6">
             <div className="p-4 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl animate-pulse">
                <Package className="text-blue-500" size={48} />
             </div>
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">Đang khởi tạo</p>
             </div>
           </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);