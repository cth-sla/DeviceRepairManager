import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Plus, Search, FileEdit, Trash2, Download, Upload, Package, Filter, X, 
  Save, QrCode, Eye, Printer, Copy, Check, ShieldAlert, Laptop, Calendar, 
  Landmark, Settings, Link2, Info, ArrowLeft, LogIn, KeySquare,
  Wrench, Phone, MapPin, Truck, FileText, CheckCircle2, Clock
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Device, DeviceType, Organization, Customer, RepairTicket, RepairStatus } from '../types';
import { DeviceIcon } from '../components/DeviceIcon';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [activeTab, setActiveTab] = useState<'all' | 'in_use' | 'warehouse'>('all');
  const ITEMS_PER_PAGE = 10;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    deviceType: DeviceType.CODEC,
    quantity: 1,
    startTime: new Date().toISOString().split('T')[0],
    organizationId: '',
    isReserve: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [devicesData, orgsData, ticketsData, customersData] = await Promise.all([
      StorageService.getDevices(),
      StorageService.getOrganizations(),
      StorageService.getTickets(),
      StorageService.getCustomers()
    ]);
    setDevices(devicesData);
    setOrganizations(orgsData);
    setTickets(ticketsData);
    setCustomers(customersData);
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

  const handleToggleReserve = async (device: Device) => {
    try {
      const updated: Device = {
        ...device,
        isReserve: !device.isReserve
      };
      await StorageService.updateDevice(updated);
      loadDevices();
    } catch (error) {
      console.error('Error toggling reserve status:', error);
      alert('Có lỗi xảy ra khi chuyển trạng thái dự trữ');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      serialNumber: '',
      deviceType: DeviceType.CODEC,
      quantity: 1,
      startTime: new Date().toISOString().split('T')[0],
      organizationId: '',
      isReserve: false
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
      organizationId: device.organizationId || '',
      isReserve: device.isReserve || false
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
    const org = organizations.find(o => o.id === d.organizationId);
    const orgName = org?.name || '';
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          orgName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || d.deviceType === filterType;
    
    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'in_use') {
      matchesTab = d.organizationId !== undefined && d.organizationId !== '';
    } else if (activeTab === 'warehouse') {
      matchesTab = d.organizationId === undefined || d.organizationId === '' || d.isReserve === true;
    }
    
    return matchesSearch && matchesType && matchesTab;
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

  // Check if session is authenticated for public QR Code scanning
  const { session } = useAuth();
  const publicDeviceId = searchParams.get('id');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <QrCode className="animate-pulse text-blue-600 mx-auto" size={48} />
          <p className="text-slate-500 font-medium">Đang tải thông tin thiết bị...</p>
        </div>
      </div>
    );
  }

  if (!session && !publicDeviceId) {
    return <Navigate to="/login" replace />;
  }

  if (publicDeviceId) {
    // Find device or ticket
    const device = devices.find(d => d.id === publicDeviceId);
    const org = device ? organizations.find(o => o.id === device.organizationId) : null;
    const ticket = tickets.find(t => t.id === publicDeviceId);

    if (!device && !ticket) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-800">Không tìm thấy thông tin</h1>
              <p className="text-sm text-slate-500">Mã thiết bị hoặc phiếu tiếp nhận không tồn tại trong hệ thống hoặc đã bị xóa.</p>
            </div>
            <a 
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-500/20"
            >
              <LogIn size={18} />
              <span>Đăng nhập hệ thống</span>
            </a>
          </div>
        </div>
      );
    }

    if (ticket) {
      let customerFullName = 'Khách hàng';
      let customerPhone = '';
      let customerAddress = '';
      let orgName = '---';

      if (ticket.customerId.startsWith('org-fallback-')) {
        const orgId = ticket.customerId.replace('org-fallback-', '');
        const orgObj = organizations.find(o => o.id === orgId);
        customerFullName = `Đại diện ${orgObj?.name || 'Đơn vị'}`;
        orgName = orgObj?.name || '---';
        customerAddress = orgObj?.address || '';
      } else {
        const customerObj = customers.find(c => c.id === ticket.customerId);
        customerFullName = customerObj?.fullName || 'Khách hàng';
        customerPhone = customerObj?.phone || '';
        customerAddress = customerObj?.address || '';
        if (customerObj) {
          const orgObj = organizations.find(o => o.id === customerObj.organizationId);
          orgName = orgObj?.name || '---';
        }
      }

      const isReceived = true;
      const isProcessing = ticket.status === 'Đang xử lý' || ticket.status === 'Đã trả';
      const isReturned = ticket.status === 'Đã trả';

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Wrench size={100} />
              </div>
              <span className="inline-block px-3 py-1 bg-white/25 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white/95 mb-2">
                Tra cứu tiến trình sửa chữa
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Trạng Thái Sửa Chữa Thiết Bị</h1>
              <p className="text-xs text-blue-200 mt-2 flex items-center gap-1.5 font-mono">
                Mã phiếu: <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded text-[10px]">{ticket.id}</span>
              </p>
            </div>

            <div className="p-6 space-y-8">
              
              {/* Stepper / Timeline */}
              <div className="space-y-4">
                <div className="relative flex justify-between items-center max-w-lg mx-auto w-full">
                  {/* Line backdrop */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded pointer-events-none -z-0">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500 rounded" 
                      style={{ width: isReturned ? '100%' : isProcessing ? '50%' : '0%' }}
                    />
                  </div>

                  {/* Step 1: RECEIVED */}
                  <div className="flex flex-col items-center gap-2 relative z-10 w-24 text-center">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all shadow-md bg-blue-600 text-white border-blue-600 ring-4 ring-blue-50">
                      <Check size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Đã nhận</span>
                    <span className="text-[9px] font-medium text-slate-400">{ticket.receiveDate}</span>
                  </div>

                  {/* Step 2: PROCESSING */}
                  <div className="flex flex-col items-center gap-2 relative z-10 w-24 text-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all shadow-md ${isProcessing ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-50' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {isReturned ? <Check size={16} /> : isProcessing ? <Clock size={16} className="animate-spin" /> : '2'}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isProcessing ? 'text-amber-600 font-extrabold' : 'text-slate-400'}`}>Đang xử lý</span>
                    <span className="text-[9px] font-medium text-slate-400">{isProcessing ? 'Đang thực hiện' : 'Chờ xử lý'}</span>
                  </div>

                  {/* Step 3: RETURNED */}
                  <div className="flex flex-col items-center gap-2 relative z-10 w-24 text-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all shadow-md ${isReturned ? 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-50' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {isReturned ? <Check size={16} /> : '3'}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${isReturned ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>Đã trả</span>
                    <span className="text-[9px] font-medium text-slate-400">{ticket.returnDate || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Patient/Customer Information */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <FileText size={14} className="text-blue-500" />
                  Thông tin bàn giao & tiếp nhận
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Tên khách hàng / Người liên hệ</span>
                    <span className="font-extrabold text-slate-800 text-base">{customerFullName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Đơn vị sử dụng</span>
                    <span className="font-bold text-blue-600 text-sm uppercase">{orgName}</span>
                  </div>
                  {customerPhone && (
                    <div className="space-y-1 col-span-1">
                      <span className="text-xs font-semibold text-slate-400 block">Số điện thoại liên hệ</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 font-mono">
                        <Phone size={14} className="text-slate-400" />
                        {customerPhone}
                      </span>
                    </div>
                  )}
                  {customerAddress && (
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <span className="text-xs font-semibold text-slate-400 block">Địa chỉ nhận/trả</span>
                      <span className="font-medium text-slate-600 flex items-start gap-1.5">
                        <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        {customerAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Device and Condition */}
              <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Laptop size={14} className="text-blue-500" />
                  Thông tin thiết bị tiếp nhận
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Loại thiết bị</span>
                    <span className="px-2.5 py-0.5 font-bold text-blue-700 bg-blue-50 rounded border border-blue-100 text-xs inline-block">
                      {ticket.deviceType}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 block">Số Serial / Model</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700 inline-block font-sans">
                      {ticket.serialNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <span className="text-xs font-semibold text-slate-400 block">Tình trạng lúc bàn giao</span>
                    <p className="bg-amber-50/50 border border-amber-100/70 text-slate-700 p-3 rounded-xl text-xs font-medium leading-relaxed">
                      ⚠️ {ticket.deviceCondition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping / Return Block (If status is RETURNED) */}
              {isReturned && (
                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300 font-sans">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-emerald-100/60 pb-2">
                    <Truck size={14} className="text-emerald-600" />
                    Thông tin bàn giao & Vận chuyển xuất xưởng
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-emerald-600/70 block">Ngày giao trả</span>
                      <span className="font-bold text-slate-800">{ticket.returnDate || '---'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-emerald-600/70 block">Hình thức bàn giao</span>
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded inline-block">
                        {ticket.shippingMethod || 'Trực tiếp'}
                      </span>
                    </div>
                    {ticket.trackingNumber && (
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <span className="text-xs font-semibold text-emerald-600/70 block">Mã vận đơn / Số vận đơn</span>
                        <div className="flex gap-2 items-center">
                          <span className="font-mono bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold">
                            {ticket.trackingNumber}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ticket.trackingNumber || '');
                              alert('Đã sao chép mã vận đơn!');
                            }} 
                            className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                            title="Sao chép"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    {ticket.returnNote && (
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <span className="text-xs font-semibold text-emerald-600/70 block">Ghi chú xuất xưởng / khắc phục</span>
                        <p className="bg-white border border-emerald-100 text-slate-600 p-3 rounded-xl text-xs leading-relaxed">
                          {ticket.returnNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thank you note */}
              <div className="text-center py-4 text-slate-400 font-medium text-xs">
                <div>Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ của chúng tôi!</div>
                <div className="mt-1 font-semibold text-slate-400 uppercase tracking-widest text-[9px]">Sơn La Smart Technologies</div>
              </div>
            </div>

            {/* Back button to Login */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
              <a 
                href="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                id="back_to_login_btn"
              >
                <LogIn size={14} />
                Đăng nhập hệ thống quản lý
              </a>
            </div>
            
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 font-sans">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <QrCode size={120} />
            </div>
            <span className="inline-block px-3 py-1 bg-white/25 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white/95 mb-2">
              Thẻ thông tin tài sản
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Chi tiết Thiết bị sử dụng</h1>
            <p className="text-xs text-white/80 mt-1 font-mono">{device.id}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Device Main Info Box */}
            <div className="flex items-start gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner flex-shrink-0">
                <DeviceIcon type={device.deviceType} size={32} />
              </div>
              <div className="space-y-1">
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                  {device.deviceType}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight leading-snug">
                  {device.name}
                </h2>
              </div>
            </div>

            {/* Crucial Section: Organization / Unit in USE & QR Code */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Landmark size={18} className="text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Đơn vị đang sử dụng</span>
                </div>
                <div className="space-y-1.5 pl-7">
                  <div className="text-lg font-extrabold text-slate-900 leading-snug">
                    {org?.name || '---'}
                  </div>
                  {org?.address && (
                    <p className="text-xs text-slate-500 font-medium">
                      📍 {org.address}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code of the current device */}
              <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200/60 flex-shrink-0 self-center sm:self-auto">
                <QRCodeCanvas
                  value={`https://qltb.sonlasmart.com/devices?id=${device.id}`}
                  size={96}
                  level="Q"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Secondary Attributes List */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-2">
              {/* Serial Number */}
              <div className="flex py-3 justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold tracking-wide">Số Serial / Model</span>
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                  {device.serialNumber || 'N/A'}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex py-3 justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold tracking-wide">Số lượng</span>
                <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  {device.quantity} chiếc
                </span>
              </div>

              {/* Start Date */}
              <div className="flex py-3 justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold tracking-wide">Ngày đưa vào sử dụng</span>
                <span className="font-semibold text-slate-700">
                  {device.startTime || '---'}
                </span>
              </div>
            </div>

            {/* Extra: System Info Footer */}
            <div className="flex items-center gap-2 p-3.5 bg-sky-50/50 border border-sky-100 rounded-xl text-sky-700 text-xs leading-relaxed">
              <Info size={16} className="text-flex-shrink-0" />
              <p className="font-medium">
                Đây là thông tin xác thực từ <strong className="font-extrabold">Hệ thống Quản lý Thiết bị SonLaSmart</strong>.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
              qltb.sonlasmart.com
            </span>
            <a 
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors shadow-md"
            >
              <LogIn size={14} />
              <span>Đăng nhập Quản trị</span>
            </a>
          </div>

        </div>
      </div>
    );
  }

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
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng sản phẩm</span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-extrabold text-slate-800">{totalUniqueDevices}</span>
                  <span className="text-xs text-slate-400 font-medium">thiết bị / mã</span>
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

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-1 mt-4">
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Package size={16} />
          <span>Tất cả Thiết bị</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-150 text-slate-600 font-semibold">
            {devices.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('in_use'); setCurrentPage(1); }}
          className={`px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'in_use'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Laptop size={16} />
          <span>Đang sử dụng</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-150 text-slate-600 font-semibold">
            {devices.filter(d => d.organizationId && d.organizationId !== '').length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('warehouse'); setCurrentPage(1); }}
          className={`px-4 sm:px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'warehouse'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Settings size={16} className="text-amber-500 animate-[spin_20s_linear_infinite]" />
          <span>Kho hàng & Dự trữ</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
            {devices.filter(d => !d.organizationId || d.organizationId === '' || d.isReserve).length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo tên, serial hoặc đơn vị..."
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
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
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
                      {device.isReserve ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm animate-pulse">
                          ⚡ Thiết bị Dự trữ
                        </span>
                      ) : !device.organizationId || device.organizationId === '' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/10">
                          📦 Hàng tồn kho
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {organizations.find(o => o.id === device.organizationId)?.name || '---'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {(!device.organizationId || device.organizationId === '') && (
                          <button 
                            onClick={() => handleToggleReserve(device)}
                            title={device.isReserve ? "Chuyển về Hàng tồn kho thường" : "Chuyển làm Thiết bị dự trữ"}
                            className={`p-2 rounded-lg transition-all ${
                              device.isReserve 
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' 
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Settings size={18} />
                          </button>
                        )}
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
                  onChange={(e) => {
                    const orgId = e.target.value;
                    setFormData({
                      ...formData,
                      organizationId: orgId,
                      isReserve: orgId ? false : formData.isReserve
                    });
                  }}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input 
                  type="checkbox"
                  id="isReserveCheckbox"
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  checked={formData.isReserve}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      isReserve: checked,
                      organizationId: checked ? '' : formData.organizationId
                    });
                  }}
                />
                <label htmlFor="isReserveCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Đặt làm thiết bị dự trữ / dự phòng (Kho hàng)
                </label>
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
