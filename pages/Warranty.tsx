import React, { useState, useEffect } from 'react';
import { WarrantyTicket, WarrantyStatus, Organization, DeviceType } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, CheckCircle2, Clock, Building2, Coins, Download, Loader2, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';

export const WarrantyPage: React.FC = () => {
  const [tickets, setTickets] = useState<WarrantyTicket[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WarrantyTicket>>({});

  const fetchData = async () => {
    setIsLoading(true);
    const [t, o] = await Promise.all([StorageService.getWarrantyTickets(), StorageService.getOrganizations()]);
    setTickets(t);
    setOrganizations(o);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getOrgName = (orgId: string) => organizations.find(o => o.id === orgId)?.name || 'Hãng chưa rõ';

  const handleSave = async () => {
    if (!formData.organizationId || !formData.deviceType || !formData.sentDate) return alert('Thiếu thông tin');
    const ticket: WarrantyTicket = {
      id: editingId || crypto.randomUUID(),
      organizationId: formData.organizationId,
      deviceType: formData.deviceType as DeviceType,
      serialNumber: formData.serialNumber,
      description: formData.description || '',
      sentDate: formData.sentDate,
      status: formData.status || WarrantyStatus.SENT,
      returnDate: formData.returnDate,
      cost: formData.cost,
      note: formData.note,
      createdAt: editingId ? (tickets.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    try {
      if (editingId) await StorageService.updateWarrantyTicket(ticket);
      else await StorageService.addWarrantyTicket(ticket);
      await fetchData();
      closeModal();
    } catch (e) { alert('Lỗi lưu phiếu'); }
  };

  const openModal = (ticket?: WarrantyTicket) => {
    if (ticket) { setEditingId(ticket.id); setFormData({ ...ticket }); }
    else { setEditingId(null); setFormData({ status: WarrantyStatus.SENT, sentDate: new Date().toISOString().split('T')[0], deviceType: DeviceType.CODEC }); }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setFormData({}); };

  const statusColors = {
    [WarrantyStatus.SENT]: 'bg-blue-50 text-blue-700 border-blue-200',
    [WarrantyStatus.FIXING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [WarrantyStatus.DONE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [WarrantyStatus.CANNOT_FIX]: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = getOrgName(t.organizationId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.sentDate.localeCompare(a.sentDate));

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gửi Hãng / Bảo hành</h1>
          <p className="text-slate-500 text-sm">Theo dõi thiết bị được chuyển đến các trung tâm bảo hành</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-2">
          <Plus size={18} /> Tạo Phiếu Gửi
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm theo Serial, hãng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <select className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            {Object.values(WarrantyStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4">Hãng Nhận</th>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTickets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Trống dữ liệu.</td></tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => openModal(ticket)}>
                    <td className="px-6 py-4 font-bold text-slate-700">{ticket.sentDate}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{getOrgName(ticket.organizationId)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <DeviceIcon type={ticket.deviceType} size={16} className="text-blue-500" />
                        <span className="font-bold text-slate-800">{ticket.deviceType}</span>
                      </div>
                      {ticket.serialNumber && <span className="text-[10px] font-mono text-slate-400 font-semibold">SN: {ticket.serialNumber}</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[ticket.status]}`}>{ticket.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-slate-200 group-hover:text-blue-400 transition-colors ml-auto" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 tracking-tight">{editingId ? 'Cập nhật Phiếu Gửi' : 'Phiếu Gửi Hãng Mới'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Đơn vị nhận *</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm" value={formData.organizationId || ''} onChange={(e) => setFormData({...formData, organizationId: e.target.value})}>
                      <option value="">Chọn đơn vị...</option>
                      {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày gửi *</label>
                    <input type="date" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" value={formData.sentDate || ''} onChange={(e) => setFormData({...formData, sentDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Loại thiết bị *</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm" value={formData.deviceType || DeviceType.CODEC} onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}>
                      {Object.values(DeviceType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Số Serial</label>
                    <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" value={formData.serialNumber || ''} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tình trạng/Lỗi</label>
                  <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Trạng thái bảo hành</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {Object.values(WarrantyStatus).map(s => (
                       <button key={s} onClick={() => setFormData({...formData, status: s})} className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${formData.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
                     ))}
                  </div>
                </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 text-slate-400 font-bold text-xs uppercase tracking-widest">Hủy</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-accent hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">Lưu Phiếu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};