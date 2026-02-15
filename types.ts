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
  GHN = 'Giao Hàng Nhanh',
  GHTK = 'Giao Hàng Tiết Kiệm',
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
  organizationId: string;
  phone: string;
  address: string;
  createdAt: number;
}

export interface RepairTicket {
  id: string;
  customerId: string;
  deviceType: DeviceType;
  serialNumber?: string;
  deviceCondition: string;
  receiveDate: string;
  
  status: RepairStatus;
  
  // Output info
  returnDate?: string;
  returnNote?: string;
  shippingMethod?: ShippingMethod;
  trackingNumber?: string; // New field
  
  createdAt: number;
  updatedAt: number;
}

export interface WarrantyTicket {
  id: string;
  organizationId: string;
  deviceType: DeviceType;
  serialNumber?: string;
  description: string;
  sentDate: string;
  
  status: WarrantyStatus;
  
  returnDate?: string;
  cost?: number;
  note?: string;
  trackingNumber?: string; // New field
  
  createdAt: number;
  updatedAt: number;
}

export interface DashboardStats {
  totalTickets: number;
  processing: number;
  returned: number;
  received: number;
}

export interface ShippingStep {
  status: string;
  location: string;
  time: string;
  description: string;
}

export interface ShippingInfo {
  carrier: ShippingMethod;
  trackingNumber: string;
  currentStatus: string;
  lastUpdate: string;
  steps: ShippingStep[];
}