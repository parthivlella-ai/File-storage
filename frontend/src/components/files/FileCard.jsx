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
import { formatBytes, formatRelativeTime } from '../../utils/formatters';
import { CATEGORY_CONFIG, isPreviewable } from '../../utils/fileTypes';
import { fileService } from '../../services/fileService';
import { useFiles } from '../../context/FileContext';

const FileCard = ({ file, isSelected, onSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
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
  const isImg = file.category === 'images' && !imageError;
  const previewUrl = fileService.getPreviewUrl(file._id);

  return (
    <div
      onDoubleClick={() => canView && setPreviewFile(file)}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-200 cursor-pointer select-none glass-card ${
        isSelected
          ? 'ring-2 ring-brand-500 bg-brand-500/10'
          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
      }`}
    >
      {/* Top action bar on card */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-slate-600 bg-slate-800/80 opacity-0 group-hover:opacity-100 hover:border-brand-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            </svg>
          )}
        </div>

        {/* Star & Options button */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(file);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              file.isStarred
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Star className={`w-4 h-4 ${file.isStarred ? 'fill-amber-400' : ''}`} />
          </button>

          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4 text-brand-400" />
                    <span>Preview</span>
                  </button>
                )}

                <a
                  href={fileService.getDownloadUrl(file._id)}
                  download={file.originalName}
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => {
                    setShareFile(file);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share Link</span>
                </button>

                <button
                  onClick={() => {
                    setRenameItem({ type: 'file', item: file });
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={() => {
                    setMoveItem({ type: 'file', item: file });
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <FolderInput className="w-4 h-4 text-indigo-400" />
                  <span>Move to...</span>
                </button>

                <button
                  onClick={() => {
                    setDetailsFile(file);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
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
      </div>

      {/* File Preview Area / Icon Thumbnail */}
      <div
        onClick={() => (canView ? setPreviewFile(file) : setDetailsFile(file))}
        className="w-full h-32 rounded-xl bg-slate-950/40 flex items-center justify-center overflow-hidden mb-3 border border-slate-800/60 group-hover:border-slate-700"
      >
        {isImg ? (
          <img
            src={previewUrl}
            alt={file.originalName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileIcon category={file.category} extension={file.extension} size="xl" />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catConfig.bgColor}`}
            >
              {file.extension || catConfig.badge}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex flex-col gap-1">
        <h4
          title={file.originalName}
          className="text-sm font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors"
        >
          {file.originalName}
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{formatBytes(file.size)}</span>
          <span>{formatRelativeTime(file.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
