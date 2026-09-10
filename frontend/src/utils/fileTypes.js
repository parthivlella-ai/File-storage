/**
 * File Category & MIME Helpers
 */

export const CATEGORY_CONFIG = {
  documents: {
    label: 'Documents',
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconColor: 'text-blue-400',
    badge: 'DOC',
  },
  images: {
    label: 'Images',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'IMG',
  },
  videos: {
    label: 'Videos',
    color: '#f59e0b', // amber
    bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'VID',
  },
  audio: {
    label: 'Audio',
    color: '#ec4899', // pink
    bgColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    iconColor: 'text-pink-400',
    badge: 'AUD',
  },
  pdf: {
    label: 'PDFs',
    color: '#ef4444', // red
    bgColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    iconColor: 'text-red-400',
    badge: 'PDF',
  },
  other: {
    label: 'Other',
    color: '#8b5cf6', // purple
    bgColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    iconColor: 'text-purple-400',
    badge: 'FILE',
  },
};

/**
 * Check if a file is previewable directly inside browser
 */
export const isPreviewable = (file) => {
  if (!file) return false;
  const category = file.category;
  const ext = (file.extension || '').toLowerCase();
  const mime = (file.mimeType || '').toLowerCase();

  if (category === 'images' || mime.startsWith('image/')) return true;
  if (category === 'videos' || mime.startsWith('video/')) return true;
  if (category === 'audio' || mime.startsWith('audio/')) return true;
  if (category === 'pdf' || ext === 'pdf' || mime === 'application/pdf') return true;

  const textExts = ['txt', 'md', 'json', 'csv', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'xml', 'svg', 'log', 'py', 'sh', 'sql'];
  if (textExts.includes(ext) || mime.startsWith('text/')) return true;

  return false;
};
