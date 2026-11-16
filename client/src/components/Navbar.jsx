import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, ShoppingCart, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { merchant, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Store info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Mithra CRM</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                SaaS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Store className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200">{merchant?.store_name || 'My Store'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-[11px]">{merchant?.category || 'Retail'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick POS Mode Toggle & User Controls */}
      <div className="flex items-center gap-3">
        {/* Fast POS Mode Button */}
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
            activeTab === 'pos'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cashier POS</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>

        {/* Merchant profile badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
            {merchant?.owner_name ? merchant.owner_name.charAt(0).toUpperCase() : 'M'}
          </div>
          <span className="text-slate-300 font-medium">{merchant?.owner_name || 'Merchant'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
