import React from 'react';
import { LayoutDashboard, Users, Wrench, Package, Menu, X, Building, ShieldCheck, LogOut, Wifi, WifiOff, Cog } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { signOut, session, isOfflineMode } = useAuth();

  const navItems = [
    { label: 'Tổng quan', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Quản lý Sửa chữa', path: '/repairs', icon: <Wrench size={20} /> },
    { label: 'Gửi Hãng / Bảo hành', path: '/warranty', icon: <ShieldCheck size={20} /> },
    { label: 'Quản lý Đơn vị', path: '/organizations', icon: <Building size={20} /> },
    { label: 'Quản lý Khách hàng', path: '/customers', icon: <Users size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div 
      className="flex h-screen overflow-hidden bg-slate-900"
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2048")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900/80 backdrop-blur-md text-white transform transition-transform duration-200 ease-in-out flex flex-col border-r border-slate-700/50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Cog className="text-blue-500 animate-[spin_10s_linear_infinite]" size={28} />
            <span className="text-xl font-bold tracking-tight">DeviceMgr</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Status Indicator */}
        <div className={`px-4 py-2 mx-4 rounded text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-2 ${isOfflineMode ? 'bg-amber-900/30 text-amber-400 border border-amber-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}`}>
           {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
           <span>{isOfflineMode ? 'Chế độ Offline' : 'Đã kết nối Online'}</span>
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 mt-2">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold text-xs border border-slate-600">
              {session?.user.email?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session?.user.email}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Administrator</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm z-10 p-4 lg:hidden flex items-center border-b border-slate-200">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100/50"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-slate-700">Menu</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/20">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};