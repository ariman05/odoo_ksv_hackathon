import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, ClipboardCheck, Clock, ShieldCheck, ClipboardList, Info } from 'lucide-react';
import api from '../api.js';
import { TableRowSkeleton } from '../components/Skeleton.jsx';

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
      alert("Approval action processed successfully!");
    }
  });

  const handleAction = (id, action) => {
    actionMutation.mutate({ id, action, comments });
  };

  const approvalList = Array.isArray(approvals) ? approvals : (approvals?.results || []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold font-display text-white tracking-tight">Approvals Workspace</h2>
          <p className="text-xs text-slate-400 mt-0.5">Review active procurement bids and audit workflow status processes</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : approvalList.length === 0 ? (
        <div className="text-center py-16 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30 flex flex-col items-center justify-center space-y-2">
          <ShieldCheck size={20} className="text-slate-400" />
          <p className="text-xs font-bold text-white">No Approvals Pending</p>
          <p className="text-[11px] text-slate-400 max-w-xs">All active selections have been fully actioned or there are no quotes pending review.</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {approvalList.map((approval) => (
              <motion.div 
                key={approval.id} 
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 }
                }}
                layout
                className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col lg:flex-row gap-6 justify-between items-start"
              >
                {/* Approval Info */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-[8px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${
                      approval.stage === 'manager_review' 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                        : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    }`}>
                      {approval.stage.replace('_', ' ')}
                    </span>
                    
                    <span className={`text-[8px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${
                      approval.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : approval.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {approval.status}
                    </span>

                    <span className="text-[10px] text-slate-500 font-semibold">
                      Created {new Date(approval.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-base lg:text-lg text-white">RFQ: {approval.rfq_title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Vendor Bidder: <span className="text-brand-400 font-bold">{approval.vendor_name}</span></p>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-slate-950/40 border border-slate-900 rounded-xl max-w-sm">
                    <ClipboardCheck size={16} className="text-slate-500 shrink-0" />
                    <div className="text-[11px] font-semibold">
                      <span className="text-slate-400">Total Bidding Value: </span>
                      <span className="font-bold text-white">${Number(approval.total_price).toLocaleString()}</span>
                    </div>
                  </div>

                  {approval.comments && (
                    <div className="text-xs p-3 bg-slate-950/60 border border-slate-900/60 rounded-xl space-y-1 max-w-2xl">
                      <p className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Decision comments:</p>
                      <p className="text-slate-300 italic">"{approval.comments}"</p>
                    </div>
                  )}
                </div>

                {/* Approval workflow action workspace */}
                {approval.status === 'pending' && isAdmin && (
                  <div className="w-full lg:w-96 p-5 bg-slate-950/30 border border-slate-800/40 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sign-off comments</label>
                      <textarea
                        placeholder="Add review references, conditions, or rejection reasons..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 text-xs resize-none"
                      />
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => handleAction(approval.id, 'approved')}
                        className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 border border-emerald-500/15 transition-all active:scale-[0.98]"
                      >
                        {actionMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={12} />} Approve
                      </button>
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => handleAction(approval.id, 'rejected')}
                        className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 border border-red-500/15 transition-all active:scale-[0.98]"
                      >
                        {actionMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <X size={12} />} Reject
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
