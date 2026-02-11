import React, { useState, useEffect } from 'react';
import { Customer, RepairTicket, DeviceType, RepairStatus, ShippingMethod, Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, History, Download, ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';
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
    return org ? org.name : 'Unknown Org';
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the modal
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

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = () => {
    // 1. Prepare Header
    const headers = [
      "Mã Phiếu", 
      "Ngày Nhận", 
      "Tên Khách Hàng", 
      "Đơn Vị", 
      "Số Điện Thoại",
      "Loại Thiết Bị", 
      "Số Serial", 
      "Tình Trạng", 
      "Trạng Thái", 
      "Ngày Trả", 
      "Vận Chuyển", 
      "Ghi Chú"
    ];

    // 2. Prepare Rows
    const rows = tickets.map(t => {
      const c = getCustomer(t.customerId);
      const org = getOrgName(t.customerId);
      return [
        t.id.slice(0, 8),
        t.receiveDate,
        c ? c.fullName : '',
        org,
        c ? `'${c.phone}` : '', // Add quote to prevent Excel auto-formatting as number
        t.deviceType,
        t.serialNumber || '',
        t.deviceCondition,
        t.status,
        t.returnDate || '',
        t.shippingMethod || '',
        t.returnNote || ''
      ].map(field => `"${field}"`).join(','); // Quote fields and join with comma
    });

    // 3. Combine with BOM for UTF-8 support
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');

    // 4. Create Blob and Link
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
    if (!formData.customerId || !formData.deviceType || !formData.receiveDate) {
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
      customerId: formData.customerId,
      deviceType: formData.deviceType as DeviceType,
      serialNumber: formData.serialNumber,
      deviceCondition: formData.deviceCondition || 'Không rõ',
      receiveDate: formData.receiveDate,
      status: formData.status || RepairStatus.RECEIVED,
      
      returnDate: formData.returnDate,
      returnNote: formData.returnNote,
      shippingMethod: formData.shippingMethod as ShippingMethod,
      
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
    
    const matchesSearch = 
      customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Sửa chữa</h1>
          <p className="text-slate-500">Theo dõi quy trình nhận và trả thiết bị</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo Serial, khách hàng, đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select 
              className="flex-1 md:flex-none px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.values(RepairStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Mã phiếu / Ngày nhận</th>
                <th className="px-6 py-3 whitespace-nowrap">Khách hàng</th>
                <th className="px-6 py-3 whitespace-nowrap">Thiết bị</th>
                <th className="px-6 py-3 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-3 whitespace-nowrap">Ngày trả / Vận chuyển</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <WrenchIconPlaceholder />
                    <span className="mt-2">Chưa có phiếu sửa chữa nào.</span>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const customer = getCustomer(ticket.customerId);
                  const orgName = getOrgName(ticket.customerId);

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openModal(ticket)}>
                      {/* Cột 1: Mã + Ngày Nhận */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400">#{ticket.id.slice(0, 8)}</div>
                        <div className="font-medium text-slate-900 mt-1 flex items-center gap-1 whitespace-nowrap">
                           <Clock size={12} className="text-blue-500"/> {ticket.receiveDate}
                        </div>
                      </td>
                      
                      {/* Cột 2: Khách Hàng */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 whitespace-nowrap">{customer?.fullName || 'Unknown'}</div>
                        <div className="text-slate-500 text-xs mt-1 font-medium text-blue-600 whitespace-nowrap">{orgName}</div>
                      </td>

                      {/* Cột 3: Thiết bị */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium w-fit mb-1 whitespace-nowrap">
                            <DeviceIcon type={ticket.deviceType} size={14} className="text-slate-500" />
                            {ticket.deviceType}
                          </span>
                          {ticket.serialNumber && (
                             <span className="text-xs font-mono text-slate-600 bg-slate-50 px-1 rounded border border-slate-100 w-fit whitespace-nowrap">
                              SN: {ticket.serialNumber}
                            </span>
                          )}
                          <div className="text-slate-500 text-xs mt-1 max-w-[150px] truncate" title={ticket.deviceCondition}>
                            {ticket.deviceCondition}
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Trạng Thái */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status]} whitespace-nowrap`}>
                          {ticket.status}
                        </span>
                      </td>

                      {/* Cột 5: Ngày Trả / Vận Chuyển (Explicit) */}
                      <td className="px-6 py-4">
                        {ticket.status === RepairStatus.RETURNED ? (
                          <div className="text-xs">
                             <div className="flex items-center gap-1 font-medium text-green-700 mb-1 whitespace-nowrap">
                                <CheckCircle2 size={12} />
                                {ticket.returnDate}
                             </div>
                            <div className="flex items-center gap-1 text-slate-600 whitespace-nowrap">
                              <Truck size={12} />
                              {ticket.shippingMethod}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">---</span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={(e) => openDeviceHistory(e, ticket)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Xem lịch sử thiết bị"
                          >
                            <History size={18} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, ticket.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Xóa phiếu"
                          >
                            <Trash2 size={18} />
                          </button>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
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

        {/* Pagination Footer */}
        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium">{startIndex + 1}</span> đến <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredTickets.length)}</span> trong tổng số <span className="font-medium">{filteredTickets.length}</span> phiếu
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700">
                Trang {currentPage} / {totalPages || 1}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tickets={historyTickets}
        customers={customers}
        organizations={organizations}
        title={historyTitle}
      />

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
              <h3 className="font-semibold text-lg text-slate-800">
                {editingId ? 'Cập nhật Phiếu Sửa Chữa' : 'Tạo Phiếu Mới'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Thông tin nhận</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Khách hàng <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      disabled={customers.length === 0}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map(c => {
                         const orgName = getOrgName(c.id);
                         return (
                           <option key={c.id} value={c.id}>{c.fullName} - {orgName}</option>
                         );
                      })}
                    </select>
                    {customers.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Vui lòng tạo khách hàng trước.</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Ngày nhận <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.receiveDate || ''}
                      onChange={(e) => setFormData({...formData, receiveDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Loại thiết bị <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      value={formData.deviceType || DeviceType.CODEC}
                      onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}
                    >
                      {Object.values(DeviceType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Số Serial / Model</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.serialNumber || ''}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="VD: SN12345678"
                    />
                  </div>
                </div>
                  
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Tình trạng khi nhận</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.deviceCondition || ''}
                    onChange={(e) => setFormData({...formData, deviceCondition: e.target.value})}
                    placeholder="VD: Không lên nguồn, vỡ kính..."
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Xử lý & Trả hàng</h4>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Trạng thái hiện tại</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     {Object.values(RepairStatus).map((status) => (
                       <label key={status} className={`
                          flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                          ${formData.status === status 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                       `}>
                         <input 
                           type="radio" 
                           name="status" 
                           value={status}
                           checked={formData.status === status}
                           onChange={(e) => setFormData({...formData, status: e.target.value as RepairStatus})}
                           className="hidden"
                         />
                         <span className="font-medium text-sm">{status}</span>
                       </label>
                     ))}
                  </div>
                </div>

                {/* Conditional Fields for RETURNED status */}
                {formData.status === RepairStatus.RETURNED && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-2 text-green-800 text-sm mb-2">
                      <Truck size={16} className="mt-0.5" />
                      <span>Thông tin người nhận sẽ được lấy tự động từ dữ liệu khách hàng.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Ngày trả <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                          value={formData.returnDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Đơn vị vận chuyển <span className="text-red-500">*</span></label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                          value={formData.shippingMethod || ShippingMethod.VIETTEL_POST}
                          onChange={(e) => setFormData({...formData, shippingMethod: e.target.value as ShippingMethod})}
                        >
                           {Object.values(ShippingMethod).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Ghi chú trả hàng</label>
                      <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                        rows={2}
                        value={formData.returnNote || ''}
                        onChange={(e) => setFormData({...formData, returnNote: e.target.value})}
                        placeholder="VD: Đã thay main, kèm dây nguồn..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3 rounded-b-xl sticky bottom-0">
              {editingId ? (
                <button 
                  onClick={(e) => handleDelete(e, editingId)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Xóa Phiếu
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
                >
                  Lưu Phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple placeholder icon
const WrenchIconPlaceholder = () => (
  <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);