import React from 'react';
import { LayoutDashboard, Users, Wrench, Package, Menu, X, Building, ShieldCheck, LogOut, Wifi, WifiOff } from 'lucide-react';
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
    <div className="flex h-screen bg-red-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-secondary text-white transform transition-transform duration-200 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-red-900/50">
          <div className="flex items-center space-x-2">
            <Package className="text-red-500" size={28} />
            <span className="text-xl font-bold">DeviceMgr</span>
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
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-accent text-white shadow-lg' 
                  : 'text-red-200 hover:bg-red-900/50 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Status Indicator */}
        <div className={`px-4 py-2 mx-4 rounded text-xs flex items-center justify-center gap-2 ${isOfflineMode ? 'bg-amber-900/50 text-amber-200' : 'bg-green-900/30 text-green-300'}`}>
           {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
           <span>{isOfflineMode ? 'Chế độ Offline (Demo)' : 'Đã kết nối Online'}</span>
        </div>

        <div className="p-4 border-t border-red-900/50 bg-secondary mt-2">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center text-red-200 font-bold text-xs">
              {session?.user.email?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session?.user.email}</p>
              <p className="text-xs text-red-400">Administrator</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10 p-4 lg:hidden flex items-center border-b border-red-100">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-red-50"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-slate-700">Menu</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};