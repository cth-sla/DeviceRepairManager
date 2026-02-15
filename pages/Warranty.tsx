import React, { useState, useEffect } from 'react';
import { WarrantyTicket, WarrantyStatus, Organization, DeviceType, ShippingMethod } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, ChevronLeft, Building2, Download, Loader2, Barcode, Eye, Trash2 } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';
import { ShippingStatusBadge } from '../components/ShippingStatusBadge';

export const WarrantyPage: React.FC = () => {
  const [tickets, setTickets] = useState<WarrantyTicket[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WarrantyTicket>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [t, o] = await Promise.all([
        StorageService.getWarrantyTickets(),
        StorageService.getOrganizations()
      ]);
      setTickets(t);
      setOrganizations(o);
    } catch (e) {
      console.error("Fetch data error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getOrgName = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Đơn vị không xác định';
  };

  const handleExport = () => {
    const headers = ["Mã Phiếu", "Ngày Gửi", "Đơn Vị Nhận (Hãng)", "Loại Thiết Bị", "Số Serial", "Mô Tả Lỗi", "Trạng Thái", "Ngày Nhận Lại", "ĐV Vận Chuyển", "Mã Vận Đơn", "Chi Phí", "Ghi Chú"];
    const rows = tickets.map(t => {
      return [
        t.id.slice(0, 8), t.sentDate, getOrgName(t.organizationId), t.deviceType, t.serialNumber || '', t.description || '', t.status, t.returnDate || '', t.shippingMethod || '', t.trackingNumber || '', t.cost || '0', t.note || ''
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_bao_hanh_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!formData.organizationId || !formData.deviceType || !formData.sentDate) {
      alert('Vui lòng điền đủ thông tin bắt buộc (Đơn vị, Loại thiết bị, Ngày gửi).');
      return;
    }

    const newTicket: WarrantyTicket = {
      id: editingId || crypto.randomUUID(),
      organizationId: formData.organizationId,
      deviceType: formData.deviceType as DeviceType,
      serialNumber: formData.serialNumber?.trim() || '',
      description: formData.description?.trim() || '',
      sentDate: formData.sentDate,
      status: (formData.status as WarrantyStatus) || WarrantyStatus.SENT,
      returnDate: formData.returnDate || '',
      cost: formData.cost || 0,
      note: formData.note?.trim() || '',
      shippingMethod: (formData.shippingMethod as ShippingMethod) || ShippingMethod.VIETTEL_POST,
      trackingNumber: formData.trackingNumber?.trim() || '',
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
      console.error("Lỗi lưu phiếu bảo hành:", e);
      alert('Có lỗi xảy ra khi lưu phiếu. Vui lòng kiểm tra lại cấu hình Supabase SQL.');
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
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu gửi hãng này?')) {
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
    const matchesSearch = orgName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.trackingNumber && t.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gửi Hãng / Bảo hành</h1>
          <p className="text-slate-500 text-sm">Quản lý thiết bị gửi đi sửa chữa chuyên nghiệp</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
            <Plus size={18} />
            <span>Tạo phiếu gửi</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm theo Serial, đơn vị, mã vận đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select className="flex-1 md:flex-none px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
                    <td className="px-6 py-4 text-slate-700">
                       <DeviceIcon type={ticket.deviceType} size={14} className="inline mr-2 opacity-60" />
                       <span className="font-bold">{ticket.deviceType}</span>
                       {ticket.serialNumber && <div className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {ticket.serialNumber}</div>}
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
                              <CheckCircle2 size={12} /> {ticket.returnDate}
                           </div>
                        )}
                        {ticket.trackingNumber && (
                          <ShippingStatusBadge carrier={ticket.shippingMethod} trackingNumber={ticket.trackingNumber} />
                        )}
                        {!ticket.returnDate && !ticket.trackingNumber && (
                          <span className="text-slate-300 text-xs italic">Đang xử lý</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                         <button onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                           <Trash2 size={18} />
                         </button>
                         <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>

        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500">
              Trang {currentPage} / {totalPages || 1}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 bg-white shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 bg-white shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 flex flex-col max-h-[95vh] border border-white/20">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
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
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Thông tin gửi thiết bị</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn vị nhận (Hãng) *</label>
                      <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" value={formData.organizationId || ''} onChange={(e) => setFormData({...formData, organizationId: e.target.value})} >
                        <option value="">-- Chọn đơn vị --</option>
                        {organizations.map(org => (<option key={org.id} value={org.id}>{org.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ngày gửi hãng *</label>
                      <input type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" value={formData.sentDate || ''} onChange={(e) => setFormData({...formData, sentDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Loại thiết bị *</label>
                      <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" value={formData.deviceType || DeviceType.CODEC} onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}>
                        {Object.values(DeviceType).map(t => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số Serial / Model</label>
                      <input type="text" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-mono bg-white shadow-sm" value={formData.serialNumber || ''} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} placeholder="VD: SN12345678" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Cập nhật tiến độ & Vận đơn</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {Object.values(WarrantyStatus).map((status) => (
                       <label key={status} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${formData.status === status ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                         <input type="radio" name="status" value={status} checked={formData.status === status} onChange={(e) => setFormData({...formData, status: e.target.value as WarrantyStatus})} className="hidden" />
                         <span className="font-bold text-[11px] uppercase tracking-tighter">{status}</span>
                       </label>
                     ))}
                  </div>

                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn vị vận chuyển</label>
                        <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" value={formData.shippingMethod || ShippingMethod.VIETTEL_POST} onChange={(e) => setFormData({...formData, shippingMethod: e.target.value as ShippingMethod})}>
                           {Object.values(ShippingMethod).map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1.5">
                          <Barcode size={14} /> Mã vận đơn (Tracking ID)
                        </label>
                        <input type="text" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase font-mono bg-white" value={formData.trackingNumber || ''} onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})} placeholder="VD: 123456789" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Side */}
              <div className="w-full lg:w-80 bg-slate-50 p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-6">
                  <Eye size={18} />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest">Xem trước</h4>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-white overflow-hidden p-5 space-y-4">
                   <div className="text-[10px] uppercase font-bold text-slate-400">Gửi bảo hành</div>
                   <div className="font-bold text-slate-900 text-lg leading-tight">
                     {organizations.find(o => o.id === formData.organizationId)?.name || 'Chưa chọn đơn vị'}
                   </div>
                   <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                      <DeviceIcon type={formData.deviceType || 'Codec'} size={14} />
                      {formData.deviceType}
                   </div>
                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formData.sentDate}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${statusColors[formData.status as WarrantyStatus || WarrantyStatus.SENT]}`}>
                        {formData.status || 'SENT'}
                      </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 z-10">
                <button onClick={closeModal} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-all font-bold text-sm">Hủy bỏ</button>
                <button onClick={handleSave} className="px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold text-sm shadow-xl active:scale-95">
                  {editingId ? 'Cập nhật' : 'Lưu phiếu'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};