
import React, { useState, useEffect } from 'react';
import { Customer, RepairTicket, DeviceType, RepairStatus, ShippingMethod, Organization } from '../types';
import { StorageService } from '../services/storage';
// Added Wrench to the lucide-react imports to fix the identifier error
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, History, Download, ChevronLeft, Loader2, Trash2, Eye, Wrench } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { DeviceIcon } from '../components/DeviceIcon';

export const RepairsPage: React.FC = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyTickets, setHistoryTickets] = useState<RepairTicket[]>([]);

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RepairTicket>>({});

  const fetchData = async () => {
    setIsLoading(true);
    const [t, c, o] = await Promise.all([
      StorageService.getTickets(),
      StorageService.getCustomers(),
      StorageService.getOrganizations()
    ]);
    setTickets(t);
    setCustomers(c);
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

  const getCustomer = (id: string) => customers.find(c => c.id === id);
  
  const getOrgName = (customerId: string) => {
    const customer = getCustomer(customerId);
    if (!customer) return '';
    const org = organizations.find(o => o.id === customer.organizationId);
    return org ? org.name : 'Đơn vị ẩn';
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Xác nhận xóa phiếu sửa chữa này? Thao tác không thể hoàn tác.')) {
      try {
        await StorageService.deleteTicket(id);
        await fetchData();
        if (isModalOpen) closeModal();
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi xóa phiếu.');
      }
    }
  };

  const handleExport = () => {
    const headers = ["Mã Phiếu", "Ngày Nhận", "Khách Hàng", "Đơn Vị", "Liên Hệ", "Thiết Bị", "Serial", "Trạng Thái"];
    const rows = tickets.map(t => {
      const c = getCustomer(t.customerId);
      return [t.id.slice(0,8), t.receiveDate, c?.fullName, getOrgName(t.customerId), c?.phone, t.deviceType, t.serialNumber, t.status];
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Repairs_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleSave = async () => {
    if (!formData.customerId || !formData.deviceType || !formData.receiveDate) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const ticket: RepairTicket = {
      id: editingId || crypto.randomUUID(),
      customerId: formData.customerId,
      deviceType: formData.deviceType as DeviceType,
      serialNumber: formData.serialNumber,
      deviceCondition: formData.deviceCondition || 'Bình thường',
      receiveDate: formData.receiveDate,
      status: formData.status || RepairStatus.RECEIVED,
      returnDate: formData.returnDate,
      returnNote: formData.returnNote,
      shippingMethod: formData.shippingMethod as ShippingMethod,
      createdAt: editingId ? (tickets.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    try {
      if (editingId) await StorageService.updateTicket(ticket);
      else await StorageService.addTicket(ticket);
      await fetchData();
      closeModal();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu phiếu sửa chữa');
    }
  };

  const openModal = (ticket?: RepairTicket) => {
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({ ...ticket });
    } else {
      setEditingId(null);
      setFormData({
        status: RepairStatus.RECEIVED,
        receiveDate: new Date().toISOString().split('T')[0],
        deviceType: DeviceType.CODEC,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const openDetail = (e: React.MouseEvent, ticket: RepairTicket) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const statusColors = {
    [RepairStatus.RECEIVED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RepairStatus.RETURNED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const filteredTickets = tickets.filter(t => {
    const customer = getCustomer(t.customerId);
    const orgName = getOrgName(t.customerId);
    const matchesSearch = customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Sửa chữa</h1>
          <p className="text-slate-500 text-sm">Hồ sơ tiếp nhận và xử lý thiết bị</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
          <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            <span>Tạo phiếu mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo Serial, khách hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          <select 
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-blue-600" size={40} />
             </div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã / Ngày nhận</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    Không tìm thấy phiếu sửa chữa phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const customer = getCustomer(ticket.customerId);
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => openModal(ticket)}>
                      <td className="px-6 py-4">
                        <div className="font-mono text-[10px] text-slate-300">#{ticket.id.slice(0, 8)}</div>
                        <div className="font-bold text-slate-700 mt-1">{ticket.receiveDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{customer?.fullName}</div>
                        <div className="text-[10px] font-bold uppercase text-blue-600/70 tracking-tight">{getOrgName(ticket.customerId)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <DeviceIcon type={ticket.deviceType} size={16} className="text-blue-500" />
                          <span className="font-bold text-slate-800">{ticket.deviceType}</span>
                        </div>
                        {ticket.serialNumber && <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">SN: {ticket.serialNumber}</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={(e) => openDetail(e, ticket)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Eye size={18} /></button>
                          <button onClick={(e) => handleDelete(e, ticket.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                          <ChevronRight className="text-slate-200 group-hover:text-blue-400 transition-colors" size={16} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          )}
        </div>

        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredTickets.length)} / {filteredTickets.length}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50"
              ><ChevronLeft size={16} /></button>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50"
              ><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <TicketDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        ticket={selectedTicket} 
        customer={selectedTicket ? getCustomer(selectedTicket.customerId) || null : null}
        organization={selectedTicket ? (organizations.find(o => o.id === getCustomer(selectedTicket.customerId)?.organizationId) || null) : null}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 tracking-tight">{editingId ? 'Cập nhật Phiếu' : 'Tiếp nhận Thiết bị'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Khách hàng *</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                    >
                      <option value="">Chọn khách hàng...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} ({getOrgName(c.id)})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày tiếp nhận *</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      value={formData.receiveDate || ''}
                      onChange={(e) => setFormData({...formData, receiveDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Loại thiết bị *</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={formData.deviceType || DeviceType.CODEC}
                      onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}
                    >
                      {Object.values(DeviceType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Số Serial</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      value={formData.serialNumber || ''}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="SN..."
                    />
                  </div>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tình trạng/Lỗi mô tả</label>
                  <textarea 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    value={formData.deviceCondition || ''}
                    onChange={(e) => setFormData({...formData, deviceCondition: e.target.value})}
                    placeholder="Mô tả chi tiết tình trạng máy..."
                  />
               </div>

               <div className="pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Quy trình hiện tại</label>
                  <div className="flex flex-wrap gap-2">
                     {Object.values(RepairStatus).map(s => (
                       <button 
                        key={s}
                        onClick={() => setFormData({...formData, status: s})}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${formData.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400'}`}
                       >{s}</button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">Hủy</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-accent hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">Lưu Phiếu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fix: Import Wrench from lucide-react above (line 6)
const WrenchIconPlaceholder = () => (
  <div className="p-6 bg-slate-50 rounded-full text-slate-200 mb-4 border-2 border-slate-100 border-dashed">
    <Wrench size={48} />
  </div>
);
