import React, { useState, useEffect, useCallback } from 'react';
import {
  WalletCards,
  PlusCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { useToast } from '../hooks/useToast';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/Loader';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/constants';

const BudgetsPage = () => {
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });

  const { showToast } = useToast();

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await budgetService.getStatus({
        month: selectedMonth,
        year: selectedYear
      });
      setBudgetStatus(data);
    } catch {
      showToast('Failed to fetch budget status', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      month: selectedMonth,
      year: selectedYear
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      amount: item.amount,
      month: item.month,
      year: item.year
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        month: parseInt(formData.month),
        year: parseInt(formData.year)
      };

      if (editingItem) {
        await budgetService.update(editingItem.id, payload);
        showToast('Budget updated successfully!');
      } else {
        await budgetService.create(payload);
        showToast('Budget configured successfully!');
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch {
      showToast('Error saving budget', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await budgetService.delete(deletingId);
      showToast('Budget deleted successfully!');
      setDeletingId(null);
      fetchBudgets();
    } catch {
      showToast('Error deleting budget', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const months = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <WalletCards className="w-6 h-6 text-amber-500" />
            <span>Category Budgets & Limits</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set category limits with automated 80% threshold warnings and real-time expense syncing
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Month Budget"
          value={formatCurrency(budgetStatus?.total_budgeted)}
          subtitle="Sum of planned category limits"
          icon={WalletCards}
          colorScheme="amber"
        />
        <StatCard
          title="Actual Spent"
          value={formatCurrency(budgetStatus?.total_spent)}
          subtitle="Cumulative tracked outflow"
          icon={AlertTriangle}
          colorScheme="red"
        />
        <StatCard
          title="Budget Remaining"
          value={formatCurrency(budgetStatus?.total_remaining)}
          subtitle="Available headroom"
          icon={CheckCircle2}
          colorScheme="green"
        />
      </div>

      {/* Budgets Progress Grid */}
      {loading ? (
        <div className="p-8"><PageLoader message="Calculating real-time budget utilization..." /></div>
      ) : (!budgetStatus?.budgets || budgetStatus.budgets.length === 0) ? (
        <div className="glass-card p-6">
          <EmptyState
            title="No budgets set for this month"
            description="Create category budgets (e.g. Food: $500, Rent: $1,200) to keep your finances on track."
            actionLabel="Create Budget"
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetStatus.budgets.map((b) => {
            const isExceeded = b.percentage_used >= 100;
            const isWarning = b.percentage_used >= 80 && !isExceeded;

            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            let statusText = 'Normal';

            if (isExceeded) {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
              statusText = 'Exceeded Budget';
            } else if (isWarning) {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
              statusText = '80% Warning';
            }

            return (
              <div key={b.id} className="glass-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {b.category}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(b)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(b.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeBg}`}>
                      {statusText} ({b.percentage_used}%)
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Limit: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(b.amount)}</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                    />
                  </div>

                  {/* Spent vs Remaining */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-400">Spent</p>
                      <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(b.spent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Remaining</p>
                      <p className={`font-bold ${b.remaining < 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(b.remaining)}
                      </p>
                    </div>
                  </div>
                </div>

                {isExceeded && (
                  <div className="mt-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Exceeded by {formatCurrency(Math.abs(b.remaining))}!</span>
                  </div>
                )}
                {isWarning && (
                  <div className="mt-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Approaching monthly budget threshold.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Budget Limit' : 'Configure Category Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Monthly Budget Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="500.00"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Month
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:outline-none"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Year
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        message="Are you sure you want to remove this category budget limit?"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default BudgetsPage;
