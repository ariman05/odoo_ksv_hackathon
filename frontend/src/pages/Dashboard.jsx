import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, CheckSquare, DollarSign, Users, Activity, 
  ArrowUpRight, Clock, Award, Calendar, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../api.js';
import StatCard from '../components/StatCard.jsx';
import { CardSkeleton, ChartSkeleton, Skeleton } from '../components/Skeleton.jsx';

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

  const activityList = Array.isArray(activityLogs) ? activityLogs : (activityLogs?.results || []);

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

  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  };

  return (
    <motion.div 
      variants={pageTransition}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-2xl lg:text-3xl font-extrabold font-display text-white tracking-tight">
            Welcome back, {user.first_name || user.username}
          </h2>
          <p className="text-slate-400 text-xs lg:text-sm">
            {isVendor 
              ? `Manage quotations, check approval statuses, and track revenue for ${user.company_name || 'your company'}.` 
              : 'Monitor procurement pipelines, approve bids, and manage vendor compliance profiles.'}
          </p>
        </div>
        {!isVendor && (
          <div className="flex gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              System Active
            </span>
          </div>
        )}
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isVendor ? (
          <>
            <StatCard 
              title="Quotes Submitted" 
              value={stats.submitted_quotes} 
              icon={FileText} 
              description="Total quotations bids" 
            />
            <StatCard 
              title="Success Rate" 
              value={`${stats.submitted_quotes ? Math.round((stats.accepted_quotes / stats.submitted_quotes) * 100) : 0}%`} 
              icon={Award} 
              description={`${stats.accepted_quotes} accepted quotes`} 
              trendType="up"
            />
            <StatCard 
              title="Revenue Earned" 
              value={`$${stats.total_revenue.toLocaleString()}`} 
              icon={DollarSign} 
              description="Awaiting remittance" 
            />
            <StatCard 
              title="Vendor Rating" 
              value={stats.rating ? stats.rating.toFixed(2) : '5.00'} 
              icon={Users} 
              description="Compliance score" 
            />
          </>
        ) : (
          <>
            <StatCard 
              title="Capital Spend" 
              value={`$${stats.total_spend.toLocaleString()}`} 
              icon={DollarSign} 
              description="Spend outlay overall" 
              trend="+12.4%" 
              trendType="up"
            />
            <StatCard 
              title="Active RFQs" 
              value={stats.open_rfqs} 
              icon={FileText} 
              description="Currently open for bidding" 
            />
            <StatCard 
              title="Pending Approvals" 
              value={stats.pending_approvals} 
              icon={Clock} 
              description="Workflow stages pending" 
              trend={stats.pending_approvals > 0 ? "Action Required" : "All Clear"}
              trendType={stats.pending_approvals > 0 ? "down" : "up"}
            />
            <StatCard 
              title="Approved Suppliers" 
              value={stats.active_vendors} 
              icon={Users} 
              description="Active verified profiles" 
            />
          </>
        )}
      </div>

      {/* Charts & timelines section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2">
          {statsLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-white text-base tracking-tight">
                    {isVendor ? 'Revenue Performance' : 'Procurement Spend Analysis'}
                  </h3>
                  <p className="text-slate-400 text-xs">Monthly performance analysis</p>
                </div>
              </div>
              
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData?.monthly_spend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={isVendor ? "revenue" : "spend"} 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#chartGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent timeline feed */}
        <div>
          <div className="glass-card rounded-2xl p-6 border border-slate-800/40 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800/40 pb-4">
              <div>
                <h3 className="font-display font-extrabold text-white text-base tracking-tight">System Audit Log</h3>
                <p className="text-slate-400 text-xs">Recent transaction logs</p>
              </div>
              <Activity size={18} className="text-brand-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {logsLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : activityList.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-xs">No logs recorded.</div>
              ) : (
                activityList.slice(0, 5).map((log) => {
                  const initials = log.username ? log.username.slice(0, 2).toUpperCase() : 'US';
                  return (
                    <div key={log.id} className="flex gap-3 items-start text-xs p-3 rounded-xl bg-slate-950/40 border border-slate-900/40 hover:border-slate-800 transition-colors">
                      <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/25 flex items-center justify-center font-bold text-brand-400 shrink-0 text-[10px]">
                        {initials}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <p className="font-bold text-slate-200 truncate">{log.username}</p>
                          <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{log.description}</p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 pt-0.5">
                          <Calendar size={10} />
                          <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
