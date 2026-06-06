import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, MessageSquare, ClipboardCheck, Clock, UserCheck } from 'lucide-react';
import api from '../api.js';

export default function Approvals() {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role !== 'vendor';

  const [comments, setComments] = useState('');

  // Fetch approvals
  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await api.get('/api/approvals/');
      return res.data;
    }
  });

  // Action mutation (Approve/Reject)
  const actionMutation = useMutation({
    mutationFn: async ({ id, action, comments }) => {
      const res = await api.post(`/api/approvals/${id}/action/`, { action, comments });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      setComments('');
      alert("Approval action processed!");
    }
  });

  const handleAction = (id, action) => {
    actionMutation.mutate({ id, action, comments });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Approvals Workspace</h2>
          <p className="text-xs text-slate-400 mt-1">Review active procurement bids and audit workflow processes</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading approvals...</div>
      ) : approvals?.results?.length === 0 ? (
        <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
          No approvals pending or actioned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {approvals?.results?.map((approval) => (
            <div 
              key={approval.id} 
              className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col lg:flex-row gap-6 justify-between items-start"
            >
              {/* Approval Info */}
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    approval.stage === 'manager_review' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                  }`}>
                    {approval.stage.replace('_', ' ')}
                  </span>
                  
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    approval.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : approval.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {approval.status}
                  </span>

                  <span className="text-xs text-slate-500">
                    Created {new Date(approval.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white">RFQ: {approval.rfq_title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Vendor Bidder: <span className="text-brand-400 font-semibold">{approval.vendor_name}</span></p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-900 rounded-xl max-w-sm">
                  <ClipboardCheck size={16} className="text-slate-500" />
                  <div className="text-xs">
                    <span className="text-slate-400">Total Bidding Value: </span>
                    <span className="font-bold text-white">${approval.total_price?.toLocaleString()}</span>
                  </div>
                </div>

                {approval.comments && (
                  <div className="text-xs p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <p className="font-semibold text-slate-300">Decision comments:</p>
                    <p className="text-slate-400 italic">"{approval.comments}"</p>
                  </div>
                )}
              </div>

              {/* Approval workflow action workspace */}
              {approval.status === 'pending' && isAdmin && (
                <div className="w-full lg:w-96 p-5 bg-slate-900/30 border border-slate-800/40 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sign-off comments</label>
                    <textarea
                      placeholder="Add logic, approvals references, or rejection reasons..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs resize-none"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction(approval.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {actionMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button
                      disabled={actionMutation.isPending}
                      onClick={() => handleAction(approval.id, 'rejected')}
                      className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 border border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {actionMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={14} />} Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
