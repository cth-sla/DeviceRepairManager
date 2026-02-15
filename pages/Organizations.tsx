import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Search, MapPin, Building2, Trash2, Edit2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state: 15 items per page as requested
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await StorageService.getOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSave = async () => {
    if (!formData.name?.trim()) return alert('Vui lòng nhập tên đơn vị');

    const newOrg: Organization = {
      id: editingId || crypto.randomUUID(),
      name: formData.name.trim(),
      address: formData.address?.trim() || '',
      createdAt: editingId 
        ? (organizations.find(c => c.id === editingId)?.createdAt || Date.now()) 
        : Date.now()
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
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng kiểm tra kết nối.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('CẢNH BÁO: Xóa đơn vị này có thể xóa tất cả Khách hàng và Phiếu liên quan. Bạn vẫn muốn tiếp tục?')) {
      try {
        await StorageService.deleteOrganization(id);
        await fetchData();
      } catch (error: any) {
        console.error(error);
        if (error.code === '23503') {
          alert('KHÔNG THỂ XÓA: Đơn vị này hiện có dữ liệu liên quan. Vui lòng xóa Khách hàng thuộc đơn vị này trước.');
        } else {
          alert('Có lỗi xảy ra khi xóa dữ liệu.');
        }
      }
    }
  };

  const openModal = (org?: Organization) => {
    if (org) {
      setEditingId(org.id);
      setFormData({ ...org });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', address: '' });
  };

  const filteredOrgs = organizations.filter(o => 
    (o.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOrgs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrgs = filteredOrgs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Đơn vị</h1>
          <p className="text-slate-500 text-sm">Danh sách các cơ quan, tổ chức đối tác hệ thống</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-bold active:scale-95"
        >
          <Plus size={18} />
          <span>Thêm Đơn vị mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tên đơn vị..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
               <Loader2 className="animate-spin text-blue-600" size={40} />
               <p className="text-slate-400 font-medium text-sm">Đang tải danh sách đơn vị...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tên Đơn vị</th>
                  <th className="px-6 py-4">Địa chỉ trụ sở</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 size={48} className="text-slate-200" />
                        <span className="font-medium">Chưa có dữ liệu đơn vị nào được ghi nhận.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                              <Building2 size={20} />
                          </div>
                          <div className="font-bold text-slate-800">{org.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <MapPin size={14} className="text-slate-400" />
                          {org.address || 'Chưa cập nhật địa chỉ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openModal(org)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(org.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
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

        {filteredOrgs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-medium text-slate-500">
              Hiển thị <span className="font-bold text-slate-900">{startIndex + 1}</span>-
              <span className="font-bold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredOrgs.length)}</span> / 
              <span className="font-bold text-slate-900">{filteredOrgs.length}</span> đơn vị
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1} 
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-600 transition-colors shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="text-blue-600" size={20} />
                <h3 className="font-bold text-lg text-slate-800">
                  {editingId ? 'Cập nhật thông tin Đơn vị' : 'Thêm Đơn vị mới'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tên Đơn vị / Tổ chức *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="VD: Công ty TNHH Giải pháp Công nghệ..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Địa chỉ trụ sở</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm"
                  rows={3}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                />
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-all font-bold text-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold text-sm shadow-xl shadow-blue-600/20 active:scale-95"
              >
                {editingId ? 'Cập nhật ngay' : 'Thêm vào hệ thống'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};