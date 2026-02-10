import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Building2, Trash2, Edit2, X, Loader2 } from 'lucide-react';

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
    if (window.confirm('CẢNH BÁO: Xóa đơn vị này có thể xóa tất cả Khách hàng và Phiếu liên quan. Bạn vẫn muốn xóa?')) {
      try {
        await StorageService.deleteOrganization(id);
        await fetchData();
      } catch (error: any) {
        console.error(error);
        if (error.code === '23503') {
          alert('KHÔNG THỂ XÓA: Đơn vị này hiện có các Khách hàng hoặc Phiếu bảo hành liên quan. Vui lòng xóa các dữ liệu liên quan trước.');
        } else {
          alert('Có lỗi xảy ra khi xóa dữ liệu.');
        }
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
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Đơn vị</h1>
          <p className="text-slate-500">Danh sách các cơ quan, tổ chức đối tác</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-semibold"
        >
          <Plus size={18} />
          <span>Thêm Đơn vị</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-4 border-b border-red-100 bg-red-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tên đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
               <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-red-50/50 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Tên Đơn vị</th>
                  <th className="px-6 py-3">Địa chỉ</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-italic">
                      Chưa có dữ liệu đơn vị.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                              <Building2 size={20} />
                          </div>
                          <div className="font-bold text-slate-900">{org.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin size={14} className="text-red-400" />
                          {org.address || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openModal(org)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(org.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-lg text-red-900">
                {editingId ? 'Cập nhật Đơn vị' : 'Thêm Đơn vị mới'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Tên Đơn vị <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Tập đoàn ABC..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Địa chỉ</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Địa chỉ trụ sở chính..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-bold text-xs uppercase"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-bold text-xs uppercase shadow-sm"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};