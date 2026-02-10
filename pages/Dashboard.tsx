import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairStatus, RepairTicket, Customer, Organization } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
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

      setStats({
        total: loadedTickets.length,
        received: loadedTickets.filter(t => t.status === RepairStatus.RECEIVED).length,
        processing: loadedTickets.filter(t => t.status === RepairStatus.PROCESSING).length,
        returned: loadedTickets.filter(t => t.status === RepairStatus.RETURNED).length,
      });

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

  const statusData = [
    { name: 'Đã nhận', value: stats.received, color: '#ef4444' }, // Red 500
    { name: 'Đang xử lý', value: stats.processing, color: '#f59e0b' }, // Amber
    { name: 'Đã trả', value: stats.returned, color: '#22c55e' }, // Green
  ];

  const COLORS = ['#7f1d1d', '#dc2626', '#f87171', '#ef4444', '#b91c1c', '#991b1b'];

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan Hệ thống</h1>
          <p className="text-slate-500">Báo cáo tình trạng và số liệu hoạt động</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng phiếu" 
          value={stats.total} 
          icon={<Package className="text-red-900" />} 
          bg="bg-red-100" 
        />
        <StatCard 
          title="Mới tiếp nhận" 
          value={stats.received} 
          icon={<AlertCircle className="text-red-600" />} 
          bg="bg-red-50" 
          borderColor="border-red-200"
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
          icon={<CheckCircle2 className="text-green-600" />} 
          bg="bg-green-50" 
          borderColor="border-green-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 min-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Thống kê theo Trạng thái</h3>
          {stats.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={statusData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="value" name="Số lượng" fill="#dc2626" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 min-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Tỷ lệ Loại thiết bị</h3>
          {stats.total === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-100 flex items-center justify-between bg-red-50/30">
          <div className="flex items-center gap-2">
            <History className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-slate-800">Phiếu sửa chữa gần đây</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50/50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-3">Ngày nhận</th>
                <th className="px-6 py-3">Thiết bị</th>
                <th className="px-6 py-3">Khách hàng</th>
                <th className="px-6 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{t.receiveDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <DeviceIcon type={t.deviceType} size={16} className="text-red-500" />
                        <span className="font-medium text-slate-900">{t.deviceType}</span>
                      </div>
                      {t.serialNumber && <span className="text-xs text-slate-500 pl-6 block">SN: {t.serialNumber}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-slate-900">{getCustomerName(t.customerId)}</span>
                      <span className="text-xs text-slate-500">{getOrgName(t.customerId)}</span>
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
  <div className={`p-6 rounded-xl ${bg} border ${borderColor} transition-transform hover:scale-105 duration-200`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="p-3 bg-white/50 rounded-lg backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: RepairStatus }) => {
  const colors = {
    [RepairStatus.RECEIVED]: 'bg-red-100 text-red-700',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700',
    [RepairStatus.RETURNED]: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};