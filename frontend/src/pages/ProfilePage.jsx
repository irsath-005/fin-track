import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { formatDate } from '../utils/formatters';

const ProfilePage = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { showToast } = useToast();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const updated = await authService.updateProfile({ name });
      updateUserProfile(updated);
      showToast('Profile information updated successfully!');
    } catch {
      showToast('Failed to update profile information', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      showToast('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password. Check your current password.';
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <User className="w-6 h-6 text-emerald-500" />
          <span>Profile & Security Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your account credentials, security tokens, and database isolation profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Account Info Card */}
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-emerald-500/25 mb-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {user?.name || 'FinTrack User'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.email}
          </p>

          <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Account ID</span>
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{user?.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>DB Isolation</span>
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">PostgreSQL Strict</span>
            </div>
            {user?.created_at && (
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Member Since</span>
                </span>
                <span>{formatDate(user.created_at.split('T')[0])}</span>
              </div>
            )}
          </div>
        </div>

        {/* Update Forms Container */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Name Form */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-500" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Email Address (Primary Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <span>Security & Password</span>
            </h3>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
