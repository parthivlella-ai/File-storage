import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Image, Video, Music, FileSliders, Layers } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import { useFiles } from '../../context/FileContext';

const CategoryCards = ({ categories = {} }) => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useFiles();

  const categoryItems = [
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      color: '#3b82f6',
      bgClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      data: categories.documents || { count: 0, totalBytes: 0 },
    },
    {
      id: 'images',
      label: 'Images',
      icon: Image,
      color: '#10b981',
      bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      data: categories.images || { count: 0, totalBytes: 0 },
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      color: '#f59e0b',
      bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      data: categories.videos || { count: 0, totalBytes: 0 },
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      color: '#ec4899',
      bgClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      data: categories.audio || { count: 0, totalBytes: 0 },
    },
    {
      id: 'pdf',
      label: 'PDFs',
      icon: FileText,
      color: '#ef4444',
      bgClass: 'bg-red-500/10 text-red-400 border-red-500/20',
      data: categories.pdf || { count: 0, totalBytes: 0 },
    },
    {
      id: 'other',
      label: 'Other',
      icon: Layers,
      color: '#8b5cf6',
      bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      data: categories.other || { count: 0, totalBytes: 0 },
    },
  ];

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    navigate('/my-files');
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {categoryItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => handleCategoryClick(item.id)}
            className="group p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer select-none glass-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${item.bgClass} transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {item.data.count}
              </span>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                {item.label}
              </h5>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {formatBytes(item.data.totalBytes)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryCards;
