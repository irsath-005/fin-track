import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { useToast } from '../hooks/useToast';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/Loader';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, INVESTMENT_TYPES } from '../utils/constants';

const TransactionsPage = () => {
  const [data, setData] = useState({ transactions: [], total: 0, total_pages: 1, page: 1, limit: 15 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState(''); // "income", "expense", "investment"
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const { showToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (search) params.search = search;

      const res = await transactionService.getAll(params);
      setData(res);
    } catch {
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, categoryFilter, startDate, endDate, search, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCSV = () => {
    const exportData = data.transactions.map((t) => ({
      ID: t.id,
      Type: t.type.toUpperCase(),
      Category: t.category,
      Amount: t.amount,
      Date: t.date,
      PaymentMethod: t.payment_method,
      Description: t.description || '',
      Merchant: t.merchant || ''
    }));
    exportToCSV(exportData, `FinTrack_Transactions_${getTodayDateString()}.csv`);
  };

  const allAvailableCategories = Array.from(new Set([
    ...INCOME_CATEGORIES,
    ...EXPENSE_CATEGORIES,
    ...INVESTMENT_TYPES
  ])).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-500" />
            <span>Central Transaction Journal</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unified ledger across Income (Green), Expenses (Red), and Investment Assets (Blue)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Transactions</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Flow Types</option>
              <option value="income">Incomes Only (Green)</option>
              <option value="expense">Expenses Only (Red)</option>
              <option value="investment">Investments Only (Blue)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {allAvailableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="category">Sort by Category</option>
              <option value="type">Sort by Type</option>
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

        {/* Date Filter Bar */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
          />
          {(startDate || endDate || search || typeFilter || categoryFilter) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setTypeFilter('');
                setCategoryFilter('');
                setPage(1);
              }}
              className="text-xs text-rose-500 hover:underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8"><PageLoader message="Loading transaction ledger..." /></div>
        ) : data.transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Adjust your search criteria or add new income/expenses."
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description / Merchant</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.transactions.map((tx, idx) => {
                    const isInc = tx.type === 'income';
                    const isExp = tx.type === 'expense';
                    const isInv = tx.type === 'investment';

                    return (
                      <tr
                        key={`${tx.type}-${tx.id}-${idx}`}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              isInc
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : isExp
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          {tx.category}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{tx.description}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {tx.payment_method}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-extrabold text-right ${
                            isInc
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExp
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isInc ? '+' : isExp ? '-' : ''}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing page <span className="font-bold text-slate-900 dark:text-white">{data.page}</span> of {data.total_pages} ({data.total} total items)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={data.page >= data.total_pages}
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
