import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'w-8 h-8', className = '' }) => (
  <Loader2 className={`animate-spin text-emerald-500 ${size} ${className}`} />
);

export const PageLoader = ({ message = 'Loading financial data...' }) => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
    <Spinner size="w-10 h-10" />
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
      {message}
    </p>
  </div>
);

export default PageLoader;
