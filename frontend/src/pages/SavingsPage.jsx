import React, { useState, useEffect, useCallback } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Percent,
  Calendar,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/common/StatCard';
import SavingsTrendChart from '../components/charts/SavingsTrendChart';
import PageLoader from '../components/common/Loader';
import { formatCurrency, formatPercentage, getTodayDateString } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';

const SavingsPage = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchSavingsData = useCallback(async () => {
    try {
      setLoading(true);
      const [sum, monthly] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getMonthlyAnalytics(selectedYear)
      ]);
      setSummary(sum);
      setMonthlyBreakdown(monthly);
    } catch {
      showToast('Failed to load savings analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, showToast]);

  useEffect(() => {
    fetchSavingsData();
  }, [fetchSavingsData]);

  const handleExportCSV = () => {
    const exportData = monthlyBreakdown.map((m) => ({
      Month: m.month_name,
      Year: m.year,
      Income: m.income,
      Expenses: m.expenses,
      Investments: m.investments,
      NetSavings: m.savings,
      SavingsRate: `${m.savings_rate}%`
    }));
    exportToCSV(exportData, `FinTrack_Savings_${selectedYear}.csv`);
  };

  if (loading) return <PageLoader message="Calculating savings metrics from database..." />;

  const currentYearTotalSavings = monthlyBreakdown.reduce((acc, curr) => acc + curr.savings, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <PiggyBank className="w-6 h-6 text-purple-500" />
            <span>Savings & Wealth Accumulation</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time savings formula: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Income - Expenses - Investments</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="All-Time Total Savings"
          value={formatCurrency(summary?.total_savings)}
          subtitle="Net accumulated reserve"
          icon={PiggyBank}
          colorScheme="purple"
        />
        <StatCard
          title={`${selectedYear} Cumulative Savings`}
          value={formatCurrency(currentYearTotalSavings)}
          subtitle={`Annual net accumulation`}
          icon={TrendingUp}
          colorScheme="green"
        />
        <StatCard
          title="Monthly Savings (Current)"
          value={formatCurrency(summary?.monthly_savings)}
          subtitle={`Inflow - Outflow - Assets`}
          icon={ArrowUpRight}
          colorScheme="blue"
        />
        <StatCard
          title="Savings Rate"
          value={`${summary?.savings_rate || 0}%`}
          subtitle="Percentage of income retained"
          icon={Percent}
          colorScheme="amber"
        />
      </div>

      {/* Chart Section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedYear} Monthly Savings Growth Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Net savings retained per month after meeting all expenses and investment commitments
            </p>
          </div>
        </div>
        <SavingsTrendChart data={monthlyBreakdown} height={320} />
      </div>

      {/* Monthly Savings Breakdown Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {selectedYear} Month-by-Month Savings Statement
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Month</th>
                <th className="py-3.5 px-4">Income</th>
                <th className="py-3.5 px-4">Expenses</th>
                <th className="py-3.5 px-4">Investments</th>
                <th className="py-3.5 px-4">Net Savings</th>
                <th className="py-3.5 px-4">Savings Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyBreakdown.map((m) => {
                const isPositive = m.savings >= 0;
                return (
                  <tr
                    key={m.month}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {m.month_name} {m.year}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(m.income)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(m.expenses)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(m.investments)}
                    </td>
                    <td className={`py-3.5 px-4 font-extrabold ${isPositive ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(m.savings)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        m.savings_rate >= 20
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : m.savings_rate > 0
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                        {m.savings_rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SavingsPage;
