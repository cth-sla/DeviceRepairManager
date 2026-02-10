import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Building2, Trash2, Edit2, X, Loader2, ChevronRight } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    address: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    const data = await StorageService.getOrganizations();
    setOrganizations(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Vui lòng nhập tên đơn vị');

    const newOrg: Organization = {
      id: editingId || crypto.randomUUID(),
      name: formData.name!,
      address: formData.address || '',
      createdAt: editingId ? (organizations.find(c => c.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    try {
      if (editingId) {
        await StorageService.updateOrganization(newOrg);
      } else {
        await StorageService.addOrganization(newOrg);
      }
      await fetchData();
      closeModal();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Cảnh báo: Xóa đơn vị sẽ ảnh hưởng đến các dữ liệu liên quan. Bạn chắc chắn muốn xóa?')) {
      try {
        await StorageService.deleteOrganization(id);
        await fetchData();
      } catch (error: any) {
        console.error(error);
        alert('Lỗi: Đơn vị đang có dữ liệu ràng buộc.');
      }
    }
  };

  const openModal = (org?: Organization) => {
    if (org) {
      setEditingId(org.id);
      setFormData(org);
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Đơn vị</h1>
          <p className="text-slate-500 text-sm">Danh sách đối tác và khách hàng doanh nghiệp</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} />
          <span>Thêm Đơn vị</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
               <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Thông tin Đơn vị</th>
                  <th className="px-6 py-4">Địa chỉ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                      Chưa có dữ liệu cơ sở.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                              <Building2 size={20} />
                          </div>
                          <div className="font-bold text-slate-900">{org.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={14} className="text-slate-300" />
                          <span className="text-xs">{org.address || 'Chưa cập nhật'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openModal(org)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(org.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 tracking-tight">{editingId ? 'Cập nhật Đơn vị' : 'Thêm Đơn vị mới'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tên Đơn vị *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Tên cơ quan, tổ chức..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Địa chỉ trụ sở</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Địa chỉ chi tiết..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Hủy</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-primary text-white hover:bg-slate-800 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};