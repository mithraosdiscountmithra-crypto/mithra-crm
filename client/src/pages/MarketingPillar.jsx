import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Megaphone,
  Ticket,
  CalendarHeart,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Gift,
  RotateCcw,
  Percent,
  Check
} from 'lucide-react';

export default function MarketingPillar() {
  const { merchant } = useAuth();
  const [activeTab, setActiveTab] = useState('aisensy'); // 'aisensy', 'coupons', 'greetings'

  // AiSensy Campaign Form
  const [campaignName, setCampaignName] = useState('');
  const [templateName, setTemplateName] = useState('festival_weekend_special');
  const [targetSegment, setTargetSegment] = useState('ALL');
  const [campaignMessage, setCampaignMessage] = useState('Hello {customer_name}, enjoy exclusive weekend offers at {store_name}! Use coupon {coupon_code}.');
  const [selectedCouponCode, setSelectedCouponCode] = useState('FESTIVE50');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('PERCENT');
  const [newDiscountValue, setNewDiscountValue] = useState(15);
  const [newMinSpend, setNewMinSpend] = useState(250);
  const [newIsScratchCard, setNewIsScratchCard] = useState(true);
  const [newRevealedPerk, setNewRevealedPerk] = useState('Free Artisanal Dessert');
  const [newUsageLimit, setNewUsageLimit] = useState(100);

  // Interactive Scratch Card Simulator State
  const [scratchedCards, setScratchedCards] = useState({});

  // Greetings State
  const [greetings, setGreetings] = useState([]);
  const [loadingGreetings, setLoadingGreetings] = useState(false);
  const [triggeringGreetingId, setTriggeringGreetingId] = useState(null);

  // Fetch data
  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await api.marketing.getCoupons();
      if (res.success) {
        setCoupons(res.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchGreetings = async () => {
    try {
      setLoadingGreetings(true);
      const res = await api.marketing.getGreetings();
      if (res.success) {
        setGreetings(res.greetings || []);
      }
    } catch (err) {
      console.error('Error fetching greetings:', err);
    } finally {
      setLoadingGreetings(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchGreetings();
  }, []);

  // Handlers
  const handleDispatchAiSensy = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      alert('Please enter a campaign title.');
      return;
    }
    try {
      setIsDispatching(true);
      setDispatchResult(null);
      const res = await api.marketing.triggerAiSensy({
        campaign_name: campaignName.trim(),
        template_name: templateName,
        target_segment: targetSegment,
        message_text: campaignMessage,
        coupon_code: selectedCouponCode
      });
      if (res.success) {
        setDispatchResult(res);
        setCampaignName('');
      } else {
        alert(res.error || 'Failed to dispatch AiSensy campaign');
      }
    } catch (err) {
      console.error('Campaign error:', err);
      alert(err.message || 'Error dispatching campaign');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponTitle.trim()) {
      alert('Coupon code and title are required');
      return;
    }
    try {
      const res = await api.marketing.createCoupon({
        code: newCouponCode.trim(),
        title: newCouponTitle.trim(),
        discount_type: newDiscountType,
        discount_value: parseFloat(newDiscountValue),
        min_spend: parseFloat(newMinSpend),
        is_scratch_card: newIsScratchCard,
        revealed_perk: newIsScratchCard ? newRevealedPerk.trim() : null,
        usage_limit: parseInt(newUsageLimit, 10)
      });
      if (res.success) {
        setShowCreateCouponModal(false);
        setNewCouponCode('');
        setNewCouponTitle('');
        fetchCoupons();
      } else {
        alert(res.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error('Create coupon error:', err);
      alert(err.message || 'Error creating coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to deactivate and remove this coupon?')) return;
    try {
      const res = await api.marketing.deleteCoupon(id);
      if (res.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  const handleTriggerGreeting = async (id) => {
    try {
      setTriggeringGreetingId(id);
      const res = await api.marketing.triggerGreeting(id);
      if (res.success) {
        setGreetings(prev => prev.map(g => g.id === id ? { ...g, status: 'SENT' } : g));
        if (res.whatsapp_link) {
          window.open(res.whatsapp_link, '_blank');
        }
      }
    } catch (err) {
      console.error('Trigger greeting error:', err);
      alert(err.message || 'Failed to trigger greeting');
    } finally {
      setTriggeringGreetingId(null);
    }
  };

  const toggleScratch = (couponId) => {
    setScratchedCards(prev => ({
      ...prev,
      [couponId]: !prev[couponId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span>Pillar 1: Marketing & Growth Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            WhatsApp AiSensy & Digital Scratch Cards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated WhatsApp campaigns via AiSensy, interactive gamified scratch card rewards, and scheduled birthday greetings.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('aisensy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'aisensy' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>AiSensy Broadcast</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'coupons' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Scratch Cards ({coupons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('greetings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'greetings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarHeart className="w-3.5 h-3.5" />
            <span>Greetings Queue</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: AISENSY WHATSAPP CAMPAIGN BROADCAST */}
      {/* ========================================================================= */}
      {activeTab === 'aisensy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">AiSensy WhatsApp Business API Trigger</h3>
                  <p className="text-[11px] text-slate-400">Official Meta verified WhatsApp broadcast with rich templates</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                AiSensy Connected
              </span>
            </div>

            <form onSubmit={handleDispatchAiSensy} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Mega Roast Sale 2026"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Target Customer Segment</label>
                  <select
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Registered Customers</option>
                    <option value="VIP">Mithra Plus VIP Members Only</option>
                    <option value="NEW_CUSTOMERS">New Signups (Last 30 Days)</option>
                    <option value="UDHAAR_USERS">Khata Ledger Patrons</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Attach Promo Coupon / Scratch Card</label>
                  <select
                    value={selectedCouponCode}
                    onChange={(e) => setSelectedCouponCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {coupons.map(c => (
                      <option key={c.id} value={c.code}>{c.code} ({c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `₹${c.discount_value}`} OFF)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Personalized Message Body</label>
                <textarea
                  rows={3}
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tags supported: <code>{'{customer_name}'}</code>, <code>{'{store_name}'}</code>, <code>{'{coupon_code}'}</code>
                </span>
              </div>

              <button
                type="submit"
                disabled={isDispatching}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDispatching ? (
                  <span>Dispatching to AiSensy Gateway...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Launch Broadcast via AiSensy</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Dispatch Success or Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            {dispatchResult ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AiSensy Broadcast Dispatched!</span>
                </div>
                <h4 className="text-base font-black text-white">{dispatchResult.message}</h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="text-slate-400">Provider: <span className="text-emerald-400 font-bold">{dispatchResult.provider}</span></div>
                  <div className="text-slate-400">Total Recipients: <span className="text-white font-bold">{dispatchResult.dispatch_summary?.total_recipients}</span></div>
                  <div className="text-slate-400">Delivery Status: <span className="text-emerald-400 font-bold">200 OK (SENT_TO_GATEWAY)</span></div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AiSensy Integration Highlights</h4>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Meta Verified WhatsApp Business API integration without per-message third-party markups.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>High delivery rate with 98% open rates compared to email/SMS marketing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Automatic variable tag population with customer first name and exclusive coupon code.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DIGITAL SCRATCH CARDS & COUPONS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Active Promotional Coupons & Scratch Cards</h3>
              <p className="text-xs text-slate-400">Gamified digital scratch cards encourage repeat visits and boost average order value.</p>
            </div>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon / Scratch Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const isScratched = scratchedCards[coupon.id];
              return (
                <div
                  key={coupon.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all relative overflow-hidden group shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {coupon.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {coupon.used_count || 0} / {coupon.usage_limit || 100} Used
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white">{coupon.title}</h4>
                    <p className="text-xs font-bold text-emerald-400 mt-1">
                      {coupon.discount_type === 'PERCENT' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} FLAT OFF`}
                      {coupon.min_spend > 0 && <span className="text-slate-400 font-normal"> (Min spend: ₹{coupon.min_spend})</span>}
                    </p>
                  </div>

                  {/* Gamified Scratch Card Simulation Widget */}
                  {coupon.is_scratch_card && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>Interactive Scratch Card Preview</span>
                      </div>

                      <div
                        onClick={() => toggleScratch(coupon.id)}
                        className={`cursor-pointer p-3 rounded-xl border text-center transition-all select-none ${
                          isScratched
                            ? 'bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border-amber-400/40 text-amber-300'
                            : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-400'
                        }`}
                      >
                        {isScratched ? (
                          <div className="animate-in zoom-in-95 space-y-0.5">
                            <span className="text-[10px] uppercase font-black text-emerald-400">🎉 REVEALED PERK:</span>
                            <div className="text-xs font-black text-white">{coupon.revealed_perk || 'Special VIP Gift'}</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-amber-400">✨ Click / Tap to Scratch</span>
                            <p className="text-[10px] text-slate-500">Tap to reveal customer gift</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Expires: {coupon.expiry_date || 'No Expiry'}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: AUTOMATED BIRTHDAY & ANNIVERSARY GREETINGS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'greetings' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Customer Milestone Greeting Scheduler</h3>
              <p className="text-xs text-slate-400">Automated calendar triggers that send personalized WhatsApp wishes and reward coupons on birthdays & anniversaries.</p>
            </div>
            <button
              onClick={fetchGreetings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Schedule</span>
            </button>
          </div>

          <div className="space-y-3">
            {greetings.map((g) => {
              const isSent = g.status === 'SENT';
              return (
                <div
                  key={g.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        g.greeting_type === 'BIRTHDAY'
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {g.greeting_type}
                      </span>
                      <span className="text-xs font-bold text-white">Event Date: {g.event_date}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSent
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {g.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 max-w-xl font-mono">
                      "{g.message}"
                    </p>

                    {g.coupon_code && (
                      <div className="text-[10px] text-amber-400 font-bold">
                        🎁 Attached Gift Voucher: <span className="font-mono">{g.coupon_code}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerGreeting(g.id)}
                      disabled={isSent || triggeringGreetingId === g.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSent ? 'Sent on WhatsApp' : 'Dispatch Greeting'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Create New Coupon / Scratch Card</h3>
              <button onClick={() => setShowCreateCouponModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. MONSOON30"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Special 30% Off"
                  required
                  value={newCouponTitle}
                  onChange={(e) => setNewCouponTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat ₹ Amount</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Min Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={newMinSpend}
                    onChange={(e) => setNewMinSpend(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsScratchCard}
                    onChange={(e) => setNewIsScratchCard(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200 font-bold">Enable Interactive Scratch Card</span>
                </label>

                {newIsScratchCard && (
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Surprise Revealed Perk Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Free Gourmet Cookie with Latte"
                      value={newRevealedPerk}
                      onChange={(e) => setNewRevealedPerk(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-[11px]"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
