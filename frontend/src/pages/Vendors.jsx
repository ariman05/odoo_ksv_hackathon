import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldAlert, Star, Mail, Phone, Calendar, Check, X, Loader2 } from 'lucide-react';
import api from '../api.js';
import { CardSkeleton } from '../components/Skeleton.jsx';

export default function Vendors() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch all vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors', statusFilter],
    queryFn: async () => {
      const res = await api.get(`/api/vendors/${statusFilter ? `?status=${statusFilter}` : ''}`);
      return res.data;
    }
  });

  const vendorList = Array.isArray(vendors) ? vendors : (vendors?.results || []);

  // Vendor Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await api.post(`/api/vendors/${id}/approve/`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
    }
  });

  const handleApprove = (id, action) => {
    approveMutation.mutate({ id, action });
  };

  const filteredVendors = vendorList.filter(vendor => 
    vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search vendors by name, representative, category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 text-sm"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredVendors.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30 flex flex-col items-center justify-center space-y-3"
        >
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 mb-2">
            <ShieldAlert size={20} />
          </div>
          <p className="text-sm font-bold text-white">No Vendors Found</p>
          <p className="text-xs text-slate-400 max-w-sm">No registered suppliers match your selected filters. Try broadening your keywords or resetting filters.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredVendors.map((vendor) => (
              <motion.div 
                key={vendor.id} 
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card rounded-2xl p-6 border border-slate-800/40 relative flex flex-col justify-between group hover:-translate-y-1 hover:border-brand-500/35 transition-all duration-300"
              >
                <div>
                  {/* Header Profile */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h4 className="font-display font-extrabold text-base text-white truncate">{vendor.company_name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{vendor.contact_person} (Rep)</p>
                    </div>
                    <span className={`inline-block text-[8px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border shrink-0 ${
                      vendor.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                        : vendor.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse'
                        : 'bg-red-500/10 text-red-400 border-red-500/15'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>

                  {/* Rating & Category */}
                  <div className="flex items-center gap-3 mb-5 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-bold text-white">{vendor.rating}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="bg-brand-500/5 border border-brand-500/10 px-2 py-0.5 rounded text-brand-400 font-semibold">
                      {vendor.category}
                    </span>
                  </div>

                  {/* Contacts details */}
                  <div className="space-y-2.5 text-[11px] text-slate-400 border-t border-slate-800/40 pt-4">
                    <div className="flex items-center gap-2.5">
                      <Mail size={12} className="text-slate-500" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={12} className="text-slate-500" />
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Calendar size={12} className="text-slate-500" />
                      <span>Joined {new Date(vendor.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Administrative Actions */}
                {vendor.status === 'pending' && (
                  <div className="flex gap-2.5 mt-6 border-t border-slate-800/40 pt-4">
                    <button 
                      disabled={approveMutation.isPending}
                      onClick={() => handleApprove(vendor.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-emerald-500/15 transition-all active:scale-[0.98]"
                    >
                      {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
                    </button>
                    <button 
                      disabled={approveMutation.isPending}
                      onClick={() => handleApprove(vendor.id, 'rejected')}
                      className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-red-500/15 transition-all active:scale-[0.98]"
                    >
                      {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Reject
                    </button>
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
