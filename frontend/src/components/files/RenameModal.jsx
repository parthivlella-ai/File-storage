import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useFiles } from '../../context/FileContext';

const RenameModal = () => {
  const { renameItem, setRenameItem, renameCurrentItem } = useFiles();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (renameItem) {
      setName(renameItem.type === 'file' ? renameItem.item.originalName : renameItem.item.name);
    }
  }, [renameItem]);

  if (!renameItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await renameCurrentItem(name.trim());
    setLoading(false);
  };

  return (
    <Modal
      isOpen={!!renameItem}
      onClose={() => setRenameItem(null)}
      title={`Rename ${renameItem.type === 'file' ? 'File' : 'Folder'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            New Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setRenameItem(null)}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-900/40 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RenameModal;
