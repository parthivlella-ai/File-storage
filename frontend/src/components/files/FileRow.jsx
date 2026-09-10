import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Download,
  Eye,
  Edit2,
  FolderInput,
  Trash2,
  Info,
  Star,
  Share2,
} from 'lucide-react';
import FileIcon from './FileIcon';
import { formatBytes, formatDate } from '../../utils/formatters';
import { CATEGORY_CONFIG, isPreviewable } from '../../utils/fileTypes';
import { fileService } from '../../services/fileService';
import { useFiles } from '../../context/FileContext';

const FileRow = ({ file, isSelected, onSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const {
    setPreviewFile,
    setDetailsFile,
    setRenameItem,
    setMoveItem,
    setShareFile,
    toggleStar,
    moveToTrash,
  } = useFiles();

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

  const catConfig = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.other;
  const canView = isPreviewable(file);

  return (
    <div
      onDoubleClick={() => canView && setPreviewFile(file)}
      className={`group flex items-center justify-between px-4 py-3 border-b border-slate-800/80 transition-colors cursor-pointer select-none text-sm ${
        isSelected
          ? 'bg-brand-500/10 border-brand-500/30'
          : 'hover:bg-slate-800/50 bg-slate-900/20'
      }`}
    >
      {/* Name and Checkbox column */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-slate-700 bg-slate-800 opacity-0 group-hover:opacity-100 hover:border-brand-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            </svg>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(file);
          }}
          className={`p-1 rounded transition-colors shrink-0 ${
            file.isStarred
              ? 'text-amber-400'
              : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400' : ''}`} />
        </button>

        <FileIcon category={file.category} extension={file.extension} size="sm" className="shrink-0" />

        <span
          title={file.originalName}
          onClick={() => (canView ? setPreviewFile(file) : setDetailsFile(file))}
          className="font-medium text-slate-200 truncate hover:text-brand-400 transition-colors"
        >
          {file.originalName}
        </span>
      </div>

      {/* Category Badge column */}
      <div className="hidden sm:flex items-center w-28 shrink-0">
        <span
          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${catConfig.bgColor}`}
        >
          {catConfig.label}
        </span>
      </div>

      {/* Size column */}
      <div className="hidden md:block w-24 text-right text-xs text-slate-400 shrink-0">
        {formatBytes(file.size)}
      </div>

      {/* Upload Date column */}
      <div className="hidden lg:block w-36 text-right text-xs text-slate-400 shrink-0">
        {formatDate(file.createdAt)}
      </div>

      {/* Action Buttons & Dropdown */}
      <div className="flex items-center justify-end gap-1 w-20 shrink-0 relative" ref={menuRef}>
        {canView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewFile(file);
            }}
            title="Preview"
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all hidden sm:block"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        <a
          href={fileService.getDownloadUrl(file._id)}
          download={file.originalName}
          onClick={(e) => e.stopPropagation()}
          title="Download"
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all hidden sm:block"
        >
          <Download className="w-4 h-4" />
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-48 py-1.5 rounded-xl glass-dropdown z-30 shadow-2xl border border-slate-700/80 bg-slate-900/95 text-slate-200 text-sm animate-modal-enter"
          >
            {canView && (
              <button
                onClick={() => {
                  setPreviewFile(file);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4 text-brand-400" />
                <span>Preview</span>
              </button>
            )}

            <a
              href={fileService.getDownloadUrl(file._id)}
              download={file.originalName}
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download</span>
            </a>

            <button
              onClick={() => {
                setShareFile(file);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Share Link</span>
            </button>

            <button
              onClick={() => {
                setRenameItem({ type: 'file', item: file });
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Rename</span>
            </button>

            <button
              onClick={() => {
                setMoveItem({ type: 'file', item: file });
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FolderInput className="w-4 h-4 text-indigo-400" />
              <span>Move to...</span>
            </button>

            <button
              onClick={() => {
                setDetailsFile(file);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>Details & Info</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                moveToTrash('file', file._id, file.originalName);
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

export default FileRow;
