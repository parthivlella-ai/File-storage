import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import { fileService } from '../services/fileService';
import { useFiles } from '../context/FileContext';
import FileCard from '../components/files/FileCard';
import FileRow from '../components/files/FileRow';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const RecentPage = () => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { viewMode, selectedFileIds, toggleSelectFile, setUploadModalOpen } = useFiles();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const res = await fileService.getFiles({ folderId: 'all', sortBy: 'updatedAt', order: 'desc', limit: 50 });
        setRecentFiles(res.files || []);
      } catch (err) {
        console.error('Failed to load recent files:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Files</h2>
            <p className="text-xs text-slate-400">Files you have recently uploaded or modified</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading recent activity..." />
      ) : recentFiles.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No recent files"
          description="Your recently uploaded and modified documents will show up here."
          actionText="Upload Now"
          onAction={() => setUploadModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentFiles.map((file) => (
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
          {recentFiles.map((file) => (
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

export default RecentPage;
