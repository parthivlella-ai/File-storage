import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileSliders,
  File,
} from 'lucide-react';

const FileIcon = ({ category, extension = '', size = 'md', className = '' }) => {
  const ext = extension.toLowerCase();

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const iconClass = `${sizeClasses[size]} ${className}`;

  if (category === 'pdf' || ext === 'pdf') {
    return <FileText className={`${iconClass} text-rose-400`} />;
  }

  if (category === 'images' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return <Image className={`${iconClass} text-emerald-400`} />;
  }

  if (category === 'videos' || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
    return <Video className={`${iconClass} text-amber-400`} />;
  }

  if (category === 'audio' || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return <Music className={`${iconClass} text-pink-400`} />;
  }

  if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) {
    return <FileSpreadsheet className={`${iconClass} text-emerald-500`} />;
  }

  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sh', 'sql', 'cpp', 'java'].includes(ext)) {
    return <FileCode className={`${iconClass} text-cyan-400`} />;
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className={`${iconClass} text-orange-400`} />;
  }

  if (category === 'documents' || ['doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(ext)) {
    return <FileText className={`${iconClass} text-blue-400`} />;
  }

  return <File className={`${iconClass} text-slate-400`} />;
};

export default FileIcon;
