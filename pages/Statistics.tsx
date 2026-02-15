import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { RepairTicket, Customer, Organization } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle, History, User, BrainCircuit, Sparkles, Lightbulb } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';
import { GoogleGenAI, Type } from "@google/genai";

interface AnalysisData {
  name: string; // Device Type
  count: number;
  percent: number;
  status: 'safe' | 'warning' | 'critical';
  recommendation: string;
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

    const counts: Record<string, number> = {};
    data.forEach(t => {
      counts[t.deviceType] = (counts[t.deviceType] || 0) + 1;
    });

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

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

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
          <p className="text-slate-500 text-sm">Tổng hợp dữ liệu hỏng hóc thiết bị để đưa ra quyết định mua sắm và bảo trì</p>
        </div>
        {topFailure && (
          <button 
            onClick={runAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isAiAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
            Tái phân tích AI
          </button>
        )}
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

      {/* AI Failure Deep Dive Section */}
      {topFailure && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <Sparkles className="text-blue-300" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Deep Dive: Phân tích lỗi {topFailure.name}</h2>
                <p className="text-blue-200/60 text-xs font-medium uppercase tracking-widest">Powered by Gemini AI Analysis</p>
              </div>
            </div>

            {isAiAnalyzing ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="animate-spin text-blue-400" size={40} />
                  <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200" size={16} />
                </div>
                <p className="text-blue-100 text-sm animate-pulse">Đang tổng hợp dữ liệu và nhận diện mẫu lỗi...</p>
              </div>
            ) : aiAnalysis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiAnalysis.map((item, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                        <AlertTriangle className="text-amber-400" size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">{item.issue}</h4>
                        <p className="text-xs text-blue-100/70 leading-relaxed">{item.frequency_description}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2">
                      <Lightbulb size={14} className="text-blue-300 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-200/90 italic">{item.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-blue-200/50 italic text-sm">
                Chưa có đủ dữ liệu mô tả để thực hiện phân tích chuyên sâu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Top Failure List */}
      {topFailure && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={20} className="text-slate-500" />
              <h3 className="font-bold text-slate-800">
                Chi tiết các phiếu lỗi: <span className="text-blue-600">{topFailure.name}</span>
              </h3>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Hiển thị {topFailureTickets.length} sự cố gần nhất
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Số Serial</th>
                  <th className="px-6 py-4">Khách hàng / Đơn vị</th>
                  <th className="px-6 py-4">Mô tả tình trạng lỗi</th>
                  <th className="px-6 py-4">Ngày nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topFailureTickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Không có dữ liệu chi tiết.</td>
                  </tr>
                ) : (
                  topFailureTickets.map((t) => {
                    const info = getCustomerInfo(t.customerId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-600 uppercase">
                          {t.serialNumber || 'KHÔNG CÓ SN'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-50 text-blue-500 rounded">
                              <User size={12} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 leading-tight">{info.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium uppercase">{info.org}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md text-slate-600 leading-relaxed italic">
                            "{t.deviceCondition}"
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{t.receiveDate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluation & Recommendations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Đánh giá tổng quát các loại thiết bị</h3>
          <div className="flex gap-4 text-xs font-medium">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Nguy hiểm (&gt;30%)</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Cảnh báo (&gt;15%)</div>
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
                <th className="px-6 py-4">Khuyến nghị</th>
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