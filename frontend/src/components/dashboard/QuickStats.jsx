import React from 'react';
import { Files, Folder, Star, ShieldCheck } from 'lucide-react';

const QuickStats = ({ stats }) => {
  if (!stats) return null;

  const items = [
    {
      label: 'Total Files',
      value: stats.totalFiles || 0,
      icon: Files,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
    {
      label: 'Active Folders',
      value: stats.totalFolders || 0,
      icon: Folder,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Starred Items',
      value: stats.starredCount || 0,
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Security Status',
      value: 'Protected',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl border ${item.bg} ${item.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;
