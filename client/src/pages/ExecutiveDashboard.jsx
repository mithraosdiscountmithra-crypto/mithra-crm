import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Building2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  DollarSign,
  Package,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Activity,
  Award,
  Zap,
  Phone
} from 'lucide-react';

export default function ExecutiveDashboard({ setActiveTab }) {
  const { merchant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.executive.getOverview();
      if (res.success) {
        setData(res.executive);
      } else {
        setError(res.error || 'Failed to fetch executive data');
      }
    } catch (err) {
      console.error('Executive overview fetch error:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent mx-auto"></div>
        <p className="text-xs font-semibold tracking-wide">Compiling CEO Strategic Analytics & Multi-Branch Feeds...</p>
      </div>
    );
  }

  const kpis = data?.kpiSuite;
  const branches = data?.branches || [];
  const aiBriefing = data?.aiBriefing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Pillar 7: Executive Management Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>CEO Cockpit & Multi-Branch Oversight</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              Health {kpis?.businessHealthScore || 80}/100
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Holistic cross-department enterprise intelligence, multi-outlet sales tracking, and real-time AI strategic growth briefing.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Cockpit</span>
        </button>
      </div>

      {/* Strategic AI Executive Briefing */}
      {aiBriefing && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-5 sm:p-6 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">AI Strategic Business Health Briefing</h3>
                <span className="text-[11px] font-bold text-amber-400 uppercase">
                  Status: {aiBriefing.overall_health} ({aiBriefing.health_score}/100 Score)
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
            {aiBriefing.headline}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {/* Key Strengths */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enterprise Strengths</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                {aiBriefing.key_strengths?.map((str, idx) => (
                  <li key={idx} className="leading-snug">{str}</li>
                ))}
              </ul>
            </div>

            {/* Strategic Risks */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Risk Exposure</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                {aiBriefing.strategic_risks?.map((risk, idx) => (
                  <li key={idx} className="leading-snug">{risk}</li>
                ))}
              </ul>
            </div>

            {/* Growth Recommendations */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Revenue Actions</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                {aiBriefing.growth_recommendations?.map((rec, idx) => (
                  <li key={idx} className="leading-snug">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CEO Strategic KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Net Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">₹{kpis?.totalNetRevenue}</div>
          <p className="text-[10px] text-slate-400">Margin: <span className="font-bold text-emerald-400">{kpis?.profitMargin}</span></p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>VIP Subscribers</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">{kpis?.activeVIPMembers} Active</div>
          <p className="text-[10px] text-slate-400">{kpis?.totalRegisteredCustomers} registered customers</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Market Udhaar Balance</span>
            <BookOpen className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">₹{kpis?.outstandingUdhaarDebt}</div>
          <p className="text-[10px] text-slate-400">Recovery rate: <span className="font-bold text-emerald-400">{kpis?.udhaarRecoveryRate}</span></p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Inventory Stock Assets</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400">₹{kpis?.totalStockValuation}</div>
          <p className="text-[10px] text-slate-400">{kpis?.lowStockRiskCount} low-stock alert items</p>
        </div>
      </div>

      {/* Multi-Branch Outlets Performance Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Multi-Branch Outlets Overview</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">{branches.length} Outlets Operating</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{b.branch_code}</span>
                  <h4 className="text-sm font-black text-white line-clamp-1">{b.branch_name}</h4>
                  <p className="text-[11px] text-slate-400">{b.address}, {b.city}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  b.status === 'EXCEEDING_TARGET'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {b.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Progress bar to daily target */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sales Today: <strong className="text-white">₹{b.revenue_today}</strong></span>
                  <span className="font-bold text-emerald-400">{b.target_progress_percent}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, parseFloat(b.target_progress_percent))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Target: ₹{b.daily_target}</span>
                  <span>Manager: {b.manager}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> {b.phone}
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Pillars Enterprise Launchpad */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Enterprise 7 Management Pillars
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'marketing', name: '1. Marketing', desc: 'AiSensy & Coupons', color: 'emerald' },
            { id: 'sales', name: '2. Sales', desc: 'POS & VIP Passes', color: 'indigo' },
            { id: 'operations', name: '3. Operations', desc: 'Inventory & Auto-PO', color: 'sky' },
            { id: 'rd', name: '4. R&D', desc: 'Feedback & Experiments', color: 'amber' },
            { id: 'finance', name: '5. Finance', desc: 'P&L, Khata & GST', color: 'rose' },
            { id: 'hr', name: '6. HR & Staff', desc: 'Attendance & RBAC', color: 'teal' }
          ].map(pil => (
            <button
              key={pil.id}
              onClick={() => setActiveTab && setActiveTab(pil.id)}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left transition-all hover:shadow-lg group"
            >
              <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                <span>{pil.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{pil.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
