import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Award, 
  Receipt, 
  Settings,
  Package,
  BookOpen,
  Sparkles,
  Database,
  TrendingDown,
  UserCheck,
  MessageSquare,
  Truck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Checkout', icon: ShoppingCart, badge: 'Fast' },
    { id: 'udhaar', label: 'Digital Khata / Udhaar', icon: BookOpen, badge: 'Credit' },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package },
    { id: 'suppliers', label: 'Suppliers & POs', icon: Truck, badge: 'Procure' },
    { id: 'expenses', label: 'Expenses & P&L', icon: TrendingDown, badge: 'P&L' },
    { id: 'staff', label: 'Staff & Attendance', icon: UserCheck, badge: 'Team' },
    { id: 'whatsapp', label: 'WhatsApp Marketing', icon: MessageSquare, badge: 'Bulk' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'plans', label: 'Membership Plans', icon: Award },
    { id: 'redemptions', label: 'Redemptions Log', icon: Receipt },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Management & POS
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
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

      {/* Tenant Status Footer Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Tenant Isolated</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          PostgreSQL multi-tenant schema with strict per-merchant partitioning.
        </p>
      </div>
    </aside>
  );
}
