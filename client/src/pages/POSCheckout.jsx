import React, { useState, useEffect } from 'react';
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
  IndianRupee, 
  Sparkles, 
  UserPlus, 
  Printer, 
  RotateCcw,
  Receipt,
  Check,
  Zap,
  Tag,
  Share2,
  Calendar,
  CreditCard
} from 'lucide-react';

export default function POSCheckout() {
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'sell_pass'
  
  // Plans state
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Phone search & member state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click VIP Enroll Inline state
  const [enrollName, setEnrollName] = useState('');
  const [enrollingVIP, setEnrollingVIP] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);

  // Bill calculation state
  const [billAmount, setBillAmount] = useState('');
  const [overrideDiscount, setOverrideDiscount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Success receipt & VIP pass card modals
  const [receipt, setReceipt] = useState(null);
  const [newVIPCard, setNewVIPCard] = useState(null);

  // Dedicated VIP Pass Sales state
  const [passPhone, setPassPhone] = useState('');
  const [passName, setPassName] = useState('');
  const [passPlanId, setPassPlanId] = useState('');
  const [issuingPass, setIssuingPass] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await api.plans.getAll();
      if (res.success && res.plans && res.plans.length > 0) {
        setPlans(res.plans);
        setSelectedPlanId(res.plans[0].id);
        setPassPlanId(res.plans[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch membership plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

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
      setSuccessMsg('');
      setSearchResult(null);
      setBillAmount('');
      setOverrideDiscount('');

      const res = await api.pos.verifyPhone(phoneNumber.trim());
      if (res.success) {
        if (!res.found) {
          setError(`No customer found with phone: ${phoneNumber}. You can enroll them as a VIP member below with 1 click!`);
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

  // 1-Click Quick VIP Enrollment & Immediate Verification
  const handleQuickEnroll = async (phoneToUse, planIdToUse, nameToUse) => {
    const targetPhone = String(phoneToUse || phoneNumber).trim();
    const targetPlan = planIdToUse || selectedPlanId;

    if (!targetPhone) {
      setError('Please enter a phone number.');
      return;
    }
    if (!targetPlan) {
      setError('Please select a VIP Membership Plan.');
      return;
    }

    try {
      setEnrollingVIP(true);
      setError('');
      setSuccessMsg('');

      const res = await api.pos.quickEnrollVIP({
        phone: targetPhone,
        name: nameToUse || enrollName || 'VIP Customer',
        plan_id: targetPlan
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setSearchResult({
          success: true,
          found: true,
          customer: res.customer,
          membership: res.membership
        });
        setPhoneNumber(targetPhone);
        setEnrollName('');
        setShowUpgradePlans(false);
      } else {
        setError(res.error || 'Failed to enroll VIP member');
      }
    } catch (err) {
      setError(err.message || 'Error enrolling VIP member');
    } finally {
      setEnrollingVIP(false);
    }
  };

  // Dedicated VIP Pass Sales Submission
  const handleIssueVIPPass = async (e) => {
    if (e) e.preventDefault();
    if (!passPhone.trim()) {
      setError('Please enter customer phone number.');
      return;
    }
    if (!passPlanId) {
      setError('Please select a VIP Membership Plan.');
      return;
    }

    try {
      setIssuingPass(true);
      setError('');
      const res = await api.pos.quickEnrollVIP({
        phone: passPhone.trim(),
        name: passName.trim() || 'VIP Member',
        plan_id: passPlanId
      });

      if (res.success) {
        setNewVIPCard({
          customer: res.customer,
          membership: res.membership
        });
        setPassPhone('');
        setPassName('');
      } else {
        setError(res.error || 'Failed to issue VIP pass');
      }
    } catch (err) {
      setError(err.message || 'Error issuing VIP pass');
    } finally {
      setIssuingPass(false);
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
      setError('Please enter a bill amount greater than ₹0.');
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

  const handleResetForNextCustomer = () => {
    setReceipt(null);
    setNewVIPCard(null);
    setPhoneNumber('');
    setSearchResult(null);
    setBillAmount('');
    setOverrideDiscount('');
    setError('');
    setSuccessMsg('');
    setShowUpgradePlans(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Cashier Terminal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">POS Billing & VIP Pass Activation</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            1-Click VIP Enrollment: Number enter chesi plan select chesthe ventane VIP Member avtharu!
          </p>
        </div>

        {/* Tab Switcher & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('billing'); setError(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'billing'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS Billing</span>
            </button>
            <button
              onClick={() => { setActiveTab('sell_pass'); setError(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'sell_pass'
                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>⚡ Sell VIP Pass</span>
            </button>
          </div>

          <button
            onClick={handleResetForNextCustomer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg('')}
            className="text-xs text-emerald-400 hover:text-white font-bold px-2 py-1 rounded bg-emerald-500/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: POS BILLING & LOOKUP */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Lookup & Fast Enroll Bar */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Step 1: Enter Customer Phone Number
              </label>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fast Member Verification & 1-Click VIP Join</span>
              </span>
            </div>
            
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210 (or click demo pills below)"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={searching || !phoneNumber.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {searching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Verify</span>
                </button>

                {plans.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuickEnroll(phoneNumber, selectedPlanId, enrollName)}
                    disabled={enrollingVIP || !phoneNumber.trim()}
                    className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
                    title="Directly enroll this phone number as VIP without verifying first"
                  >
                    {enrollingVIP ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                    ) : (
                      <Zap className="w-4 h-4 fill-slate-950" />
                    )}
                    <span>⚡ Join VIP</span>
                  </button>
                )}
              </div>
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

            {/* ERROR OR NEW CUSTOMER INLINE ENROLLMENT BOX */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>

                {/* 1-Click Fast VIP Join Box when customer is not found */}
                {error.includes('No customer found') && plans.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-slate-200 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>⚡ 1-Click VIP Member Join (వెంటనే VIP ప్లాన్ సెలెక్ట్ చేయండి):</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {phoneNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Customer Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={enrollName}
                          onChange={(e) => setEnrollName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Select Membership Plan:
                        </label>
                        <select
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.plan_name} ({p.discount_percent}% OFF) - ₹{p.price || 0}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fast Plan Selector Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {plans.map((p) => {
                        const isSelected = selectedPlanId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPlanId(p.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/30'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span>{p.plan_name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isSelected ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {p.discount_percent}% OFF
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickEnroll(phoneNumber, selectedPlanId, enrollName)}
                      disabled={enrollingVIP || !selectedPlanId}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
                    >
                      {enrollingVIP ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                      ) : (
                        <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                      )}
                      <span>✨ Join as VIP Member & Start Billing (Enter ↵)</span>
                    </button>
                  </div>
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

                  {/* Membership Tier Card or 1-Click Sell Plan */}
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

                      <div className="flex items-center justify-between text-[11px] text-indigo-300 font-medium pt-1 border-t border-indigo-500/20">
                        <span>Valid until: <strong className="text-white">{searchResult.membership.expiry_date}</strong></span>
                        <button
                          type="button"
                          onClick={() => setShowUpgradePlans(!showUpgradePlans)}
                          className="text-amber-400 hover:text-amber-300 font-bold underline"
                        >
                          {showUpgradePlans ? 'Hide' : 'Upgrade Plan'}
                        </button>
                      </div>

                      {/* Upgrade Plan Selector */}
                      {showUpgradePlans && plans.length > 0 && (
                        <div className="pt-2 border-t border-indigo-500/20 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300">Switch to another tier:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {plans.filter(p => p.id !== searchResult.membership.plan_id).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleQuickEnroll(searchResult.customer.phone, p.id, searchResult.customer.name)}
                                disabled={enrollingVIP}
                                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-left text-xs text-white flex items-center justify-between transition"
                              >
                                <span className="font-bold truncate">{p.plan_name}</span>
                                <span className="text-[10px] font-bold text-emerald-400 font-mono">{p.discount_percent}%</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Customer has NO active membership -> Show 1-Click VIP Pass Seller */
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-indigo-950/30 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>Sell VIP Membership Pass</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          1-Click Join
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-300">
                        This customer doesn't have an active VIP membership. Select a plan to enroll them instantly:
                      </p>

                      <div className="space-y-2">
                        {plans.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleQuickEnroll(searchResult.customer.phone, p.id, searchResult.customer.name)}
                            disabled={enrollingVIP}
                            className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-left transition flex items-center justify-between group"
                          >
                            <div>
                              <div className="font-bold text-white text-xs group-hover:text-amber-300">
                                {p.plan_name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ₹{p.price || 0} • {p.validity_months || 12} months validity
                              </div>
                            </div>
                            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 shadow">
                              {p.discount_percent}% OFF
                            </span>
                          </button>
                        ))}
                      </div>
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
                      Gross Bill Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
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
                        Tier default: <span className="font-bold text-sky-400">{activePlanDiscount}%</span>
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
                      <span className="font-mono text-white font-medium">₹{originalBill.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-400 font-medium">
                      <span>Loyalty Discount ({effectiveDiscountPercent}%):</span>
                      <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-base font-bold text-white">Net Total to Collect:</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ₹{finalPayable.toFixed(2)}
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
        </div>
      )}

      {/* TAB 2: DEDICATED SELL VIP MEMBERSHIP PASS */}
      {activeTab === 'sell_pass' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Sell & Activate VIP Membership Pass</h2>
              <p className="text-xs text-slate-400">
                Enter customer number, choose membership tier, and hit Enter to issue their active VIP Pass.
              </p>
            </div>
          </div>

          <form onSubmit={handleIssueVIPPass} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Customer Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={passPhone}
                    onChange={(e) => setPassPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={passName}
                  onChange={(e) => setPassName(e.target.value)}
                  placeholder="e.g. Suresh Reddy"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Plan Cards Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Choose VIP Tier / Membership Plan:
              </label>

              {plans.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  No membership plans found. Please create plans in the Plans management section first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((p) => {
                    const isSelected = passPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPassPlanId(p.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-950/20 border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-white text-sm">{p.plan_name}</span>
                            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950">
                              {p.discount_percent}% OFF
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {p.benefits_description || 'Unlimited store discounts on all orders'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-3">
                          <span className="text-lg font-black text-amber-400 font-mono">
                            ₹{p.price || 0}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {p.validity_months || 12} Months
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Issue Pass Button */}
            <button
              type="submit"
              disabled={issuingPass || !passPhone.trim() || !passPlanId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition disabled:opacity-50"
            >
              {issuingPass ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <Crown className="w-5 h-5 fill-slate-950" />
              )}
              <span>👑 Issue VIP Membership Pass (Enter ↵)</span>
            </button>
          </form>
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
                <span className="font-mono text-slate-300">₹{receipt.bill_amount}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Discount Saved ({receipt.discount_percent}%):</span>
                <span className="font-mono">-₹{receipt.discount_given}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-400 text-base">₹{receipt.net_payable}</span>
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

      {/* NEW VIP PASS CARD MODAL */}
      <Modal
        isOpen={Boolean(newVIPCard)}
        onClose={() => setNewVIPCard(null)}
        title="🎉 VIP Membership Pass Issued!"
        maxWidth="max-w-md"
      >
        {newVIPCard && (
          <div className="space-y-5 text-center">
            {/* VIP Card Preview */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-950 text-white shadow-2xl text-left relative overflow-hidden border border-amber-400/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span className="font-black text-sm tracking-wide uppercase">MITHRA PLUS VIP</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white text-slate-950">
                  {newVIPCard.membership.discount_percent}% OFF
                </span>
              </div>

              <div className="my-5">
                <div className="text-xl font-black">{newVIPCard.customer.name}</div>
                <div className="font-mono text-xs opacity-90">{newVIPCard.customer.phone}</div>
              </div>

              <div className="flex items-end justify-between pt-3 border-t border-white/20 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-75">Plan Tier</div>
                  <div className="font-extrabold">{newVIPCard.membership.plan_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider opacity-75">Valid Until</div>
                  <div className="font-extrabold">{newVIPCard.membership.expiry_date}</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Membership is active immediately! The customer will now automatically receive discounts on all counter bills and QR storefront orders.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const msg = encodeURIComponent(
                    `🎉 Congratulations ${newVIPCard.customer.name}! You are now a VIP Member (${newVIPCard.membership.plan_name}) with ${newVIPCard.membership.discount_percent}% discount on all your orders valid till ${newVIPCard.membership.expiry_date}. Thank you for joining us!`
                  );
                  window.open(`https://wa.me/91${newVIPCard.customer.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  setNewVIPCard(null);
                  setActiveTab('billing');
                  setPhoneNumber(newVIPCard.customer.phone);
                  setSearchResult({
                    success: true,
                    found: true,
                    customer: newVIPCard.customer,
                    membership: newVIPCard.membership
                  });
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition"
              >
                Start Billing Now ➔
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
