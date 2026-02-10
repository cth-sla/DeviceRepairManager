
import React, { useState, useEffect } from 'react';
import { Customer, RepairTicket, Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Phone, Building2, Trash2, Edit2, X, History, Loader2 } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';
import { Link } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    fullName: '',
    organizationId: '',
    phone: '',
    address: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [custs, orgs, tcks] = await Promise.all([
      StorageService.getCustomers(),
      StorageService.getOrganizations(),
      StorageService.getTickets()
    ]);
    setCustomers(custs);
    setOrganizations(orgs);
    setTickets(tcks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || '---';
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.organizationId) return alert('Vui lòng nhập tên và chọn đơn vị');

    const newCustomer: Customer = {
      id: editingId || crypto.randomUUID(),
      fullName: formData.fullName!,
      organizationId: formData.organizationId!,
      phone: formData.phone || '',
      address: formData.address || '',
      createdAt: editingId ? (customers.find(c => c.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    try {
      if (editingId) {
        await StorageService.updateCustomer(newCustomer);
      } else {
        await StorageService.addCustomer(newCustomer);
      }
      await fetchData();
      closeModal();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu khách hàng');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này? Lưu ý: Mọi phiếu sửa chữa của khách hàng này cũng sẽ bị xóa.')) {
      try {
        await StorageService.deleteCustomer(id);
        await fetchData();
      } catch (error: any) {
        console.error(error);
        if (error.code === '23503') {
          alert('KHÔNG THỂ XÓA: Khách hàng này đang có các Phiếu sửa chữa liên quan. Vui lòng xóa các Phiếu đó trước.');
        } else {
          alert('Có lỗi xảy ra khi xóa khách hàng. Chi tiết: ' + (error.message || 'Lỗi DB'));
        }
      }
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({ fullName: '', organizationId: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const openHistory = (customer: Customer) => {
    setHistoryCustomer(customer);
    setIsHistoryOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOrgName(c.organizationId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customerTickets = historyCustomer 
    ? tickets.filter(t => t.customerId === historyCustomer.id) 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Khách hàng</h1>
          <p className="text-slate-500">Quản lý danh sách người liên hệ tại các đơn vị</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Thêm Khách hàng</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center py-12">
               <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Họ và Tên</th>
                  <th className="px-6 py-3">Đơn vị (Tổ chức)</th>
                  <th className="px-6 py-3">Liên hệ</th>
                  <th className="px-6 py-3">Địa chỉ</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Chưa có dữ liệu khách hàng.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{customer.fullName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 size={14} className="text-blue-500" />
                          {getOrgName(customer.organizationId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {customer.phone || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 max-w-xs truncate">
                          <MapPin size={14} className="text-slate-400" />
                          {customer.address || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openHistory(customer)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            title="Xem lịch sử sửa chữa"
                          >
                            <History size={16} />
                          </button>
                          <button 
                            onClick={() => openModal(customer)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tickets={customerTickets}
        customers={customers}
        organizations={organizations}
        title={`Lịch sử: ${historyCustomer?.fullName} - ${getOrgName(historyCustomer?.organizationId || '')}`}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-lg text-slate-800">
                {editingId ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Đơn vị (Tổ chức) <span className="text-red-500">*</span></label>
                 <select
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                   value={formData.organizationId}
                   onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                 >
                    <option value="">-- Chọn đơn vị --</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                 </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0987..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Số nhà, đường, quận/huyện..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
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
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
