import React, { useState, useEffect } from 'react';
import { ShippingMethod, ShippingInfo } from '../types';
import { ShippingService } from '../services/shipping';
import { Truck, Search, Loader2, MapPin, Clock, X } from 'lucide-react';

interface ShippingStatusBadgeProps {
  carrier?: ShippingMethod;
  trackingNumber?: string;
}

export const ShippingStatusBadge: React.FC<ShippingStatusBadgeProps> = ({ carrier, trackingNumber }) => {
  const [info, setInfo] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (carrier && trackingNumber && [ShippingMethod.VIETTEL_POST, ShippingMethod.GHN, ShippingMethod.GHTK].includes(carrier)) {
      setLoading(true);
      ShippingService.track(carrier, trackingNumber)
        .then(setInfo)
        .finally(() => setLoading(false));
    }
  }, [carrier, trackingNumber]);

  if (!carrier || !trackingNumber) return null;

  // Chỉ hiển thị cho các đơn vị có API hỗ trợ tra cứu
  const supportsTracking = [ShippingMethod.VIETTEL_POST, ShippingMethod.GHN, ShippingMethod.GHTK].includes(carrier);
  if (!supportsTracking) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
        <Truck size={10} /> {trackingNumber}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status.includes('giao')) return 'bg-green-100 text-green-700 border-green-200';
    if (status.includes('chuyển')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(true);
        }}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all hover:shadow-sm ${info ? getStatusColor(info.currentStatus) : 'bg-slate-50 text-slate-500 border-slate-200'}`}
      >
        {loading ? <Loader2 size={10} className="animate-spin" /> : <Truck size={10} />}
        {info ? info.currentStatus : 'Tra cứu...'}
        <span className="opacity-50">| {trackingNumber}</span>
      </button>

      {showDetails && info && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="text-blue-600" size={20} />
                <h4 className="font-bold text-slate-800">Hành trình đơn hàng</h4>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex justify-between text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">
                  <span>{carrier}</span>
                  <span>{trackingNumber}</span>
                </div>
                <div className="text-lg font-bold text-blue-900">{info.currentStatus}</div>
                <div className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Cập nhật cuối: {info.lastUpdate}
                </div>
              </div>

              <div className="space-y-6">
                {info.steps.map((step, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-slate-200 last:border-0 pb-2">
                    <div className={`absolute -left-[7px] top-0 w-3 h-3 rounded-full border-2 bg-white ${idx === 0 ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-300'}`}></div>
                    <div className="text-sm font-bold text-slate-800">{step.status}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                       <MapPin size={10} /> {step.location}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{step.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{step.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <button 
                onClick={() => setShowDetails(false)}
                className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};