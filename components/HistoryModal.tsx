import React from 'react';
import { RepairTicket, RepairStatus, Customer, Organization } from '../types';
import { X, CheckCircle2, Clock, FileText } from 'lucide-react';
import { DeviceIcon } from './DeviceIcon';

interface HistoryModalProps {
  title: string;
  tickets: RepairTicket[];
  customers: Customer[];
  organizations?: Organization[]; 
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  title, 
  tickets, 
  customers,
  organizations = [],
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  const getCustomerName = (id: string) => {
    const c = customers.find(cus => cus.id === id);
    return c ? c.fullName : 'Unknown';
  };

  const getOrgName = (customerId: string) => {
    const c = customers.find(cus => cus.id === customerId);
    if (!c) return '';
    const org = organizations.find(o => o.id === c.organizationId);
    return org ? `(${org.name})` : '';
  };

  const statusColors = {
    [RepairStatus.RECEIVED]: 'bg-red-50 text-red-700 border-red-100',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RepairStatus.RETURNED]: 'bg-green-100 text-green-700 border-green-200',
  };

  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.receiveDate).getTime() - new Date(a.receiveDate).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-2 text-red-900">
            <Clock size={20} />
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-red-50/10">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p className="italic">Không có lịch sử sửa chữa nào.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedTickets.map((ticket) => (
                <div key={ticket.id} className="relative pl-8 border-l-2 border-red-200 last:border-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-red-500 shadow-sm"></div>
                  
                  <div className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{ticket.receiveDate}</span>
                        <span className="text-[10px] font-mono text-slate-400">#{ticket.id.slice(0, 8)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] text-red-600 uppercase font-bold tracking-widest mb-1">Thiết bị</p>
                        <div className="flex items-center gap-1.5 mb-1 font-semibold text-slate-800">
                          <DeviceIcon type={ticket.deviceType} size={14} className="text-red-500" />
                          {ticket.deviceType}
                        </div>
                        {ticket.serialNumber && (
                           <p className="text-slate-500 text-[10px] font-mono">SN: {ticket.serialNumber}</p>
                        )}
                        <p className="text-slate-600 mt-1 italic text-xs">"{ticket.deviceCondition}"</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-red-600 uppercase font-bold tracking-widest mb-1">Khách hàng</p>
                        <p className="font-medium text-slate-800">
                          {getCustomerName(ticket.customerId)} <span className="text-slate-500 text-xs font-normal">{getOrgName(ticket.customerId)}</span>
                        </p>
                      </div>
                    </div>

                    {ticket.status === RepairStatus.RETURNED && (
                      <div className="mt-4 pt-3 border-t border-red-50">
                        <div className="flex items-start gap-2 bg-green-50/50 p-2 rounded-lg border border-green-100">
                          <CheckCircle2 size={16} className="text-green-600 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold text-slate-900">Đã trả: {ticket.returnDate}</span>
                            <span className="text-slate-500 ml-1">({ticket.shippingMethod})</span>
                            {ticket.returnNote && (
                              <p className="text-slate-600 mt-1 italic">"{ticket.returnNote}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-red-100 bg-red-50/30 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-accent hover:bg-red-700 text-white font-bold rounded-lg text-xs uppercase shadow-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};