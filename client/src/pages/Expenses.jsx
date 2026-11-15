import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  TrendingDown, 
  TrendingUp, 
  IndianRupee, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Tag, 
  CreditCard, 
  Building2, 
  PieChart, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Percent,
  RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'Rent & Shop Lease',
  'Inventory & Stock',
  'Utilities & Bills',
  'Staff Salaries',
  'Marketing & Promotions',
  'Maintenance & Repairs',
  'Packaging & Supplies',
  'Software & Subscriptions',
  'General & Miscellaneous'
];

const PAYMENT_METHODS = [
  'CASH',
  'UPI / Online',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General & Miscellaneous',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    paid_to: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [expRes, pnlRes] = await Promise.all([
        api.expenses.getAll(),
        api.expenses.getPnL()
      ]);

      if (expRes.success) {
        setExpenses(expRes.expenses || []);
      }
      if (pnlRes.success) {
        setPnl(pnlRes.pnl || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load expense and P&L data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide an expense title/description');
      return;
    }
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.expenses.create(formData);
      if (res.success) {
        setSuccess('Expense recorded successfully!');
        setIsModalOpen(false);
        setFormData({
          title: '',
          category: 'General & Miscellaneous',
          amount: '',
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'CASH',
          paid_to: '',
          notes: ''
        });
        await fetchData();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the expense "${title}"?`)) {
      return;
    }

    try {
      const res = await api.expenses.delete(id);
      if (res.success) {
        setSuccess('Expense deleted successfully');
        await fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.paid_to && item.paid_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const isProfitable = pnl && pnl.isProfitable;
  const netProfit = pnl ? pnl.netProfitLoss : '0.00';
  const totalExp = pnl ? pnl.totalExpenses : '0.00';
  const netRev = pnl ? pnl.netSales : '0.00';
  const grossSales = pnl ? pnl.grossSales : '0.00';
  const discounts = pnl ? pnl.totalDiscounts : '0.00';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Financial Accounting</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              P&L Ledger
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Expenses & Profit / Loss Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track operational store outflows, view category expense breakdowns, and compute exact bottom-line net profit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Financials"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-rose-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* P&L Financial Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Gross Sales (POS)</span>
            <IndianRupee className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">₹{grossSales}</div>
          <div className="text-[11px] text-slate-500">Less discounts: -₹{discounts}</div>
        </div>

        {/* Net Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 tracking-tight">₹{netRev}</div>
          <div className="text-[11px] text-slate-500">Realized shop income</div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">₹{totalExp}</div>
          <div className="text-[11px] text-slate-500">{expenses.length} recorded line items</div>
        </div>

        {/* Net Profit / Loss */}
        <div className={`p-5 rounded-2xl border ${
          isProfitable 
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
        } space-y-1`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Net {isProfitable ? 'Profit' : 'Loss'}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
              isProfitable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {pnl?.netProfitMargin ? `${pnl.netProfitMargin}% Margin` : '0%'}
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight">
            {isProfitable ? `+₹${netProfit}` : `-₹${Math.abs(parseFloat(netProfit)).toFixed(2)}`}
          </div>
          <div className="text-[11px] text-slate-400">
            {isProfitable ? 'Healthy operating surplus' : 'Expenses exceed net sales'}
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      {pnl?.categoryBreakdown && pnl.categoryBreakdown.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Expense Outflows by Category</h2>
            </div>
            <span className="text-xs text-slate-400">{pnl.categoryBreakdown.length} active categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pnl.categoryBreakdown.map((cat, idx) => {
              const expVal = parseFloat(cat.total);
              const totalVal = parseFloat(totalExp) || 1;
              const pct = Math.round((expVal / totalVal) * 100);
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 truncate">{cat.category}</span>
                    <span className="font-mono font-bold text-white">₹{parseFloat(cat.total).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full" 
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{cat.count} expense records</span>
                    <span>{pct}% of outflows</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses List & Filter Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Expense Records</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredExpenses.length} entries
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, payee, notes..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition w-48 sm:w-56"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500 transition"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                      {exp.expense_date ? String(exp.expense_date).split('T')[0] : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {exp.paid_to || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {exp.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      ₹{parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Expense"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Expense Title / Description *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. November Store Rent or Milk & Coffee Beans"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Expense Date</label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Paid To / Vendor Name</label>
            <input
              type="text"
              name="paid_to"
              value={formData.paid_to}
              onChange={handleInputChange}
              placeholder="e.g. Landlord John, City Power Corp, Dairy Supplier"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notes / Invoice Ref</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="Optional invoice number, remarks, receipt details..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold hover:opacity-95 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
