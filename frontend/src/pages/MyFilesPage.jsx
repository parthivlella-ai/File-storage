import React from 'react';
import {
  UploadCloud,
  FolderPlus,
  Trash2,
  Star,
  FolderInput,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { useFiles } from '../context/FileContext';
import Breadcrumbs from '../components/folders/Breadcrumbs';
import FolderCard from '../components/folders/FolderCard';
import FileCard from '../components/files/FileCard';
import FileRow from '../components/files/FileRow';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Files' },
  { id: 'documents', label: 'Documents' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'other', label: 'Other' },
];

const MyFilesPage = () => {
  const {
    files,
    folders,
    loading,
    viewMode,
    selectedCategory,
    setSelectedCategory,
    selectedFileIds,
    toggleSelectFile,
    selectAllFiles,
    executeBatchAction,
    setUploadModalOpen,
    setCreateFolderModalOpen,
    searchQuery,
  } = useFiles();

  const isAllSelected = files.length > 0 && selectedFileIds.length === files.length;
  const hasSelection = selectedFileIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Main Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <Breadcrumbs />

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-brand-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-900/40 transition-all hover:scale-105 flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Batch Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Batch Operations Bar */}
        {hasSelection && (
          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 px-3 py-1.5 rounded-xl animate-modal-enter">
            <span className="text-xs font-bold text-brand-300">
              {selectedFileIds.length} selected
            </span>
            <div className="h-4 w-[1px] bg-brand-500/30 mx-1" />
            <button
              onClick={() => executeBatchAction('star')}
              className="p-1 text-slate-300 hover:text-amber-400 rounded transition-colors"
              title="Star Selected"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => executeBatchAction('trash')}
              className="p-1 text-slate-300 hover:text-rose-400 rounded transition-colors"
              title="Move Selected to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading files & folders..." />
      ) : (
        <div className="space-y-8">
          {/* Folders Section (if any exist) */}
          {folders.length > 0 && selectedCategory === 'all' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Folders ({folders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {folders.map((folder) => (
                  <FolderCard key={folder._id} folder={folder} />
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Files {files.length > 0 && `(${files.length})`}
                {searchQuery && ` matching "${searchQuery}"`}
              </h3>

              {files.length > 0 && (
                <button
                  onClick={selectAllFiles}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}
            </div>

            {files.length === 0 && folders.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'No matching files found' : 'This folder is empty'}
                description={
                  searchQuery
                    ? `No results found for "${searchQuery}". Try a different keyword.`
                    : 'Upload your documents, media, or create a folder to start organizing.'
                }
                actionText="Upload Files"
                onAction={() => setUploadModalOpen(true)}
              />
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                No files in this view. Use the folders above or upload new files.
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    isSelected={selectedFileIds.includes(file._id)}
                    onSelect={() => toggleSelectFile(file._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                {/* List Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex-1">Name</div>
                  <div className="hidden sm:block w-28">Category</div>
                  <div className="hidden md:block w-24 text-right">Size</div>
                  <div className="hidden lg:block w-36 text-right">Modified</div>
                  <div className="w-20 text-right">Actions</div>
                </div>

                {files.map((file) => (
                  <FileRow
                    key={file._id}
                    file={file}
                    isSelected={selectedFileIds.includes(file._id)}
                    onSelect={() => toggleSelectFile(file._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFilesPage;
