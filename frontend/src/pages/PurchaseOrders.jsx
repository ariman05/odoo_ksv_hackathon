import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Check, Send, ShieldAlert, Award, Calendar, DollarSign, Loader2, ArrowLeft } from 'lucide-react';
import api from '../api.js';

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

  // Acknowledge PO Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/purchase-orders/${id}/acknowledge/`);
      return res.data;
    },
    onSuccess: (data) => {
      setSelectedPo(data);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      alert("PO Acknowledged successfully!");
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
      alert("Invoice marked as PAID!");
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

  return (
    <div className="space-y-6">
      {selectedPo ? (
        <div className="space-y-6">
          <button 
            onClick={() => {
              setSelectedPo(null);
              setShowInvoiceForm(false);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to POs Directory
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Styled Purchase Order (Left/Mid) */}
            <div className="lg:col-span-2 bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-8 border border-slate-200">
              {/* PO Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h3 className="text-2xl font-bold font-display uppercase tracking-wider text-slate-800">Purchase Order</h3>
                  <p className="text-xs text-slate-500 mt-1">Order Ref: {selectedPo.po_number}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-lg text-slate-800">VendorBridge Corp</h4>
                  <p className="text-xs text-slate-500">100 Procurement Blvd</p>
                  <p className="text-xs text-slate-500">New York, NY 10001</p>
                </div>
              </div>

              {/* Addresses details */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <h5 className="font-bold text-slate-400 uppercase tracking-widest mb-1.5">Supplier Details</h5>
                  <p className="font-semibold text-slate-700">{selectedPo.vendor_name}</p>
                  <p className="text-slate-500">Authorized Procurement Partner</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deliver To</h5>
                  <p className="font-semibold text-slate-700">VendorBridge HQ</p>
                  <p className="text-slate-500">Receiving Dept, Floor 1</p>
                </div>
              </div>

              {/* PO terms */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-600">Purchase Terms:</span>
                <p className="text-slate-500">{selectedPo.terms || 'Standard procurement terms apply. Net 30 payment.'}</p>
              </div>

              {/* Total Summary */}
              <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total PO Value</span>
                  <p className="text-3xl font-extrabold text-slate-800 font-display">${selectedPo.total_amount?.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                  <div>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                      {selectedPo.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acknowledge buttons */}
              {isVendor && selectedPo.status === 'sent' && (
                <div className="flex gap-4 border-t border-slate-100 pt-6">
                  <button
                    disabled={acknowledgeMutation.isPending}
                    onClick={() => acknowledgeMutation.mutate(selectedPo.id)}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/10"
                  >
                    {acknowledgeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />} Acknowledge & Accept PO
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
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 hover-scale shadow-lg shadow-brand-500/20"
                >
                  <Send size={14} /> Create Invoice
                </button>
              )}

              {showInvoiceForm && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/40 space-y-4">
                  <h4 className="font-bold text-white text-sm">Submit Invoice</h4>
                  <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Date *</label>
                      <input 
                        type="date"
                        required
                        value={invoiceDueDate}
                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment comments</label>
                      <textarea 
                        rows={2}
                        value={invoiceComments}
                        onChange={(e) => setInvoiceComments(e.target.value)}
                        placeholder="Wire details/reference info..."
                        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-white text-xs focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={submitInvoiceMutation.isPending}
                        className="flex-1 py-2 bg-brand-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1"
                      >
                        {submitInvoiceMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowInvoiceForm(false)}
                        className="px-3 py-2 bg-slate-900 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Invoices List */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800/40 space-y-4">
                <h4 className="font-bold text-white text-sm">Associated Invoices</h4>
                {invoicesLoading ? (
                  <p className="text-xs text-slate-500">Loading invoices...</p>
                ) : invoices?.results?.length === 0 ? (
                  <p className="text-xs text-slate-500">No invoices submitted against this PO.</p>
                ) : (
                  <div className="space-y-3">
                    {invoices?.results?.map((inv) => (
                      <div key={inv.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white">{inv.invoice_number}</p>
                            <p className="text-[10px] text-slate-400">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="font-semibold text-brand-400">${inv.total_amount.toLocaleString()}</p>

                        {!isVendor && inv.status === 'submitted' && (
                          <button
                            disabled={payInvoiceMutation.isPending}
                            onClick={() => payInvoiceMutation.mutate(inv.id)}
                            className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg font-semibold text-[10px] flex items-center justify-center gap-1 border border-emerald-500/20 transition-all"
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
          <div className="p-6 glass-card rounded-2xl border border-slate-800/40">
            <h2 className="text-2xl font-bold font-display text-white">Purchase Orders</h2>
            <p className="text-xs text-slate-400 mt-1">Review legal procurement purchase agreements and invoices</p>
          </div>

          {posLoading ? (
            <div className="text-center py-12 text-slate-400">Loading orders...</div>
          ) : pos?.results?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
              No purchase orders active.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pos?.results?.map((po) => (
                <div 
                  key={po.id} 
                  onClick={() => setSelectedPo(po)}
                  className="glass-card rounded-2xl p-6 border border-slate-800/40 hover:border-slate-700/50 cursor-pointer transition-all duration-300 hover:scale-[1.01] relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">{po.po_number}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">RFQ: {po.rfq_title}</p>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                        po.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-800/30 pt-3">
                      <p>Vendor: <span className="font-semibold text-slate-300">{po.vendor_name}</span></p>
                      <p>Date: <span className="font-semibold text-slate-300">{new Date(po.created_at).toLocaleDateString()}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/30 pt-4 mt-4">
                    <span className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                      View PO Details →
                    </span>
                    <span className="font-bold text-slate-200 text-sm">${po.total_amount?.toLocaleString()}</span>
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
