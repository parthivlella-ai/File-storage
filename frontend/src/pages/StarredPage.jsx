import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { fileService } from '../services/fileService';
import { useFiles } from '../context/FileContext';
import FileCard from '../components/files/FileCard';
import FileRow from '../components/files/FileRow';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const StarredPage = () => {
  const [starredFiles, setStarredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { viewMode, selectedFileIds, toggleSelectFile } = useFiles();

  useEffect(() => {
    const fetchStarred = async () => {
      try {
        setLoading(true);
        const res = await fileService.getFiles({ folderId: 'all', isStarred: 'true' });
        setStarredFiles(res.files || []);
      } catch (err) {
        console.error('Failed to load starred files:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Starred Files</h2>
            <p className="text-xs text-slate-400">Quickly access your bookmarked and favorite documents</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading starred files..." />
      ) : starredFiles.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No starred files yet"
          description="Star important files to quickly locate them anytime in this section."
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {starredFiles.map((file) => (
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
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex-1">Name</div>
            <div className="hidden sm:block w-28">Category</div>
            <div className="hidden md:block w-24 text-right">Size</div>
            <div className="hidden lg:block w-36 text-right">Modified</div>
            <div className="w-20 text-right">Actions</div>
          </div>
          {starredFiles.map((file) => (
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
  );
};

export default StarredPage;
