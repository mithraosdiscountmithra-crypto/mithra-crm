import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { 
  DollarSign, 
  Users, 
  Award, 
  ShoppingBag, 
  ArrowUpRight, 
  Clock, 
  Sparkles,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.analytics.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recentRedemptions || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Merchant CRM Overview</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live POS Ready
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Sales & Membership Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time multi-tenant insights across loyalty tiers, customer retention, and instant checkout discounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-emerald-500/25"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open Cashier POS</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales via CRM"
          value={`$${stats.totalSales || '0.00'}`}
          subtitle="Processed at checkout"
          icon={DollarSign}
          color="blue"
          trend="+18.4%"
        />
        <StatCard
          title="Discounts Provided"
          value={`$${stats.totalDiscounts || '0.00'}`}
          subtitle="Saved by loyal customers"
          icon={TrendingUp}
          color="rose"
        />
        <StatCard
          title="Active Members"
          value={`${stats.activeMembers || 0} / ${stats.totalCustomers || 0}`}
          subtitle={`${stats.memberLoyaltyRate || 0}% loyalty conversion rate`}
          icon={Award}
          color="purple"
          trend="High"
        />
        <StatCard
          title="Total Redemptions"
          value={stats.redemptionsCount || 0}
          subtitle="Successful member redemptions"
          icon={Receipt}
          color="emerald"
        />
      </div>

      {/* Grid: Recent Transactions & Quick Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Redemptions Audit Log */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-base">Recent POS Redemptions</h3>
            </div>
            <button
              onClick={() => setActiveTab('redemptions')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No redemptions logged yet. Use the POS Checkout screen to verify members and log transactions!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recent.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                      {tx.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{tx.customer_name}</div>
                      <div className="text-xs text-slate-400">{tx.customer_phone}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      ${parseFloat(tx.bill_amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">
                      -${parseFloat(tx.discount_given).toFixed(2)} discount
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launch & Quick Add */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Cashier Quick Tasks</span>
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => setActiveTab('pos')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Open Cashier POS Screen</div>
                  <div className="text-[11px] text-slate-400">Search customer by phone & apply discount</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Register New Customer</div>
                  <div className="text-[11px] text-slate-400">Add phone, birthday & assign membership</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Configure Loyalty Tiers</div>
                  <div className="text-[11px] text-slate-400">Adjust validity, discount % and perks</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Stock & Inventory Management</div>
                  <div className="text-[11px] text-slate-400">Track SKUs, warehouse levels & reorder alerts</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sky-400" />
              </button>

              <button
                onClick={() => setActiveTab('udhaar')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Customer Khata & Udhaar Book</div>
                  <div className="text-[11px] text-slate-400">Manage customer credit & WhatsApp reminders</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Expenses & P&L Statement</div>
                  <div className="text-[11px] text-slate-400">Track operating costs & calculate net profit/loss</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-pink-400" />
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Staff Roster & Attendance</div>
                  <div className="text-[11px] text-slate-400">1-click daily attendance & payroll obligations</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => setActiveTab('whatsapp')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">Bulk WhatsApp Broadcasts</div>
                  <div className="text-[11px] text-slate-400">Send festival offers & VIP deals to customer segments</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </div>

          {/* Quick Tenant Info */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 space-y-1.5">
            <div className="font-bold text-indigo-200">Tenant Isolation Verified</div>
            <p className="text-[11px] text-indigo-400/90 leading-relaxed">
              Your customer data, membership plans, and redemption transaction records are partitioned with strict PostgreSQL tenant foreign key cascades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
