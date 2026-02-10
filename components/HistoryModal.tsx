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

  const getCustomerName = (id: string) => customers.find(cus => cus.id === id)?.fullName || '---';

  const statusColors = {
    [RepairStatus.RECEIVED]: 'bg-blue-50 text-blue-700 border-blue-100',
    [RepairStatus.PROCESSING]: 'bg-amber-50 text-amber-700 border-amber-100',
    [RepairStatus.RETURNED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const sortedTickets = [...tickets].sort((a, b) => new Date(b.receiveDate).getTime() - new Date(a.receiveDate).getTime());

  return (
    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-900">
            <Clock size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/20">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-20 text-slate-300">
              <FileText size={64} className="mx-auto mb-4 opacity-10" />
              <p className="font-medium">Chưa ghi nhận lịch sử nào.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedTickets.map((ticket) => (
                <div key={ticket.id} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-8 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-md"></div>
                  
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div>
                        <span className="font-bold text-slate-900 text-lg mr-2">{ticket.receiveDate}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">REF:{ticket.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border self-start ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thiết bị & Tình trạng</p>
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <DeviceIcon type={ticket.deviceType} size={16} className="text-blue-500" />
                          {ticket.deviceType}
                        </div>
                        <p className="text-slate-600 text-xs italic leading-relaxed">"{ticket.deviceCondition}"</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người sở hữu</p>
                        <p className="font-bold text-slate-800">{getCustomerName(ticket.customerId)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 text-right">
          <button onClick={onClose} className="px-8 py-2.5 bg-primary hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10">Đóng</button>
        </div>
      </div>
    </div>
  );
};