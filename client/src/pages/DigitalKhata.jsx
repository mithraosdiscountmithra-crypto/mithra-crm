import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  FileText, 
  Check, 
  Send,
  MessageCircle,
  User,
  Phone,
  Wallet
} from 'lucide-react';

export default function DigitalKhata() {
  const { merchant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('pending'); // 'all', 'pending', 'settled'

  // Add Entry Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [transactionType, setTransactionType] = useState('GIVEN'); // 'GIVEN' or 'PAID'
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customer Statement Modal State
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.udhaar.getSummary();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch Udhaar ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const openStatementModal = async (customerId) => {
    try {
      setLoadingStatement(true);
      const res = await api.udhaar.getCustomerLedger(customerId);
      if (res.success) {
        setSelectedCustomerStatement(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer statement');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await api.udhaar.addEntry({
        customer_id: parseInt(selectedCustomerId, 10),
        transaction_type: transactionType,
        amount: parsedAmount,
        notes: notes.trim(),
        due_date: transactionType === 'GIVEN' && dueDate ? dueDate : undefined
      });

      if (res.success) {
        setSuccess(res.message);
        setIsAddModalOpen(false);
        setSelectedCustomerId('');
        setAmount('');
        setNotes('');
        setDueDate('');
        fetchSummary();

        // If statement modal was open, refresh it
        if (selectedCustomerStatement && selectedCustomerStatement.customer?.id === parseInt(selectedCustomerId, 10)) {
          openStatementModal(selectedCustomerId);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to record entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleEntry = async (entryId) => {
    try {
      const res = await api.udhaar.settle(entryId);
      if (res.success) {
        setSuccess('Entry marked as settled!');
        if (selectedCustomerStatement) {
          openStatementModal(selectedCustomerStatement.customer.id);
        }
        fetchSummary();
      }
    } catch (err) {
      setError(err.message || 'Failed to settle entry');
    }
  };

  // WhatsApp Payment Reminder generator
  const handleSendWhatsAppReminder = (customer) => {
    const rawPhone = String(customer.phone).replace(/\D/g, '');
    const storeName = merchant?.store_name || 'Our Store';
    const netDue = customer.net_balance;
    const dueInfo = customer.due_date ? ` which was due on ${customer.due_date}` : '';

    const message = `Hello ${customer.name}, this is a gentle reminder from ${storeName} regarding your pending Khata/Udhaar balance of $${netDue}${dueInfo}. Please clear the outstanding balance when convenient. Thank you!`;
    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  const summary = data?.summary || {
    totalOutstanding: '0.00',
    totalCollected: '0.00',
    totalGivenOverall: '0.00',
    pendingCustomersCount: 0,
    totalCustomers: 0
  };

  const customersList = data?.customers || [];

  // Filter customers
  const filteredCustomers = customersList.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const net = parseFloat(c.net_balance);
    let matchesStatus = true;
    if (filterMode === 'pending') {
      matchesStatus = net > 0;
    } else if (filterMode === 'settled') {
      matchesStatus = net === 0;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Digital Khata Ledger</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              WhatsApp Integrated
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Customer Credit & Udhaar Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track customer credit debts, collect payments, inspect passbook statements, and send 1-click WhatsApp payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchSummary}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setTransactionType('GIVEN');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition shadow-lg shadow-rose-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Give Credit / Record Entry</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-rose-300">
            <span>Market Outstanding (You'll Get)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-2">${summary.totalOutstanding}</div>
          <div className="text-xs text-rose-300/80 mt-1">Pending collection from customers</div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-300">
            <span>Total Collected (Paid Back)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">${summary.totalCollected}</div>
          <div className="text-xs text-emerald-300/80 mt-1">Recovered credit payments</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Active Credit Customers</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">{summary.pendingCustomersCount}</div>
          <div className="text-xs text-slate-500 mt-1">Customers with pending balance</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Lifetime Credit Disbursed</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 mt-2">${summary.totalGivenOverall}</div>
          <div className="text-xs text-slate-500 mt-1">Total credit extended since start</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterMode === 'pending'
                ? 'bg-rose-500 text-white font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending Balance ({summary.pendingCustomersCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Accounts ({customersList.length})
          </button>
          <button
            onClick={() => setFilterMode('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'settled'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Settled (0 Due)
          </button>
        </div>
      </div>

      {/* Customer Ledgers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Given</th>
                <th className="px-6 py-4">Total Paid</th>
                <th className="px-6 py-4">Net Pending Balance</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No matching customer accounts found. Click "Give Credit / Record Entry" to log a transaction.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const net = parseFloat(c.net_balance);
                  const hasDue = net > 0;

                  return (
                    <tr key={c.customer_id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="text-[11px] text-slate-500">Account #{c.customer_id}</div>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                        {c.phone}
                      </td>

                      <td className="px-6 py-4 font-mono text-rose-300 text-xs">
                        ${c.total_given}
                      </td>

                      <td className="px-6 py-4 font-mono text-emerald-400 text-xs">
                        ${c.total_paid}
                      </td>

                      <td className="px-6 py-4">
                        {hasDue ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black font-mono text-rose-400">
                              ${c.net_balance}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              You'll Get
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono">
                        {c.due_date ? (
                          <span className="text-amber-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{c.due_date}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Send WhatsApp Reminder */}
                          {hasDue && (
                            <button
                              onClick={() => handleSendWhatsAppReminder(c)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                              title="Send WhatsApp payment reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>
                          )}

                          {/* Record Payment shortcut */}
                          <button
                            onClick={() => {
                              setSelectedCustomerId(String(c.customer_id));
                              setTransactionType('PAID');
                              setIsAddModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                            title="Record customer payment"
                          >
                            + Pay
                          </button>

                          {/* View Statement button */}
                          <button
                            onClick={() => openStatementModal(c.customer_id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                          >
                            Passbook
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Entry Modal (Given / Paid) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Khata / Udhaar Entry"
      >
        <form onSubmit={handleAddEntry} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Select Customer *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">-- Choose Customer --</option>
              {customersList.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.phone}) — Net Due: ${c.net_balance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Transaction Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('GIVEN')}
                className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  transactionType === 'GIVEN'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>You Gave ($ Udhaar)</span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('PAID')}
                className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  transactionType === 'PAID'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>You Received ($ Payment)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Amount ($) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {transactionType === 'GIVEN' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Due Date for Repayment (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Bill / Item Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2 bags of coffee beans, pastry box on credit"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-black text-sm transition shadow-lg disabled:opacity-50 ${
              transactionType === 'GIVEN'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {submitting 
              ? 'Saving Entry...' 
              : transactionType === 'GIVEN' 
              ? 'Confirm Credit Given' 
              : 'Confirm Payment Received'}
          </button>
        </form>
      </Modal>

      {/* Customer Passbook / Statement Modal */}
      <Modal
        isOpen={Boolean(selectedCustomerStatement)}
        onClose={() => setSelectedCustomerStatement(null)}
        title={`Khata Passbook: ${selectedCustomerStatement?.customer?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedCustomerStatement && (
          <div className="space-y-5">
            {/* Customer Net Balance Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-base">{selectedCustomerStatement.customer.name}</div>
                <div className="text-xs text-slate-400 font-mono">{selectedCustomerStatement.customer.phone}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Net Balance Due</div>
                  <div className={`text-xl font-black font-mono ${
                    parseFloat(selectedCustomerStatement.summary.netBalance) > 0 
                      ? 'text-rose-400' 
                      : 'text-emerald-400'
                  }`}>
                    ${selectedCustomerStatement.summary.netBalance}
                  </div>
                </div>

                {parseFloat(selectedCustomerStatement.summary.netBalance) > 0 && (
                  <button
                    onClick={() => handleSendWhatsAppReminder({
                      name: selectedCustomerStatement.customer.name,
                      phone: selectedCustomerStatement.customer.phone,
                      net_balance: selectedCustomerStatement.summary.netBalance
                    })}
                    className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                    title="Send WhatsApp payment reminder"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Reminder</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick add entry from statement modal */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCustomerId(String(selectedCustomerStatement.customer.id));
                  setTransactionType('GIVEN');
                  setIsAddModalOpen(true);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+ Give Credit</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCustomerId(String(selectedCustomerStatement.customer.id));
                  setTransactionType('PAID');
                  setIsAddModalOpen(true);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>+ Record Payment</span>
              </button>
            </div>

            {/* Transactions Statement List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {selectedCustomerStatement.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No ledger entries recorded for this customer yet.
                </div>
              ) : (
                selectedCustomerStatement.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        tx.transaction_type === 'GIVEN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tx.transaction_type === 'GIVEN' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {tx.transaction_type === 'GIVEN' ? 'Credit Given (Udhaar)' : 'Payment Received'}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {tx.notes || 'No description notes'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {new Date(tx.created_at).toLocaleString()}
                          {tx.due_date && ` • Due: ${tx.due_date}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-black text-sm font-mono ${
                        tx.transaction_type === 'GIVEN' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {tx.transaction_type === 'GIVEN' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <div className="mt-1">
                        {tx.status === 'SETTLED' ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Settled
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSettleEntry(tx.id)}
                            className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition"
                          >
                            Mark Settled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
