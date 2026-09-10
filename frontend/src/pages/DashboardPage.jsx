import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FolderPlus,
  ArrowRight,
  Clock,
  Sparkles,
  HardDrive,
  Files,
} from 'lucide-react';
import { statsService } from '../services/statsService';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';
import StorageBar from '../components/dashboard/StorageBar';
import CategoryCards from '../components/dashboard/CategoryCards';
import QuickStats from '../components/dashboard/QuickStats';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import FileCard from '../components/files/FileCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const { setUploadModalOpen, setCreateFolderModalOpen, selectedFileIds, toggleSelectFile } = useFiles();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await statsService.getDashboardStats();
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loadingStats) {
    return <LoadingSpinner size="lg" text="Loading cloud dashboard..." />;
  }

  const recentFiles = stats?.recentFiles || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900/60 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Secure Cloud Vault Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Your files are encrypted and safe. Easily organize, preview, share, and manage your cloud documents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateFolderModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-900/50 transition-all hover:scale-105 flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <QuickStats stats={stats} />

      {/* Storage Breakdown Bar */}
      <StorageBar stats={stats} />

      {/* File Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">File Categories</h3>
          <button
            onClick={() => navigate('/my-files')}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <CategoryCards categories={stats?.categories} />
      </div>

      {/* Recent Uploads & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Uploads Grid (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Recent Uploads</h3>
            </div>
            <button
              onClick={() => navigate('/recent')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentFiles.slice(0, 4).map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  isSelected={selectedFileIds.includes(file._id)}
                  onSelect={() => toggleSelectFile(file._id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No files uploaded yet. Drag & drop files or click Upload above.
            </div>
          )}
        </div>

        {/* Live Activity Stream (1 Col) */}
        <div className="lg:col-span-1">
          <RecentActivityList activities={stats?.recentActivity || []} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
