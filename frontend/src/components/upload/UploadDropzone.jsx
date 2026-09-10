import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import FileIcon from '../files/FileIcon';
import { useFiles } from '../../context/FileContext';
import { useToast } from '../../context/ToastContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UploadDropzone = ({ onComplete }) => {
  const { uploadFiles, currentFolder } = useFiles();
  const { showError } = useToast();

  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        rejectedFiles.forEach((rej) => {
          showError(`Cannot upload ${rej.file.name}: ${rej.errors[0]?.message || 'Invalid file'}`);
        });
      }

      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          showError(`${file.name} exceeds the 50MB maximum limit.`);
          return false;
        }
        return true;
      });

      setFilesToUpload((prev) => [...prev, ...validFiles]);
    },
    [showError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = (index) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const onProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(percentCompleted);
    };

    const res = await uploadFiles(filesToUpload, onProgress);
    setUploading(false);

    if (res.success) {
      setFilesToUpload([]);
      setUploadProgress(0);
      if (onComplete) onComplete();
    }
  };

  const totalBytes = filesToUpload.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Drop Zone Box */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4 border border-brand-500/20">
          <UploadCloud className="w-8 h-8 animate-bounce" />
        </div>
        <h4 className="text-base font-semibold text-white mb-1">
          {isDragActive ? 'Drop your files here!' : 'Drag & drop files here, or browse'}
        </h4>
        <p className="text-xs text-slate-400 max-w-xs mb-3">
          Upload any document, image, video, audio, or archive up to 50MB per file.
        </p>
        <span className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors">
          Browse Files from Device
        </span>
      </div>

      {/* Target Folder Badge */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-400">
        <span>
          Uploading to: <strong className="text-slate-200">{currentFolder ? currentFolder.name : 'My Files (Root)'}</strong>
        </span>
        {filesToUpload.length > 0 && (
          <span>
            {filesToUpload.length} files selected ({formatBytes(totalBytes)})
          </span>
        )}
      </div>

      {/* Selected Files List */}
      {filesToUpload.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 rounded-xl bg-slate-950/40 p-2 border border-slate-800">
          {filesToUpload.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-200"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <File className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="truncate font-medium">{file.name}</span>
                <span className="text-slate-400 shrink-0">({formatBytes(file.size)})</span>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              Processing & encrypting storage...
            </span>
            <span className="text-brand-400 font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action CTA */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setFilesToUpload([])}
          disabled={uploading || filesToUpload.length === 0}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={handleStartUpload}
          disabled={uploading || filesToUpload.length === 0}
          className="px-6 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-900/40 transition-all disabled:opacity-40 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading ({uploadProgress}%)
            </>
          ) : (
            `Upload ${filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}`
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadDropzone;
