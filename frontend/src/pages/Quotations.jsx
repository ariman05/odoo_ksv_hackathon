import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, ShieldAlert, Award, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import api from '../api.js';

export default function Quotations() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: async () => {
      const res = await api.get('/api/quotations/');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Submitted Quotations</h2>
          <p className="text-xs text-slate-400 mt-1">Track and manage bidding records for RFQ items</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading quotations...</div>
      ) : quotes?.results?.length === 0 ? (
        <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
          No quotations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quotes?.results?.map((quote) => (
            <div 
              key={quote.id} 
              className="glass-card rounded-2xl p-5 border border-slate-800/40 hover:border-slate-700/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-white text-sm truncate">Quote #{quote.id} for: {quote.rfq_title}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    quote.status === 'accepted' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : quote.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {quote.status}
                  </span>
                </div>
                
                {user.role !== 'vendor' && (
                  <p className="text-xs text-slate-300">Submitted by: <span className="font-semibold text-brand-400">{quote.vendor_name}</span></p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={13} />
                    <span>Delivery: {new Date(quote.delivery_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={13} />
                    <span>Shipping: ${quote.shipping_cost}</span>
                  </div>
                  {quote.comments && (
                    <div className="flex items-center gap-1 max-w-xs truncate">
                      <MessageSquare size={13} />
                      <span className="truncate">"{quote.comments}"</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Price</p>
                  <p className="text-lg font-bold text-brand-400">${quote.total_price.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
