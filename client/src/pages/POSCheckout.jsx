import React, { useState, useEffect, useRef } from 'react';
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
  Plus, 
  ArrowRight,
  ShieldCheck,
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
  const [customerName, setCustomerName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click VIP Enroll state
  const [enrollingVIP, setEnrollingVIP] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);

  // Create New Plan Modal state
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('199');
  const [newPlanDiscount, setNewPlanDiscount] = useState('20');
  const [newPlanMonths, setNewPlanMonths] = useState('12');
  const [newPlanBenefits, setNewPlanBenefits] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);

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

  const billInputRef = useRef(null);

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
        if (!selectedPlanId) setSelectedPlanId(res.plans[0].id);
        if (!passPlanId) setPassPlanId(res.plans[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch membership plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Create New Plan on the fly
  const handleCreatePlan = async (e) => {
    if (e) e.preventDefault();
    if (!newPlanName.trim()) {
      setError('Please provide a Plan Name.');
      return;
    }
    if (!newPlanDiscount) {
      setError('Please provide a Discount Percentage.');
      return;
    }

    try {
      setCreatingPlan(true);
      setError('');

      const res = await api.plans.create({
        plan_name: newPlanName.trim(),
        price: parseFloat(newPlanPrice) || 0,
        discount_percent: parseFloat(newPlanDiscount) || 10,
        validity_months: parseInt(newPlanMonths, 10) || 12,
        benefits_description: newPlanBenefits.trim() || `${newPlanDiscount}% VIP discount on all orders`
      });

      if (res.success && res.plan) {
        // Refresh plans
        const updatedPlansRes = await api.plans.getAll();
        if (updatedPlansRes.success) {
          setPlans(updatedPlansRes.plans);
          setSelectedPlanId(res.plan.id);
          setPassPlanId(res.plan.id);
        }
        setShowCreatePlanModal(false);
        setNewPlanName('');
        setNewPlanPrice('199');
        setNewPlanDiscount('20');
        setNewPlanMonths('12');
        setNewPlanBenefits('');
        setSuccessMsg(`🎉 Plan "${res.plan.plan_name}" (${res.plan.discount_percent}% OFF) created & selected!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  // Check / Verify if phone number already exists
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setError('Please enter a customer mobile number.');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSuccessMsg('');
      setSearchResult(null);
      setBillAmount('');
      setOverrideDiscount('');

      const res = await api.pos.verifyPhone(cleanPhone);
      if (res.success) {
        if (!res.found) {
          setError(`Mobile ${cleanPhone} is not yet a member. Select a VIP Plan below and click "⚡ Join VIP & Start Billing"!`);
        } else {
          setSearchResult(res);
          setCustomerName(res.customer.name || '');
          if (res.membership && res.membership.plan_id) {
            setSelectedPlanId(res.membership.plan_id);
          }
          // Focus bill amount
          setTimeout(() => {
            if (billInputRef.current) billInputRef.current.focus();
          }, 150);
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

  // 1-Click Quick VIP Enrollment: ANY Phone Number + Selected Plan -> Immediate VIP
  const handleQuickEnroll = async (phoneToUse, planIdToUse, nameToUse) => {
    const targetPhone = String(phoneToUse || phoneNumber).trim();
    const targetPlan = planIdToUse || selectedPlanId;

    if (!targetPhone) {
      setError('Please enter a customer mobile number.');
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
        name: nameToUse || customerName || 'VIP Customer',
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
        setCustomerName(res.customer.name || '');
        setSelectedPlanId(res.membership.plan_id);
        setShowUpgradePlans(false);

        // Auto-focus bill input for immediate cashier billing
        setTimeout(() => {
          if (billInputRef.current) billInputRef.current.focus();
        }, 150);
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
      setError('Please search or enroll a customer first.');
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
    setCustomerName('');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Cashier Terminal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">POS Member Verification & VIP Pass Sales</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ఏ నెంబర్ అయినా ఎంటర్ చేసి, ప్లాన్ సెలెక్ట్ చేసి Enter కొడితే వెంటనే VIP మెంబర్ అయిపోతారు!
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

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError('')}
            className="text-xs text-rose-400 hover:text-white font-bold px-2 py-1 rounded bg-rose-500/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: POS BILLING & 1-CLICK VIP ENROLLMENT */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* STEP 1: CUSTOMER PHONE + PLAN SELECTOR BAR */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-mono">1</span>
                <span>Enter Customer Mobile Number & Choose VIP Plan</span>
              </label>

              {/* + Create New Plan Button right in header */}
              <button
                type="button"
                onClick={() => setShowCreatePlanModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create New Plan (కొత్త ప్లాన్)</span>
              </button>
            </div>
            
            {/* Input Row: Phone Number & Optional Customer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (phoneNumber.trim()) {
                        handleQuickEnroll(phoneNumber, selectedPlanId, customerName);
                      }
                    }
                  }}
                  placeholder="Enter 10-digit Mobile Number (e.g. 9876543210)"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (phoneNumber.trim()) {
                        handleQuickEnroll(phoneNumber, selectedPlanId, customerName);
                      }
                    }
                  }}
                  placeholder="Customer Name (Optional)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* LIVE PLAN SELECTOR PILLS (ALWAYS VISIBLE RIGHT BELOW INPUT) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select VIP Membership Plan to Apply:</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {plans.length} Plans Available
                </span>
              </div>

              {/* Plan Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/25 via-slate-900 to-amber-950/30 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                          <span className="font-extrabold text-white text-xs truncate">{p.plan_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ₹{p.price || 0} • {p.validity_months || 12} mos
                        </div>
                      </div>

                      <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                        isSelected 
                          ? 'bg-amber-400 text-slate-950 shadow' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.discount_percent}% OFF
                      </span>
                    </button>
                  );
                })}

                {/* Inline Add New Plan Button inside Grid */}
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(true)}
                  className="p-3 rounded-2xl border border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-950 hover:bg-slate-900/40 text-slate-400 hover:text-amber-300 transition flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Create Another Plan</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS ROW */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* PRIMARY 1-CLICK JOIN & BILL BUTTON */}
              <button
                type="button"
                onClick={() => handleQuickEnroll(phoneNumber, selectedPlanId, customerName)}
                disabled={enrollingVIP || !phoneNumber.trim()}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition disabled:opacity-50"
              >
                {enrollingVIP ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <Zap className="w-4 h-4 fill-slate-950" />
                )}
                <span>⚡ Join VIP Member & Proceed to Bill (Enter ↵)</span>
              </button>

              {/* SECONDARY CHECK EXISTING STATUS BUTTON */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={searching || !phoneNumber.trim()}
                className="px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition disabled:opacity-50"
                title="Check if this number is already an existing customer or has birthday perks"
              >
                {searching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Check Existing Status</span>
              </button>
            </div>
          </div>

          {/* STEP 2: CUSTOMER STATUS CARD & POS BILL CALCULATOR */}
          {searchResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              {/* Customer & Membership Verification Badge (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customer Verified Profile
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active Member</span>
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

                  {/* Active Membership Badge */}
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
                          {showUpgradePlans ? 'Close' : 'Switch Plan'}
                        </button>
                      </div>

                      {/* Upgrade / Switch Plan Selector */}
                      {showUpgradePlans && plans.length > 0 && (
                        <div className="pt-2 border-t border-indigo-500/20 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300">Choose plan to switch:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {plans.map((p) => (
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
                    /* Customer has NO active membership -> Show Selectable Plans + BIG CONFIRM & SAVE BUTTON */
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-indigo-950/40 border-2 border-amber-500/50 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                        <div className="flex items-center gap-2 text-sm font-black text-amber-300">
                          <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                          <span>Sell VIP Membership Pass</span>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          Select Plan & Confirm
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-300">
                        కస్టమర్‌కు ఇవ్వాలనుకుంటున్న ప్లాన్ సెలెక్ట్ చేసి, కింద ఉన్న <strong>"Confirm & Save Plan"</strong> బటన్ కొట్టండి:
                      </p>

                      {/* Selectable Plans */}
                      <div className="space-y-2.5">
                        {plans.map((p) => {
                          const isSelected = selectedPlanId === p.id || plans.length === 1;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPlanId(p.id)}
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                                  : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-500'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <div className="font-black text-white text-sm">{p.plan_name}</div>
                                  <div className="text-xs text-slate-400">
                                    ₹{p.price || 0} • {p.validity_months || 12} months validity
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 shadow">
                                  {p.discount_percent}% OFF
                                </span>
                                {isSelected && (
                                  <div className="text-[10px] font-bold text-amber-300 mt-1">✓ Selected</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* THE BIG CONFIRM & SAVE BUTTON! */}
                      <button
                        type="button"
                        onClick={() => handleQuickEnroll(searchResult.customer.phone, selectedPlanId, searchResult.customer.name)}
                        disabled={enrollingVIP || !selectedPlanId}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition disabled:opacity-50"
                      >
                        {enrollingVIP ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
                        ) : (
                          <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                        )}
                        <span>✅ CONFIRM & SAVE VIP MEMBERSHIP (ఖరారు చేసి సేవ్ చేయండి)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* POS Bill Calculator & Redemption (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 block pb-3 border-b border-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-slate-950 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                  <span>Enter Bill Amount & Log Discount</span>
                </span>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Gross Bill Amount (₹) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        ref={billInputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && originalBill > 0) {
                            e.preventDefault();
                            handleRedeem();
                          }
                        }}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      <span>VIP Discount ({effectiveDiscountPercent}%):</span>
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
                    <span>Complete Checkout & Print Receipt (Enter ↵)</span>
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={() => setShowCreatePlanModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create New Plan</span>
            </button>
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
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                  <p>No membership plans found.</p>
                  <button
                    type="button"
                    onClick={() => setShowCreatePlanModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                  >
                    + Create First Plan
                  </button>
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

      {/* CREATE NEW PLAN MODAL */}
      <Modal
        isOpen={showCreatePlanModal}
        onClose={() => setShowCreatePlanModal(false)}
        title="✨ Create New Membership Plan (కొత్త VIP ప్లాన్)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Plan Name * (ఉదా: Gold VIP Pass, Weekend Saver)
            </label>
            <input
              type="text"
              required
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="e.g. Biryani VIP Pass"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Discount Percent (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={newPlanDiscount}
                  onChange={(e) => setNewPlanDiscount(e.target.value)}
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Pass Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  placeholder="199"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Validity in Months (చెల్లుబాటు కాలం)
            </label>
            <select
              value={newPlanMonths}
              onChange={(e) => setNewPlanMonths(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="1">1 Month (1 నెల)</option>
              <option value="3">3 Months (3 నెలలు)</option>
              <option value="6">6 Months (6 నెలలు)</option>
              <option value="12">12 Months (1 సంవత్సరం - Standard)</option>
              <option value="24">24 Months (2 సంవత్సరాలు)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Perks / Benefits Description
            </label>
            <input
              type="text"
              value={newPlanBenefits}
              onChange={(e) => setNewPlanBenefits(e.target.value)}
              placeholder="e.g. 20% discount on all orders + priority billing"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={creatingPlan || !newPlanName.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
          >
            {creatingPlan ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>✨ Save & Use Plan Now</span>
          </button>
        </form>
      </Modal>

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
                  setTimeout(() => {
                    if (billInputRef.current) billInputRef.current.focus();
                  }, 150);
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
