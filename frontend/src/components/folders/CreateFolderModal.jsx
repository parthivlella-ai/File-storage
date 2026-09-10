import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useFiles } from '../../context/FileContext';

const COLOR_OPTIONS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
];

const CreateFolderModal = () => {
  const { createFolderModalOpen, setCreateFolderModalOpen, createFolder } = useFiles();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  if (!createFolderModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await createFolder(name.trim(), selectedColor);
    setLoading(false);

    if (res.success) {
      setName('');
      setSelectedColor('#3b82f6');
      setCreateFolderModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={createFolderModalOpen}
      onClose={() => setCreateFolderModalOpen(false)}
      title="Create New Folder"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Folder Name
          </label>
          <input
            type="text"
            placeholder="e.g., Marketing Assets, Invoices 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Folder Accent Color
          </label>
          <div className="flex items-center gap-3">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  selectedColor === c.hex
                    ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => setCreateFolderModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-900/40 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFolderModal;
