import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, ShieldAlert, Award, Star, Mail, Phone, Calendar, Check, X, Loader2 } from 'lucide-react';
import api from '../api.js';

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

  const filteredVendors = vendors?.results?.filter(vendor => 
    vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search vendors by name, contact, category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
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
        <div className="text-center py-12 text-slate-400">Loading vendors...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
          No vendors found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div 
              key={vendor.id} 
              className="glass-card rounded-2xl p-6 border border-slate-800/40 relative flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 group"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-lg text-white truncate">{vendor.company_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{vendor.contact_person} (Representative)</p>
                  </div>
                  <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                    vendor.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : vendor.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {vendor.status}
                  </span>
                </div>

                {/* Rating & Category */}
                <div className="flex items-center gap-4 mb-5 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-white">{vendor.rating}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-700" />
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-brand-400">
                    {vendor.category}
                  </span>
                </div>

                {/* Contacts details */}
                <div className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800/40 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
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
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Approve
                  </button>
                  <button 
                    disabled={approveMutation.isPending}
                    onClick={() => handleApprove(vendor.id, 'rejected')}
                    className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={14} />} Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
