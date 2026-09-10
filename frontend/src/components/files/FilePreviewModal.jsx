import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { formatBytes } from '../../utils/formatters';
import FileIcon from './FileIcon';

const FilePreviewModal = ({ file, onClose }) => {
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!file) return;

    const ext = (file.extension || '').toLowerCase();
    const textExts = ['txt', 'md', 'json', 'csv', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'xml', 'svg', 'log', 'py', 'sh', 'sql'];

    if (textExts.includes(ext) || file.mimeType?.startsWith('text/')) {
      setLoadingText(true);
      fetch(fileService.getPreviewUrl(file._id))
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch((err) => {
          console.error('Failed to load text content:', err);
          setTextContent('Could not load text preview.');
          setLoadingText(false);
        });
    }
  }, [file]);

  if (!file) return null;

  const previewUrl = fileService.getPreviewUrl(file._id);
  const downloadUrl = fileService.getDownloadUrl(file._id);
  const ext = (file.extension || '').toLowerCase();
  const isImage = file.category === 'images' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isVideo = file.category === 'videos' || ['mp4', 'mkv', 'webm', 'mov'].includes(ext);
  const isAudio = file.category === 'audio' || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext);
  const isPdf = file.category === 'pdf' || ext === 'pdf';
  const isText = ['txt', 'md', 'json', 'csv', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'xml', 'log', 'py', 'sh', 'sql'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md text-slate-100 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
        <div className="flex items-center gap-3 min-w-0">
          <FileIcon category={file.category} extension={file.extension} size="md" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate max-w-md" title={file.originalName}>
              {file.originalName}
            </h3>
            <p className="text-xs text-slate-400">
              {formatBytes(file.size)} • {file.mimeType || file.category}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isImage && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 mr-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                title="Zoom Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                title="Zoom In"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={downloadUrl}
            download={file.originalName}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-brand-900/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {isImage && (
          <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt={file.originalName}
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

        {isVideo && (
          <div className="w-full max-w-4xl max-h-[75vh] flex items-center justify-center">
            <video
              controls
              autoPlay
              playsInline
              src={previewUrl}
              className="w-full max-h-[75vh] rounded-2xl shadow-2xl bg-black border border-slate-800"
            >
              Your browser does not support video playback.
            </video>
          </div>
        )}

        {isAudio && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl max-w-lg w-full">
            <div className="w-24 h-24 rounded-full bg-pink-500/10 flex items-center justify-center mb-6 text-pink-400 border border-pink-500/20 animate-pulse">
              <FileIcon category="audio" size="lg" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2 text-center">{file.originalName}</h4>
            <p className="text-xs text-slate-400 mb-6">{formatBytes(file.size)}</p>
            <audio controls autoPlay src={previewUrl} className="w-full">
              Your browser does not support audio element.
            </audio>
          </div>
        )}

        {isPdf && (
          <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
            <iframe
              src={`${previewUrl}#toolbar=1`}
              title={file.originalName}
              className="w-full h-full min-h-[75vh] rounded-2xl"
            />
          </div>
        )}

        {isText && (
          <div className="w-full max-w-4xl h-[75vh] bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-auto shadow-2xl font-mono text-sm leading-relaxed text-slate-200">
            {loadingText ? (
              <div className="flex items-center justify-center h-full text-slate-400">Loading document...</div>
            ) : (
              <pre className="whitespace-pre-wrap select-text">{textContent}</pre>
            )}
          </div>
        )}

        {!isImage && !isVideo && !isAudio && !isPdf && !isText && (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/60 rounded-3xl border border-slate-800 max-w-md">
            <FileIcon category={file.category} extension={file.extension} size="xl" className="mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">{file.originalName}</h4>
            <p className="text-sm text-slate-400 mb-6">
              Preview is not available for this file type ({file.extension || 'file'}). Download the file to view its contents.
            </p>
            <a
              href={downloadUrl}
              download={file.originalName}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-brand-900/30 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download File ({formatBytes(file.size)})
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;
