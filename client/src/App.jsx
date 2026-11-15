import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import POSCheckout from './pages/POSCheckout';
import Customers from './pages/Customers';
import MembershipPlans from './pages/MembershipPlans';
import Inventory from './pages/Inventory';
import DigitalKhata from './pages/DigitalKhata';
import Expenses from './pages/Expenses';
import StaffPayroll from './pages/StaffPayroll';
import WhatsAppMarketing from './pages/WhatsAppMarketing';
import SuppliersAndPOs from './pages/SuppliersAndPOs';
import RedemptionsList from './pages/RedemptionsList';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { merchant, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-sm font-semibold tracking-wide">Initializing Merchant SaaS Platform...</div>
      </div>
    );
  }

  // If merchant is not logged in, show Auth screens
  if (!merchant) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Main Merchant Portal & POS Shell
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'pos' && <POSCheckout />}
          {activeTab === 'udhaar' && <DigitalKhata />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'suppliers' && <SuppliersAndPOs />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'staff' && <StaffPayroll />}
          {activeTab === 'whatsapp' && <WhatsAppMarketing />}
          {activeTab === 'customers' && <Customers />}
          {activeTab === 'plans' && <MembershipPlans />}
          {activeTab === 'redemptions' && <RedemptionsList />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Bottom mobile navigation */}
      <div className="md:hidden sticky bottom-0 z-40 bg-slate-950/95 border-t border-slate-800 p-2 flex overflow-x-auto gap-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'pos' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          POS
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'suppliers' ? 'bg-sky-600 text-white' : 'text-slate-400'
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setActiveTab('udhaar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'udhaar' ? 'bg-rose-500 text-white' : 'text-slate-400'
          }`}
        >
          Khata
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'expenses' ? 'bg-pink-600 text-white' : 'text-slate-400'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'staff' ? 'bg-teal-600 text-white' : 'text-slate-400'
          }`}
        >
          Staff
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'customers' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'plans' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Plans
        </button>
      </div>
    </div>
  );
}
