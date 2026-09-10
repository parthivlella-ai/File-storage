import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Folder, HardDrive } from 'lucide-react';
import { trashService } from '../services/trashService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatRelativeTime } from '../utils/formatters';
import FileIcon from '../components/files/FileIcon';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const TrashPage = () => {
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type, item }
  const [actionLoading, setActionLoading] = useState(false);

  const { refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await trashService.getTrashItems();
      setTrashedFiles(res.files || []);
      setTrashedFolders(res.folders || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestoreFile = async (file) => {
    try {
      await trashService.restoreFile(file._id);
      showSuccess(`Restored "${file.originalName}"`);
      await fetchTrash();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRestoreFolder = async (folder) => {
    try {
      await trashService.restoreFolder(folder._id);
      showSuccess(`Restored folder "${folder.name}"`);
      await fetchTrash();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;
    try {
      setActionLoading(true);
      if (itemToDelete.type === 'file') {
        await trashService.permanentlyDeleteFile(itemToDelete.item._id);
        showSuccess(`Permanently deleted "${itemToDelete.item.originalName}"`);
      } else {
        await trashService.permanentlyDeleteFolder(itemToDelete.item._id);
        showSuccess(`Permanently deleted folder "${itemToDelete.item.name}"`);
      }
      setItemToDelete(null);
      await fetchTrash();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      setActionLoading(true);
      await trashService.emptyTrash();
      showSuccess('Trash has been completely emptied.');
      setEmptyConfirmOpen(false);
      await fetchTrash();
      await refreshUser();
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalTrashed = trashedFiles.length + trashedFolders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Trash Bin</h2>
            <p className="text-xs text-slate-400">
              Recover deleted documents or permanently purge them to free up quota
            </p>
          </div>
        </div>

        {totalTrashed > 0 && (
          <button
            onClick={() => setEmptyConfirmOpen(true)}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash Bin</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading trash bin..." />
      ) : totalTrashed === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted files and folders will appear here until permanently deleted."
        />
      ) : (
        <div className="space-y-6">
          {/* Trashed Folders */}
          {trashedFolders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Trashed Folders ({trashedFolders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {trashedFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{folder.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          Deleted {formatRelativeTime(folder.trashDate || folder.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestoreFolder(folder)}
                        title="Restore Folder"
                        className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete({ type: 'folder', item: folder })}
                        title="Delete Permanently"
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trashed Files */}
          {trashedFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Trashed Files ({trashedFiles.length})
              </h3>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex-1">File Name</div>
                  <div className="hidden sm:block w-24 text-right">Size</div>
                  <div className="hidden md:block w-36 text-right">Deleted On</div>
                  <div className="w-24 text-right">Actions</div>
                </div>

                {trashedFiles.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileIcon category={file.category} extension={file.extension} size="sm" />
                      <span className="font-medium text-slate-300 truncate">{file.originalName}</span>
                    </div>

                    <div className="hidden sm:block w-24 text-right text-xs text-slate-400">
                      {formatBytes(file.size)}
                    </div>

                    <div className="hidden md:block w-36 text-right text-xs text-slate-500">
                      {formatRelativeTime(file.trashDate || file.updatedAt)}
                    </div>

                    <div className="flex items-center justify-end gap-1 w-24">
                      <button
                        onClick={() => handleRestoreFile(file)}
                        title="Restore File"
                        className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete({ type: 'file', item: file })}
                        title="Delete Permanently"
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty Trash Confirm Modal */}
      <ConfirmModal
        isOpen={emptyConfirmOpen}
        onClose={() => setEmptyConfirmOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash Bin"
        message="Are you sure you want to permanently delete all items in the trash? This action cannot be undone and disk storage will be permanently wiped."
        confirmText="Empty Trash Forever"
        isDanger={true}
        loading={actionLoading}
      />

      {/* Delete Item Confirm Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handlePermanentDelete}
        title="Delete Item Permanently"
        message={`Are you sure you want to permanently delete "${
          itemToDelete?.item.originalName || itemToDelete?.item.name
        }"? This cannot be recovered.`}
        confirmText="Delete Forever"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default TrashPage;
