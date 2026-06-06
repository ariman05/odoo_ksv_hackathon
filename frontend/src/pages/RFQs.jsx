import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Calendar, Plus, ChevronRight, Eye, ClipboardList, 
  Send, Users, CheckCircle2, AlertCircle, Trash2, ArrowLeft, Loader2, Info
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api.js';
import RFQForm from '../components/RFQForm.jsx';
import QuotationCompare from '../components/QuotationCompare.jsx';
import { CardSkeleton, TableRowSkeleton, Skeleton } from '../components/Skeleton.jsx';

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

  const rfqList = Array.isArray(rfqs) ? rfqs : (rfqs?.results || []);

  // Quote Submission Mutation
  const submitQuoteMutation = useMutation({
    mutationFn: async (quoteData) => {
      const res = await api.post('/api/quotations/', quoteData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      setView('list');
      alert("Quotation bid submitted successfully!");
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
        <div className="space-y-4">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back to RFQs List
          </button>
          <QuotationCompare rfq={selectedRfq} />
        </div>
      )}

      {view === 'submit-quote' && selectedRfq && (
        <div className="glass-panel p-6 lg:p-8 rounded-3xl border border-slate-800/60 shadow-2xl space-y-6 max-w-3xl mx-auto">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider mb-2"
          >
            <ArrowLeft size={14} /> Back to RFQs
          </button>

          <div className="border-b border-slate-800/40 pb-4">
            <h3 className="font-display font-extrabold text-lg text-white tracking-tight">Submit Quotation Bid</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit pricing bid for: <span className="text-brand-400 font-bold">{selectedRfq.title}</span></p>
          </div>

          <form onSubmit={handleSubmit(handleQuoteSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promised Delivery Date *</label>
                <input 
                  {...register('delivery_date')} 
                  type="date"
                  className="input-premium"
                />
                {errors.delivery_date && <p className="text-xs text-red-400">{errors.delivery_date.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipping & Handling Cost ($) *</label>
                <input 
                  {...register('shipping_cost', { valueAsNumber: true })} 
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-premium"
                />
                {errors.shipping_cost && <p className="text-xs text-red-400">{errors.shipping_cost.message}</p>}
              </div>
            </div>

            {/* Quote Pricing Table */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider border-t border-slate-800/40 pt-4">Bidding Prices per Item</h4>
              <div className="space-y-3">
                {selectedRfq.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 bg-slate-950/30 border border-slate-900 rounded-2xl">
                    <div className="md:col-span-6">
                      <p className="text-xs font-bold text-white">{item.item_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <div className="md:col-span-2 text-xs text-slate-400 font-semibold">
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
                        className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Total Bid Amount (including shipping):</span>
              <span className="text-brand-400 font-black text-base">${quoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments / Proposal terms</label>
              <textarea 
                {...register('comments')} 
                placeholder="Include payment terms, warranty info, or specs exceptions..." 
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors text-sm resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800/40 pt-6">
              <button
                type="button"
                onClick={() => setView('list')}
                className="btn-secondary-premium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitQuoteMutation.isPending}
                className="btn-premium disabled:opacity-50"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusFilter('')}
                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl border transition-all ${
                  statusFilter === '' 
                    ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All RFQs
              </button>
              <button 
                onClick={() => setStatusFilter('open')}
                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl border transition-all ${
                  statusFilter === 'open' 
                    ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Open Bids
              </button>
              <button 
                onClick={() => setStatusFilter('closed')}
                className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl border transition-all ${
                  statusFilter === 'closed' 
                    ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Closed
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setView('create')}
                className="btn-premium"
              >
                <Plus size={16} /> Create RFQ
              </button>
            )}
          </div>

          {/* RFQs List */}
          {isLoading ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : rfqList.length === 0 ? (
            <div className="text-center py-16 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30 flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 mb-2">
                <ClipboardList size={20} />
              </div>
              <p className="text-sm font-bold text-white">No RFQs Found</p>
              <p className="text-xs text-slate-400 max-w-sm">There are no Requests for Quotation published under the selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {rfqList.map((rfq) => (
                <div 
                  key={rfq.id} 
                  className="glass-card rounded-2xl p-6 border border-slate-800/40 hover:border-slate-800/60 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-extrabold text-base lg:text-lg text-white">RFQ-{rfq.id}: {rfq.title}</h3>
                        <span className={`inline-block text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                          rfq.status === 'open' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : rfq.status === 'closed'
                            ? 'bg-slate-800/40 text-slate-400 border-slate-850'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {rfq.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">{rfq.description}</p>
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-1.5 text-[10px] text-slate-400 shrink-0 font-semibold">
                      <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 px-2 py-1 rounded-lg">
                        <Calendar size={12} className="text-slate-500" />
                        <span>Deadline: <span className="text-white">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 px-2 py-1 rounded-lg mt-1">
                        <ClipboardList size={12} className="text-slate-500" />
                        <span>Quotes: <span className="text-brand-400 font-extrabold">{rfq.quotations_count || 0} submitted</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Drawer */}
                  <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-4 mt-4 space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Included Line Items ({rfq.items?.length || 0})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rfq.items?.map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-900/60">
                          <div>
                            <p className="font-bold text-slate-200">{item.item_name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[200px]">{item.description || 'No specifications listed'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-slate-300 font-semibold">Qty: {item.quantity}</p>
                            {isAdmin && <p className="text-[9px] text-slate-500 font-medium">Target: ${item.target_price}</p>}
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
                          className="py-1.5 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 border border-brand-500/15 transition-all"
                        >
                          <Users size={12} /> Compare Bids ({rfq.quotations_count})
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this RFQ?')) {
                              deleteRfqMutation.mutate(rfq.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 bg-slate-950/50 border border-slate-800 rounded-xl hover:bg-slate-900/50 transition-colors"
                          title="Delete RFQ"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      rfq.status === 'open' && (
                        <button
                          onClick={() => handleOpenSubmitQuote(rfq)}
                          className="btn-premium"
                        >
                          <Send size={12} /> Submit Bid Quote
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
    </motion.div>
  );
}
