import React, { useState, useEffect } from 'react';
import api from '../api/client';
import POSCheckout from './POSCheckout';
import MembershipPlans from './MembershipPlans';
import {
  CreditCard,
  ShoppingCart,
  Crown,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  RotateCcw,
  Receipt,
  CheckCircle2
} from 'lucide-react';

export default function SalesPillar() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'vip', 'analytics'
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchSalesAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await api.sales.getDailyAnalytics();
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchSalesAnalytics();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header & Pillar Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span>Pillar 2: Sales & Revenue Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            POS Billing & Mithra Plus VIP Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fast cashier checkout terminal, VIP subscription pass enrollments, and real-time daily sales analytics.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS Billing Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'vip' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Mithra Plus VIP Passes</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Daily Analytics</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: POS CHECKOUT */}
      {activeTab === 'pos' && (
        <div>
          <POSCheckout />
        </div>
      )}

      {/* SUB-VIEW 2: MITHRA PLUS VIP PASSES */}
      {activeTab === 'vip' && (
        <div>
          <MembershipPlans />
        </div>
      )}

      {/* SUB-VIEW 3: DAILY SALES ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
              <p className="text-xs font-semibold">Calculating daily sales & peak hours...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Analytics KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">Gross Sales</span>
                  <div className="text-xl sm:text-2xl font-black text-white">₹{analytics.totalGross}</div>
                  <p className="text-[10px] text-slate-500">Before discounts</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">Total VIP Discounts</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">-₹{analytics.totalDiscounts}</div>
                  <p className="text-[10px] text-amber-500/80">Loyalty savings given</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">Net Sales Collected</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">₹{analytics.netRevenue}</div>
                  <p className="text-[10px] text-slate-500">{analytics.totalTransactions} transactions</p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block mb-1">Avg Ticket Value</span>
                  <div className="text-xl sm:text-2xl font-black text-sky-400">₹{analytics.avgTicketValue}</div>
                  <p className="text-[10px] text-sky-400/80">VIP conversion: {analytics.vipConversionRate}</p>
                </div>
              </div>

              {/* Payment Modes Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Payment Mode Split</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 font-semibold">Online / UPI QR Payments</span>
                        <span className="font-bold text-emerald-400">₹{analytics.paymentModes?.onlineUPI}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 font-semibold">Cash Collections</span>
                        <span className="font-bold text-sky-400">₹{analytics.paymentModes?.cash}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className="bg-sky-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300 font-semibold">Pay Later (Customer Khata Credit)</span>
                        <span className="font-bold text-amber-400">₹{analytics.paymentModes?.khataCredit}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peak Hours Breakdown */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>Peak Store Hours Distribution</span>
                    </h3>
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Peak: 13:00 & 19:00
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {analytics.hourlyDistribution?.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-bold">{slot.hour}</span>
                          {slot.isPeak && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Peak Rush
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-400">{slot.orders} orders</span>
                          <span className="font-black text-white">₹{slot.sales}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
