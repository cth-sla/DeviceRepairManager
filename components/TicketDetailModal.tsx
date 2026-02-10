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
    [RepairStatus.RECEIVED]: 'bg-blue-50 text-blue-700 border-blue-100',
    [RepairStatus.PROCESSING]: 'bg-amber-50 text-amber-700 border-amber-100',
    [RepairStatus.RETURNED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 bg-secondary text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg leading-tight tracking-tight">Chi tiết Hồ sơ Sửa chữa</h3>
              <p className="text-slate-500 text-[10px] font-mono mt-0.5 tracking-wider">REF: {ticket.id.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className={`flex items-center justify-between p-5 rounded-2xl border ${statusColors[ticket.status]} shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/50 rounded-lg"><Info size={20} /></div>
              <span className="font-bold text-xl uppercase tracking-tight">{ticket.status}</span>
            </div>
            <div className="text-right text-[10px] font-bold uppercase tracking-widest opacity-60 space-y-1">
              <p>Ngày nhận: {ticket.receiveDate}</p>
              {ticket.returnDate && <p className="text-emerald-600">Ngày trả: {ticket.returnDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <Box size={16} />
                <h4 className="font-bold uppercase text-[10px] tracking-widest">Thiết bị</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Loại máy</label>
                  <div className="flex items-center gap-2">
                    <DeviceIcon type={ticket.deviceType} size={20} className="text-blue-500" />
                    <span className="font-bold text-slate-900 text-lg">{ticket.deviceType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Serial Number</label>
                  <span className="font-mono text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block font-semibold">
                    {ticket.serialNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tình trạng ghi nhận</label>
                  <p className="text-slate-800 text-sm italic font-medium leading-relaxed">"{ticket.deviceCondition}"</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-50 pb-2">
                <User size={16} />
                <h4 className="font-bold uppercase text-[10px] tracking-widest">Khách hàng</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Người đại diện</label>
                  <p className="font-bold text-slate-900 text-lg">{customer?.fullName || '---'}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{customer?.phone}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Đơn vị chủ quản</label>
                  <div className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-50">
                    <Building2 size={16} className="text-blue-400" />
                    <span className="font-bold text-slate-800 text-sm">{organization?.name || 'Vãng lai'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 text-right">
          <button onClick={onClose} className="px-8 py-2.5 bg-primary hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-900/10 text-xs uppercase tracking-widest">Đóng</button>
        </div>
      </div>
    </div>
  );
};