import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Sun,
  Moon,
  UploadCloud,
  FolderPlus,
  User,
  Shield,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onOpenSidebar }) => {
  const { user, isAdmin, logout } = useAuth();
  const {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    setUploadModalOpen,
    setCreateFolderModalOpen,
  } = useFiles();
  const { isDarkMode, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const profileRef = useRef(null);
  const sortRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value && location.pathname !== '/my-files' && location.pathname !== '/') {
      navigate('/my-files');
    }
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setSortOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search files, folders, documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: View Switch, Sort, Theme, Upload & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View Switcher: Grid vs List */}
        <div className="hidden sm:flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Options Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((prev) => !prev)}
            title="Sort Files"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden md:inline capitalize">{sortBy}</span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 py-1.5 rounded-xl glass-dropdown z-40 shadow-2xl border border-slate-700 bg-slate-900/95 text-xs text-slate-200 animate-modal-enter">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sort By
              </div>
              <button
                onClick={() => handleSortChange('createdAt')}
                className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                  sortBy === 'createdAt' ? 'text-brand-400 font-semibold' : ''
                }`}
              >
                <span>Upload Date</span>
                {sortBy === 'createdAt' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
              </button>
              <button
                onClick={() => handleSortChange('name')}
                className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                  sortBy === 'name' ? 'text-brand-400 font-semibold' : ''
                }`}
              >
                <span>File Name</span>
                {sortBy === 'name' && <span>{sortOrder === 'desc' ? 'Z-A' : 'A-Z'}</span>}
              </button>
              <button
                onClick={() => handleSortChange('size')}
                className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                  sortBy === 'size' ? 'text-brand-400 font-semibold' : ''
                }`}
              >
                <span>File Size</span>
                {sortBy === 'size' && <span>{sortOrder === 'desc' ? 'Max' : 'Min'}</span>}
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-900/30 transition-all hover:scale-105"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Member'}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-2xl glass-dropdown z-40 shadow-2xl border border-slate-700 bg-slate-900/95 text-slate-200 text-sm animate-modal-enter">
              <div className="px-4 py-2 border-b border-slate-800 mb-1">
                <p className="font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                    Administrator
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  navigate('/settings');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-indigo-300 hover:text-white transition-colors text-xs font-medium"
                >
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Admin Dashboard</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
