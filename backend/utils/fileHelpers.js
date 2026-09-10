const path = require('path');
const mime = require('mime-types');

/**
 * Determine the file category based on extension and MIME type
 * Categories: 'documents', 'images', 'videos', 'audio', 'pdf', 'other'
 */
const detectCategory = (filename, mimeType = '') => {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const mimeLower = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || mimeLower.includes('pdf')) {
    return 'pdf';
  }

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic'];
  if (imageExts.includes(ext) || mimeLower.startsWith('image/')) {
    return 'images';
  }

  const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v', '3gp'];
  if (videoExts.includes(ext) || mimeLower.startsWith('video/')) {
    return 'videos';
  }

  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
  if (audioExts.includes(ext) || mimeLower.startsWith('audio/')) {
    return 'audio';
  }

  const docExts = [
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'tsv',
    'odt', 'ods', 'odp', 'pages', 'numbers', 'key', 'md', 'json', 'xml', 'html', 'css', 'js'
  ];
  if (docExts.includes(ext) || mimeLower.includes('document') || mimeLower.includes('text/') || mimeLower.includes('sheet') || mimeLower.includes('presentation')) {
    return 'documents';
  }

  return 'other';
};

/**
 * Sanitize a user-provided file name to prevent directory traversal or invalid characters
 */
const sanitizeFilename = (filename) => {
  if (!filename) return 'unnamed_file';
  // Remove dangerous path characters and control characters
  const clean = filename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
  return clean.length > 0 ? clean : 'file';
};

/**
 * Format bytes to readable human string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

module.exports = {
  detectCategory,
  sanitizeFilename,
  formatBytes,
};
