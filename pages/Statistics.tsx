import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairTicket, Customer, Organization, RepairStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, AreaChart, Area, XAxis as RechartsXAxis
} from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle, History, User, BrainCircuit, Sparkles, Lightbulb, Calendar } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';
import { GoogleGenAI, Type } from "@google/genai";

interface AnalysisData {
  name: string; // Device Type
  count: number;
  percent: number;
  status: 'safe' | 'warning' | 'critical';
  recommendation: string;
}

interface TrendData {
  month: string;
  count: number;
}

interface StatusStat {
  name: string;
  value: number;
  color: string;
}

interface AiIssueAnalysis {
  issue: string;
  frequency_description: string;
  recommendation: string;
}

export const StatisticsPage: React.FC = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStat[]>([]);
  const [totalFailures, setTotalFailures] = useState(0);
  
  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<AiIssueAnalysis[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [tData, cData, oData] = await Promise.all([
        StorageService.getTickets(),
        StorageService.getCustomers(),
        StorageService.getOrganizations()
      ]);
      setTickets(tData);
      setCustomers(cData);
      setOrganizations(oData);
      processData(tData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const processData = (data: RepairTicket[]) => {
    const total = data.length;
    setTotalFailures(total);

    if (total === 0) return;

    // 1. Phân tích theo Loại thiết bị
    const counts: Record<string, number> = {};
    data.forEach(t => {
      counts[t.deviceType] = (counts[t.deviceType] || 0) + 1;
    });

    const deviceResult: AnalysisData[] = Object.entries(counts).map(([type, count]) => {
      const percent = parseFloat(((count / total) * 100).toFixed(1));
      let status: 'safe' | 'warning' | 'critical' = 'safe';
      let recommendation = 'Thiết bị hoạt động ổn định.';

      if (percent >= 30) {
        status = 'critical';
        recommendation = 'Tỉ lệ hỏng quá cao! Cần kiểm tra nguồn điện hoặc môi trường lắp đặt.';
      } else if (percent >= 15) {
        status = 'warning';
        recommendation = 'Tỉ lệ hỏng mức trung bình. Cần theo dõi bảo trì thường xuyên.';
      }

      return { name: type, count, percent, status, recommendation };
    }).sort((a, b) => b.count - a.count);

    setAnalysis(deviceResult);

    // 2. Phân tích xu hướng theo tháng
    const monthCounts: Record<string, number> = {};
    data.forEach(t => {
      const date = new Date(t.receiveDate);
      if (!isNaN(date.getTime())) {
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    });

    const trend = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .slice(-6); // Lấy 6 tháng gần nhất
    setTrendData(trend);

    // 3. Phân tích theo trạng thái
    const statusCounts = {
      [RepairStatus.RECEIVED]: 0,
      [RepairStatus.PROCESSING]: 0,
      [RepairStatus.RETURNED]: 0,
    };
    data.forEach(t => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    setStatusStats([
      { name: 'Đã nhận', value: statusCounts[RepairStatus.RECEIVED], color: '#3b82f6' },
      { name: 'Đang xử lý', value: statusCounts[RepairStatus.PROCESSING], color: '#f59e0b' },
      { name: 'Đã hoàn thành', value: statusCounts[RepairStatus.RETURNED], color: '#10b981' },
    ]);
  };

  const topFailure = analysis[0];
  const topFailureTickets = tickets.filter(t => t.deviceType === topFailure?.name);

  // AI Analysis Effect
  useEffect(() => {
    if (topFailure && topFailureTickets.length > 0 && !isAiAnalyzing && aiAnalysis.length === 0) {
      runAiAnalysis();
    }
  }, [topFailure]);

  const runAiAnalysis = async () => {
    if (!process.env.API_KEY || !topFailure) return;
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const conditions = topFailureTickets.map(t => t.deviceCondition).filter(c => c && c.length > 2);
      if (conditions.length === 0) {
        setIsAiAnalyzing(false);
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these failure descriptions for device type "${topFailure.name}" and summarize the 3-5 most frequent technical root causes. 
        Descriptions: ${conditions.join(" | ")}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                issue: { type: Type.STRING, description: "Tên ngắn gọn của lỗi kỹ thuật" },
                frequency_description: { type: Type.STRING, description: "Mô tả mức độ xuất hiện hoặc triệu chứng" },
                recommendation: { type: Type.STRING, description: "Khuyến nghị khắc phục hoặc phòng ngừa" }
              },
              required: ["issue", "frequency_description", "recommendation"]
            }
          }
        }
      });
      const parsed = JSON.parse(response.text || "[]");
      setAiAnalysis(parsed);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const getCustomerInfo = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return { name: '---', org: '---' };
    const org = organizations.find(o => o.id === customer.organizationId);
    return { name: customer.fullName, org: org?.name || '---' };
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Thống kê & Phân tích Sự cố
          </h1>
          <p className="text-slate-500 text-sm">Tổng hợp dữ liệu hỏng hóc và xu hướng kỹ thuật</p>
        </div>
        {topFailure && (
          <button 
            onClick={runAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isAiAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
            Tái phân tích AI
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số sự cố</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalFailures}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
            Dữ liệu thời gian thực
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hỏng nhiều nhất</p>
              <p className="text-2xl font-black text-red-600 mt-1 truncate max-w-[150px]">
                {topFailure?.name || '---'}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium">
            Tỉ lệ: <span className="text-red-600 font-bold">{topFailure?.percent || 0}%</span> sự cố
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Xử lý xong</p>
              <p className="text-3xl font-black text-green-600 mt-1">
                {statusStats.find(s => s.name === 'Đã hoàn thành')?.value || 0}
              </p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium">Đã trả lại thiết bị cho khách</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar size={16} /> Xu hướng sự cố theo tháng
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="count" name="Số sự cố" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Tỉ lệ hoàn thành</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Breakdown Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Phân bổ sự cố theo loại thiết bị</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="count" name="Số lượng hỏng" radius={[8, 8, 0, 0]} barSize={40}>
                {analysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Failure Deep Dive Section */}
      {topFailure && (
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Sparkles className="text-blue-400" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Phân tích lỗi sâu: {topFailure.name}</h2>
                <p className="text-blue-300/60 text-xs font-bold uppercase tracking-[0.2em] mt-1">AI-Powered Diagnostic System</p>
              </div>
            </div>

            {isAiAnalyzing ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-blue-400" size={48} />
                <p className="text-blue-200 text-sm font-bold tracking-widest animate-pulse">ĐANG TRÍCH XUẤT CÁC MẪU LỖI PHỔ BIẾN...</p>
              </div>
            ) : aiAnalysis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiAnalysis.map((item, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <AlertTriangle className="text-blue-400" size={20} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-white text-base leading-tight">{item.issue}</h4>
                        <p className="text-xs text-blue-100/60 leading-relaxed font-medium">{item.frequency_description}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-3">
                      <Lightbulb size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-200 italic font-medium leading-relaxed">{item.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-blue-200/50 italic text-sm border-2 border-dashed border-white/10 rounded-2xl">
                Dữ liệu hiện tại chưa đủ để thực hiện phân tích chuyên sâu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Bảng đánh giá & Khuyến nghị bảo trì</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Loại thiết bị</th>
                <th className="px-6 py-4 text-center">Tỉ lệ hỏng</th>
                <th className="px-6 py-4">Khuyến nghị phương án</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <DeviceIcon type={item.name} size={18} />
                      </div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                      item.status === 'critical' ? 'bg-red-100 text-red-700' : 
                      item.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.percent}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {item.status === 'critical' && <AlertTriangle size={14} className="text-red-500" />}
                       <span className="text-slate-600 font-medium">{item.recommendation}</span>
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