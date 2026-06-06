import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, trend, trendType = 'up' }) {
  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300">
      {/* Decorative Radial Background */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-brand-500/5 blur-xl group-hover:bg-brand-500/10 transition-colors" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </p>
          <h3 className="text-3xl font-bold font-display text-white">
            {value}
          </h3>
        </div>
        <div className="h-12 w-12 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-brand-400 group-hover:text-brand-300 transition-colors shadow-inner">
          <Icon size={22} />
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold px-2 py-0.5 rounded-full border ${
              trendType === 'up' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {trend}
            </span>
          )}
          {description && <span className="text-slate-400">{description}</span>}
        </div>
      )}
    </div>
  );
}
