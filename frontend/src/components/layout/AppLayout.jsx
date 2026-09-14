import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Financial Dashboard',
  '/income': 'Income Streams',
  '/expenses': 'Expenses & Outflows',
  '/investments': 'Investment Portfolio',
  '/savings': 'Savings & Wealth Accumulation',
  '/budgets': 'Budget Management',
  '/goals': 'Financial Goals & Milestones',
  '/transactions': 'Unified Transaction History',
  '/reports': 'Financial Reports & Analytics',
  '/profile': 'Profile & Account Settings',
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle = pageTitles[location.pathname] || 'FinTrack';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={currentTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
