import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  colorScheme = 'green', // 'green', 'blue', 'red', 'purple', 'amber'
  className = ''
}) => {
  const colorMap = {
    green: {
      bg: 'stat-card-gradient-green',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800'
    },
    blue: {
      bg: 'stat-card-gradient-blue',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      border: 'border-slate-200 dark:border-slate-800'
    },
    red: {
      bg: 'stat-card-gradient-red',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      border: 'border-slate-200 dark:border-slate-800'
    },
    purple: {
      bg: 'stat-card-gradient-purple',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      border: 'border-slate-200 dark:border-slate-800'
    },
    amber: {
      bg: 'stat-card-gradient-amber',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      border: 'border-slate-200 dark:border-slate-800'
    },
  };

  const currentTheme = colorMap[colorScheme] || colorMap.green;

  return (
    <div className={`glass-card p-5 relative overflow-hidden flex flex-col justify-between ${currentTheme.bg} ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${currentTheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {(subtitle || trend !== undefined) && (
          <div className="mt-2 flex items-center space-x-2 text-xs">
            {trend !== undefined && (
              <span
                className={`font-bold px-1.5 py-0.5 rounded-md ${
                  trend >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend >= 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            {trendLabel && (
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {trendLabel}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
