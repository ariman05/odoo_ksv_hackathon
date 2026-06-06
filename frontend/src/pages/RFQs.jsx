import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Calendar, Plus, ChevronRight, Eye, ClipboardList, 
  Send, Users, CheckCircle2, AlertCircle, Trash2, ArrowLeft, Loader2
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api.js';
import RFQForm from '../components/RFQForm.jsx';
import QuotationCompare from '../components/QuotationCompare.jsx';

// Quote Schema for Submission
const quoteSchema = z.object({
  delivery_date: z.string().min(1, 'Delivery date is required'),
  shipping_cost: z.number().min(0, 'Shipping cost must be positive'),
  comments: z.string().optional(),
  items: z.array(z.object({
    rfq_item: z.number(),
    unit_price: z.number().min(0.01, 'Price must be greater than 0'),
  }))
});

export default function RFQs() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role !== 'vendor';

  const [view, setView] = useState('list'); // list | create | compare | submit-quote
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch RFQs
  const { data: rfqs, isLoading } = useQuery({
    queryKey: ['rfqs', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/api/rfqs/${statusFilter ? `?status=${statusFilter}` : ''}`);
      return res.data;
    }
  });

  // Quote Submission Mutation
  const submitQuoteMutation = useMutation({
    mutationFn: async (quoteData) => {
      const res = await api.post('/api/quotations/', quoteData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      setView('list');
    }
  });

  // RFQ Delete Mutation
  const deleteRfqMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/rfqs/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    }
  });

  // Setup Quote Form
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(quoteSchema),
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  // Calculate dynamic quote totals
  const watchItems = watch('items') || [];
  const watchShipping = watch('shipping_cost') || 0;
  const quoteTotal = watchItems.reduce((acc, curr, idx) => {
    const qty = selectedRfq?.items?.[idx]?.quantity || 1;
    return acc + (curr.unit_price * qty);
  }, 0) + Number(watchShipping);

  const handleOpenSubmitQuote = (rfq) => {
    setSelectedRfq(rfq);
    // Initialize items array with correct RFQ item IDs
    const itemsInit = rfq.items.map(item => ({
      rfq_item: item.id,
      unit_price: item.target_price
    }));
    setValue('items', itemsInit);
    setValue('shipping_cost', 0);
    setValue('delivery_date', '');
    setValue('comments', '');
    setView('submit-quote');
  };

  const handleQuoteSubmit = (data) => {
    // Inject RFQ ID and calculate total price
    const submitData = {
      rfq: selectedRfq.id,
      delivery_date: data.delivery_date,
      shipping_cost: data.shipping_cost,
      comments: data.comments,
      total_price: quoteTotal,
      items: data.items.map((item, idx) => ({
        rfq_item: item.rfq_item,
        unit_price: item.unit_price,
        total_price: item.unit_price * selectedRfq.items[idx].quantity
      }))
    };
    submitQuoteMutation.mutate(submitData);
  };

  return (
    <div className="space-y-6">
      {/* View router */}
      {view === 'create' && (
        <RFQForm 
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['rfqs'] });
            setView('list');
          }} 
          onCancel={() => setView('list')} 
        />
      )}

      {view === 'compare' && (
        <div>
          <button 
            onClick={() => setView('list')}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to RFQs List
          </button>
          <QuotationCompare rfq={selectedRfq} />
        </div>
      )}

      {view === 'submit-quote' && selectedRfq && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800/60 shadow-2xl space-y-6">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft size={16} /> Back to RFQs List
          </button>

          <div className="border-b border-slate-800/40 pb-4">
            <h3 className="font-display font-bold text-lg text-white">Submit Quotation</h3>
            <p className="text-xs text-slate-400">Submit pricing for: <span className="text-brand-400 font-semibold">{selectedRfq.title}</span></p>
          </div>

          <form onSubmit={handleSubmit(handleQuoteSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Promised Delivery Date *</label>
                <input 
                  {...register('delivery_date')} 
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
                />
                {errors.delivery_date && <p className="text-xs text-red-400">{errors.delivery_date.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Shipping & Handling Cost ($) *</label>
                <input 
                  {...register('shipping_cost', { valueAsNumber: true })} 
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
                />
                {errors.shipping_cost && <p className="text-xs text-red-400">{errors.shipping_cost.message}</p>}
              </div>
            </div>

            {/* Quote Pricing Table */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider border-t border-slate-800/40 pt-4">Bidding Prices per Item</h4>
              <div className="space-y-3">
                {selectedRfq.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-slate-900/30 border border-slate-800/60 rounded-xl">
                    <div className="md:col-span-6">
                      <p className="text-xs font-semibold text-white">{item.item_name}</p>
                      <p className="text-[10px] text-slate-400">{item.description}</p>
                    </div>
                    <div className="md:col-span-2 text-xs text-slate-300">
                      Qty: {item.quantity}
                    </div>
                    <div className="md:col-span-4 flex items-center gap-2">
                      <span className="text-xs text-slate-500">$</span>
                      <input 
                        {...register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Unit Price"
                        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl flex items-center justify-between text-sm">
              <span className="text-slate-300 font-semibold">Total Bid Amount (including shipping):</span>
              <span className="text-brand-400 font-bold text-lg">${quoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Comments / Proposal terms</label>
              <textarea 
                {...register('comments')} 
                placeholder="Include payment terms, warranty info, or specs exceptions..." 
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-6">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitQuoteMutation.isPending}
                className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 hover-scale shadow-lg shadow-brand-500/20"
              >
                {submitQuoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Bid
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40">
            <div className="flex gap-2.5">
              <button 
                onClick={() => setStatusFilter('')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  statusFilter === '' 
                    ? 'bg-brand-600/20 text-brand-400 border-brand-500/30' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All RFQs
              </button>
              <button 
                onClick={() => setStatusFilter('open')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  statusFilter === 'open' 
                    ? 'bg-brand-600/20 text-brand-400 border-brand-500/30' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Open Bids
              </button>
              <button 
                onClick={() => setStatusFilter('closed')}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  statusFilter === 'closed' 
                    ? 'bg-brand-600/20 text-brand-400 border-brand-500/30' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Closed
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setView('create')}
                className="py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 hover-scale shadow-lg shadow-brand-500/20"
              >
                <Plus size={16} /> Create RFQ
              </button>
            )}
          </div>

          {/* RFQs List */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading RFQs...</div>
          ) : rfqs?.results?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
              No RFQs found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {rfqs?.results?.map((rfq) => (
                <div 
                  key={rfq.id} 
                  className="glass-card rounded-2xl p-6 border border-slate-800/40 hover:border-slate-700/50 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-bold text-lg text-white">RFQ-{rfq.id}: {rfq.title}</h3>
                        <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          rfq.status === 'open' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : rfq.status === 'closed'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {rfq.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{rfq.description}</p>
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-1.5 text-xs text-slate-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>Deadline: <span className="font-semibold text-white">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ClipboardList size={14} className="text-slate-500" />
                        <span>Quotes: <span className="font-semibold text-brand-400">{rfq.quotations_count || 0} submitted</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Expansion */}
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 mt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Included Items ({rfq.items?.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rfq.items?.map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between p-2.5 rounded-lg bg-slate-900/30 border border-slate-900">
                          <div>
                            <p className="font-semibold text-white">{item.item_name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.description || 'No specs listed'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-slate-400">Qty: {item.quantity}</p>
                            {isAdmin && <p className="text-[10px] text-slate-500">Target: ${item.target_price}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contextual Actions */}
                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-800/30">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRfq(rfq);
                            setView('compare');
                          }}
                          className="py-2 px-4 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-brand-500/20 transition-all"
                        >
                          <Users size={14} /> Compare Bids ({rfq.quotations_count})
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this RFQ?')) {
                              deleteRfqMutation.mutate(rfq.id);
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-900/50 border border-slate-800 rounded-xl transition-colors hover:bg-slate-800"
                          title="Delete RFQ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      rfq.status === 'open' && (
                        <button
                          onClick={() => handleOpenSubmitQuote(rfq)}
                          className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 hover-scale shadow-lg shadow-brand-500/10"
                        >
                          <Send size={14} /> Submit Quote
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
