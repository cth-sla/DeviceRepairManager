import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/client';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

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
        console.warn("Supabase not configured. Running in Offline Mode (LocalStorage).");
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
        console.error("Error checking session:", error);
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
        <div className="flex h-screen w-screen items-center justify-center bg-red-50">
           <div className="flex flex-col items-center gap-3">
             <Loader2 className="animate-spin text-red-600" size={48} />
             <p className="text-red-900 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
           </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);