import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShieldAlert, Award, Calendar, DollarSign, MessageSquare, Search, FileCheck2 } from 'lucide-react';
import api from '../api.js';
import { TableRowSkeleton } from '../components/Skeleton.jsx';

export default function Quotations() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['my-quotations'],
    queryFn: async () => {
      const res = await api.get('/api/quotations/');
      return res.data;
    }
  });

  const quoteList = Array.isArray(quotes) ? quotes : (quotes?.results || []);

  const filteredQuotes = quoteList.filter(quote => 
    quote.rfq_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.vendor_name && quote.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold font-display text-white tracking-tight">Quotations Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track and audit active bidding records submitted across the system</p>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text" 
            placeholder="Search by RFQ or vendor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 text-xs font-semibold"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="text-center py-16 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30 flex flex-col items-center justify-center space-y-2">
          <FileCheck2 size={20} className="text-slate-400" />
          <p className="text-xs font-bold text-white">No Quotations Found</p>
          <p className="text-[11px] text-slate-400 max-w-xs">No bidding records found matching your query details.</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.04 }
            }
          }}
          className="grid grid-cols-1 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredQuotes.map((quote) => (
              <motion.div 
                key={quote.id} 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 }
                }}
                layout
                className="glass-card rounded-2xl p-5 border border-slate-800/40 hover:border-slate-800/80 transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="font-extrabold text-white text-sm truncate">Quote #{quote.id} for: {quote.rfq_title}</h4>
                    <span className={`text-[8px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${
                      quote.status === 'accepted' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : quote.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  
                  {user.role !== 'vendor' && (
                    <p className="text-[11px] text-slate-355 font-medium">Submitted by: <span className="font-bold text-brand-400">{quote.vendor_name}</span></p>
                  )}

                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 pt-1 font-semibold">
                    <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
                      <Calendar size={11} className="text-slate-500" />
                      <span>Delivery: <span className="text-white">{new Date(quote.delivery_date).toLocaleDateString()}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
                      <DollarSign size={11} className="text-slate-500" />
                      <span>Shipping: <span className="text-white">${Number(quote.shipping_cost).toLocaleString()}</span></span>
                    </div>
                    {quote.comments && (
                      <div className="flex items-center gap-1.5 max-w-xs truncate bg-slate-950/40 border border-slate-900 px-2 py-0.5 rounded">
                        <MessageSquare size={11} className="text-slate-500" />
                        <span className="truncate text-slate-300">"{quote.comments}"</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Total Price</p>
                    <p className="text-base font-black text-brand-400">${Number(quote.total_price).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
