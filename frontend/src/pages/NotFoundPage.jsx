import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
      <div className="p-4 rounded-3xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-6 animate-pulse">
        <ShieldAlert className="w-16 h-16" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The storage resource or page you are looking for has been moved, deleted, or does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-900/40 transition-all hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
