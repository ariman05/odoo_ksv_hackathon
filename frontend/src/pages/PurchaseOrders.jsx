import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Send, ShieldAlert, Award, Calendar, DollarSign, Loader2, ArrowLeft, Info, Receipt } from 'lucide-react';
import api from '../api.js';
import { CardSkeleton, TableRowSkeleton } from '../components/Skeleton.jsx';

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isVendor = user.role === 'vendor';

  const [selectedPo, setSelectedPo] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceComments, setInvoiceComments] = useState('');

  // Fetch POs
  const { data: pos, isLoading: posLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/api/purchase-orders/');
      return res.data;
    }
  });

  const poList = Array.isArray(pos) ? pos : (pos?.results || []);

  // Fetch Invoices for selected PO
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', selectedPo?.id],
    queryFn: async () => {
      if (!selectedPo) return null;
      const res = await api.get(`/api/invoices/?po=${selectedPo.id}`);
      return res.data;
    },
    enabled: !!selectedPo
  });

  const invoiceList = Array.isArray(invoices) ? invoices : (invoices?.results || []);

  // Acknowledge PO Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/purchase-orders/${id}/acknowledge/`);
      return res.data;
    },
    onSuccess: (data) => {
      setSelectedPo(data);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      alert("PO Acknowledged and accepted successfully!");
    }
  });

  // Submit Invoice Mutation
  const submitInvoiceMutation = useMutation({
    mutationFn: async (invoiceData) => {
      const res = await api.post('/api/invoices/', invoiceData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedPo.id] });
      setShowInvoiceForm(false);
      setInvoiceDueDate('');
      setInvoiceComments('');
      alert("Invoice submitted successfully!");
    }
  });

  // Pay Invoice Mutation
  const payInvoiceMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/invoices/${id}/pay/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedPo.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      alert("Invoice payment processed successfully!");
    }
  });

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    submitInvoiceMutation.mutate({
      po: selectedPo.id,
      total_amount: selectedPo.total_amount,
      due_date: invoiceDueDate,
      comments: invoiceComments
    });
  };

  // PO status list stages
  const getPOProgressStep = (status) => {
    switch (status) {
      case 'draft': return 1;
      case 'sent': return 2;
      case 'acknowledged': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {selectedPo ? (
        <div className="space-y-6">
          <button 
            onClick={() => {
              setSelectedPo(null);
              setShowInvoiceForm(false);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back to POs Directory
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Styled Purchase Order (Left/Mid) */}
            <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-8 border border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-brand-500/5 blur-3xl" />
              
              {/* Progress Tracker */}
              <div className="border-b border-slate-800/40 pb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Order Progress Timeline</p>
                <div className="flex items-center justify-between max-w-lg relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-slate-800 z-0" />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-brand-500 z-0 transition-all duration-500" 
                    style={{ width: `${((getPOProgressStep(selectedPo.status) - 1) / 3) * 100}%` }}
                  />
                  {['Draft', 'Sent', 'Accepted', 'Completed'].map((label, idx) => {
                    const step = idx + 1;
                    const active = getPOProgressStep(selectedPo.status) >= step;
                    return (
                      <div key={label} className="flex flex-col items-center relative z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                          active 
                            ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {active ? <Check size={10} /> : step}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PO Header */}
              <div className="flex justify-between items-start border-b border-slate-800/40 pb-6">
                <div>
                  <h3 className="text-xl font-bold font-display uppercase tracking-wider text-slate-200">Purchase Order</h3>
                  <p className="text-xs text-slate-450 mt-1 font-semibold">Order Ref: <span className="text-white font-bold">{selectedPo.po_number}</span></p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <h4 className="font-bold text-sm text-white">VendorBridge Corp</h4>
                  <p>100 Procurement Blvd</p>
                  <p>New York, NY 10001</p>
                </div>
              </div>

              {/* Addresses details */}
              <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-800/40 pb-6">
                <div>
                  <h5 className="font-bold text-slate-500 uppercase tracking-widest mb-1.5">Supplier Details</h5>
                  <p className="font-bold text-white text-sm">{selectedPo.vendor_name}</p>
                  <p className="text-slate-450 mt-0.5">Authorized Procurement Partner</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deliver To</h5>
                  <p className="font-bold text-white text-sm">VendorBridge HQ</p>
                  <p className="text-slate-450 mt-0.5">Receiving Dept, Floor 1</p>
                </div>
              </div>

              {/* PO terms */}
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 text-xs space-y-1">
                <span className="font-bold text-slate-400">Terms of Purchase:</span>
                <p className="text-slate-350">{selectedPo.terms || 'Standard procurement terms apply. Net 30 payment terms.'}</p>
              </div>

              {/* Total Summary */}
              <div className="pt-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total PO Value</span>
                  <p className="text-2xl font-black text-brand-400 font-display">${selectedPo.total_amount?.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Status</span>
                  <div>
                    <span className="inline-block text-[8px] uppercase font-bold tracking-widest px-3 py-1 rounded-md bg-brand-500/10 border border-brand-500/15 text-brand-400">
                      {selectedPo.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acknowledge buttons */}
              {isVendor && selectedPo.status === 'sent' && (
                <div className="flex gap-4 border-t border-slate-800/40 pt-6">
                  <button
                    disabled={acknowledgeMutation.isPending}
                    onClick={() => acknowledgeMutation.mutate(selectedPo.id)}
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/10"
                  >
                    {acknowledgeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Acknowledge & Accept PO
                  </button>
                </div>
              )}
            </div>

            {/* Invoices List / Submit Box (Right sidebar) */}
            <div className="space-y-6">
              {/* Submit Invoice Box */}
              {isVendor && selectedPo.status === 'acknowledged' && !showInvoiceForm && (
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover-scale shadow-lg shadow-brand-600/15"
                >
                  <Send size={14} /> Create Invoice
                </button>
              )}

              {showInvoiceForm && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/40 space-y-4">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800/40 pb-2">Submit Invoice</h4>
                  <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Due Date *</label>
                      <input 
                        type="date"
                        required
                        value={invoiceDueDate}
                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                        className="input-premium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Payment Comments</label>
                      <textarea 
                        rows={2}
                        value={invoiceComments}
                        onChange={(e) => setInvoiceComments(e.target.value)}
                        placeholder="Wire details/reference info..."
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/20 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={submitInvoiceMutation.isPending}
                        className="flex-1 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                      >
                        {submitInvoiceMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowInvoiceForm(false)}
                        className="px-3 py-2 bg-slate-900 text-slate-300 border border-slate-850 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Invoices List */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800/40 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800/40 pb-2">Associated Invoices</h4>
                {invoicesLoading ? (
                  <p className="text-xs text-slate-500 text-center py-4">Loading invoices...</p>
                ) : invoiceList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No invoices submitted against this PO.</p>
                ) : (
                  <div className="space-y-3">
                    {invoiceList.map((inv) => (
                      <div key={inv.id} className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-white text-[11px]">{inv.invoice_number}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded border ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="font-black text-brand-450 text-[13px]">${Number(inv.total_amount).toLocaleString()}</p>

                        {!isVendor && inv.status === 'submitted' && (
                          <button
                            disabled={payInvoiceMutation.isPending}
                            onClick={() => payInvoiceMutation.mutate(inv.id)}
                            className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 border border-emerald-500/15 transition-all"
                          >
                            {payInvoiceMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Approve & Pay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 glass-card rounded-2xl border border-slate-800/40">
            <h2 className="text-xl lg:text-2xl font-extrabold font-display text-white tracking-tight">POs & Invoicing Portal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Review active purchase orders, accepts terms, and processes billing accounts</p>
          </div>

          {posLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : poList.length === 0 ? (
            <div className="text-center py-16 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30 flex flex-col items-center justify-center space-y-2">
              <Receipt size={20} className="text-slate-400" />
              <p className="text-xs font-bold text-white">No Purchase Orders</p>
              <p className="text-[11px] text-slate-400 max-w-xs">No active procurement agreements or purchase orders are recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poList.map((po) => (
                <div 
                  key={po.id} 
                  onClick={() => setSelectedPo(po)}
                  className="glass-card rounded-2xl p-6 border border-slate-800/40 hover:-translate-y-1 hover:border-brand-500/30 cursor-pointer transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{po.po_number}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">RFQ: {po.rfq_title}</p>
                      </div>
                      <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                        po.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 space-y-1.5 border-t border-slate-800/40 pt-3 font-semibold">
                      <p>Vendor: <span className="text-slate-200">{po.vendor_name}</span></p>
                      <p>Date: <span className="text-slate-200">{new Date(po.created_at).toLocaleDateString()}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 mt-4">
                    <span className="text-[9px] font-bold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 uppercase tracking-wider">
                      PO details →
                    </span>
                    <span className="font-black text-slate-200 text-sm">${po.total_amount?.toLocaleString()}</span>
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
