import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'from-blue-600/20 to-blue-500/5 text-blue-400 border-blue-500/30',
    purple: 'from-purple-600/20 to-purple-500/5 text-purple-400 border-purple-500/30',
    emerald: 'from-emerald-600/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-600/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    rose: 'from-rose-600/20 to-rose-500/5 text-rose-400 border-rose-500/30'
  };

  const iconBgMap = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br ${colorMap[color]} backdrop-blur-md transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${iconBgMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
