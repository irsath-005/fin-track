import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Sparkles,
  Trophy
} from 'lucide-react';
import { goalService } from '../services/goalService';
import { useToast } from '../hooks/useToast';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/Loader';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '0',
    target_date: getTodayDateString(),
    description: ''
  });

  const { showToast } = useToast();

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await goalService.getAll();
      setGoals(data);
    } catch {
      showToast('Failed to fetch financial goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      goal_name: '',
      target_amount: '',
      current_amount: '0',
      target_date: getTodayDateString(),
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      goal_name: item.goal_name,
      target_amount: item.target_amount,
      current_amount: item.current_amount,
      target_date: item.target_date,
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenDepositModal = (goal) => {
    setSelectedGoalForDeposit(goal);
    setDepositAmount('');
    setIsDepositModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        goal_name: formData.goal_name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        target_date: formData.target_date,
        description: formData.description || null
      };

      if (editingItem) {
        await goalService.update(editingItem.id, payload);
        showToast('Financial goal updated successfully!');
      } else {
        await goalService.create(payload);
        showToast('New financial goal created!');
      }
      setIsModalOpen(false);
      fetchGoals();
    } catch {
      showToast('Error saving financial goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    setSubmitting(true);
    try {
      const added = parseFloat(depositAmount);
      const newCurrent = selectedGoalForDeposit.current_amount + added;
      await goalService.update(selectedGoalForDeposit.id, {
        current_amount: newCurrent
      });
      showToast(`Added ${formatCurrency(added)} towards ${selectedGoalForDeposit.goal_name}!`);
      setIsDepositModalOpen(false);
      fetchGoals();
    } catch {
      showToast('Failed to add funds to goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await goalService.delete(deletingId);
      showToast('Financial goal deleted successfully!');
      setDeletingId(null);
      fetchGoals();
    } catch {
      showToast('Error deleting goal', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalTarget = goals.reduce((acc, curr) => acc + curr.target_amount, 0);
  const totalSaved = goals.reduce((acc, curr) => acc + curr.current_amount, 0);
  const completedGoals = goals.filter((g) => g.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Target className="w-6 h-6 text-emerald-500" />
            <span>Financial Goals & Milestones</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set and track savings milestones for emergency funds, houses, vehicles, and dream vacations
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Target Ambition"
          value={formatCurrency(totalTarget)}
          subtitle="Cumulative target across all goals"
          icon={Target}
          colorScheme="blue"
        />
        <StatCard
          title="Total Funds Accumulated"
          value={formatCurrency(totalSaved)}
          subtitle={`${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}% of combined targets`}
          icon={TrendingUp}
          colorScheme="green"
        />
        <StatCard
          title="Completed Goals"
          value={`${completedGoals} / ${goals.length}`}
          subtitle="Milestones achieved"
          icon={Trophy}
          colorScheme="amber"
        />
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-8"><PageLoader message="Loading financial milestones..." /></div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-6">
          <EmptyState
            title="No financial goals created yet"
            description="Create your first financial target (e.g., Emergency Fund: $10,000, New Car: $25,000) and track your progress."
            actionLabel="Create Goal"
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const isFinished = g.is_completed || g.progress_percentage >= 100;
            return (
              <div key={g.id} className="glass-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{g.goal_name}</span>
                      {isFinished && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(g)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(g.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                      {g.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(g.current_amount)}
                    </span>
                    <span className="text-slate-400">
                      Target: {formatCurrency(g.target_amount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished
                          ? 'bg-emerald-500'
                          : g.progress_percentage >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {g.progress_percentage}% achieved
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(g.target_date)}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {isFinished ? 'Goal Complete! 🎉' : `Remaining: ${formatCurrency(g.remaining_amount)}`}
                  </span>
                  <button
                    onClick={() => handleOpenDepositModal(g)}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Financial Goal' : 'Create Financial Target'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Goal Name
            </label>
            <input
              type="text"
              required
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              placeholder="e.g. Emergency Fund / Tesla Model 3"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="1"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="10000.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Current Saved (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                placeholder="2500.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Target Deadline Date
            </label>
            <input
              type="date"
              required
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description / Motivation
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 6 months of living expenses safely saved in high-yield account"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Funds / Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={`Contribute Funds to ${selectedGoalForDeposit?.goal_name || 'Goal'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Current progress: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(selectedGoalForDeposit?.current_amount)}</span> of {formatCurrency(selectedGoalForDeposit?.target_amount)}
            </p>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Contribution Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="250.00"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Financial Goal"
        message="Are you sure you want to delete this target milestone?"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default GoalsPage;
