import React, { useState, useEffect } from 'react';
import { Customer, RepairTicket, DeviceType, RepairStatus, ShippingMethod, Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, History, Download, ChevronLeft, Loader2, Trash2, UserPlus, UserCheck, Barcode, Eye } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';
import { DeviceIcon } from '../components/DeviceIcon';
import { ShippingStatusBadge } from '../components/ShippingStatusBadge';

export const RepairsPage: React.FC = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyTickets, setHistoryTickets] = useState<RepairTicket[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RepairTicket>>({});
  
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<Partial<Customer>>({
    fullName: '',
    organizationId: '',
    phone: '',
    address: ''
  });

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getCustomer = (id: string) => customers.find(c => c.id === id);
  
  const getOrgName = (customerId: string) => {
    const customer = getCustomer(customerId);
    if (!customer) return '';
    const org = organizations.find(o => o.id === customer.organizationId);
    return org ? org.name : 'Unknown Org';
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu sửa chữa này không?')) {
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
    const headers = ["Mã Phiếu", "Ngày Nhận", "Tên Khách Hàng", "Đơn Vị", "Số Điện Thoại", "Loại Thiết Bị", "Số Serial", "Tình Trạng", "Trạng Thái", "Ngày Trả", "Vận Chuyển", "Mã Vận Đơn", "Ghi Chú"];
    const rows = tickets.map(t => {
      const c = getCustomer(t.customerId);
      const org = getOrgName(t.customerId);
      return [
        t.id.slice(0, 8), t.receiveDate, c ? c.fullName : '', org, c ? `'${c.phone}` : '', t.deviceType, t.serialNumber || '', t.deviceCondition, t.status, t.returnDate || '', t.shippingMethod || '', t.trackingNumber || '', t.returnNote || ''
      ].map(field => `"${field}"`).join(',');
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_sua_chua_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    let finalCustomerId = formData.customerId;

    if (isAddingNewCustomer) {
      if (!newCustomerData.fullName || !newCustomerData.organizationId) {
        alert('Vui lòng nhập tên khách hàng và chọn đơn vị cho khách hàng mới');
        return;
      }
      
      const newCustId = crypto.randomUUID();
      const customerToSave: Customer = {
        id: newCustId,
        fullName: newCustomerData.fullName!,
        organizationId: newCustomerData.organizationId!,
        phone: newCustomerData.phone || '',
        // Fixed: Use newCustomerData.address instead of undefined variable 'e'
        address: newCustomerData.address || '',
        createdAt: Date.now()
      };
      
      try {
        await StorageService.addCustomer(customerToSave);
        finalCustomerId = newCustId;
        setCustomers(prev => [customerToSave, ...prev]);
      } catch (e) {
        console.error(e);
        alert('Lỗi khi lưu thông tin khách hàng mới');
        return;
      }
    }

    if (!finalCustomerId || !formData.deviceType || !formData.receiveDate) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.status === RepairStatus.RETURNED) {
      if (!formData.returnDate || !formData.shippingMethod) {
        alert('Khi trạng thái là "Đã trả", vui lòng nhập ngày trả và đơn vị vận chuyển.');
        return;
      }
    }

    const newTicket: RepairTicket = {
      id: editingId || crypto.randomUUID(),
      customerId: finalCustomerId,
      deviceType: formData.deviceType as DeviceType,
      serialNumber: formData.serialNumber,
      deviceCondition: formData.deviceCondition || 'Không rõ',
      receiveDate: formData.receiveDate,
      status: formData.status || RepairStatus.RECEIVED,
      returnDate: formData.returnDate,
      returnNote: formData.returnNote,
      shippingMethod: formData.shippingMethod as ShippingMethod,
      trackingNumber: formData.trackingNumber,
      createdAt: editingId ? (tickets.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };

    try {
      if (editingId) {
        await StorageService.updateTicket(newTicket);
      } else {
        await StorageService.addTicket(newTicket);
      }
      await fetchData();
      closeModal();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu phiếu sửa chữa');
    }
  };

  const openModal = (ticket?: RepairTicket) => {
    setIsAddingNewCustomer(false);
    setNewCustomerData({ fullName: '', organizationId: '', phone: '', address: '' });
    
    if (ticket) {
      setEditingId(ticket.id);
      setFormData({ ...ticket });
    } else {
      setEditingId(null);
      setFormData({
        status: RepairStatus.RECEIVED,
        receiveDate: new Date().toISOString().split('T')[0],
        deviceType: DeviceType.CODEC,
        deviceCondition: '',
        serialNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const openDeviceHistory = (e: React.MouseEvent, ticket: RepairTicket) => {
    e.stopPropagation(); 
    let matches: RepairTicket[] = [];
    let title = '';
    if (ticket.serialNumber) {
      matches = tickets.filter(t => t.serialNumber === ticket.serialNumber);
      title = `Lịch sử thiết bị: ${ticket.deviceType} - SN: ${ticket.serialNumber}`;
    } else {
      matches = tickets.filter(t => t.customerId === ticket.customerId && t.deviceType === ticket.deviceType);
      const c = getCustomer(ticket.customerId);
      title = `Lịch sử: ${ticket.deviceType} của ${c?.fullName || 'Khách hàng'}`;
    }
    setHistoryTickets(matches);
    setHistoryTitle(title);
    setIsHistoryOpen(true);
  };

  const statusColors = {
    [RepairStatus.RECEIVED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RepairStatus.RETURNED]: 'bg-green-100 text-green-700 border-green-200',
  };

  const filteredTickets = tickets.filter(t => {
    const customer = getCustomer(t.customerId);
    const orgName = getOrgName(t.customerId);
    const matchesSearch = customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || orgName.toLowerCase().includes(searchTerm.toLowerCase()) || t.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) || (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) || t.id.toLowerCase().includes(searchTerm.toLowerCase()) || (t.trackingNumber && t.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Helper for Modal Preview
  const currentPreviewCustomer = isAddingNewCustomer 
    ? newCustomerData.fullName || 'Đang nhập tên...' 
    : getCustomer(formData.customerId || '')?.fullName || 'Chưa chọn khách hàng';
    
  const currentPreviewOrg = isAddingNewCustomer
    ? (organizations.find(o => o.id === newCustomerData.organizationId)?.name || 'Chưa chọn đơn vị')
    : (getOrgName(formData.customerId || '') || '---');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Sửa chữa</h1>
          <p className="text-slate-500 text-sm">Theo dõi quy trình nhận và trả thiết bị chuyên nghiệp</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
            <Plus size={18} />
            <span>Tạo phiếu mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm theo Serial, khách hàng, đơn vị..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select className="flex-1 md:flex-none px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              {Object.values(RepairStatus).map(s => (<option key={s} value={s}>{s}</option>))}
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
                <th className="px-6 py-4 whitespace-nowrap">Mã / Ngày nhận</th>
                <th className="px-6 py-4 whitespace-nowrap">Khách hàng</th>
                <th className="px-6 py-4 whitespace-nowrap">Thiết bị</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap">Trả hàng & Vận chuyển</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <WrenchIconPlaceholder />
                    <span className="mt-2 font-medium">Không tìm thấy phiếu sửa chữa nào.</span>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const customer = getCustomer(ticket.customerId);
                  const orgName = getOrgName(ticket.customerId);
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer border-l-2 border-l-transparent hover:border-l-blue-500" onClick={() => openModal(ticket)}>
                      <td className="px-6 py-4">
                        <div className="font-mono text-[10px] text-slate-400">#{ticket.id.slice(0, 8)}</div>
                        <div className="font-bold text-slate-700 mt-1 flex items-center gap-1.5 whitespace-nowrap">
                           <Clock size={14} className="text-blue-500"/> {ticket.receiveDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 whitespace-nowrap">{customer?.fullName || '---'}</div>
                        <div className="text-blue-600 text-[11px] mt-0.5 font-bold uppercase tracking-tight">{orgName}</div>
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
                        {ticket.status === RepairStatus.RETURNED ? (
                          <div className="space-y-1.5">
                             <div className="flex items-center gap-1 font-bold text-green-700 text-[10px] whitespace-nowrap">
                                <CheckCircle2 size={12} />
                                {ticket.returnDate}
                             </div>
                             <ShippingStatusBadge carrier={ticket.shippingMethod} trackingNumber={ticket.trackingNumber} />
                          </div>
                        ) : (<span className="text-slate-300 text-xs italic">Chưa trả hàng</span>)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button onClick={(e) => openDeviceHistory(e, ticket)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Lịch sử thiết bị">
                            <History size={18} />
                          </button>
                          <button onClick={(e) => handleDelete(e, ticket.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Xóa">
                            <Trash2 size={18} />
                          </button>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors ml-1" size={18} />
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

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} tickets={historyTickets} customers={customers} organizations={organizations} title={historyTitle} />

      {/* Modal Form with Preview Side Pane */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 flex flex-col max-h-[95vh] border border-white/20">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
                    <Wrench size={20} />
                 </div>
                 <h3 className="font-bold text-xl text-slate-800">
                    {editingId ? 'Cập nhật Phiếu' : 'Tiếp nhận Thiết bị'}
                 </h3>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row overflow-hidden flex-1">
              {/* Form Side */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100 space-y-8">
                {/* Customer Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">1. Thông tin tiếp nhận</h4>
                    {!editingId && (
                      <button 
                        type="button"
                        onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                          isAddingNewCustomer 
                          ? 'bg-amber-100 text-amber-700 border-amber-200' 
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isAddingNewCustomer ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        {isAddingNewCustomer ? 'Chọn lại danh sách' : 'Khách hàng mới'}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {isAddingNewCustomer ? (
                      <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tên khách hàng *</label>
                            <input type="text" placeholder="Nguyễn Văn A" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm" value={newCustomerData.fullName || ''} onChange={(e) => setNewCustomerData({...newCustomerData, fullName: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Đơn vị *</label>
                            <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm" value={newCustomerData.organizationId || ''} onChange={(e) => setNewCustomerData({...newCustomerData, organizationId: e.target.value})} >
                              <option value="">-- Chọn đơn vị --</option>
                              {organizations.map(org => (<option key={org.id} value={org.id}>{org.name}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Số điện thoại</label>
                            <input type="text" placeholder="09xx..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm" value={newCustomerData.phone || ''} onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Địa chỉ</label>
                            <input type="text" placeholder="Thành phố..." className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm" value={newCustomerData.address || ''} onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Chọn Khách hàng *</label>
                          <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" value={formData.customerId || ''} onChange={(e) => setFormData({...formData, customerId: e.target.value})} disabled={customers.length === 0} >
                            <option value="">-- Chọn khách hàng --</option>
                            {customers.map(c => (<option key={c.id} value={c.id}>{c.fullName} - {getOrgName(c.id)}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ngày tiếp nhận *</label>
                          <input type="date" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" value={formData.receiveDate || ''} onChange={(e) => setFormData({...formData, receiveDate: e.target.value})} />
                        </div>
                      </div>
                    )}
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tình trạng mô tả</label>
                    <textarea rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm bg-white" value={formData.deviceCondition || ''} onChange={(e) => setFormData({...formData, deviceCondition: e.target.value})} placeholder="VD: Mất nguồn, sọc màn hình..." />
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-2">2. Cập nhật tiến độ</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {Object.values(RepairStatus).map((status) => (
                       <label key={status} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.status === status ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                         <input type="radio" name="status" value={status} checked={formData.status === status} onChange={(e) => setFormData({...formData, status: e.target.value as RepairStatus})} className="hidden" />
                         <span className="font-bold text-sm">{status}</span>
                       </label>
                     ))}
                  </div>

                  {formData.status === RepairStatus.RETURNED && (
                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Ngày xuất kho *</label>
                          <input type="date" className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm" value={formData.returnDate || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Kênh giao hàng *</label>
                          <select className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-medium" value={formData.shippingMethod || ShippingMethod.VIETTEL_POST} onChange={(e) => setFormData({...formData, shippingMethod: e.target.value as ShippingMethod})}>
                             {Object.values(ShippingMethod).map(m => (<option key={m} value={m}>{m}</option>))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1 flex items-center gap-1.5">
                          <Barcode size={14} /> Mã vận đơn (Tracking ID)
                        </label>
                        <input type="text" className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 uppercase font-mono shadow-sm bg-white" value={formData.trackingNumber || ''} onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})} placeholder="VD: 123456789" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Ghi chú xuất xưởng</label>
                        <textarea className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-sm bg-white" rows={2} value={formData.returnNote || ''} onChange={(e) => setFormData({...formData, returnNote: e.target.value})} placeholder="VD: Đã thay linh kiện chính hãng, tặng kèm bao da..." />
                      </div>
                    </div>
                  )}
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
                   {/* Header of Preview */}
                   <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={formData.deviceType || 'Codec'} size={20} className="text-blue-400" />
                        <span className="font-bold text-sm tracking-tight">{formData.deviceType || 'Tên thiết bị'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">#PREVIEW</span>
                   </div>

                   {/* Content of Preview */}
                   <div className="p-5 flex-1 space-y-5">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Khách hàng / Đơn vị</div>
                        <div className="font-bold text-slate-800 leading-tight">{currentPreviewCustomer}</div>
                        <div className="text-[11px] font-bold text-blue-600 uppercase">{currentPreviewOrg}</div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ngày nhận</div>
                          <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                             <Clock size={14} className="text-blue-500" />
                             {formData.receiveDate || '---'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${statusColors[formData.status as RepairStatus || RepairStatus.RECEIVED]}`}>
                          {formData.status || RepairStatus.RECEIVED}
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

                      {formData.status === RepairStatus.RETURNED && (
                        <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-green-700 uppercase">Xuất kho</span>
                            <span className="text-[10px] font-bold text-green-600">{formData.returnDate}</span>
                          </div>
                          {formData.trackingNumber && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                              <Truck size={12} /> {formData.shippingMethod}: {formData.trackingNumber}
                            </div>
                          )}
                        </div>
                      )}
                   </div>

                   {/* Footer of Preview */}
                   <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <div className="text-[9px] text-slate-400 font-medium">Phiếu hiển thị trên hệ thống</div>
                   </div>
                </div>

                {/* Quick Helper */}
                <div className="mt-auto space-y-2">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-amber-700 font-bold leading-normal">
                      Vui lòng rà soát lại thông tin khách hàng và số Serial trước khi lưu để đảm bảo dữ liệu thống nhất.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-between gap-3 rounded-b-2xl sticky bottom-0 z-10">
              {editingId ? (
                <button onClick={(e) => handleDelete(e, editingId)} className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm flex items-center gap-2">
                  <Trash2 size={18} /> Xóa phiếu này
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

const WrenchIconPlaceholder = () => (
  <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const Wrench = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);