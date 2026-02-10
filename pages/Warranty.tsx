import React, { useState, useEffect } from 'react';
import { WarrantyTicket, WarrantyStatus, Organization, DeviceType } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Truck, ChevronRight, X, ChevronLeft, Building2, Coins, Download, Loader2 } from 'lucide-react';
import { DeviceIcon } from '../components/DeviceIcon';

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

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = () => {
    // 1. Prepare Header
    const headers = [
      "Mã Phiếu", 
      "Ngày Gửi", 
      "Đơn Vị Nhận (Hãng)", 
      "Loại Thiết Bị", 
      "Số Serial", 
      "Mô Tả Lỗi", 
      "Trạng Thái", 
      "Ngày Nhận Lại", 
      "Chi Phí", 
      "Ghi Chú"
    ];

    // 2. Prepare Rows
    // Sort for export as well? Usually good practice to match view.
    const sortedForExport = [...tickets].sort((a, b) => b.sentDate.localeCompare(a.sentDate));

    const rows = sortedForExport.map(t => {
      return [
        t.id.slice(0, 8),
        t.sentDate,
        getOrgName(t.organizationId),
        t.deviceType,
        t.serialNumber || '',
        t.description || '',
        t.status,
        t.returnDate || '',
        t.cost ? t.cost.toString() : '0',
        t.note || ''
      ].map(field => `"${field}"`).join(','); // Quote fields and join with comma
    });

    // 3. Combine with BOM for UTF-8 support
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');

    // 4. Create Blob and Link
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
      deviceType: formData.deviceType,
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiếu này?')) {
      try {
        await StorageService.deleteWarrantyTicket(id);
        await fetchData();
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
    
    const matchesSearch = 
      orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.sentDate.localeCompare(a.sentDate)); // Sort by date descending (newest first)

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gửi Hãng / Bảo hành</h1>
          <p className="text-slate-500">Quản lý thiết bị gửi đi sửa chữa tại các hãng, đơn vị bên ngoài</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Tạo phiếu gửi</span>
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
              placeholder="Tìm theo Serial, đơn vị, mã phiếu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <select 
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.values(WarrantyStatus).map(s => (
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
                <th className="px-6 py-3">Mã phiếu / Ngày gửi</th>
                <th className="px-6 py-3">Gửi tới Đơn vị</th>
                <th className="px-6 py-3">Thiết bị</th>
                <th className="px-6 py-3">Mô tả / Ghi chú</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Ngày về / Chi phí</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                     <div className="flex flex-col items-center">
                        <Truck size={48} className="text-slate-200 mb-2" />
                        <span>Chưa có phiếu gửi hàng nào.</span>
                     </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openModal(ticket)}>
                      {/* Cột 1: Mã + Ngày Gửi */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-400">#{ticket.id.slice(0, 8)}</div>
                        <div className="font-medium text-slate-900 mt-1 flex items-center gap-1">
                           <Clock size={12} className="text-blue-500"/> {ticket.sentDate}
                        </div>
                      </td>
                      
                      {/* Cột 2: Đơn vị */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Building2 size={16} className="text-slate-400" />
                           <span className="font-semibold text-slate-900">{getOrgName(ticket.organizationId)}</span>
                        </div>
                      </td>

                      {/* Cột 3: Thiết bị */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                              <DeviceIcon type={ticket.deviceType} size={16} className="text-slate-500" />
                              <span className="font-medium text-slate-800">{ticket.deviceType}</span>
                           </div>
                          {ticket.serialNumber && (
                             <span className="text-xs font-mono text-slate-600 bg-slate-50 px-1 rounded border border-slate-100 w-fit mt-1 ml-6">
                              SN: {ticket.serialNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Cột 4: Mô tả */}
                      <td className="px-6 py-4">
                         <div className="max-w-[150px] truncate text-slate-600" title={ticket.description}>
                            {ticket.description}
                         </div>
                      </td>

                      {/* Cột 5: Trạng Thái */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>

                      {/* Cột 6: Ngày Về / Chi phí */}
                      <td className="px-6 py-4">
                        {ticket.returnDate ? (
                          <div className="text-xs">
                             <div className="flex items-center gap-1 font-medium text-green-700 mb-1">
                                <CheckCircle2 size={12} />
                                {ticket.returnDate}
                             </div>
                             {ticket.cost ? (
                                <div className="flex items-center gap-1 text-slate-600 font-mono">
                                  <Coins size={12} />
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticket.cost)}
                                </div>
                             ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">---</span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="text-slate-300 ml-auto" size={20} />
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
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
              <h3 className="font-semibold text-lg text-slate-800">
                {editingId ? 'Cập nhật Phiếu Gửi Hãng' : 'Tạo Phiếu Gửi Mới'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Thông tin gửi</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Đơn vị nhận (Hãng/Trung tâm) <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      value={formData.organizationId || ''}
                      onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                    {organizations.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Vui lòng tạo danh sách đơn vị trước.</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Ngày gửi <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.sentDate || ''}
                      onChange={(e) => setFormData({...formData, sentDate: e.target.value})}
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
                  <label className="text-sm font-medium text-slate-700">Mô tả lỗi / Tình trạng</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="VD: Hỏng nguồn, cần thay main..."
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">Theo dõi & Kết quả</h4>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Trạng thái hiện tại</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {Object.values(WarrantyStatus).map((status) => (
                       <label key={status} className={`
                          flex flex-col items-center justify-center gap-1 p-2 rounded-lg border cursor-pointer transition-all text-center
                          ${formData.status === status 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                       `}>
                         <input 
                           type="radio" 
                           name="status" 
                           value={status}
                           checked={formData.status === status}
                           onChange={(e) => setFormData({...formData, status: e.target.value as WarrantyStatus})}
                           className="hidden"
                         />
                         <span className="font-medium text-xs sm:text-sm">{status}</span>
                       </label>
                     ))}
                  </div>
                </div>

                {/* Conditional Fields for DONE status */}
                {(formData.status === WarrantyStatus.DONE || formData.status === WarrantyStatus.CANNOT_FIX) && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Ngày nhận lại</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={formData.returnDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Chi phí (VNĐ)</label>
                         <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={formData.cost || ''}
                          onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Ghi chú thêm</label>
                      <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        rows={2}
                        value={formData.note || ''}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        placeholder="VD: Đã thanh toán, bảo hành 3 tháng..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between rounded-b-xl sticky bottom-0">
               {editingId ? (
                 <button 
                  onClick={() => handleDelete(editingId)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Xóa phiếu
                </button>
               ) : <div></div>}
               
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