import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, Search, FileEdit, Trash2, Download, Upload, Package, Filter, X, Save, QrCode, Eye, Printer, Copy, Check } from 'lucide-react';
import { StorageService } from '../services/storage';
import { Device, DeviceType, Organization } from '../types';
import { DeviceIcon } from '../components/DeviceIcon';
import * as XLSX from 'xlsx';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOverview, setShowOverview] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDeviceForQr, setSelectedDeviceForQr] = useState<Device | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ITEMS_PER_PAGE = 10;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    deviceType: DeviceType.CODEC,
    quantity: 1,
    startTime: new Date().toISOString().split('T')[0],
    organizationId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [devicesData, orgsData] = await Promise.all([
      StorageService.getDevices(),
      StorageService.getOrganizations()
    ]);
    setDevices(devicesData);
    setOrganizations(orgsData);
    setLoading(false);
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && devices.length > 0) {
      const found = devices.find(d => d.id === id);
      if (found) {
        setSelectedDeviceForQr(found);
        setIsQrModalOpen(true);
      }
    }
  }, [searchParams, devices]);

  const handlePrintQr = () => {
    if (!selectedDeviceForQr) return;
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const qrImageSrc = canvas.toDataURL('image/png');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const org = organizations.find(o => o.id === selectedDeviceForQr.organizationId)?.name || '---';
      printWindow.document.write(`
        <html>
          <head>
            <title>In nhãn QR - ${selectedDeviceForQr.name}</title>
            <style>
              body {
                font-family: 'Inter', system-ui, sans-serif;
                margin: 0;
                padding: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100vh;
              }
              .label-card {
                border: 2px dashed #cbd5e1;
                padding: 20px;
                border-radius: 12px;
                max-width: 300px;
                background: white;
              }
              .app-title {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #64748b;
                margin-bottom: 8px;
              }
              .device-name {
                font-size: 18px;
                font-weight: bold;
                color: #0f172a;
                margin-bottom: 2px;
              }
              .device-type {
                font-size: 11px;
                font-weight: bold;
                color: #2563eb;
                text-transform: uppercase;
                margin-bottom: 12px;
              }
              .qr-image {
                width: 155px;
                height: 155px;
                margin: 10px 0;
              }
              .device-serial {
                font-family: monospace;
                font-size: 13px;
                background: #f1f5f9;
                padding: 4px 8px;
                border-radius: 4px;
                color: #334155;
                font-weight: bold;
                display: inline-block;
                margin-top: 5px;
              }
              .device-org {
                font-size: 11px;
                color: #475569;
                margin-top: 8px;
                font-weight: 500;
              }
              @media print {
                body {
                  height: auto;
                }
                .label-card {
                  border: none;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-card">
              <div class="app-title">DRM Device Asset Tag</div>
              <div class="device-name">${selectedDeviceForQr.name}</div>
              <div class="device-type">${selectedDeviceForQr.deviceType}</div>
              <img class="qr-image" src="${qrImageSrc}" />
              <div>
                <span class="device-serial">SN: ${selectedDeviceForQr.serialNumber || 'N/A'}</span>
              </div>
              <div class="device-org">Đơn vị: ${org}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadDevices = async () => {
    const data = await StorageService.getDevices();
    setDevices(data);
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
      startTime: new Date().toISOString().split('T')[0],
      organizationId: ''
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
      startTime: device.startTime,
      organizationId: device.organizationId || ''
    });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const exportData = devices.map(d => {
      const org = organizations.find(o => o.id === d.organizationId);
      return {
        'Tên thiết bị': d.name,
        'Serial': d.serialNumber,
        'Loại thiết bị': d.deviceType,
        'Số lượng': d.quantity,
        'Thời gian bắt đầu': d.startTime,
        'Đơn vị': org?.name || ''
      };
    });

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

        const newDevices: Device[] = data.map(item => {
          const orgName = item['Đơn vị'] || item['organizationName'];
          const org = organizations.find(o => o.name === orgName);
          
          return {
            id: crypto.randomUUID(),
            name: item['Tên thiết bị'] || item['name'] || 'Không tên',
            serialNumber: item['Serial'] || item['serialNumber'] || '',
            deviceType: (item['Loại thiết bị'] || item['deviceType'] || DeviceType.OTHER) as DeviceType,
            quantity: Number(item['Số lượng'] || item['quantity'] || 1),
            startTime: item['Thời gian bắt đầu'] || item['startTime'] || new Date().toISOString().split('T')[0],
            organizationId: org?.id,
            createdAt: Date.now()
          };
        });

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

  // Pagination logic
  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Thống kê theo loại thiết bị
  const typeStats = Object.values(DeviceType).map(type => {
    const typeDevices = devices.filter(d => d.deviceType === type);
    const uniqueCount = typeDevices.length;
    const totalQuantity = typeDevices.reduce((sum, d) => sum + (d.quantity || 0), 0);
    return {
      type,
      uniqueCount,
      totalQuantity,
    };
  });

  const totalActualDevices = devices.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalUniqueDevices = devices.length;

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

      {/* Báo cáo tổng quan số liệu */}
      {showOverview && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              Báo cáo tổng hợp số liệu thiết bị
            </h2>
            <button 
              onClick={() => setShowOverview(false)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors uppercase font-bold tracking-wider"
            >
              Thu gọn ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Thống kê nhanh */}
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng sản phẩm cấu hình</span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-extrabold text-slate-800">{totalUniqueDevices}</span>
                  <span className="text-xs text-slate-400 font-medium">dòng máy / mã</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số lượng thực tế</span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-extrabold text-blue-600">{totalActualDevices}</span>
                  <span className="text-xs text-slate-400 font-medium">đơn vị / chiếc</span>
                </div>
              </div>
            </div>

            {/* Bảng biểu tổng hợp số liệu theo loại */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Loại thiết bị</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-center">Số chủng loại</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Tổng số lượng</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Tỷ trọng %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {typeStats.map((stat) => {
                      const percentage = totalActualDevices > 0 
                        ? Math.round((stat.totalQuantity / totalActualDevices) * 100) 
                        : 0;

                      return (
                        <tr key={stat.type} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <span className="p-1 px-1.5 bg-slate-100 text-slate-600 rounded">
                                <DeviceIcon type={stat.type} size={12} />
                              </span>
                              <span>{stat.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-600 font-medium">{stat.uniqueCount}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`font-bold ${stat.totalQuantity > 0 ? 'text-slate-950' : 'text-slate-400'}`}>
                              {stat.totalQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                <div 
                                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 min-w-[2rem] text-right">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showOverview && (
        <button 
          onClick={() => setShowOverview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all font-bold text-xs text-slate-600"
        >
          <Package size={14} className="text-blue-600" />
          <span>Xem tổng quan số liệu kết quả</span>
        </button>
      )}

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
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Đơn vị</th>
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
                paginatedDevices.map((device) => (
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
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium">
                        {organizations.find(o => o.id === device.organizationId)?.name || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => { setSelectedDeviceForQr(device); setIsQrModalOpen(true); }}
                          title="Xem mã QR & Chi tiết"
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                        >
                          <QrCode size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(device)}
                          title="Chỉnh sửa thiết bị"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(device.id)}
                          title="Xóa thiết bị"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500">
            Hiển thị <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDevices.length)}</span> trong <span className="font-bold text-slate-900">{filteredDevices.length}</span> thiết bị
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="text-slate-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sau
            </button>
          </div>
        </div>
      )}

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
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value) || 1})}
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Đơn vị sử dụng</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
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

      {/* Modal QR Code & Chi tiết thiết bị */}
      {isQrModalOpen && selectedDeviceForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="text-blue-600 animate-pulse" size={24} />
                <h2 className="text-xl font-bold text-slate-900">
                  Mã QR & Chi tiết thiết bị
                </h2>
              </div>
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedDeviceForQr(null);
                  setSearchParams({}); // Clear query parameter if closing deep link
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Đóng"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200/50">
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={`https://qltb.sonlasmart.com/devices?id=${selectedDeviceForQr.id}`}
                    size={160}
                    level="Q"
                    includeMargin={true}
                  />
                </div>
                
                <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-wider font-bold">
                  Quét bằng điện thoại để xem trực tiếp
                </p>
                
                <div className="flex gap-2 w-full mt-4">
                  <button
                    onClick={() => {
                      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
                      if (canvas) {
                        const url = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `QR_${selectedDeviceForQr.name}.png`;
                        link.href = url;
                        link.click();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                  >
                    <Download size={14} />
                    <span>Tải ảnh QR</span>
                  </button>
                  <button
                    onClick={handlePrintQr}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                  >
                    <Printer size={14} />
                    <span>In nhãn QR</span>
                  </button>
                </div>
              </div>

              {/* Device Details Info */}
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tên thiết bị</span>
                  <div className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1.5">{selectedDeviceForQr.name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại thiết bị</span>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {selectedDeviceForQr.deviceType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số lượng</span>
                    <div className="text-sm font-bold text-slate-800">{selectedDeviceForQr.quantity} chiếc</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã Serial / Model</span>
                  <div>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold font-mono">
                      {selectedDeviceForQr.serialNumber || 'N/A'}
                    </code>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian bắt đầu sử dụng</span>
                  <div className="text-sm font-semibold text-slate-800">{selectedDeviceForQr.startTime}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đơn vị sử dụng</span>
                  <div className="text-sm font-semibold text-slate-800">
                    {organizations.find(o => o.id === selectedDeviceForQr.organizationId)?.name || '---'}
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đường dẫn quét (URL)</span>
                  <div className="flex gap-1.5 mt-1">
                    <input 
                      readOnly
                      type="text" 
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500 select-all outline-none"
                      value={`https://qltb.sonlasmart.com/devices?id=${selectedDeviceForQr.id}`}
                    />
                    <button
                      onClick={() => handleCopyLink(`https://qltb.sonlasmart.com/devices?id=${selectedDeviceForQr.id}`)}
                      className={`px-3 py-1.5 rounded-xl border flex items-center justify-center transition-all ${
                        copied 
                          ? 'bg-green-50 border-green-200 text-green-600' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title="Copy URL"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedDeviceForQr(null);
                  setSearchParams({}); // Clear query parameter if closing deep link
                }}
                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold text-sm shadow-xl shadow-blue-500/10 active:scale-95"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
