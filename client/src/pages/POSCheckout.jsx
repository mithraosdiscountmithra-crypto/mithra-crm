import React, { useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Phone, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Cake, 
  Heart, 
  Crown, 
  DollarSign, 
  Sparkles, 
  UserPlus, 
  Printer, 
  RotateCcw,
  Receipt,
  Check
} from 'lucide-react';

export default function POSCheckout() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');

  // Bill calculation state
  const [billAmount, setBillAmount] = useState('');
  const [overrideDiscount, setOverrideDiscount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Success receipt state
  const [receipt, setReceipt] = useState(null);

  // Quick Customer Register modal if customer not found
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [registering, setRegistering] = useState(false);

  // Handle phone verification
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number to search.');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSearchResult(null);
      setBillAmount('');
      setOverrideDiscount('');

      const res = await api.pos.verifyPhone(phoneNumber.trim());
      if (res.success) {
        if (!res.found) {
          setError(`No customer found with phone: ${phoneNumber}. You can register them below.`);
          setNewPhone(phoneNumber.trim());
        } else {
          setSearchResult(res);
        }
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Error looking up customer');
    } finally {
      setSearching(false);
    }
  };

  // Sample quick test phones
  const samplePhones = [
    { label: 'Gold Member (20%)', phone: '5551234567' },
    { label: 'Basic Member (10%)', phone: '5559876543' },
    { label: 'VIP Pass (25%)', phone: '5553456789' },
    { label: 'Non-Member', phone: '5554567890' }
  ];

  // Calculate numbers
  const originalBill = parseFloat(billAmount) || 0;
  const activePlanDiscount = searchResult?.membership?.discount_percent || 0;
  const effectiveDiscountPercent = overrideDiscount !== '' 
    ? parseFloat(overrideDiscount) || 0 
    : activePlanDiscount;

  const discountAmount = originalBill > 0 ? (originalBill * (effectiveDiscountPercent / 100)) : 0;
  const finalPayable = Math.max(0, originalBill - discountAmount);

  // Process redemption transaction
  const handleRedeem = async () => {
    if (!searchResult || !searchResult.customer) {
      setError('Please search and select a verified customer first.');
      return;
    }

    if (originalBill <= 0) {
      setError('Please enter a bill amount greater than $0.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const payload = {
        customer_id: searchResult.customer.id,
        bill_amount: originalBill,
        custom_discount_percent: overrideDiscount !== '' ? parseFloat(overrideDiscount) : undefined
      };

      const res = await api.pos.redeem(payload);
      if (res.success) {
        setReceipt(res.receipt);
      } else {
        setError(res.error || 'Failed to process redemption');
      }
    } catch (err) {
      setError(err.message || 'Error submitting redemption');
    } finally {
      setProcessing(false);
    }
  };

  // Quick Register Customer
  const handleQuickRegister = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      setRegistering(true);
      const res = await api.customers.create({
        name: newName,
        phone: newPhone
      });

      if (res.success) {
        setShowRegisterModal(false);
        setPhoneNumber(newPhone);
        setNewName('');
        setNewPhone('');
        // Re-verify immediately
        const verifyRes = await api.pos.verifyPhone(newPhone);
        if (verifyRes.success && verifyRes.found) {
          setSearchResult(verifyRes);
          setError('');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleResetForNextCustomer = () => {
    setReceipt(null);
    setPhoneNumber('');
    setSearchResult(null);
    setBillAmount('');
    setOverrideDiscount('');
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Cashier Terminal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">POS Member Verification & Instant Discount</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetForNextCustomer}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear / Next Order</span>
          </button>
        </div>
      </div>

      {/* Lookup Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Step 1: Enter Customer Phone Number
        </label>
        
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 5551234567 (or click demo pills below)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Verify Member</span>
          </button>
        </form>

        {/* Demo Fast Click Phones */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test:</span>
          {samplePhones.map((p) => (
            <button
              key={p.phone}
              type="button"
              onClick={() => {
                setPhoneNumber(p.phone);
                api.pos.verifyPhone(p.phone).then((res) => {
                  if (res.success && res.found) {
                    setSearchResult(res);
                    setError('');
                  }
                });
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {p.label}: <span className="font-mono text-sky-400 font-semibold">{p.phone}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            {error.includes('No customer found') && (
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition shrink-0 ml-3"
              >
                Register Customer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Status & Discount Calculator Section */}
      {searchResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Customer & Membership Verification Badge (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Status
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-black text-white">{searchResult.customer.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{searchResult.customer.phone}</p>
              </div>

              {/* Special Celebrations / Birthday Perks */}
              {(searchResult.customer.isBirthdayToday || searchResult.customer.isAnniversaryToday) && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  {searchResult.customer.isBirthdayToday && (
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Cake className="w-4 h-4 text-amber-400" />
                      <span>Birthday Today! Eligible for special merchant perk.</span>
                    </div>
                  )}
                  {searchResult.customer.isAnniversaryToday && (
                    <div className="flex items-center gap-2 font-bold text-rose-300">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span>Anniversary Celebration Today!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Membership Tier Card */}
              {searchResult.membership ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span className="font-extrabold text-white text-sm">
                        {searchResult.membership.plan_name}
                      </span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950">
                      {searchResult.membership.discount_percent}% OFF
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {searchResult.membership.benefits_description || 'Active member perks apply'}
                  </p>

                  <div className="text-[11px] text-indigo-300 font-medium">
                    Valid until: <span className="text-white font-bold">{searchResult.membership.expiry_date}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="text-sm font-semibold text-slate-300">No Active Membership Plan</div>
                  <p className="text-xs text-slate-500">
                    This customer is registered but has no current loyalty subscription.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* POS Bill Calculator & Redemption (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-3 border-b border-slate-800">
              Step 2: Enter Bill & Apply Instant Discount
            </span>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gross Bill Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Discount Percentage fine-tune / override */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Discount Percentage Applied
                  </label>
                  <span className="text-xs text-slate-400">
                    Default from tier: <span className="font-bold text-sky-400">{activePlanDiscount}%</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={overrideDiscount !== '' ? overrideDiscount : activePlanDiscount}
                    onChange={(e) => setOverrideDiscount(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm text-center"
                  />
                  <span className="text-sm font-bold text-slate-400">%</span>
                  {overrideDiscount !== '' && (
                    <button
                      type="button"
                      onClick={() => setOverrideDiscount('')}
                      className="text-xs text-slate-400 hover:text-white underline ml-2"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              </div>

              {/* Live POS Summary calculation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Original Bill:</span>
                  <span className="font-mono text-white font-medium">${originalBill.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-400 font-medium">
                  <span>Loyalty Discount ({effectiveDiscountPercent}%):</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Net Total to Collect:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ${finalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Fast 1-Click Redeem Button */}
              <button
                type="button"
                onClick={handleRedeem}
                disabled={processing || originalBill <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition disabled:opacity-50"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <Check className="w-5 h-5 stroke-[3]" />
                )}
                <span>Complete Checkout & Log Redemption</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      <Modal
        isOpen={Boolean(receipt)}
        onClose={handleResetForNextCustomer}
        title="Redemption Confirmed & Logged"
        maxWidth="max-w-md"
      >
        {receipt && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white">Transaction Successful!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Receipt #{receipt.redemption_id} • {new Date(receipt.redeemed_at).toLocaleTimeString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">{receipt.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-300">{receipt.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Membership Tier:</span>
                <span className="font-bold text-indigo-400">{receipt.plan_name}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <span className="text-slate-400">Original Total:</span>
                <span className="font-mono text-slate-300">${receipt.bill_amount}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Discount Saved ({receipt.discount_percent}%):</span>
                <span className="font-mono">-${receipt.discount_given}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-400 text-base">${receipt.net_payable}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={handleResetForNextCustomer}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition"
              >
                Next Customer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Customer Register Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Quick Customer Registration"
      >
        <form onSubmit={handleQuickRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. 5551234567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
          >
            {registering ? 'Registering...' : 'Register & Continue to POS'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
