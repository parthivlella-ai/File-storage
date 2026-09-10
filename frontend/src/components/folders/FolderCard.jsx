import React, { useState, useRef, useEffect } from 'react';
import { Folder, MoreVertical, Edit2, FolderInput, Trash2 } from 'lucide-react';
import { useFiles } from '../../context/FileContext';

const FolderCard = ({ folder }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { navigateToFolder, setRenameItem, setMoveItem, moveToTrash } = useFiles();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const folderColor = folder.color || '#3b82f6';
  const fileCount = folder.fileCount || 0;
  const subCount = folder.subfolderCount || 0;

  return (
    <div
      onDoubleClick={() => navigateToFolder(folder._id, folder)}
      className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/90 hover:border-slate-700 transition-all duration-200 cursor-pointer select-none glass-card"
    >
      <div
        onClick={() => navigateToFolder(folder._id, folder)}
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <div
          className="p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${folderColor}18` }}
        >
          <Folder className="w-5 h-5 fill-current" style={{ color: folderColor }} />
        </div>
        <div className="min-w-0">
          <h4
            className="text-sm font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors"
            title={folder.name}
          >
            {folder.name}
          </h4>
          <p className="text-[11px] text-slate-400">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
            {subCount > 0 && ` • ${subCount} folders`}
          </p>
        </div>
      </div>

      {/* Options Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-44 py-1.5 rounded-xl glass-dropdown z-30 shadow-2xl border border-slate-700/80 bg-slate-900/95 text-slate-200 text-sm animate-modal-enter"
          >
            <button
              onClick={() => {
                navigateToFolder(folder._id, folder);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Folder className="w-4 h-4 text-brand-400" />
              <span>Open</span>
            </button>

            <button
              onClick={() => {
                setRenameItem({ type: 'folder', item: folder });
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Rename</span>
            </button>

            <button
              onClick={() => {
                setMoveItem({ type: 'folder', item: folder });
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FolderInput className="w-4 h-4 text-indigo-400" />
              <span>Move to...</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                moveToTrash('folder', folder._id, folder.name);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Move to Trash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
