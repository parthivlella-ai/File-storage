import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Clock,
  FolderOpen,
  Star,
  Trash2,
  Settings,
  Shield,
  Plus,
  HardDrive,
  UploadCloud,
  FolderPlus,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { formatBytes } from '../../utils/formatters';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const { setUploadModalOpen, setCreateFolderModalOpen } = useFiles();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Files', path: '/my-files', icon: Files },
    { label: 'Recent', path: '/recent', icon: Clock },
    { label: 'Folders', path: '/folders', icon: FolderOpen },
    { label: 'Starred', path: '/starred', icon: Star },
    { label: 'Trash', path: '/trash', icon: Trash2 },
  ];

  const storageUsed = user?.storageUsed || 0;
  const storageLimit = user?.storageLimit || 5 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div
              onClick={() => {
                navigate('/');
                if (onClose) onClose();
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-900/40 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                  SECURE <span className="text-brand-400">HUB</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                  Cloud Storage
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Create / Upload CTA Buttons */}
          <div className="flex gap-2 mb-6 px-1">
            <button
              onClick={() => {
                setUploadModalOpen(true);
                if (onClose) onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-900/40 transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => {
                setCreateFolderModalOpen(true);
                if (onClose) onClose();
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {isAdmin && (
              <>
                <div className="my-2 border-t border-slate-800" />
                <NavLink
                  to="/admin"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20'
                        : 'text-indigo-300 hover:text-indigo-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Admin Panel</span>
                  <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Storage Quota Card */}
          <div className="mt-auto pt-4 border-t border-slate-800 px-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-brand-400" />
                  Storage
                </span>
                <span className="text-slate-400 font-mono">{storagePercentage}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
              </p>
            </div>

            {/* User row and settings link */}
            <div className="flex items-center justify-between">
              <NavLink
                to="/settings"
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
