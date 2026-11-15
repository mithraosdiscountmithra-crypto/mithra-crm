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
  Wallet,
  PhoneCall,
  PhoneOutgoing,
  Bot,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Headphones,
  ListFilter
} from 'lucide-react';

export default function DigitalKhata() {
  const { merchant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Page Sub-Tab: 'ledger' or 'voice-callbacks'
  const [activeSubTab, setActiveSubTab] = useState('ledger');

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

  // AI Voice Agent Caller Modal State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceDebtor, setVoiceDebtor] = useState(null);
  const [voiceCallSession, setVoiceCallSession] = useState(null);
  const [voiceCustomSpeech, setVoiceCustomSpeech] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceActionResult, setVoiceActionResult] = useState(null);

  // Scheduled Callbacks & Call Logs Data State
  const [scheduledCallbacks, setScheduledCallbacks] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsSummary, setCallLogsSummary] = useState(null);
  const [loadingVoiceData, setLoadingVoiceData] = useState(false);

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

  const fetchVoiceData = async () => {
    try {
      setLoadingVoiceData(true);
      const [cbRes, logRes] = await Promise.all([
        api.voice.getScheduledCallbacks(),
        api.voice.getCallLogs()
      ]);
      if (cbRes.success) {
        setScheduledCallbacks(cbRes.callbacks || []);
      }
      if (logRes.success) {
        setCallLogs(logRes.logs || []);
        setCallLogsSummary(logRes.summary || null);
      }
    } catch (err) {
      console.error('Failed to load voice callbacks or call logs:', err);
    } finally {
      setLoadingVoiceData(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchVoiceData();
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

  // Trigger Outbound AI Voice Call
  const handleTriggerAICall = async (customer) => {
    try {
      setVoiceDebtor(customer);
      setVoiceActionResult(null);
      setVoiceCustomSpeech('');
      setVoiceModalOpen(true);
      setVoiceProcessing(true);

      const res = await api.voice.triggerCall(customer.customer_id || customer.id);
      if (res.success) {
        setVoiceCallSession(res);
      } else {
        setError(res.error || 'Failed to initiate AI Voice Call');
      }
    } catch (err) {
      setError(err.message || 'Failed to trigger AI Voice call');
    } finally {
      setVoiceProcessing(false);
    }
  };

  // Simulate Telephony Webhook for Voice Speech Intents
  const handleSimulateVoiceResponse = async ({ speechText, intent, promisedDate, callbackDate }) => {
    if (!voiceDebtor || !voiceCallSession) return;
    try {
      setVoiceProcessing(true);
      setError('');

      const payload = {
        merchant_id: merchant?.id,
        customer_id: voiceDebtor.customer_id || voiceDebtor.id,
        call_sid: voiceCallSession.call_sid,
        speech_input: speechText || '',
        transcript: speechText || '',
        intent: intent || undefined,
        promised_date: promisedDate || undefined,
        callback_date: callbackDate || undefined
      };

      const res = await api.voice.sendWebhookResponse(payload);
      if (res.success) {
        setVoiceActionResult(res);
        setSuccess(`Voice Agent Action executed: ${res.intent}`);
        // Refresh ledgers and voice queues
        fetchSummary();
        fetchVoiceData();
      }
    } catch (err) {
      setError(err.message || 'Failed to process voice webhook response');
    } finally {
      setVoiceProcessing(false);
    }
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Digital Khata Ledger</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              WhatsApp Integrated
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              <Bot className="w-3 h-3 text-violet-400" />
              AI Voice Agent & UPI Link Dispatch
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Customer Credit, Udhaar & AI Voice Debt Collection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Automate debtor collections with AI telephony calls, scheduled callbacks, passbook statements, and automated WhatsApp UPI payment links.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchSummary();
              fetchVoiceData();
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Ledger and Voice Queues"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-rose-300">
            <span>Market Outstanding</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-400 mt-2">${summary.totalOutstanding}</div>
          <div className="text-xs text-rose-300/80 mt-1">Pending collection from customers</div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-emerald-300">
            <span>Total Collected</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-400 mt-2">${summary.totalCollected}</div>
          <div className="text-xs text-emerald-300/80 mt-1">Recovered credit payments</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Active Debtors</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white mt-2">{summary.pendingCustomersCount}</div>
          <div className="text-xs text-slate-500 mt-1">Customers with pending balance</div>
        </div>

        <div className="p-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-violet-300">
            <span>Scheduled Callbacks</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-violet-400 mt-2">{scheduledCallbacks.length}</div>
          <div className="text-xs text-violet-300/80 mt-1">Debtors in follow-up queue</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>AI Calls Logged</span>
            <Headphones className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-sky-400 mt-2">{callLogs.length}</div>
          <div className="text-xs text-slate-500 mt-1">Completed voice calls</div>
        </div>
      </div>

      {/* Main Page Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'ledger'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Customer Accounts & Khata ({filteredCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('voice-callbacks')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
            activeSubTab === 'voice-callbacks'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bot className="w-4 h-4 text-violet-300" />
          <span>Scheduled Callbacks & Voice Logs ({scheduledCallbacks.length})</span>
          {scheduledCallbacks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              {scheduledCallbacks.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: LEDGER ACCOUNTS */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search debtors by name or phone..."
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
                    <th className="px-6 py-4">Voice & Callback Status</th>
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

                          {/* Voice & Callback Status Badges */}
                          <td className="px-6 py-4 text-xs">
                            <div className="space-y-1">
                              {c.call_status === 'PROMISED_TO_PAY' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  <Calendar className="w-3 h-3 text-indigo-400" />
                                  <span>Promise to Pay {c.due_date ? `(${c.due_date})` : ''}</span>
                                </span>
                              )}

                              {c.call_status === 'CALLBACK_SCHEDULED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Callback Scheduled</span>
                                </span>
                              )}

                              {c.payment_link_sent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>UPI Link Sent</span>
                                </span>
                              )}

                              {c.call_status === 'DISPUTED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                                  <span>Disputed</span>
                                </span>
                              )}

                              {(!c.call_status || c.call_status === 'NOT_CALLED') && !c.payment_link_sent && (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Trigger AI Voice Call Button */}
                              {hasDue && (
                                <button
                                  onClick={() => handleTriggerAICall(c)}
                                  className="px-2.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                                  title="Trigger AI Voice Agent Call"
                                >
                                  <PhoneCall className="w-3.5 h-3.5 text-violet-400" />
                                  <span>AI Call</span>
                                </button>
                              )}

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
        </div>
      )}

      {/* SUB-TAB 2: SCHEDULED CALLBACKS & VOICE ACTIVITY LOGS */}
      {activeSubTab === 'voice-callbacks' && (
        <div className="space-y-6">
          {/* Section 1: Scheduled Callbacks Queue */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>Upcoming Debtor Callback Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {scheduledCallbacks.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Debtors who requested follow-up calls during automated voice agent conversations.
                </p>
              </div>

              <button
                onClick={fetchVoiceData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {scheduledCallbacks.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No callbacks currently scheduled. The AI Voice Agent will automatically schedule callbacks when debtors are busy.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scheduledCallbacks.map((cb) => (
                  <div
                    key={cb.id}
                    className="p-4 rounded-xl bg-slate-950 border border-violet-500/20 hover:border-violet-500/40 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{cb.customer_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{cb.customer_phone}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {cb.intent || 'CALLBACK'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Scheduled: {new Date(cb.callback_scheduled_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic line-clamp-2">
                        "{cb.summary || cb.transcript || 'Debtor requested callback'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleTriggerAICall({ customer_id: cb.customer_id, name: cb.customer_name, phone: cb.customer_phone })}
                        className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppReminder({ name: cb.customer_name, phone: cb.customer_phone, net_balance: 'pending' })}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition"
                        title="Send WhatsApp Message"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: AI Voice Agent Call Transcripts & History */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-sky-400" />
                  <span>AI Voice Agent Call Logs & Intent Analytics</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete call records, intent parsing results, and automated UPI link dispatches.
                </p>
              </div>

              {callLogsSummary && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    Total: <strong className="text-white">{callLogsSummary.totalCalls}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    Promises: <strong>{callLogsSummary.promisedToPayCount}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    Callbacks: <strong>{callLogsSummary.callbacksScheduledCount}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    UPI Dispatches: <strong>{callLogsSummary.paymentLinksSentCount}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Call SID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Parsed Intent</th>
                      <th className="px-4 py-3">Transcript / Summary</th>
                      <th className="px-4 py-3">Action Dispatched</th>
                      <th className="px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {callLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500">
                          No AI voice calls logged yet. Click "AI Call" next to any debtor in the ledger to initiate a call.
                        </td>
                      </tr>
                    ) : (
                      callLogs.map((log) => {
                        let intentBadgeColor = 'bg-slate-800 text-slate-300';
                        if (log.intent === 'REQUEST_PAYMENT_LINK') intentBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                        else if (log.intent === 'PROMISE_TO_PAY') intentBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                        else if (log.intent === 'REQUEST_CALLBACK') intentBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                        else if (log.intent === 'DISPUTE') intentBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition">
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {log.call_sid}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{log.customer_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{log.customer_phone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${intentBadgeColor}`}>
                                {log.intent}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <div className="text-slate-300 truncate" title={log.summary || log.transcript}>
                                {log.summary || log.transcript || '—'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {log.payment_link_sent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp UPI Sent</span>
                                </span>
                              ) : log.promised_date ? (
                                <span className="text-indigo-300 text-[11px] font-mono">
                                  Due: {log.promised_date}
                                </span>
                              ) : log.callback_scheduled_at ? (
                                <span className="text-amber-300 text-[11px] font-mono">
                                  Callback: {new Date(log.callback_scheduled_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Record Khata Entry (Given / Paid) */}
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

      {/* MODAL 2: Customer Passbook / Statement Modal */}
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

      {/* MODAL 3: AI Voice Agent Debtor Caller & Telephony Simulator */}
      <Modal
        isOpen={voiceModalOpen}
        onClose={() => {
          setVoiceModalOpen(false);
          setVoiceDebtor(null);
          setVoiceCallSession(null);
          setVoiceActionResult(null);
        }}
        title="AI Voice Agent - Outbound Debtor Call Simulator"
        maxWidth="max-w-2xl"
      >
        {voiceDebtor && (
          <div className="space-y-5">
            {/* Call Status Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
                    <PhoneOutgoing className="w-5 h-5 text-violet-400 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-sm">{voiceDebtor.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{voiceDebtor.phone}</span>
                  </div>
                  <div className="text-[11px] text-violet-300 font-medium">
                    Call Active • Session SID: <span className="font-mono">{voiceCallSession?.call_sid || 'INITIALIZING...'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Ledger Balance</div>
                <div className="text-lg font-black font-mono text-rose-400">
                  ${voiceDebtor.net_balance || voiceCallSession?.customer?.outstanding_balance || '0.00'}
                </div>
              </div>
            </div>

            {/* AI Agent Greeting Script */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wide">
                <Bot className="w-3.5 h-3.5" />
                <span>AI Voice Agent Greeting Prompt</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                "{voiceCallSession?.agent_script || `Hello ${voiceDebtor.name}! This is the AI assistant calling from ${merchant?.store_name || 'Our Store'}. We are checking in regarding your outstanding ledger balance. Would you like us to schedule a payment date, or dispatch an instant UPI payment link to your WhatsApp?`}"
              </p>
            </div>

            {/* Live Webhook Actions / Result Display */}
            {voiceActionResult && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                    <CheckCircle className="w-4 h-4" />
                    <span>Parsed Speech Intent: {voiceActionResult.intent}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Webhook Executed
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {voiceActionResult.log?.summary || voiceActionResult.message}
                </p>

                {/* WhatsApp UPI Payment Link Action */}
                {voiceActionResult.actions?.payment_link_sent && voiceActionResult.actions?.whatsapp_link && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                    <div className="text-[11px] text-emerald-300 font-mono break-all bg-slate-950 p-2.5 rounded-lg border border-emerald-500/20">
                      <strong>UPI Link:</strong> {voiceActionResult.actions.payment_link_url}
                    </div>

                    <a
                      href={voiceActionResult.actions.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Open WhatsApp to Send Payment Link Instantly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Promise to Pay Date */}
                {voiceActionResult.actions?.promised_date && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Customer promised payment on: <strong>{voiceActionResult.actions.promised_date}</strong>. Updated in Ledger!</span>
                  </div>
                )}

                {/* Scheduled Callback Time */}
                {voiceActionResult.actions?.callback_scheduled_at && (
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Callback enqueued for: <strong>{new Date(voiceActionResult.actions.callback_scheduled_at).toLocaleString()}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Telephony Speech Simulator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Simulate Debtor Voice Response (Telephony Webhook):</span>
                </label>
                <span className="text-[10px] text-slate-500">Heuristic NLP Parser</span>
              </div>

              {/* Quick Preset Speech Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={voiceProcessing}
                  onClick={() => handleSimulateVoiceResponse({
                    speechText: 'Can you please text me a UPI payment link on WhatsApp to pay right now?',
                    intent: 'REQUEST_PAYMENT_LINK'
                  })}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left transition group disabled:opacity-50"
                >
                  <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Request UPI Link via WhatsApp</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 italic group-hover:text-slate-300">
                    "Send me the UPI link on WhatsApp"
                  </div>
                </button>

                <button
                  type="button"
                  disabled={voiceProcessing}
                  onClick={() => {
                    const fri = new Date();
                    fri.setDate(fri.getDate() + ((7 - fri.getDay() + 5) % 7 || 7));
                    const friStr = fri.toISOString().split('T')[0];
                    handleSimulateVoiceResponse({
                      speechText: 'I will be at the shop this Friday to pay the full amount.',
                      intent: 'PROMISE_TO_PAY',
                      promisedDate: friStr
                    });
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-left transition group disabled:opacity-50"
                >
                  <div className="text-xs font-extrabold text-indigo-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Promise to Pay (This Friday)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 italic group-hover:text-slate-300">
                    "I will pay the full bill this Friday"
                  </div>
                </button>

                <button
                  type="button"
                  disabled={voiceProcessing}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(10, 0, 0, 0);
                    handleSimulateVoiceResponse({
                      speechText: 'I am driving right now in a rush, please call me back tomorrow at 10 AM.',
                      intent: 'REQUEST_CALLBACK',
                      callbackDate: tomorrow.toISOString()
                    });
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition group disabled:opacity-50"
                >
                  <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Callback (Tomorrow 10 AM)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 italic group-hover:text-slate-300">
                    "I am driving, call me back tomorrow"
                  </div>
                </button>

                <button
                  type="button"
                  disabled={voiceProcessing}
                  onClick={() => handleSimulateVoiceResponse({
                    speechText: 'I already paid this balance last week, this bill is incorrect.',
                    intent: 'DISPUTE'
                  })}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-left transition group disabled:opacity-50"
                >
                  <div className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Dispute / Balance Contested</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 italic group-hover:text-slate-300">
                    "I already cleared this bill last week"
                  </div>
                </button>
              </div>

              {/* Custom Speech Input */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Or test custom debtor speech input:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voiceCustomSpeech}
                    onChange={(e) => setVoiceCustomSpeech(e.target.value)}
                    placeholder="e.g. Can you WhatsApp me the QR code link to pay via GPay?"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    disabled={voiceProcessing || !voiceCustomSpeech.trim()}
                    onClick={() => handleSimulateVoiceResponse({ speechText: voiceCustomSpeech })}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs transition shrink-0"
                  >
                    {voiceProcessing ? 'Processing...' : 'Send Voice Input'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer close */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setVoiceModalOpen(false);
                  setVoiceDebtor(null);
                  setVoiceCallSession(null);
                  setVoiceActionResult(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Close & Return to Ledger
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}