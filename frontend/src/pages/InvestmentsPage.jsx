import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  Search,
  ArrowUpDown,
  Download,
  LineChart as LineChartIcon,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon
} from 'lucide-react';
import { investmentService } from '../services/investmentService';
import { useToast } from '../hooks/useToast';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/Loader';
import StatCard from '../components/common/StatCard';
import PortfolioChart from '../components/charts/PortfolioChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { formatCurrency, formatDate, formatPercentage, getTodayDateString } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import { INVESTMENT_TYPES } from '../utils/constants';

const InvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('investment_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    investment_name: '',
    investment_type: INVESTMENT_TYPES[0],
    amount_invested: '',
    current_value: '',
    investment_date: getTodayDateString(),
    quantity: '1',
    purchase_price: '',
    current_price: '',
    expected_return: '',
    notes: ''
  });

  const { showToast } = useToast();

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (search) params.search = search;
      if (typeFilter) params.investment_type = typeFilter;

      const [data, sum] = await Promise.all([
        investmentService.getAll(params),
        investmentService.getSummary()
      ]);
      setInvestments(data);
      setSummary(sum);
    } catch {
      showToast('Failed to fetch investment assets', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      investment_name: '',
      investment_type: INVESTMENT_TYPES[0],
      amount_invested: '',
      current_value: '',
      investment_date: getTodayDateString(),
      quantity: '1',
      purchase_price: '',
      current_price: '',
      expected_return: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      investment_name: item.investment_name,
      investment_type: item.investment_type,
      amount_invested: item.amount_invested,
      current_value: item.current_value,
      investment_date: item.investment_date,
      quantity: item.quantity || '1',
      purchase_price: item.purchase_price || '',
      current_price: item.current_price || '',
      expected_return: item.expected_return || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        investment_name: formData.investment_name,
        investment_type: formData.investment_type,
        amount_invested: parseFloat(formData.amount_invested),
        current_value: parseFloat(formData.current_value || formData.amount_invested),
        investment_date: formData.investment_date,
        quantity: formData.quantity ? parseFloat(formData.quantity) : 1.0,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        current_price: formData.current_price ? parseFloat(formData.current_price) : null,
        expected_return: formData.expected_return ? parseFloat(formData.expected_return) : null,
        notes: formData.notes || null
      };

      if (editingItem) {
        await investmentService.update(editingItem.id, payload);
        showToast('Investment updated successfully!');
      } else {
        await investmentService.create(payload);
        showToast('Investment asset recorded successfully!');
      }
      setIsModalOpen(false);
      fetchInvestments();
    } catch {
      showToast('Error saving investment asset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await investmentService.delete(deletingId);
      showToast('Investment asset removed successfully!');
      setDeletingId(null);
      fetchInvestments();
    } catch {
      showToast('Error deleting investment asset', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = investments.map((inv) => ({
      ID: inv.id,
      Name: inv.investment_name,
      Type: inv.investment_type,
      Invested: inv.amount_invested,
      CurrentValue: inv.current_value,
      ProfitLoss: inv.profit_loss,
      ReturnPercentage: `${inv.return_percentage}%`,
      Date: inv.investment_date,
      Quantity: inv.quantity || 1,
      Notes: inv.notes || ''
    }));
    exportToCSV(exportData, `FinTrack_Portfolio_${getTodayDateString()}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <LineChartIcon className="w-6 h-6 text-blue-500" />
            <span>Investment Portfolio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track stocks, mutual funds, SIPs, fixed deposits, crypto, gold, and real estate
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Invested"
          value={formatCurrency(summary?.total_invested)}
          subtitle="Cumulative principal"
          icon={DollarSign}
          colorScheme="blue"
        />
        <StatCard
          title="Current Portfolio Value"
          value={formatCurrency(summary?.current_portfolio_value)}
          subtitle="Realized & unrealized"
          icon={TrendingUp}
          colorScheme="green"
        />
        <StatCard
          title="Total Profit / Loss"
          value={`${summary?.total_profit_loss >= 0 ? '+' : ''}${formatCurrency(summary?.total_profit_loss)}`}
          subtitle="Net return amount"
          icon={summary?.total_profit_loss >= 0 ? TrendingUp : TrendingDown}
          colorScheme={summary?.total_profit_loss >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Total Return %"
          value={formatPercentage(summary?.total_return_percentage)}
          subtitle="Portfolio yield"
          icon={PieIcon}
          colorScheme="purple"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search investment name or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Investment Types</option>
              {INVESTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="investment_date">Sort by Date</option>
              <option value="amount_invested">Sort by Invested Amount</option>
              <option value="current_value">Sort by Current Value</option>
              <option value="investment_name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
              title={`Toggle sort order (${sortOrder.toUpperCase()})`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><PageLoader message="Loading investment assets..." /></div>
        ) : investments.length === 0 ? (
          <EmptyState
            title="No investment assets tracked yet"
            description="Start recording stocks, funds, crypto, or real estate to visualize portfolio yield."
            actionLabel="Add Investment"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Asset Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount Invested</th>
                  <th className="py-3.5 px-4">Current Value</th>
                  <th className="py-3.5 px-4">Profit / Loss</th>
                  <th className="py-3.5 px-4">Return %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {investments.map((inv) => {
                  const isProfit = inv.profit_loss >= 0;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>{inv.investment_name}</div>
                        {inv.notes && (
                          <div className="text-xs text-slate-400 font-normal truncate max-w-xs">
                            {inv.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {inv.investment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {formatDate(inv.investment_date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(inv.amount_invested)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.current_value)}
                      </td>
                      <td className={`py-3.5 px-4 font-extrabold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(inv.profit_loss)}
                      </td>
                      <td className={`py-3.5 px-4 font-extrabold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatPercentage(inv.return_percentage)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit investment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(inv.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete investment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Investment Record' : 'Record New Investment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Asset Name
            </label>
            <input
              type="text"
              required
              value={formData.investment_name}
              onChange={(e) => setFormData({ ...formData, investment_name: e.target.value })}
              placeholder="e.g. Apple Inc (AAPL) / Bitcoin"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Investment Type
              </label>
              <select
                value={formData.investment_type}
                onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Investment Date
              </label>
              <input
                type="date"
                required
                value={formData.investment_date}
                onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Amount Invested (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.amount_invested}
                onChange={(e) => setFormData({ ...formData, amount_invested: e.target.value })}
                placeholder="2500.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Current Value (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="2850.00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Quantity
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Buy Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="250.00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Curr Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                placeholder="285.00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Dollar-cost averaging monthly plan"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Investment' : 'Save Investment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Investment Record"
        message="Are you sure you want to remove this investment asset from your portfolio tracking?"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default InvestmentsPage;
