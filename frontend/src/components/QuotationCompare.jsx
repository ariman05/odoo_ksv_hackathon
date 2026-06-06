import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Info, CheckCircle2 } from 'lucide-react';
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

  if (isLoading) return <div className="text-center py-6 text-slate-400">Loading quotations...</div>;

  const quoteList = quotes?.results || [];

  if (quoteList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-slate-800/40 bg-slate-900/30 rounded-2xl">
        No bids have been submitted for this RFQ yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 glass-card rounded-2xl border border-slate-800/40">
        <h3 className="font-display font-bold text-lg text-white mb-2">Quote Comparison Matrix</h3>
        <p className="text-xs text-slate-400">RFQ: {rfq.title} • Compare prices and timelines to select the optimal bid.</p>
      </div>

      <div className="overflow-x-auto glass-card rounded-2xl border border-slate-800/40">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Line Item / Specifications</th>
              <th className="p-4 text-center">Target Price</th>
              {quoteList.map(q => (
                <th key={q.id} className="p-4 text-center">
                  <div className="space-y-1">
                    <p className="text-white font-bold">{q.vendor_name}</p>
                    <span className="text-[10px] uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                      Rating: 4.8
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rfq.items.map((rfqItem) => (
              <tr key={rfqItem.id} className="hover:bg-slate-900/20 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-slate-200">{rfqItem.item_name}</p>
                  <p className="text-xs text-slate-500">{rfqItem.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Quantity: {rfqItem.quantity}</p>
                </td>
                <td className="p-4 text-center text-slate-400 font-semibold">
                  ${rfqItem.target_price}
                </td>
                {quoteList.map((q) => {
                  const qItem = q.items.find(item => item.rfq_item === rfqItem.id);
                  return (
                    <td key={q.id} className="p-4 text-center font-bold text-white">
                      {qItem ? `$${qItem.unit_price}` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Shipping row */}
            <tr className="bg-slate-900/10">
              <td className="p-4 font-semibold text-slate-400">Shipping & Surcharge</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => (
                <td key={q.id} className="p-4 text-center text-slate-300 font-semibold">
                  ${q.shipping_cost}
                </td>
              ))}
            </tr>

            {/* Total Row */}
            <tr className="bg-brand-500/5 font-bold">
              <td className="p-4 text-white">Total Quote Amount</td>
              <td className="p-4 text-center text-slate-400">
                ${rfq.items.reduce((sum, item) => sum + (item.quantity * item.target_price), 0).toLocaleString()}
              </td>
              {quoteList.map(q => (
                <td key={q.id} className="p-4 text-center text-brand-400 text-lg">
                  ${q.total_price.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Timelines row */}
            <tr>
              <td className="p-4 font-semibold text-slate-400">Promised Delivery</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => (
                <td key={q.id} className="p-4 text-center text-slate-300 text-xs">
                  {new Date(q.delivery_date).toLocaleDateString()}
                </td>
              ))}
            </tr>

            {/* Selection actions row */}
            <tr>
              <td className="p-4 font-semibold text-slate-400">Selection Action</td>
              <td className="p-4 text-center text-slate-500">-</td>
              {quoteList.map(q => (
                <td key={q.id} className="p-4 text-center">
                  {q.status === 'accepted' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 size={12} /> Selected
                    </span>
                  ) : q.status === 'rejected' ? (
                    <span className="text-xs text-slate-500">Rejected</span>
                  ) : (
                    <button
                      disabled={selectMutation.isPending}
                      onClick={() => selectMutation.mutate(q.id)}
                      className="py-1.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover-scale shadow-lg shadow-brand-500/10"
                    >
                      {selectMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Select Bid
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
