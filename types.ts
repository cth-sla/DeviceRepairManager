export enum DeviceType {
  CODEC = 'Codec',
  MIC = 'Mic',
  CAMERA = 'Camera',
  SOURCE = 'Nguồn',
  CONTROL = 'Điều khiển',
  OTHER = 'Khác'
}

export enum ShippingMethod {
  VIETTEL_POST = 'Viettel Post',
  TAXI = 'Taxi',
  BUS = 'Xe Buýt',
  DIRECT = 'Trực tiếp'
}

export enum RepairStatus {
  RECEIVED = 'Đã nhận',
  PROCESSING = 'Đang xử lý',
  RETURNED = 'Đã trả'
}

export enum WarrantyStatus {
  SENT = 'Đã gửi hãng',
  FIXING = 'Đang sửa',
  DONE = 'Đã xong',
  CANNOT_FIX = 'Không sửa được'
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  fullName: string;
  organizationId: string; // Changed from free text to ID reference
  phone: string;
  address: string;
  createdAt: number;
}

export interface RepairTicket {
  id: string;
  customerId: string;
  deviceType: DeviceType;
  serialNumber?: string; // Added for device history tracking
  deviceCondition: string; // Tình trạng
  receiveDate: string; // ISO Date string
  
  status: RepairStatus;
  
  // Output info
  returnDate?: string;
  returnNote?: string;
  shippingMethod?: ShippingMethod;
  
  createdAt: number;
  updatedAt: number;
}

export interface WarrantyTicket {
  id: string;
  organizationId: string; // ID của Đơn vị (Hãng/Trung tâm sửa chữa)
  deviceType: DeviceType;
  serialNumber?: string;
  description: string; // Mô tả lỗi/Tình trạng
  sentDate: string;
  
  status: WarrantyStatus;
  
  returnDate?: string;
  cost?: number; // Chi phí sửa chữa
  note?: string; // Ghi chú thêm
  
  createdAt: number;
  updatedAt: number;
}

// Stats interface for dashboard
export interface DashboardStats {
  totalTickets: number;
  processing: number;
  returned: number;
  received: number;
}