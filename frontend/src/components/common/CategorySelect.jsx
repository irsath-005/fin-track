import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, ChevronDown } from 'lucide-react';

const CategorySelect = ({
  categories = [],
  value = '',
  onChange,
  storageKey = 'custom_categories',
  placeholder = 'Select Category...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [allCategories, setAllCategories] = useState(categories);
  const containerRef = useRef(null);

  // Load persistent custom categories from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = Array.from(new Set([...categories, ...parsed]));
          setAllCategories(merged);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading custom categories:', err);
    }
    setAllCategories(categories);
  }, [categories, storageKey]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = allCategories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelect = (cat) => {
    onChange(cat);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddCustom = (e) => {
    e?.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (!allCategories.includes(trimmed)) {
      const updated = [...allCategories, trimmed];
      setAllCategories(updated);
      try {
        const customOnly = updated.filter((c) => !categories.includes(c));
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
      } catch (err) {
        console.error('Error saving custom category:', err);
      }
    }
    onChange(trimmed);
    setCustomInput('');
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Category Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium dark:text-white flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
      >
        <span className={value ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Category..."
              className="w-full text-xs bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none placeholder-slate-400"
              autoFocus
            />
          </div>

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full px-3 py-2 text-xs text-left rounded-lg flex items-center justify-between transition-colors ${
                    value === cat
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>{cat}</span>
                  {value === cat && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No Category found.
              </div>
            )}
          </div>

          {/* Add New Category Input */}
          <form onSubmit={handleAddCustom} className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Add new category"
                className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-40 transition-colors"
                title="Add Category"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
