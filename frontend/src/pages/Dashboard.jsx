import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  LineChart,
  PiggyBank,
  Sparkles,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Award,
  AlertTriangle,
  AlertCircle,
  Activity,
  Lightbulb,
  CreditCard,
  PieChart as PieIcon
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import PageLoader from '../components/common/Loader';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import PortfolioChart from '../components/charts/PortfolioChart';
import SavingsTrendChart from '../components/charts/SavingsTrendChart';
import Modal from '../components/common/Modal';
import { analyticsService } from '../services/analyticsService';
import { incomeService } from '../services/incomeService';
import { expenseService } from '../services/expenseService';
import { investmentService } from '../services/investmentService';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, INVESTMENT_TYPES, PAYMENT_METHODS } from '../utils/constants';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick form states
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: '',
    category: INCOME_CATEGORIES[0],
    date: getTodayDateString(),
    payment_method: PAYMENT_METHODS[0],
    description: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    date: getTodayDateString(),
    payment_method: PAYMENT_METHODS[1],
    merchant: '',
    description: '',
    notes: ''
  });

  const [investmentForm, setInvestmentForm] = useState({
    investment_name: '',
    investment_type: INVESTMENT_TYPES[0],
    amount_invested: '',
    current_value: '',
    investment_date: getTodayDateString(),
    notes: ''
  });

  const { showToast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, monthRes, catRes] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getMonthlyAnalytics(),
        analyticsService.getCategoryAnalytics()
      ]);
      setSummary(sumRes);
      setMonthlyData(monthRes);
      setCategoryData(catRes);
    } catch {
      showToast('Failed to load dashboard data. Ensure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Quick Add Income
  const handleAddIncome = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await incomeService.create({
        ...incomeForm,
        amount: parseFloat(incomeForm.amount)
      });
      showToast('Income added successfully!');
      setIsIncomeModalOpen(false);
      setIncomeForm({
        amount: '',
        source: '',
        category: INCOME_CATEGORIES[0],
        date: getTodayDateString(),
        payment_method: PAYMENT_METHODS[0],
        description: ''
      });
      loadDashboardData();
    } catch {
      showToast('Failed to add income', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expenseService.create({
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      showToast('Expense added successfully!');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        amount: '',
        category: EXPENSE_CATEGORIES[0],
        date: getTodayDateString(),
        payment_method: PAYMENT_METHODS[1],
        merchant: '',
        description: '',
        notes: ''
      });
      loadDashboardData();
    } catch {
      showToast('Failed to add expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Add Investment
  const handleAddInvestment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await investmentService.create({
        ...investmentForm,
        amount_invested: parseFloat(investmentForm.amount_invested),
        current_value: parseFloat(investmentForm.current_value || investmentForm.amount_invested)
      });
      showToast('Investment added successfully!');
      setIsInvestmentModalOpen(false);
      setInvestmentForm({
        investment_name: '',
        investment_type: INVESTMENT_TYPES[0],
        amount_invested: '',
        current_value: '',
        investment_date: getTodayDateString(),
        notes: ''
      });
      loadDashboardData();
    } catch {
      showToast('Failed to add investment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success':
        return <Award className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'info':
        return <PieIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      default:
        return <Lightbulb className="w-5 h-5 text-purple-500 flex-shrink-0" />;
    }
  };

  if (loading) return <PageLoader message="Loading your dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time balance, savings rates, and automated smart insights
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Net Balance"
          value={formatCurrency(summary?.total_balance)}
          subtitle="Net cash flow"
          icon={Wallet}
          colorScheme="green"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary?.monthly_income)}
          subtitle={`Total: ${formatCurrency(summary?.total_income)}`}
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(summary?.monthly_expenses)}
          subtitle={`Total: ${formatCurrency(summary?.total_expenses)}`}
          icon={TrendingDown}
          colorScheme="red"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(summary?.total_savings)}
          subtitle={`Rate: ${summary?.savings_rate || 0}% this month`}
          icon={PiggyBank}
          colorScheme="purple"
        />
      </div>

      {/* Secondary KPI Bar: Investments & Budget Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Portfolio Current Value
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.portfolio_value)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Invested: {formatCurrency(summary?.total_investments)} ({summary?.portfolio_return_percentage >= 0 ? '+' : ''}{summary?.portfolio_return_percentage}% return)
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Monthly Savings
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary?.monthly_savings)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculated: Income - Expenses - Investments
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Current Budget Remaining
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.budget_remaining)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Remaining limit for this month
          </p>
        </div>
      </div>

      {/* AI Financial Insights Section */}
      {summary?.insights && summary.insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dynamic Financial Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.insights.map((insight) => (
              <div
                key={insight.id}
                className="glass-card p-4 flex items-start space-x-3 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900"
              >
                {getInsightIcon(insight.type)}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Income vs Expenses (Monthly)
            </h3>
            <Link to="/reports" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              View Breakdown
            </Link>
          </div>
          <IncomeExpenseChart data={monthlyData} />
        </div>

        {/* Expense by Category */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Expenses by Category
            </h3>
            <Link to="/expenses" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              All Expenses
            </Link>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>

        {/* Savings Growth Trend */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Savings Growth Trend
            </h3>
            <Link to="/savings" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Savings Details
            </Link>
          </div>
          <SavingsTrendChart data={monthlyData} />
        </div>

        {/* Recent Transactions List */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h3>
              <Link to="/transactions" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(!summary?.recent_transactions || summary.recent_transactions.length === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                No recent transactions recorded yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                {summary.recent_transactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  const isExp = tx.type === 'expense';
                  return (
                    <div key={tx.id} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isInc
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : isExp
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isInc ? '+' : isExp ? '-' : '•'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tx.category} • {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isInc
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExp
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isInc ? '+' : isExp ? '-' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Quick Add Income Modal */}
      <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Record New Income">
        <form onSubmit={handleAddIncome} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              placeholder="5000.00"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Source / Employer</label>
              <input
                type="text"
                required
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                placeholder="Google / Acme Corp"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Category</label>
              <select
                value={incomeForm.category}
                onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Payment Method</label>
              <select
                value={incomeForm.payment_method}
                onChange={(e) => setIncomeForm({ ...incomeForm, payment_method: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Description (Optional)</label>
            <input
              type="text"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              placeholder="e.g. Monthly base salary"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsIncomeModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : 'Save Income'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Quick Add Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              placeholder="120.50"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Merchant / Vendor</label>
              <input
                type="text"
                value={expenseForm.merchant}
                onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })}
                placeholder="Amazon / Whole Foods"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Payment Method</label>
              <select
                value={expenseForm.payment_method}
                onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Description / Notes</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="e.g. Weekly grocery stock up"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Quick Add Investment Modal */}
      <Modal isOpen={isInvestmentModalOpen} onClose={() => setIsInvestmentModalOpen(false)} title="Record New Investment">
        <form onSubmit={handleAddInvestment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Asset Name</label>
            <input
              type="text"
              required
              value={investmentForm.investment_name}
              onChange={(e) => setInvestmentForm({ ...investmentForm, investment_name: e.target.value })}
              placeholder="Vanguard S&P 500 (VOO)"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Type</label>
              <select
                value={investmentForm.investment_type}
                onChange={(e) => setInvestmentForm({ ...investmentForm, investment_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Investment Date</label>
              <input
                type="date"
                required
                value={investmentForm.investment_date}
                onChange={(e) => setInvestmentForm({ ...investmentForm, investment_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Amount Invested (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={investmentForm.amount_invested}
                onChange={(e) => setInvestmentForm({ ...investmentForm, amount_invested: e.target.value })}
                placeholder="1000.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Current Value (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={investmentForm.current_value}
                onChange={(e) => setInvestmentForm({ ...investmentForm, current_value: e.target.value })}
                placeholder="1150.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsInvestmentModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : 'Save Investment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
