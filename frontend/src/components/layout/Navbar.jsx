import React from 'react';
import { Menu, Sun, Moon, Bell, ShieldCheck, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const Navbar = ({ onMenuClick, title }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left side: Hamburger & Dynamic Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right side: Security badge, Theme Toggle, Profile link */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Security / Cloud Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PostgreSQL Active</span>
        </div>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          aria-label="Toggle Theme"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Account Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
