import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, TrendingUp, Users, DollarSign, Award, ArrowUpRight } from 'lucide-react';
import api from '../api.js';
import StatCard from '../components/StatCard.jsx';

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f43f5e', '#10b981'];

export default function Reports() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports-analytics'],
    queryFn: async () => {
      const res = await api.get('/api/reports/');
      return res.data;
    }
  });

  const stats = reportData?.stats || {
    total_spend: 0,
    open_rfqs: 0,
    pending_approvals: 0,
    active_vendors: 0
  };

  const spendByCategory = reportData?.spend_by_category || [];
  const topVendors = reportData?.top_vendors || [];
  const monthlySpend = reportData?.monthly_spend || [];

  return (
    <div className="space-y-8">
      <div className="p-6 glass-card rounded-2xl border border-slate-800/40">
        <h2 className="text-2xl font-bold font-display text-white">Reports & Procurement Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">Audit department budgets, category spend distributions, and vendor performance ratings</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Capital Spend" 
          value={isLoading ? '...' : `$${stats.total_spend.toLocaleString()}`} 
          icon={DollarSign} 
          description="Cumulative procurement spend" 
        />
        <StatCard 
          title="Total Bids Submitted" 
          value={isLoading ? '...' : stats.total_bids} 
          icon={TrendingUp} 
          description="Total quotations received" 
        />
        <StatCard 
          title="Fulfillment Rate" 
          value={isLoading ? '...' : stats.fulfillment_rate} 
          icon={Award} 
          description="POs completed successfully" 
        />
        <StatCard 
          title="Authorized Suppliers" 
          value={isLoading ? '...' : stats.active_vendors} 
          icon={Users} 
          description="Checked compliance rating" 
        />
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spend */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/40 h-[380px] flex flex-col">
          <h3 className="font-display font-bold text-white mb-4">Capital Outlay (Monthly)</h3>
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading outlay...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="spend" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category breakdown (Pie chart) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/40 h-[380px] flex flex-col">
          <h3 className="font-display font-bold text-white mb-4">Spend by Procurement Category</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-6 min-h-0">
            <div className="flex-1 w-full h-[200px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading breakdown...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {spendByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="space-y-2.5 shrink-0 min-w-[150px]">
              {spendByCategory.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-400 font-semibold">{entry.name}:</span>
                  <span className="text-white font-bold ml-auto">${entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Vendors Leaderboard */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/40">
        <h3 className="font-display font-bold text-white mb-4">Top Suppliers by Procurement Value</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest pb-3 font-semibold">
                <th className="pb-3">Supplier Name</th>
                <th className="pb-3 text-center">Bids count</th>
                <th className="pb-3 text-right">Capital Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {topVendors.map((vendor, idx) => (
                <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                  <td className="py-4 font-bold text-slate-200 flex items-center gap-2">
                    <span className="h-5 w-5 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] text-slate-400">
                      {idx + 1}
                    </span>
                    {vendor.vendor}
                  </td>
                  <td className="py-4 text-center font-semibold text-slate-400">
                    {vendor.rfqs}
                  </td>
                  <td className="py-4 text-right font-extrabold text-brand-400 text-sm">
                    ${vendor.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
