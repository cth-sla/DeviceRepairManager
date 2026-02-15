import React, { useState, useEffect } from 'react';
import { WarrantyTicket, WarrantyStatus, Organization, DeviceType, ShippingMethod } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, ChevronLeft, Building2, Coins, Download, Loader2, Barcode, Eye, Trash2 } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';
import { ShippingStatusBadge } from '../components/ShippingStatusBadge';

export const WarrantyPage: React.FC = () => {
  const [tickets, setTickets] = useState<WarrantyTicket[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WarrantyTicket>>({});

  const fetchData = async () => {
    setIsLoading(true);
    const [t, o] = await Promise.all([
      StorageService.getWarrantyTickets(),
      StorageService.getOrganizations()
    ]);
    setTickets(t);
    setOrganizations(o);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getOrgName = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Đơn vị không xác định';
  };

  const handleExport = () => {
    const headers = ["Mã Phiếu", "Ngày Gửi", "Đơn Vị Nhận (Hãng)", "Loại Thiết Bị", "Số Serial", "Mô Tả Lỗi", "Trạng Thái", "Ngày Nhận Lại", "ĐV Vận Chuyển", "Mã Vận Đơn", "Chi Phí", "Ghi Chú"];
    const sortedForExport = [...tickets].sort((a, b) => b.sentDate.localeCompare(a.sentDate));

    const rows = sortedForExport.map(t => {
      return [
        t.id.slice(0, 8), t.sentDate, getOrgName(t.organizationId), t.deviceType, t.serialNumber || '', t.description || '', t.status, t.returnDate || '', t.shippingMethod || '', t.trackingNumber || '', t.cost ? t.cost.toString() : '0', t.note || ''
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_gui_hang_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!formData.organizationId || !formData.deviceType || !formData.sentDate) {
      alert('Vui lòng điền đầy đủ thông tin: Đơn vị, Loại thiết bị, Ngày gửi');
      return;
    }

    const newTicket: WarrantyTicket = {
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
      shippingMethod: formData.shippingMethod as ShippingMethod,
      trackingNumber: formData.trackingNumber,
      
      createdAt: editingId ? (tickets.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    try {
      if (editingId) {
        await StorageService.updateWarrantyTicket(newTicket);
      } else {
        await StorageService.addWarrantyTicket(newTicket);
      }
      await fetchData();
      closeModal();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu phiếu bảo hành');
    }
  };

  const openModal = (ticket?: WarrantyTicket) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({ ...ticket });
    } else {
      setEditingId(null);
      setFormData({
        status: WarrantyStatus.SENT,
        sentDate: new Date().toISOString().split('T')[0],
        deviceType: DeviceType.CODEC,
        description: '',
        serialNumber: '',
        shippingMethod: ShippingMethod.VIETTEL_POST
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu này?')) {
      try {
        await StorageService.deleteWarrantyTicket(id);
        await fetchData();
        if (isModalOpen) closeModal();
      } catch (e) {
        console.error(e);
        alert('Lỗi khi xóa phiếu');
      }
    }
  };

  const statusColors = {
    [WarrantyStatus.SENT]: 'bg-blue-100 text-blue-700 border-blue-200',
    [WarrantyStatus.FIXING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [WarrantyStatus.DONE]: 'bg-green-100 text-green-700 border-green-200',
    [WarrantyStatus.CANNOT_FIX]: 'bg-red-100 text-red-700 border-red-200',
  };

  const filteredTickets = tickets.filter(t => {
    const orgName = getOrgName(t.organizationId);
    const matchesSearch = orgName.toLowerCase().includes(searchTerm.toLowerCase()) || t.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) || (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) || t.id.toLowerCase().includes(searchTerm.toLowerCase()) || (t.trackingNumber && t.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.sentDate.localeCompare(a.sentDate));

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Preview Helpers
  const currentPreviewOrg = organizations.find(o => o.id === formData.organizationId)?.name || 'Chưa chọn đơn vị';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gửi Hãng / Bảo hành</h1>
          <p className="text-slate-500 text-sm">Quản lý thiết bị gửi đi sửa chữa chuyên nghiệp</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
            <Plus size={18} />
            <span>Tạo phiếu gửi</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm theo Serial, đơn vị, mã vận đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select className="flex-1 md:flex-none px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {Object.values(WarrantyStatus).map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Mã / Ngày gửi</th>
                <th className="px-6 py-4 whitespace-nowrap">Gửi tới Đơn vị</th>
                <th className="px-6 py-4 whitespace-nowrap">Thiết bị</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap">Kết quả & Vận chuyển</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <Truck size={48} className="text-slate-200 mb-2" />
                    <span className="font-medium">Chưa có phiếu gửi bảo hành nào.</span>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-blue-500" onClick={() => openModal(ticket)}>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] text-slate-400">#{ticket.id.slice(0, 8)}</div>
                      <div className="font-bold text-slate-700 mt-1 flex items-center gap-1.5 whitespace-nowrap">
                         <Clock size={14} className="text-blue-500"/> {ticket.sentDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <Building2 size={16} className="text-slate-400" />
                         <span className="font-bold text-slate-900 whitespace-nowrap">{getOrgName(ticket.organizationId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold w-fit mb-1 whitespace-nowrap uppercase">
                          <DeviceIcon type={ticket.deviceType} size={14} className="text-slate-500" />
                          {ticket.deviceType}
                        </span>
                        {ticket.serialNumber && (
                           <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 w-fit whitespace-nowrap">
                            SN: {ticket.serialNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[ticket.status]} whitespace-nowrap`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {ticket.returnDate && (
                           <div className="flex items-center gap-1 font-bold text-green-700 text-[10px] whitespace-nowrap">
                              <CheckCircle2 size={12} />
                              {ticket.returnDate}
                           </div>
                        )}
                        {ticket.trackingNumber && (
                          <ShippingStatusBadge carrier={ticket.shippingMethod} trackingNumber={ticket.trackingNumber} />
                        )}
                        {!ticket.returnDate && !ticket.trackingNumber && (
                          <span className="text-slate-300 text-xs italic">Đang chờ xử lý</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors ml-auto" size={18} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>

        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              Hiển thị <span className="font-bold text-slate-900">{startIndex + 1}</span>-
              <span className="font-bold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredTickets.length)}</span> / 
              <span className="font-bold text-slate-900">{filteredTickets.length}</span> phiếu
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-sm">Trang {currentPage} / {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form with Preview Side Pane */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 flex flex-col max-h-[95vh] border border-white/20">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                    <Truck size={20} />
                 </div>
                 <h3 className="font-bold text-xl text-slate-800">
                    {editingId ? 'Cập nhật Phiếu Gửi' : 'Gửi Hãng / Bảo hành'}
                 </h3>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row overflow-hidden flex-1">
              {/* Form Side */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100 space-y-8">
                {/* Send Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-2">1. Thông tin gửi thiết bị</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn vị nhận (Hãng) *</label>
                      <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" value={formData.organizationId || ''} onChange={(e) => setFormData({...formData, organizationId: e.target.value})} >
                        <option value="">-- Chọn đơn vị --</option>
                        {organizations.map(org => (<option key={org.id} value={org.id}>{org.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ngày gửi hãng *</label>
                      <input type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" value={formData.sentDate || ''} onChange={(e) => setFormData({...formData, sentDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Loại thiết bị *</label>
                      <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" value={formData.deviceType || DeviceType.CODEC} onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}>
                        {Object.values(DeviceType).map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số Serial / Model</label>
                      <input type="text" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-mono shadow-sm bg-white" value={formData.serialNumber || ''} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} placeholder="VD: SN12345678" />
                    </div>
                  </div>
                    
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mô tả tình trạng lỗi</label>
                    <textarea rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm bg-white" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="VD: Hỏng cổng nguồn, không nhận mic..." />
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-2">2. Cập nhật tiến độ & Vận đơn</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {Object.values(WarrantyStatus).map((status) => (
                       <label key={status} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${formData.status === status ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                         <input type="radio" name="status" value={status} checked={formData.status === status} onChange={(e) => setFormData({...formData, status: e.target.value as WarrantyStatus})} className="hidden" />
                         <span className="font-bold text-[11px] uppercase tracking-tighter">{status}</span>
                       </label>
                     ))}
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn vị vận chuyển</label>
                        <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-medium" value={formData.shippingMethod || ShippingMethod.VIETTEL_POST} onChange={(e) => setFormData({...formData, shippingMethod: e.target.value as ShippingMethod})}>
                           {Object.values(ShippingMethod).map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1.5">
                          <Barcode size={14} /> Mã vận đơn (Tracking ID)
                        </label>
                        <input type="text" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-mono shadow-sm bg-white" value={formData.trackingNumber || ''} onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})} placeholder="VD: 123456789" />
                      </div>
                    </div>

                    {(formData.status === WarrantyStatus.DONE || formData.status === WarrantyStatus.CANNOT_FIX) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Ngày nhận lại</label>
                          <input type="date" className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm" value={formData.returnDate || ''} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Chi phí (VNĐ)</label>
                          <input type="number" className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-bold" value={formData.cost || ''} onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})} placeholder="0" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ghi chú hãng / Trung tâm</label>
                      <textarea className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm bg-white" rows={2} value={formData.note || ''} onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="VD: Đã thay thế linh kiện, trả bảo hành..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Side Pane */}
              <div className="w-full lg:w-80 bg-slate-50 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <Eye size={18} />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest">Xem trước hiển thị</h4>
                </div>

                {/* Preview Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-white overflow-hidden flex flex-col min-h-[300px] transition-all hover:scale-[1.02]">
                   <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={formData.deviceType || 'Codec'} size={20} className="text-blue-400" />
                        <span className="font-bold text-sm tracking-tight">{formData.deviceType || 'Loại TB'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">#WARRANTY</span>
                   </div>

                   <div className="p-5 flex-1 space-y-5">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gửi tới đơn vị</div>
                        <div className="font-bold text-slate-800 leading-tight">{currentPreviewOrg}</div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ngày gửi đi</div>
                          <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                             <Clock size={14} className="text-blue-500" />
                             {formData.sentDate || '---'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${statusColors[formData.status as WarrantyStatus || WarrantyStatus.SENT]}`}>
                          {formData.status || WarrantyStatus.SENT}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                         {formData.serialNumber ? (
                           <div className="inline-block px-2 py-1 bg-slate-100 rounded-md font-mono text-[10px] font-bold text-slate-500 border border-slate-200">
                             SN: {formData.serialNumber}
                           </div>
                         ) : (
                           <div className="text-[10px] text-red-400 italic font-medium flex items-center gap-1">
                             <AlertCircle size={12} /> Thiếu Số Serial
                           </div>
                         )}
                      </div>

                      {formData.trackingNumber && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-700 uppercase">Vận đơn</span>
                            <span className="text-[10px] font-bold text-blue-600">{formData.shippingMethod}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                            <Truck size={12} /> {formData.trackingNumber}
                          </div>
                        </div>
                      )}

                      {formData.returnDate && (
                        <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Ngày về</span>
                           <span className="text-[10px] font-bold text-green-600">{formData.returnDate}</span>
                        </div>
                      )}
                   </div>

                   <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <div className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Báo cáo hãng</div>
                   </div>
                </div>

                <div className="mt-auto p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                   <div className="flex items-center gap-2 mb-2">
                      <Barcode size={18} />
                      <span className="text-xs font-bold uppercase">Tra cứu tự động</span>
                   </div>
                   <p className="text-[10px] leading-relaxed opacity-90">
                      Khi có mã vận đơn từ {formData.shippingMethod || 'đơn vị vận chuyển'}, hệ thống sẽ tự động cập nhật hành trình trên bảng danh sách.
                   </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-between gap-3 rounded-b-2xl sticky bottom-0 z-10">
              {editingId ? (
                <button onClick={() => handleDelete(editingId)} className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm flex items-center gap-2">
                  <Trash2 size={18} /> Xóa phiếu
                </button>
              ) : (<div></div>)}
              <div className="flex gap-3">
                <button onClick={closeModal} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-all font-bold text-sm">Hủy bỏ</button>
                <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold text-sm shadow-xl shadow-blue-600/20 active:scale-95">
                  {editingId ? 'Cập nhật thay đổi' : 'Lưu và Xuất bản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};