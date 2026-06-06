import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, CheckSquare, DollarSign, Users, Activity, 
  ArrowUpRight, Clock, ShieldAlert, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import api from '../api.js';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Query Dashboard stats
  const { data: reportData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const res = await api.get('/api/reports/');
      return res.data;
    }
  });

  // Query Activity logs
  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await api.get('/api/activity/');
      return res.data;
    }
  });

  const stats = reportData?.stats || {
    total_spend: 0.0,
    open_rfqs: 0,
    pending_approvals: 0,
    active_vendors: 0,
    submitted_quotes: 0,
    accepted_quotes: 0,
    total_revenue: 0.0
  };

  const isVendor = user.role === 'vendor';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-white">
            Hello, {user.first_name || user.username}!
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isVendor 
              ? `Manage quotations, check approval statuses, and track revenue for ${user.company_name}.` 
              : 'Monitor procurement pipelines, approve bids, and manage vendor compliance profiles.'}
          </p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isVendor ? (
          <>
            <StatCard 
              title="Quotes Submitted" 
              value={statsLoading ? '...' : stats.submitted_quotes} 
              icon={FileText} 
              description="Lifetime submissions" 
            />
            <StatCard 
              title="Accepted Quotes" 
              value={statsLoading ? '...' : stats.accepted_quotes} 
              icon={Award} 
              description={`${stats.submitted_quotes ? Math.round((stats.accepted_quotes / stats.submitted_quotes) * 100) : 0}% success rate`} 
              trendType="up"
            />
            <StatCard 
              title="Revenue Earned" 
              value={statsLoading ? '...' : `$${stats.total_revenue.toLocaleString()}`} 
              icon={DollarSign} 
              description="Completed orders total" 
            />
            <StatCard 
              title="Vendor Rating" 
              value="4.85" 
              icon={Users} 
              description="Compliance score" 
            />
          </>
        ) : (
          <>
            <StatCard 
              title="Monthly Spend" 
              value={statsLoading ? '...' : `$${stats.total_spend.toLocaleString()}`} 
              icon={DollarSign} 
              description="Across all categories" 
              trend="+12.4%" 
              trendType="up"
            />
            <StatCard 
              title="Active RFQs" 
              value={statsLoading ? '...' : stats.open_rfqs} 
              icon={FileText} 
              description="Currently accepting bids" 
            />
            <StatCard 
              title="Pending Approvals" 
              value={statsLoading ? '...' : stats.pending_approvals} 
              icon={Clock} 
              description="Require manager sign-off" 
              trend={stats.pending_approvals > 0 ? "Action required" : "All clear"}
              trendType={stats.pending_approvals > 0 ? "down" : "up"}
            />
            <StatCard 
              title="Active Vendors" 
              value={statsLoading ? '...' : stats.active_vendors} 
              icon={Users} 
              description="Approved compliance profiles" 
            />
          </>
        )}
      </div>

      {/* Main Charts & Feeds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart View */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-white">
                {isVendor ? 'Revenue Performance' : 'Procurement Spend Analysis'}
              </h3>
              <p className="text-xs text-slate-400">Monthly breakdown over the last 6 months</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {statsLoading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-500">
                Loading charts...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.monthly_spend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey={isVendor ? "revenue" : "spend"} fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Audit Log / Activity Log Feed */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-white">Recent Activity</h3>
              <p className="text-xs text-slate-400">Audit trail logs</p>
            </div>
            <Activity size={18} className="text-brand-400" />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {logsLoading ? (
              <div className="text-center text-slate-500 py-8 text-sm">Loading activity logs...</div>
            ) : activityLogs?.results?.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">No activity recorded.</div>
            ) : (
              activityLogs?.results?.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed p-2.5 rounded-xl bg-slate-900/30 border border-slate-900/50">
                  <div className="h-6 w-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                    <Clock size={12} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200">
                      {log.username} <span className="text-brand-400">{log.action}</span>
                    </p>
                    <p className="text-slate-400">{log.description}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
