import React from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  Folder as FolderIcon,
  Tag,
  Star,
  Trash2,
  Share2,
  FileCode,
  Eye,
} from 'lucide-react';
import FileIcon from './FileIcon';
import { formatBytes, formatDate } from '../../utils/formatters';
import { CATEGORY_CONFIG, isPreviewable } from '../../utils/fileTypes';
import { fileService } from '../../services/fileService';
import { useFiles } from '../../context/FileContext';

const FileDetailsDrawer = ({ file, onClose }) => {
  const { setPreviewFile, setRenameItem, setMoveItem, setShareFile, toggleStar, moveToTrash } = useFiles();

  if (!file) return null;

  const catConfig = CATEGORY_CONFIG[file.category] || CATEGORY_CONFIG.other;
  const canView = isPreviewable(file);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 glass-dropdown bg-slate-900/95 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between text-slate-100 animate-slideLeft">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">File Information</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail and Title */}
        <div className="flex flex-col items-center text-center py-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-700/60 shadow-inner">
            <FileIcon category={file.category} extension={file.extension} size="lg" />
          </div>
          <h4 className="text-base font-bold text-white break-all px-2" title={file.originalName}>
            {file.originalName}
          </h4>
          <span
            className={`mt-2 text-xs font-semibold px-3 py-0.5 rounded-full border ${catConfig.bgColor}`}
          >
            {catConfig.label}
          </span>
        </div>

        {/* Metadata items list */}
        <div className="py-5 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">File Size</p>
              <p className="font-medium text-slate-200">
                {formatBytes(file.size)} ({file.size?.toLocaleString()} bytes)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">MIME Type</p>
              <p className="font-medium text-slate-200 font-mono text-xs break-all">
                {file.mimeType || 'application/octet-stream'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FolderIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Location</p>
              <p className="font-medium text-slate-200">
                {file.folder ? (typeof file.folder === 'object' ? file.folder.name : 'Subfolder') : 'My Files (Root)'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Uploaded On</p>
              <p className="font-medium text-slate-200">{formatDate(file.createdAt, true)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Total Downloads / Views</p>
              <p className="font-medium text-slate-200">{file.downloadCount || 0} times</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {canView && (
            <button
              onClick={() => {
                setPreviewFile(file);
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          )}

          <a
            href={fileService.getDownloadUrl(file._id)}
            download={file.originalName}
            className={`flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors ${
              !canView ? 'col-span-2' : ''
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download
          </a>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => {
              setShareFile(file);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            Share
          </button>

          <button
            onClick={() => toggleStar(file)}
            className={`flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors ${
              file.isStarred ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${file.isStarred ? 'fill-amber-400' : ''}`} />
            Star
          </button>

          <button
            onClick={() => {
              moveToTrash('file', file._id, file.originalName);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Trash
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsDrawer;
