import React from 'react';
import {
  UploadCloud,
  Download,
  Edit2,
  Trash2,
  FolderPlus,
  Share2,
  RotateCcw,
  FolderInput,
  Clock,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

const ACTION_ICONS = {
  upload: { icon: UploadCloud, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Uploaded' },
  download: { icon: Download, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Downloaded' },
  rename: { icon: Edit2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Renamed' },
  delete: { icon: Trash2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Moved to Trash' },
  restore: { icon: RotateCcw, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Restored' },
  create_folder: { icon: FolderPlus, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Created Folder' },
  move: { icon: FolderInput, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', label: 'Moved' },
  share: { icon: Share2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', label: 'Shared' },
};

const RecentActivityList = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
        No recent activity logged yet.
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-brand-400" />
        <h4 className="text-base font-semibold text-white">Recent Activity</h4>
      </div>

      <div className="space-y-3">
        {activities.map((act) => {
          const config = ACTION_ICONS[act.action] || ACTION_ICONS.upload;
          const Icon = config.icon;

          return (
            <div
              key={act._id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg border ${config.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {config.label} <span className="text-brand-400 font-bold">"{act.itemName}"</span>
                  </p>
                  <p className="text-[11px] text-slate-400 capitalize">{act.itemType}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0 ml-3">
                {formatRelativeTime(act.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivityList;
