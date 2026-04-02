import React, { useState, useEffect } from 'react';
import { Plus, Search, FileEdit, Trash2, Download, Upload, Package, Filter, X, Save } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Device, DeviceType } from '../types';
import * as XLSX from 'xlsx';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    deviceType: DeviceType.CODEC,
    quantity: 1,
    startTime: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    const data = await StorageService.getDevices();
    setDevices(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        const updatedDevice: Device = {
          ...editingDevice,
          ...formData
        };
        await StorageService.updateDevice(updatedDevice);
      } else {
        const newDevice: Device = {
          id: crypto.randomUUID(),
          ...formData,
          createdAt: Date.now()
        };
        await StorageService.addDevice(newDevice);
      }
      setIsModalOpen(false);
      setEditingDevice(null);
      resetForm();
      loadDevices();
    } catch (error) {
      console.error('Error saving device:', error);
      alert('Có lỗi xảy ra khi lưu thiết bị');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      try {
        await StorageService.deleteDevice(id);
        loadDevices();
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      serialNumber: '',
      deviceType: DeviceType.CODEC,
      quantity: 1,
      startTime: new Date().toISOString().split('T')[0]
    });
  };

  const openAddModal = () => {
    setEditingDevice(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      serialNumber: device.serialNumber,
      deviceType: device.deviceType,
      quantity: device.quantity,
      startTime: device.startTime
    });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const exportData = devices.map(d => ({
      'Tên thiết bị': d.name,
      'Serial': d.serialNumber,
      'Loại thiết bị': d.deviceType,
      'Số lượng': d.quantity,
      'Thời gian bắt đầu': d.startTime
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Devices');
    XLSX.writeFile(wb, 'Danh_sach_thiet_bi.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newDevices: Device[] = data.map(item => ({
          id: crypto.randomUUID(),
          name: item['Tên thiết bị'] || item['name'] || 'Không tên',
          serialNumber: item['Serial'] || item['serialNumber'] || '',
          deviceType: (item['Loại thiết bị'] || item['deviceType'] || DeviceType.OTHER) as DeviceType,
          quantity: Number(item['Số lượng'] || item['quantity'] || 1),
          startTime: item['Thời gian bắt đầu'] || item['startTime'] || new Date().toISOString().split('T')[0],
          createdAt: Date.now()
        }));

        for (const device of newDevices) {
          await StorageService.addDevice(device);
        }
        loadDevices();
        alert(`Đã import thành công ${newDevices.length} thiết bị`);
      } catch (error) {
        console.error('Error importing excel:', error);
        alert('Lỗi khi import Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.deviceType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Thiết bị</h1>
          <p className="text-slate-500">Danh sách thiết bị trong hệ thống</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download size={18} />
            <span>Xuất Excel</span>
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer">
            <Upload size={18} />
            <span>Nhập Excel</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
          </label>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} />
            <span>Thêm thiết bị</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc serial..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả loại thiết bị</option>
            {Object.values(DeviceType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end text-sm text-slate-500">
          Tổng số: <span className="font-bold text-slate-900 ml-1">{filteredDevices.length}</span> thiết bị
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Thiết bị</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Serial</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Loại</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Số lượng</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bắt đầu</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} className="opacity-20" />
                      <span>Không tìm thấy thiết bị nào</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{device.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                        {device.serialNumber || 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {device.deviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {device.quantity}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {device.startTime}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(device)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(device.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tên thiết bị</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Serial</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Loại thiết bị</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.deviceType}
                    onChange={(e) => setFormData({...formData, deviceType: e.target.value as DeviceType})}
                  >
                    {Object.values(DeviceType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Số lượng</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Thời gian bắt đầu</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                >
                  <Save size={18} />
                  <span>Lưu lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
