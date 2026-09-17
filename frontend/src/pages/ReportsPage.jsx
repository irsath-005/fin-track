import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useToast } from '../hooks/useToast';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import PortfolioChart from '../components/charts/PortfolioChart';
import SavingsTrendChart from '../components/charts/SavingsTrendChart';
import StatCard from '../components/common/StatCard';
import PageLoader from '../components/common/Loader';
import { formatCurrency, formatPercentage, getTodayDateString } from '../utils/formatters';
import { exportToCSV, printFinancialReport } from '../utils/exportUtils';

const ReportsPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = all months
  const [yearlyData, setYearlyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [yearly, monthly, cats] = await Promise.all([
        analyticsService.getYearlyAnalytics(selectedYear),
        analyticsService.getMonthlyAnalytics(selectedYear),
        analyticsService.getCategoryAnalytics(selectedMonth === 0 ? null : selectedMonth, selectedYear)
      ]);
      setYearlyData(yearly);
      setMonthlyData(monthly);
      setCategoryData(cats);
    } catch {
      showToast('Failed to compile financial reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = () => {
    const exportData = monthlyData.map((m) => ({
      Month: m.month_name,
      Year: m.year,
      Income: m.income,
      Expenses: m.expenses,
      Investments: m.investments,
      Savings: m.savings,
      SavingsRate: `${m.savings_rate}%`
    }));
    exportToCSV(exportData, `FinTrack_Financial_Report_${selectedYear}.csv`);
  };

  const months = [
    { value: 0, name: 'Entire Year' },
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  if (loading) return <PageLoader message="Loading financial reports..." />;

  return (
    <div className="space-y-6">
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            <span>Reports & Deep Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate printable annual statements, category expenditure reports, and portfolio rollups
          </p>
        </div>

        {/* Year/Month selectors & Export Actions */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
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
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={printFinancialReport}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">FinTrack Financial Performance Statement</h1>
        <p className="text-sm text-gray-500">Period: {selectedMonth === 0 ? 'Full Year' : months.find(m => m.value === selectedMonth)?.name} {selectedYear} • Generated on {getTodayDateString()}</p>
      </div>

      {/* Yearly KPI Rollup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title={`${selectedYear} Total Income`}
          value={formatCurrency(yearlyData?.total_income)}
          subtitle="Cumulative yearly inflow"
          icon={TrendingUp}
          colorScheme="green"
        />
        <StatCard
          title={`${selectedYear} Total Expenses`}
          value={formatCurrency(yearlyData?.total_expenses)}
          subtitle="Cumulative yearly outflow"
          icon={TrendingDown}
          colorScheme="red"
        />
        <StatCard
          title={`${selectedYear} Net Savings`}
          value={formatCurrency(yearlyData?.total_savings)}
          subtitle={`Annual Savings: ${yearlyData?.net_savings_rate || 0}%`}
          icon={DollarSign}
          colorScheme="purple"
        />
        <StatCard
          title={`${selectedYear} Total Invested`}
          value={formatCurrency(yearlyData?.total_investments)}
          subtitle="Capital deployed in assets"
          icon={PieIcon}
          colorScheme="blue"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {selectedYear} Inflow vs Outflow Comparison
          </h3>
          <IncomeExpenseChart data={monthlyData} height={300} />
        </div>

        {/* Expense Category Spending Breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Category Expenditure Distribution {selectedMonth > 0 ? `(${months.find(m => m.value === selectedMonth)?.name})` : ''}
          </h3>
          <CategoryPieChart data={categoryData} height={300} />
        </div>

        {/* Savings Growth Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {selectedYear} Net Savings Curve
          </h3>
          <SavingsTrendChart data={monthlyData} height={300} />
        </div>

        {/* Investment Asset Allocations */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Portfolio Asset Allocation
          </h3>
          <CategoryPieChart
            data={yearlyData?.investment_breakdown || []}
            nameKey="investment_type"
            valueKey="current_value"
            height={300}
          />
        </div>
      </div>

      {/* Full Monthly Statement Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Comprehensive {selectedYear} Financial Ledger Statement
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Total Inflow</th>
                <th className="py-3.5 px-4">Total Outflow</th>
                <th className="py-3.5 px-4">Investments</th>
                <th className="py-3.5 px-4">Net Savings</th>
                <th className="py-3.5 px-4 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyData.map((m) => (
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
                  <td className={`py-3.5 px-4 font-extrabold ${m.savings >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.savings >= 0 ? '+' : ''}{formatCurrency(m.savings)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                    {m.savings_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
