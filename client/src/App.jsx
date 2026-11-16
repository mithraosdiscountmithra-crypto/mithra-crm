// Mithra CRM Enterprise SaaS App - Production Cloud Release v1.0.1
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AICopilotDrawer from './components/AICopilotDrawer';
import LiveOrderNotifier from './components/LiveOrderNotifier';

// 7 Management Pillars Components
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import MarketingPillar from './pages/MarketingPillar';
import SalesPillar from './pages/SalesPillar';
import OperationsPillar from './pages/OperationsPillar';
import RAndDPillar from './pages/RAndDPillar';
import FinancePillar from './pages/FinancePillar';
import HRPillar from './pages/HRPillar';

// Omnichannel Storefront & Auxiliary Views
import CustomerStorefront from './pages/CustomerStorefront';
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
import SuperAdminPanel from './pages/SuperAdminPanel';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { merchant, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('executive'); // Default to Pillar 7 (Executive Suite)
  const [currentRole, setCurrentRole] = useState('Owner / CEO'); // RBAC Role Switcher
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  const [adminToken, setAdminToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('loyalty_admin_token') : null;
  });

  const isAdminRoute = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/admin') || window.location.search.includes('tab=admin') || window.location.search.includes('admin=true'));

  const isImpersonating = typeof window !== 'undefined' && localStorage.getItem('is_impersonating_vendor') === 'true';
  const impersonatedVendorName = typeof window !== 'undefined' && localStorage.getItem('impersonated_vendor_name');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-sm font-semibold tracking-wide">Initializing Mithra CRM Platform...</div>
      </div>
    );
  }

  // 1. ISOLATED SUPER ADMIN PLATFORM OWNER PORTAL (Completely separate from vendors)
  if (isAdminRoute) {
    if (!adminToken) {
      return (
        <SuperAdminLogin 
          onLoginSuccess={(adminUser) => {
            const token = localStorage.getItem('loyalty_admin_token');
            setAdminToken(token);
          }} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <SuperAdminPanel />
      </div>
    );
  }

  // 2. Allow direct access to customer digital storefront without requiring merchant login
  const isPublicStorefront = typeof window !== 'undefined' && 
    (window.location.search.includes('store') || window.location.pathname.includes('storefront'));

  if (isPublicStorefront) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
        <CustomerStorefront isPublicCustomer={true} />
      </div>
    );
  }

  // 3. VENDOR PORTAL: If merchant is not logged in, show Vendor Auth screens
  if (!merchant) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // 4. MAIN VENDOR PORTAL & POS TERMINAL (Tenant Isolated - Vendors NEVER see Admin Panel)
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Super Admin Impersonation Active Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-slate-950 px-4 py-2.5 text-xs font-black flex flex-wrap items-center justify-between shadow-xl sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <span>
              [SUPER ADMIN MODE]: Currently configuring store <strong>"{merchant?.store_name || impersonatedVendorName}"</strong> as Platform Owner.
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('is_impersonating_vendor');
              localStorage.removeItem('impersonated_vendor_name');
              window.location.href = '/?tab=admin';
            }}
            className="px-3 py-1 rounded-xl bg-slate-950 text-amber-300 font-bold hover:bg-slate-900 transition flex items-center gap-1 shadow"
          >
            <span>⬅️ Exit & Return to Master Admin Panel</span>
          </button>
        </div>
      )}

      {/* Live Order Chime Sound & Banner Notifier */}
      <LiveOrderNotifier activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Top Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
        />

        {/* Dynamic Main Workspace: 7 Management Pillars + Omnichannel Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Pillar 7: Executive Dashboard (CEO Cockpit & Multi-Branch) */}
          {(activeTab === 'executive' || activeTab === 'dashboard') && (
            <ExecutiveDashboard setActiveTab={setActiveTab} />
          )}

          {/* Pillar 1: Marketing (AiSensy, Scratch Cards & Greetings) */}
          {activeTab === 'marketing' && <MarketingPillar />}

          {/* Pillar 2: Sales (POS Billing, VIP Passes & Daily Analytics) */}
          {activeTab === 'sales' && <SalesPillar />}

          {/* Pillar 3: Operations (Inventory, Low-Stock & Auto-PO) */}
          {activeTab === 'operations' && <OperationsPillar />}

          {/* Pillar 4: R&D (Customer Feedback, NPS & A/B Tests) */}
          {activeTab === 'rd' && <RAndDPillar />}

          {/* Pillar 5: Accounts & Finance (Digital Khata, Expenses & GST Tax) */}
          {activeTab === 'finance' && <FinancePillar />}

          {/* Pillar 6: HR & Staff (Attendance, Payroll & RBAC) */}
          {activeTab === 'hr' && <HRPillar />}

          {/* Channels & Direct Views */}
          {activeTab === 'orders' && <CustomerStorefront initialSubView="orders" />}
          {activeTab === 'storefront' && <CustomerStorefront initialSubView="store" />}
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

      {/* Bottom mobile navigation for 7 Management Pillars */}
      <div className="md:hidden sticky bottom-0 z-40 bg-slate-950/95 border-t border-slate-800 p-2 flex overflow-x-auto gap-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('executive')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'executive' || activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          👑 Executive
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'marketing' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          📢 Marketing
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          💳 Sales & POS
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'operations' ? 'bg-sky-600 text-white' : 'text-slate-400'
          }`}
        >
          ⚙️ Operations
        </button>
        <button
          onClick={() => setActiveTab('rd')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'rd' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}
        >
          🔬 R&D
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'finance' ? 'bg-rose-600 text-white' : 'text-slate-400'
          }`}
        >
          📊 Finance
        </button>
        <button
          onClick={() => setActiveTab('hr')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'hr' ? 'bg-teal-600 text-white' : 'text-slate-400'
          }`}
        >
          👥 HR & Team
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          📦 Orders
        </button>
        <button
          onClick={() => setActiveTab('storefront')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
            activeTab === 'storefront' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          🏪 Storefront
        </button>
      </div>

      {/* Global Floating AI Copilot Assistant */}
      <AICopilotDrawer />
    </div>
  );
}
