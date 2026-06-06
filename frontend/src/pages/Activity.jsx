import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, User, ShieldAlert } from 'lucide-react';
import api from '../api.js';

export default function ActivityLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-activities'],
    queryFn: async () => {
      const res = await api.get('/api/activity/');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800/40">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">System Activity Logs</h2>
          <p className="text-xs text-slate-400 mt-1">Immutable audit trail tracking procurement actions, user registrations, and approvals</p>
        </div>
        <ShieldAlert size={20} className="text-brand-400" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading audit trail...</div>
      ) : logs?.results?.length === 0 ? (
        <div className="text-center py-12 text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/30">
          No activities recorded.
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800/40 overflow-hidden divide-y divide-slate-800/40">
          {logs?.results?.map((log) => (
            <div key={log.id} className="p-4 flex gap-4 items-start hover:bg-slate-900/10 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex justify-between items-center gap-4">
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User size={12} className="text-slate-500" />
                    {log.username}
                  </p>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded mr-2 inline-block">
                    {log.action}
                  </span>
                  <span className="text-slate-400">{log.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
