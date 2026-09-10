import React from 'react';
import { HardDrive, Sparkles } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

const StorageBar = ({ stats }) => {
  if (!stats) return null;

  const used = stats.storageUsed || 0;
  const limit = stats.storageLimit || 5 * 1024 * 1024 * 1024;
  const percentage = Math.min(100, parseFloat(((used / limit) * 100).toFixed(1)));
  const categories = stats.categories || {};

  return (
    <div className="p-6 rounded-2xl glass-card bg-slate-900/60 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Storage Overview</h4>
            <p className="text-xs text-slate-400">
              {formatBytes(used)} used of {formatBytes(limit)} ({percentage}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {formatBytes(Math.max(0, limit - used))} Available
          </span>
        </div>
      </div>

      {/* Segmented Multi-color Progress Bar */}
      <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner mb-4">
        {Object.entries(categories).map(([key, cat]) => {
          const segPercent = limit > 0 ? (cat.totalBytes / limit) * 100 : 0;
          if (segPercent <= 0) return null;
          return (
            <div
              key={key}
              style={{
                width: `${segPercent}%`,
                backgroundColor: cat.color,
              }}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              title={`${cat.label}: ${formatBytes(cat.totalBytes)} (${segPercent.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
        {Object.entries(categories).map(([key, cat]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-slate-400 truncate">{cat.label}</span>
            <span className="font-semibold text-slate-200 ml-auto">{formatBytes(cat.totalBytes, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorageBar;
