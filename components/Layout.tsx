import React from 'react';
import { LayoutDashboard, Users, Wrench, Package, Menu, X, Building, ShieldCheck, LogOut, Wifi, WifiOff, Cog, BarChart3, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const location = useLocation();
  const { signOut, session, isOfflineMode } = useAuth();

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextSetting = !prev;
      localStorage.setItem('sidebar-collapsed', String(nextSetting));
      return nextSetting;
    });
  };

  const navItems = [
    { label: 'Tổng quan', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Thống kê & Phân tích', path: '/statistics', icon: <BarChart3 size={20} /> },
    { label: 'Quản lý Thiết bị', path: '/devices', icon: <Package size={20} /> },
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
          fixed lg:static inset-y-0 left-0 z-30 bg-slate-900/80 backdrop-blur-md text-white transform transition-all duration-300 ease-in-out flex flex-col border-r border-slate-700/50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-64 lg:w-20' : 'w-64'}
        `}
      >
        <div className={`flex items-center border-b border-slate-700/50 transition-all duration-300 ${isCollapsed ? 'lg:flex-col lg:p-4 lg:gap-3 lg:justify-center' : 'justify-between p-6'}`}>
          <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'lg:space-x-0 lg:justify-center' : 'space-x-3'}`}>
            <Cog className="text-blue-500 animate-[spin_10s_linear_infinite] flex-shrink-0" size={28} />
            <span className={`text-xl font-bold tracking-tight transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>Device Manager</span>
          </div>
          <button 
            onClick={toggleCollapse} 
            className="hidden lg:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 p-2 rounded-xl transition-all border border-transparent hover:border-slate-700/50 cursor-pointer"
            title={isCollapsed ? "Hiện menu (>>)" : "Ẩn menu (<<)"}
          >
            {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
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
                flex items-center transition-all duration-200 rounded-lg
                ${isCollapsed ? 'lg:justify-center lg:px-2 lg:py-3' : 'space-x-3 px-4 py-3'}
                ${isActive(item.path) 
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className={`font-medium transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Status Indicator */}
        <div 
          className={`
            transition-all duration-300 uppercase font-bold tracking-wider flex items-center justify-center
            ${isCollapsed ? 'lg:w-10 lg:h-10 lg:mx-auto lg:p-0 lg:rounded-full' : 'px-4 py-2 mx-4 rounded text-[10px] gap-2'}
            ${isOfflineMode ? 'bg-amber-900/30 text-amber-400 border border-amber-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}
          `}
          title={isOfflineMode ? 'Chế độ Offline' : 'Đã kết nối Online'}
        >
          {isOfflineMode ? <WifiOff size={14} className="flex-shrink-0" /> : <Wifi size={14} className="flex-shrink-0" />}
          <span className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block text-[10px]'}`}>{isOfflineMode ? 'Offline' : 'Online'}</span>
        </div>

        <div className={`p-4 border-t border-slate-700/50 bg-slate-900/50 mt-2 transition-all duration-300 ${isCollapsed ? 'lg:px-2 lg:py-4 lg:flex lg:flex-col lg:items-center lg:gap-4' : ''}`}>
          <div 
            className={`flex items-center transition-all duration-300 ${isCollapsed ? 'lg:flex-col lg:gap-1 lg:p-0' : 'gap-3 mb-3 px-2'}`}
            title={session?.user.email || ''}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold text-xs border border-slate-600 flex-shrink-0 transition-transform duration-300">
              {session?.user.email?.substring(0,2).toUpperCase()}
            </div>
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-sm font-medium text-white truncate">{session?.user.email}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Administrator</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className={`flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-300 text-sm font-medium ${isCollapsed ? 'lg:w-10 lg:h-10 lg:p-0' : 'w-full gap-2 px-4 py-2'}`}
            title="Đăng xuất"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>Đăng xuất</span>
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

        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <div className="w-full h-full">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};