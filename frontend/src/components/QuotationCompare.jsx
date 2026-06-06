import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Info, CheckCircle2, DollarSign, Clock, ShieldAlert } from 'lucide-react';
import api from '../api.js';

export default function QuotationCompare({ rfq }) {
  const queryClient = useQueryClient();

  // Fetch quotations for this RFQ
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotations', rfq.id],
    queryFn: async () => {
      const res = await api.get(`/api/quotations/?rfq=${rfq.id}`);
      return res.data;
    }
  });

  // Select quote mutation
  const selectMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/quotations/${id}/select/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['quotations', rfq.id] });
      alert("Quotation selected! Approval workflow has been triggered.");
    }
  });

  if (isLoading) return <div className="text-center py-12 text-slate-400 text-xs">Loading quotations...</div>;

  const quoteList = Array.isArray(quotes) ? quotes : (quotes?.results || []);

  if (quoteList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-slate-800/40 bg-slate-900/10 rounded-2xl flex flex-col items-center justify-center space-y-2">
        <ShieldAlert size={18} className="text-slate-400" />
        <p className="text-xs font-bold text-white">No Bids Submitted</p>
        <p className="text-[11px] text-slate-400 max-w-xs">No active vendors have submitted quotations for this RFQ yet.</p>
      </div>
    );
  }

  // Find the lowest quote total to highlight
  const lowestTotal = Math.min(...quoteList.map(q => Number(q.total_price)));

  return (
    <div className="space-y-6">
      <div className="p-5 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
        <h3 className="font-display font-extrabold text-base text-white tracking-tight">Bid Comparison Workspace</h3>
        <p className="text-xs text-slate-400 mt-0.5">Compare prices and delivery timelines for RFQ: <span className="text-brand-400 font-bold">{rfq.title}</span></p>
      </div>

      <div className="overflow-x-auto glass-card rounded-2xl border border-slate-800/40 shadow-2xl">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 w-1/3">Line Item specifications</th>
              <th className="p-4 text-center">Target Price</th>
              {quoteList.map(q => {
                const isLowest = Number(q.total_price) === lowestTotal;
                return (
                  <th key={q.id} className={`p-4 text-center ${isLowest ? 'bg-brand-500/5' : ''}`}>
                    <div className="space-y-1">
                      <p className="text-white font-extrabold text-sm">{q.vendor_name}</p>
                      {isLowest && (
                        <span className="inline-block text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Lowest Bid
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rfq.items.map((rfqItem) => (
              <tr key={rfqItem.id} className="hover:bg-slate-900/10 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-slate-200">{rfqItem.item_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{rfqItem.description}</p>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold">Qty: {rfqItem.quantity}</p>
                </td>
                <td className="p-4 text-center text-slate-400 font-bold">
                  ${Number(rfqItem.target_price).toLocaleString()}
                </td>
                {quoteList.map((q) => {
                  const qItem = q.items.find(item => item.rfq_item === rfqItem.id);
                  const isLowest = Number(q.total_price) === lowestTotal;
                  return (
                    <td key={q.id} className={`p-4 text-center font-bold text-white ${isLowest ? 'bg-brand-500/5' : ''}`}>
                      {qItem ? `$${Number(qItem.unit_price).toLocaleString()}` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Shipping row */}
            <tr className="bg-slate-950/20">
              <td className="p-4 font-bold text-slate-400">Shipping & Surcharge</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => {
                const isLowest = Number(q.total_price) === lowestTotal;
                return (
                  <td key={q.id} className={`p-4 text-center text-slate-300 font-bold ${isLowest ? 'bg-brand-500/5' : ''}`}>
                    ${Number(q.shipping_cost).toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Total Row */}
            <tr className="bg-slate-950/40 font-bold border-t border-b border-slate-800">
              <td className="p-4 text-white font-extrabold text-xs">Total Bid Value</td>
              <td className="p-4 text-center text-slate-400">
                ${rfq.items.reduce((sum, item) => sum + (item.quantity * item.target_price), 0).toLocaleString()}
              </td>
              {quoteList.map(q => {
                const isLowest = Number(q.total_price) === lowestTotal;
                return (
                  <td key={q.id} className={`p-4 text-center text-brand-400 text-sm font-black ${isLowest ? 'bg-brand-500/10' : ''}`}>
                    ${Number(q.total_price).toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Timelines row */}
            <tr>
              <td className="p-4 font-bold text-slate-400">Delivery Date</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => {
                const isLowest = Number(q.total_price) === lowestTotal;
                return (
                  <td key={q.id} className={`p-4 text-center text-slate-300 text-[10px] ${isLowest ? 'bg-brand-500/5' : ''}`}>
                    {new Date(q.delivery_date).toLocaleDateString()}
                  </td>
                );
              })}
            </tr>

            {/* Selection actions row */}
            <tr>
              <td className="p-4 font-bold text-slate-400">Selection Action</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => {
                const isLowest = Number(q.total_price) === lowestTotal;
                return (
                  <td key={q.id} className={`p-4 text-center ${isLowest ? 'bg-brand-500/5' : ''}`}>
                    {q.status === 'accepted' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 size={12} /> Selected
                      </span>
                    ) : q.status === 'rejected' ? (
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Rejected</span>
                    ) : (
                      <button
                        disabled={selectMutation.isPending}
                        onClick={() => selectMutation.mutate(q.id)}
                        className="py-1.5 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-[0.98] mx-auto shadow-md shadow-brand-600/15"
                      >
                        {selectMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Select Bid
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
