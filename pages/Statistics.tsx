import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairTicket } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';

interface AnalysisData {
  name: string; // Device Type
  count: number;
  percent: number;
  status: 'safe' | 'warning' | 'critical';
  recommendation: string;
}

export const StatisticsPage: React.FC = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData[]>([]);
  const [totalFailures, setTotalFailures] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await StorageService.getTickets();
      setTickets(data);
      processData(data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const processData = (data: RepairTicket[]) => {
    const total = data.length;
    setTotalFailures(total);

    if (total === 0) return;

    // Count by device type
    const counts: Record<string, number> = {};
    data.forEach(t => {
      counts[t.deviceType] = (counts[t.deviceType] || 0) + 1;
    });

    // Calculate stats and generate recommendations
    const result: AnalysisData[] = Object.entries(counts).map(([type, count]) => {
      const percent = parseFloat(((count / total) * 100).toFixed(1));
      
      let status: 'safe' | 'warning' | 'critical' = 'safe';
      let recommendation = 'Thiết bị hoạt động ổn định.';

      if (percent >= 30) {
        status = 'critical';
        recommendation = 'Tỉ lệ hỏng quá cao! Cần xem xét thay thế loại thiết bị này hoặc kiểm tra nguồn điện/môi trường lắp đặt.';
      } else if (percent >= 15) {
        status = 'warning';
        recommendation = 'Tỉ lệ hỏng mức trung bình cao. Cần theo dõi thêm và bảo trì thường xuyên hơn.';
      } else {
        status = 'safe';
        recommendation = 'Tỉ lệ hỏng ở mức chấp nhận được. Duy trì quy trình bảo dưỡng hiện tại.';
      }

      return {
        name: type,
        count,
        percent,
        status,
        recommendation
      };
    }).sort((a, b) => b.count - a.count);

    setAnalysis(result);
  };

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const topFailure = analysis[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="text-blue-600" />
          Thống kê & Phân tích Sự cố
        </h1>
        <p className="text-slate-500 text-sm">Tổng hợp dữ liệu hỏng hóc thiết bị để đưa ra quyết định mua sắm và bảo trì</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng số sự cố</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{totalFailures}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Dữ liệu ghi nhận từ tất cả phiếu sửa chữa</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hỏng nhiều nhất</p>
              <p className="text-2xl font-bold text-red-600 mt-2 truncate max-w-[150px]" title={topFailure?.name || '---'}>
                {topFailure?.name || '---'}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Chiếm <span className="font-bold text-slate-700">{topFailure?.percent || 0}%</span> tổng số sự cố
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Độ tin cậy cao</p>
              <p className="text-2xl font-bold text-green-600 mt-2 truncate max-w-[150px]">
                {analysis[analysis.length - 1]?.name || '---'}
              </p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Thiết bị ít gặp sự cố nhất</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Số lượng hỏng theo Loại thiết bị</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="count" name="Số lượng" radius={[4, 4, 0, 0]} barSize={40}>
                 {analysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Tỉ trọng sự cố (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysis}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value" // Actually using 'count', remapping below or relying on 'count' key if dataKey is flexible. Recharts expects 'value' usually.
                nameKey="name"
                data={analysis.map(a => ({...a, value: a.count}))} // Map count to value for Pie
              >
                {analysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} phiếu`, 'Số lượng']} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Đánh giá chi tiết & Khuyến nghị</h3>
          <div className="flex gap-4 text-xs font-medium">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Nguy hiểm (>30%)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Cảnh báo (>15%)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ổn định</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Loại thiết bị</th>
                <th className="px-6 py-4 text-center">Số lượng hỏng</th>
                <th className="px-6 py-4 text-center">Tỉ lệ (%)</th>
                <th className="px-6 py-4">Đánh giá & Phương án</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded text-slate-600">
                        <DeviceIcon type={item.name} size={18} />
                      </div>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{item.count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${
                      item.status === 'critical' ? 'text-red-600' : 
                      item.status === 'warning' ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {item.percent}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                      item.status === 'critical' ? 'bg-red-50 border-red-100 text-red-800' : 
                      item.status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-green-50 border-green-100 text-green-800'
                    }`}>
                      {item.status === 'critical' ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> :
                       item.status === 'warning' ? <HelpCircle size={18} className="shrink-0 mt-0.5" /> :
                       <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                      <span className="text-sm font-medium">{item.recommendation}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};