import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Copy, Check, Globe, Link2, ExternalLink } from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useToast } from '../../context/ToastContext';
import { fileService } from '../../services/fileService';
import { API_BASE_URL } from '../../services/api';

const ShareModal = () => {
  const { shareFile, setShareFile } = useFiles();
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  if (!shareFile) return null;

  const shareToken = shareFile.shareToken || 'link';
  const apiRoot = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : `${window.location.origin}${API_BASE_URL}`;
  const shareUrl = `${apiRoot}/files/${shareFile._id}/preview?shareToken=${shareToken}`;
  const directDownloadUrl = `${apiRoot}/files/${shareFile._id}/download?shareToken=${shareToken}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccess('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={!!shareFile}
      onClose={() => setShareFile(null)}
      title="Share File"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{shareFile.originalName}</h4>
            <p className="text-xs text-slate-400">Anyone with this secure token link can view this file.</p>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Secure Shareable Preview Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 font-mono focus:outline-none"
              />
              <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <button
              onClick={() => copyToClipboard(shareUrl)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Direct Download Link */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Direct Download Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={directDownloadUrl}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(directDownloadUrl)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0"
              title="Copy Direct Download Link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setShareFile(null)}
            className="px-5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
