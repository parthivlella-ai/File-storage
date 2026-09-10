import React, { useState } from 'react';
import { User, Lock, HardDrive, Shield, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate } from '../utils/formatters';

const SettingsPage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({ name, avatar });
    setSavingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Title */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight">Account & Security Settings</h2>
        <p className="text-xs text-slate-400">Manage your profile, login credentials, and account details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Profile Summary Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center glass-card">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl overflow-hidden mb-4 border border-white/10">
              {avatar ? (
                <img src={avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <h3 className="text-base font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400 truncate max-w-full">{user?.email}</p>

            <span className="mt-3 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {user?.role === 'admin' ? 'Administrator' : 'Standard Member'}
            </span>

            <div className="w-full border-t border-slate-800 my-4" />

            <div className="w-full text-left space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Member Since</span>
                <span className="text-slate-200 font-medium">{formatDate(user?.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Limit</span>
                <span className="text-slate-200 font-medium">{formatBytes(user?.storageLimit || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Edit Form */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2 bg-slate-950/30 border border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Email cannot be changed directly for security purposes.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-900/30 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 glass-card">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
