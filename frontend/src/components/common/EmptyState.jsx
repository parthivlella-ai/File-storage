import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No files found',
  description = 'Upload files or create a folder to get started with Secure File Hub.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="p-4 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4">
        <Icon className="w-10 h-10" />
      </div>
      <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-brand-900/40 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
