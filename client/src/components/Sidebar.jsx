import React from 'react';
import { 
  Crown,
  Megaphone,
  ShoppingCart,
  Package,
  FlaskConical,
  DollarSign,
  Users,
  Store,
  Settings,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentRole = 'Owner / CEO', setCurrentRole }) {
  // 7 Management Pillars
  const pillars = [
    { id: 'executive', label: '1. Executive Suite', icon: Crown, badge: 'CEO', permissionKey: 'can_executive' },
    { id: 'marketing', label: '2. Marketing Engine', icon: Megaphone, badge: 'AiSensy', permissionKey: 'can_marketing' },
    { id: 'sales', label: '3. Sales & POS', icon: ShoppingCart, badge: 'Terminal', permissionKey: 'can_pos' },
    { id: 'operations', label: '4. Operations & Stock', icon: Package, badge: 'Auto-PO', permissionKey: 'can_operations' },
    { id: 'rd', label: '5. R&D & Feedback', icon: FlaskConical, badge: 'NPS', permissionKey: 'can_rd' },
    { id: 'finance', label: '6. Accounts & Finance', icon: DollarSign, badge: 'GST P&L', permissionKey: 'can_finance' },
    { id: 'hr', label: '7. HR & Staff', icon: Users, badge: 'RBAC', permissionKey: 'can_hr' },
  ];

  const channels = [
    { id: 'storefront', label: 'Online Storefront', icon: Store, badge: 'Live' },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  // Role permissions map for fast client role simulation
  const rolePermissions = {
    'Owner / CEO': { can_executive: true, can_marketing: true, can_pos: true, can_operations: true, can_rd: true, can_finance: true, can_hr: true },
    'Store Manager': { can_executive: false, can_marketing: true, can_pos: true, can_operations: true, can_rd: true, can_finance: false, can_hr: true },
    'Cashier': { can_executive: false, can_marketing: false, can_pos: true, can_operations: false, can_rd: true, can_finance: false, can_hr: false },
    'Chief Accountant': { can_executive: false, can_marketing: false, can_pos: false, can_operations: true, can_rd: false, can_finance: true, can_hr: true },
  };

  const perms = rolePermissions[currentRole] || rolePermissions['Owner / CEO'];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-5">
        {/* Active Role Selector Widget */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Active Role (RBAC)
            </span>
          </div>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole && setCurrentRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="Owner / CEO">👑 Owner / CEO (Full Access)</option>
            <option value="Store Manager">💼 Store Manager</option>
            <option value="Cashier">💳 Cashier / Front Desk</option>
            <option value="Chief Accountant">📊 Chief Accountant</option>
          </select>
        </div>

        {/* 7 Management Pillars Section */}
        <div className="space-y-1.5">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            7 Management Pillars
          </div>

          <nav className="space-y-1">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeTab === pillar.id;
              const isAllowed = perms[pillar.permissionKey];

              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveTab(pillar.id)}
                  disabled={!isAllowed}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !isAllowed
                      ? 'opacity-35 cursor-not-allowed text-slate-600'
                      : isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{pillar.label}</span>
                  </div>
                  {pillar.badge && isAllowed && (
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {pillar.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Omnichannel & Settings Section */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Channels & Config
          </div>

          <nav className="space-y-1">
            {channels.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tenant Isolated Status Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>7 Pillars Enterprise ERP</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          PostgreSQL multi-tenant schema with strict role access controls.
        </p>
      </div>
    </aside>
  );
}
