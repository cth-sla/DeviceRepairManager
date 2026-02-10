
import React from 'react';
import { RepairTicket, Customer, Organization, RepairStatus } from '../types';
import { X, Calendar, User, Building2, Box, Info, Truck, ClipboardList, Clock } from 'lucide-react';
import { DeviceIcon } from './DeviceIcon';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: RepairTicket | null;
  customer: Customer | null;
  organization: Organization | null;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  customer,
  organization,
}) => {
  if (!isOpen || !ticket) return null;

  const statusColors = {
    [RepairStatus.RECEIVED]: 'bg-red-100 text-red-700 border-red-200',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RepairStatus.RETURNED]: 'bg-green-100 text-green-700 border-green-200',
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-secondary text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-red-400" size={24} />
            <div>
              <h3 className="font-bold text-lg leading-tight">Chi tiết Phiếu Sửa chữa</h3>
              <p className="text-red-200 text-xs font-mono">ID: {ticket.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${statusColors[ticket.status]}`}>
            <div className="flex items-center gap-2">
              <Info size={20} />
              <span className="font-bold text-lg">{ticket.status}</span>
            </div>
            <div className="text-right text-xs opacity-80">
              <p>Ngày tiếp nhận: <span className="font-semibold">{ticket.receiveDate}</span></p>
              {ticket.returnDate && <p>Ngày bàn giao: <span className="font-semibold">{ticket.returnDate}</span></p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700 border-b border-red-100 pb-2">
                <Box size={18} />
                <h4 className="font-bold uppercase text-xs tracking-wider">Thông tin thiết bị</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block">Loại thiết bị</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DeviceIcon type={ticket.deviceType} size={20} className="text-red-600" />
                    <span className="font-semibold text-slate-900">{ticket.deviceType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block">Số Serial / Model</label>
                  <p className="font-mono text-sm text-slate-800 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                    {ticket.serialNumber || 'Không có'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block">Tình trạng lỗi</label>
                  <p className="text-slate-800 mt-1 italic">"{ticket.deviceCondition}"</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700 border-b border-red-100 pb-2">
                <User size={18} />
                <h4 className="font-bold uppercase text-xs tracking-wider">Thông tin khách hàng</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block">Người đại diện</label>
                  <p className="font-semibold text-slate-900 mt-1">{customer?.fullName || '---'}</p>
                  <p className="text-sm text-slate-600">{customer?.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block">Đơn vị</label>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-800">
                    <Building2 size={14} className="text-red-400" />
                    <span className="font-medium">{organization?.name || '---'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{customer?.address || organization?.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Return Info (If applicable) */}
          {ticket.status === RepairStatus.RETURNED && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <Truck size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wider">Thông tin bàn giao</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-green-600 block">Ngày trả</label>
                  <p className="font-semibold text-slate-900">{ticket.returnDate}</p>
                </div>
                <div>
                  <label className="text-xs text-green-600 block">Phương thức</label>
                  <p className="font-semibold text-slate-900">{ticket.shippingMethod}</p>
                </div>
              </div>
              {ticket.returnNote && (
                <div>
                  <label className="text-xs text-green-600 block">Ghi chú trả hàng</label>
                  <p className="text-slate-700 mt-1 italic">{ticket.returnNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <Clock size={10} />
              Tạo lúc: {formatDate(ticket.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              Cập nhật cuối: {formatDate(ticket.updatedAt)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
