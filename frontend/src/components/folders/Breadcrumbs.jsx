import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { useFiles } from '../../context/FileContext';

const Breadcrumbs = () => {
  const { breadcrumbs, currentFolderId, navigateToFolder } = useFiles();

  return (
    <nav className="flex items-center gap-1.5 text-sm font-medium text-slate-400 overflow-x-auto py-1 scrollbar-none">
      <button
        onClick={() => navigateToFolder(null)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
          !currentFolderId
            ? 'text-white bg-slate-800 font-semibold'
            : 'hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <Home className="w-4 h-4 text-brand-400" />
        <span>My Files</span>
      </button>

      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb._id}>
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            <button
              onClick={() => navigateToFolder(crumb._id, crumb)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors truncate max-w-xs shrink-0 ${
                isLast
                  ? 'text-white bg-slate-800 font-semibold'
                  : 'hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{crumb.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
