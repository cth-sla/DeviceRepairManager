import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairStatus, RepairTicket, Customer, Organization } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Package, History, Loader2 } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    processing: 0,
    returned: 0
  });
  
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [deviceStats, setDeviceStats] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [loadedTickets, loadedCustomers, loadedOrgs] = await Promise.all([
        StorageService.getTickets(),
        StorageService.getCustomers(),
        StorageService.getOrganizations()
      ]);

      setTickets(loadedTickets);
      setCustomers(loadedCustomers);
      setOrganizations(loadedOrgs);

      // Calc Status Stats
      setStats({
        total: loadedTickets.length,
        received: loadedTickets.filter(t => t.status === RepairStatus.RECEIVED).length,
        processing: loadedTickets.filter(t => t.status === RepairStatus.PROCESSING).length,
        returned: loadedTickets.filter(t => t.status === RepairStatus.RETURNED).length,
      });

      // Calc Device Type Stats
      const typeCounts: Record<string, number> = {};
      loadedTickets.forEach(t => {
        typeCounts[t.deviceType] = (typeCounts[t.deviceType] || 0) + 1;
      });
      const deviceData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
      setDeviceStats(deviceData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getCustomerName = (customerId: string) => {
    const c = customers.find(cus => cus.id === customerId);
    return c ? c.fullName : '---';
  };

  const getOrgName = (customerId: string) => {
    const c = customers.find(cus => cus.id === customerId);
    if (!c) return '';
    const org = organizations.find(o => o.id === c.organizationId);
    return org ? org.name : '';
  };

  // Data for Status Bar Chart
  const statusData = [
    { name: 'Đã nhận', value: stats.received, color: '#3b82f6' }, // Blue
    { name: 'Đang xử lý', value: stats.processing, color: '#f59e0b' }, // Amber
    { name: 'Đã trả', value: stats.returned, color: '#10b981' }, // Emerald
  ];

  // Colors for Midnight Blue theme
  const COLORS = ['#1e293b', '#3b82f6', '#2563eb', '#60a5fa', '#94a3b8', '#0f172a'];

  // Recent Tickets (Top 5 newest)
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-slate-500 text-sm">Báo cáo tình trạng và số liệu hoạt động thực tế</p>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng phiếu" 
          value={stats.total} 
          icon={<Package className="text-slate-600" />} 
          bg="bg-slate-100" 
        />
        <StatCard 
          title="Mới tiếp nhận" 
          value={stats.received} 
          icon={<AlertCircle className="text-blue-600" />} 
          bg="bg-blue-50" 
          borderColor="border-blue-200"
        />
        <StatCard 
          title="Đang xử lý" 
          value={stats.processing} 
          icon={<Clock className="text-amber-600" />} 
          bg="bg-amber-50" 
          borderColor="border-amber-200"
        />
        <StatCard 
          title="Đã trả khách" 
          value={stats.returned} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          bg="bg-emerald-50" 
          borderColor="border-emerald-200"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[350px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Thống kê Trạng thái</h3>
          {stats.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={statusData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fontWeight: 600, fill: '#475569'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" name="Số lượng" radius={[0, 4, 4, 0]} barSize={32}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Device Type Bar Chart (Vertical Columns) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[350px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Phân loại Thiết bị</h3>
          {stats.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={deviceStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fontWeight: 600, fill: '#475569'}}
                />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]} barSize={40}>
                  {deviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fill: '#1e293b', fontSize: 12, fontWeight: '800' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="text-slate-500" size={20} />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Phiếu sửa chữa gần đây</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ngày nhận</th>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Chưa có dữ liệu vận hành.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-600">{t.receiveDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <DeviceIcon type={t.deviceType} size={16} className="text-blue-500" />
                        <span className="font-bold text-slate-900">{t.deviceType}</span>
                      </div>
                      {t.serialNumber && <span className="text-[10px] font-mono text-slate-400 pl-6 block">SN: {t.serialNumber}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-800">{getCustomerName(t.customerId)}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{getOrgName(t.customerId)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg, borderColor = "border-transparent" }: any) => (
  <div className={`p-6 rounded-xl ${bg} border ${borderColor} transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: RepairStatus }) => {
  const colors = {
    [RepairStatus.RECEIVED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RepairStatus.RETURNED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${colors[status]}`}>
      {status}
    </span>
  );
};