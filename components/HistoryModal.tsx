import React from 'react';
import { RepairTicket, RepairStatus, Customer, Organization } from '../types';
import { X, Calendar, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';

interface HistoryModalProps {
  title: string;
  tickets: RepairTicket[];
  customers: Customer[];
  organizations?: Organization[]; // Added optional organization list for looking up names
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
    [RepairStatus.RECEIVED]: 'bg-blue-100 text-blue-700',
    [RepairStatus.PROCESSING]: 'bg-amber-100 text-amber-700',
    [RepairStatus.RETURNED]: 'bg-green-100 text-green-700',
  };

  // Sort tickets by date descending (newest first)
  const sortedTickets = [...tickets].sort((a, b) => 
    new Date(b.receiveDate).getTime() - new Date(a.receiveDate).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p>Không có lịch sử sửa chữa nào.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedTickets.map((ticket) => (
                <div key={ticket.id} className="relative pl-8 border-l-2 border-slate-200 last:border-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{ticket.receiveDate}</span>
                        <span className="text-sm text-slate-500 font-mono">#{ticket.id.slice(0, 8)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${statusColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Thiết bị</p>
                        <p className="font-medium text-slate-800">{ticket.deviceType}</p>
                        {ticket.serialNumber && (
                           <p className="text-slate-500 text-xs">SN: {ticket.serialNumber}</p>
                        )}
                        <p className="text-slate-600 mt-1">{ticket.deviceCondition}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Khách hàng</p>
                        <p className="text-slate-800">
                          {getCustomerName(ticket.customerId)} <span className="text-slate-500 text-xs">{getOrgName(ticket.customerId)}</span>
                        </p>
                      </div>
                    </div>

                    {ticket.status === RepairStatus.RETURNED && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-green-600 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">Đã trả ngày {ticket.returnDate}</span>
                            <span className="text-slate-500"> qua {ticket.shippingMethod}</span>
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

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};