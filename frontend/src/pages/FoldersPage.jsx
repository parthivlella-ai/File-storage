import React, { useEffect, useState } from 'react';
import { FolderOpen, FolderPlus, Plus } from 'lucide-react';
import { folderService } from '../services/folderService';
import { useFiles } from '../context/FileContext';
import FolderCard from '../components/folders/FolderCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const FoldersPage = () => {
  const [allFolders, setAllFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setCreateFolderModalOpen } = useFiles();

  const fetchAllFolders = async () => {
    try {
      setLoading(true);
      const res = await folderService.getFolders(null, true);
      setAllFolders(res.folders || []);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFolders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">All Folders</h2>
            <p className="text-xs text-slate-400">Manage and organize your directory structure</p>
          </div>
        </div>

        <button
          onClick={() => setCreateFolderModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-900/40 transition-all flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading folders..." />
      ) : allFolders.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No folders created yet"
          description="Create structured folders to neatly organize your cloud files."
          actionText="Create Folder"
          onAction={() => setCreateFolderModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allFolders.map((folder) => (
            <FolderCard key={folder._id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoldersPage;
