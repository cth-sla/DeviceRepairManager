import React, { useState, useEffect } from 'react';
import { Customer, RepairTicket, Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Phone, Building2, Trash2, Edit2, X, History, Loader2, ChevronRight } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
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

  useEffect(() => { fetchData(); }, []);

  const getOrgName = (orgId: string) => organizations.find(o => o.id === orgId)?.name || 'Cá nhân';

  const handleSave = async () => {
    if (!formData.fullName || !formData.organizationId) return alert('Thiếu thông tin bắt buộc');
    const customer: Customer = {
      id: editingId || crypto.randomUUID(),
      fullName: formData.fullName!,
      organizationId: formData.organizationId!,
      phone: formData.phone || '',
      address: formData.address || '',
      createdAt: editingId ? (customers.find(c => c.id === editingId)?.createdAt || Date.now()) : Date.now()
    };
    try {
      if (editingId) await StorageService.updateCustomer(customer);
      else await StorageService.addCustomer(customer);
      await fetchData();
      closeModal();
    } catch (e) { alert('Lỗi lưu khách hàng'); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa khách hàng này?')) {
      try {
        await StorageService.deleteCustomer(id);
        await fetchData();
      } catch (e) { alert('Lỗi xóa khách hàng.'); }
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

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setFormData({}); };

  const openHistory = (customer: Customer) => { setHistoryCustomer(customer); setIsHistoryOpen(true); };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOrgName(c.organizationId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-slate-500 text-sm">Danh bạ người liên hệ đại diện đơn vị</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10">
          <Plus size={18} /> Thêm Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Họ và Tên</th>
                  <th className="px-6 py-4">Đơn vị</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Trống dữ liệu.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">{customer.fullName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                          <Building2 size={14} className="text-blue-400" /> {getOrgName(customer.organizationId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                          <Phone size={14} className="text-slate-300" /> {customer.phone || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openHistory(customer)} className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><History size={16} /></button>
                          <button onClick={() => openModal(customer)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(customer.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                          <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-400 transition-colors ml-1" />
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
        isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}
        tickets={historyCustomer ? tickets.filter(t => t.customerId === historyCustomer.id) : []}
        customers={customers} organizations={organizations} title={`Lịch sử: ${historyCustomer?.fullName}`}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 tracking-tight">{editingId ? 'Sửa Khách hàng' : 'Thêm Khách hàng'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Đơn vị *</label>
                 <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm" value={formData.organizationId} onChange={(e) => setFormData({...formData, organizationId: e.target.value})}>
                    <option value="">Chọn đơn vị...</option>
                    {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Họ và tên *</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Số điện thoại</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Địa chỉ liên hệ</label>
                <textarea className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Hủy</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-accent hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};