import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Folder as FolderIcon, Home, Check } from 'lucide-react';
import { folderService } from '../../services/folderService';
import { useFiles } from '../../context/FileContext';

const MoveModal = () => {
  const { moveItem, setMoveItem, moveCurrentItem } = useFiles();
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (moveItem) {
      setLoadingFolders(true);
      folderService
        .getFolders(null, true)
        .then((res) => {
          // Filter out the item itself if it's a folder
          let list = res.folders || [];
          if (moveItem.type === 'folder') {
            list = list.filter((f) => f._id !== moveItem.item._id);
          }
          setFolders(list);
          setSelectedFolderId(null); // Default to root
        })
        .finally(() => setLoadingFolders(false));
    }
  }, [moveItem]);

  if (!moveItem) return null;

  const handleMove = async () => {
    setSubmitting(true);
    await moveCurrentItem(selectedFolderId);
    setSubmitting(false);
  };

  return (
    <Modal
      isOpen={!!moveItem}
      onClose={() => setMoveItem(null)}
      title={`Move "${moveItem.item.originalName || moveItem.item.name}"`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Destination Folder
        </p>

        <div className="max-h-60 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-slate-950/50 border border-slate-800">
          {/* Root Option */}
          <div
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
              selectedFolderId === null
                ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium">My Files (Root Directory)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4 text-brand-400" />}
          </div>

          {/* Folder list */}
          {loadingFolders ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading available folders...</div>
          ) : (
            folders.map((f) => (
              <div
                key={f._id}
                onClick={() => setSelectedFolderId(f._id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  selectedFolderId === f._id
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderIcon className="w-4 h-4" style={{ color: f.color || '#3b82f6' }} />
                  <span className="text-sm font-medium">{f.name}</span>
                </div>
                {selectedFolderId === f._id && <Check className="w-4 h-4 text-brand-400" />}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setMoveItem(null)}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-900/40 transition-all disabled:opacity-50"
          >
            {submitting ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveModal;
