import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairStatus, RepairTicket, Customer, Organization } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Package, History, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';

interface DeviceStat {
  name: string;
  value: number;
  percent: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bg?: string;
  borderColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  bg = 'bg-white', 
  borderColor = 'border-slate-200' 
}) => {
  return (
    <div className={`p-6 rounded-xl shadow-sm border ${borderColor} ${bg} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100/50">
          {icon}
        </div>
        {/* You could add percentage change here if available */}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{title}</h3>
      </div>
    </div>
  );
};

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
  
  const [deviceStats, setDeviceStats] = useState<DeviceStat[]>([]);

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

      // 1. Calc Status Stats
      setStats({
        total: loadedTickets.length,
        received: loadedTickets.filter(t => t.status === RepairStatus.RECEIVED).length,
        processing: loadedTickets.filter(t => t.status === RepairStatus.PROCESSING).length,
        returned: loadedTickets.filter(t => t.status === RepairStatus.RETURNED).length,
      });

      // 2. Calc Device Type Stats & Ratios
      const typeCounts: Record<string, number> = {};
      loadedTickets.forEach(t => {
        typeCounts[t.deviceType] = (typeCounts[t.deviceType] || 0) + 1;
      });

      const totalTickets = loadedTickets.length;
      const deviceData = Object.entries(typeCounts)
        .map(([name, value]) => ({ 
          name, 
          value,
          percent: totalTickets > 0 ? parseFloat(((value / totalTickets) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.value - a.value); // Sort descending to show most broken first

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

  // Colors for Device Chart (Distinct colors)
  const DEVICE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

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
          title="Tổng phiếu tiếp nhận" 
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
        
        {/* Left: Status Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Tiến độ Xử lý</h3>
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
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
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
        
        {/* Right: Device Failure Ratio (Pie Chart + List) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Tỉ lệ Hỏng theo Thiết bị</h3>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
               <TrendingUp size={14} />
               <span>Top: {deviceStats[0]?.name || 'N/A'}</span>
            </div>
          </div>

          {stats.total === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
          ) : (
            <div className="flex flex-col sm:flex-row h-full">
              {/* Pie Chart */}
              <div className="flex-1 h-[250px] sm:h-auto min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} phiếu (${props.payload.percent}%)`, 
                        name
                      ]}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown List */}
              <div className="flex-1 sm:pl-4 sm:border-l border-slate-100 flex flex-col justify-center space-y-3 overflow-y-auto max-h-[300px]">
                {deviceStats.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[index % DEVICE_COLORS.length] }}></div>
                      <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">{item.value}</span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-[45px] text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 italic text-center">
                  * Dữ liệu dựa trên tổng số phiếu
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
