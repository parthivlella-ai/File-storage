import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  HardDrive,
  Files,
  Search,
  UserX,
  UserCheck,
  Edit,
  FileText,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { formatBytes, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'files' | 'activity'
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [quotaUser, setQuotaUser] = useState(null);
  const [quotaGB, setQuotaGB] = useState('10');
  const [updatingQuota, setUpdatingQuota] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, filesRes] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAllUsers({ search: userSearch }),
        adminService.getAllFilesMetadata(),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setFiles(filesRes.files || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.getAllUsers({ search: userSearch });
      setUsers(res.users || []);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      const res = await adminService.toggleUserBlock(userId);
      showSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: res.isBlocked } : u))
      );
    } catch (err) {
      showError(err.message);
    }
  };

  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    if (!quotaUser) return;
    try {
      setUpdatingQuota(true);
      const res = await adminService.updateUserQuota(quotaUser._id, quotaGB);
      showSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === quotaUser._id ? { ...u, storageLimit: res.storageLimit } : u))
      );
      setQuotaUser(null);
    } catch (err) {
      showError(err.message);
    } finally {
      setUpdatingQuota(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading administration metrics..." />;
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Admin Control Center</h2>
            <p className="text-xs text-slate-400">
              System monitoring, storage analytics, and user account governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            System Healthy
          </span>
        </div>
      </div>

      {/* Global Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Users</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Registered accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Files</span>
            <Files className="w-5 h-5 text-brand-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats?.totalFiles || 0}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Across all users</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Disk Storage Allocated</span>
            <HardDrive className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {formatBytes(stats?.totalStorageBytes || 0)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Physical disk capacity</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Active Folders</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats?.totalFolders || 0}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Directories created</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          User Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'files'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Storage Metadata Inspector ({files.length})
        </button>
      </div>

      {/* Tab Content: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchUsers} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Storage Used</th>
                    <th className="p-4">Files</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {users.map((u) => {
                    const usagePercent = Math.min(
                      100,
                      Math.round(((u.storageUsed || 0) / (u.storageLimit || 1)) * 100)
                    );
                    return (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === 'admin'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="p-4">
                          <div>
                            <p className="text-slate-200">
                              {formatBytes(u.storageUsed || 0)} / {formatBytes(u.storageLimit || 0)}
                            </p>
                            <div className="w-24 h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-slate-300 font-mono">{u.fileCount || 0}</td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.isBlocked
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {u.isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setQuotaUser(u);
                                setQuotaGB(
                                  ((u.storageLimit || 5 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024)).toString()
                                );
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                              title="Update Storage Quota"
                            >
                              Quota
                            </button>

                            <button
                              onClick={() => handleToggleBlock(u._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isBlocked
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-rose-400 hover:bg-rose-500/10'
                              }`}
                              title={u.isBlocked ? 'Activate User' : 'Suspend User'}
                            >
                              {u.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Safe Metadata Inspector */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Metadata Inspection Protocol: Administrator views metadata only (file sizes, mime types, owners). Private file contents remain strictly confidential.
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Size</th>
                    <th className="p-4 text-right">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {files.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold text-white truncate max-w-xs">{f.originalName}</td>
                      <td className="p-4 text-slate-300">{f.owner?.name || f.owner?.email || 'User'}</td>
                      <td className="p-4 capitalize text-slate-400">{f.category}</td>
                      <td className="p-4 text-right text-slate-200">{formatBytes(f.size)}</td>
                      <td className="p-4 text-right text-slate-400">{formatDate(f.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Storage Quota Modal */}
      {quotaUser && (
        <Modal
          isOpen={!!quotaUser}
          onClose={() => setQuotaUser(null)}
          title={`Update Storage Quota for ${quotaUser.name}`}
        >
          <form onSubmit={handleUpdateQuota} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Storage Limit (in Gigabytes - GB)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={quotaGB}
                onChange={(e) => setQuotaGB(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setQuotaUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingQuota}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
              >
                {updatingQuota ? 'Saving...' : 'Update Quota'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminPage;
