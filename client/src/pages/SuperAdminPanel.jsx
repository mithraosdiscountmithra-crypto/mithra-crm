import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Package, 
  Plus, 
  Search, 
  ExternalLink, 
  MessageCircle, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  RefreshCw,
  Sparkles,
  QrCode,
  Lock,
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function SuperAdminPanel({ setActiveTab }) {
  const { merchant: currentLoggedInMerchant, login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [stats, setStats] = useState({
    total_vendors: 0,
    active_vendors: 0,
    total_customers: 0,
    total_members: 0,
    total_gmv: 0,
    total_products: 0
  });

  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Provisioning Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    store_name: '',
    owner_name: '',
    category: 'Restaurant & Dining',
    phone: '',
    email: '',
    password: '',
    city: 'Hyderabad',
    address: ''
  });

  // Welcome Success Modal
  const [provisionedVendor, setProvisionedVendor] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.admin.getOverview();
      if (res.success) {
        setStats(res.stats || {});
        setVendors(res.vendors || []);
      } else {
        setError(res.error || 'Failed to load platform data');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to platform server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVendorForm(prev => ({ ...prev, password: `Mithra@${rand}` }));
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendorForm.store_name.trim() || !newVendorForm.owner_name.trim() || !newVendorForm.phone.trim() || !newVendorForm.email.trim() || !newVendorForm.password.trim()) {
      setError('Please fill all mandatory fields (Store Name, Owner, Phone, Email, Password).');
      return;
    }

    try {
      setProvisioning(true);
      setError('');
      const res = await api.admin.createVendor(newVendorForm);
      if (res.success) {
        setProvisionedVendor({
          ...res.vendor,
          rawPassword: newVendorForm.password,
          whatsappLink: res.whatsapp_link,
          whatsappMessage: res.whatsapp_message
        });
        setIsCreateModalOpen(false);
        setNewVendorForm({
          store_name: '',
          owner_name: '',
          category: 'Restaurant & Dining',
          phone: '',
          email: '',
          password: '',
          city: 'Hyderabad',
          address: ''
        });
        fetchOverview();
      } else {
        setError(res.error || 'Failed to provision vendor');
      }
    } catch (err) {
      setError(err.message || 'Error provisioning vendor');
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleStatus = async (vendorId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      setError('');
      const res = await api.admin.toggleVendorStatus(vendorId, newStatus);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchOverview();
      }
    } catch (err) {
      setError(err.message || 'Failed to update vendor status');
    }
  };

  const handleImpersonate = async (vendorId, vendorName) => {
    if (!window.confirm(`Switch to "${vendorName}" dashboard? You will be logged in as this vendor to configure their store.`)) {
      return;
    }
    try {
      setError('');
      const res = await api.admin.impersonateVendor(vendorId);
      if (res.success && res.token) {
        localStorage.setItem('loyalty_token', res.token);
        localStorage.setItem('loyalty_merchant', JSON.stringify(res.merchant));
        localStorage.setItem('is_impersonating_vendor', 'true');
        localStorage.setItem('impersonated_vendor_name', vendorName);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'Failed to switch to vendor');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('loyalty_admin_token');
    localStorage.removeItem('loyalty_admin_user');
    window.location.reload();
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = 
      (v.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone || '').includes(searchTerm) ||
      (v.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(vendors.map(v => v.category).filter(Boolean))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Platform Owner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Mithra Master SaaS Panel
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Platform Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ప్లాట్‌ఫారమ్ మెయిన్ ప్యానెల్: Manage all vendors, provision new stores, view platform GMV & dispatch WhatsApp credentials
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              handleGeneratePassword();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ Provision New Vendor (కొత్త వెండర్)</span>
          </button>

          {/* Return to Vendor App */}
          <a
            href="/"
            className="hidden md:flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition"
            title="Go to Vendor Portal"
          >
            <Store className="w-3.5 h-3.5 text-sky-400" />
            <span>Vendor Portal</span>
          </a>

          {/* Super Admin Logout */}
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
            title="Logout from Master Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-rose-400 ml-4">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Platform 4 Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Vendors */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
            <span>Onboarded Stores</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats.total_vendors || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            {stats.active_vendors || 0} Stores Active
          </div>
        </div>

        {/* Platform Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
            <span>Platform Customers</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats.total_customers || 0}
          </div>
          <div className="text-[11px] text-amber-300 font-semibold mt-1">
            👑 {stats.total_members || 0} Active VIP Members
          </div>
        </div>

        {/* Total GMV */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
            <span>Platform GMV Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{Number(stats.total_gmv || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Across all store POS terminals
          </div>
        </div>

        {/* Live Products */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
            <span>Menu & Catalog Items</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {stats.total_products || 0}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Live dishes & retail products
          </div>
        </div>
      </div>

      {/* Onboarding Guide Callout Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>కొత్త వెండర్లకు CRM ఇవ్వడం ఎలా? (2 Easy Ways to Onboard Vendors):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>1️⃣ వెండర్ సొంతంగా రిజిస్టర్ అవ్వడం (Self-Registration):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              మీరు మీ సైట్ లింక్: <code className="text-sky-300 font-mono">https://mithra-crm.vercel.app</code> వెండర్‌కు పంపిస్తే, వారు "Sign Up / Register Store" క్లిక్ చేసి 1 నిమిషంలో సొంత అకౌంట్ క్రియేట్ చేసుకుంటారు.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>2️⃣ మన మెయిన్ ప్యానెల్ నుండి మనమే యాడ్ చేయడం (Super Admin Provisioning):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              పైన ఉన్న <strong>"➕ Provision New Vendor"</strong> బటన్ నొక్కి షాప్ పేరు, ఫోన్ నెంబర్ ఎంటర్ చేయండి. వెంటనే అకౌంట్ క్రియేట్ అయ్యి <strong>1-Click WhatsApp Welcome Link</strong> వస్తుంది!
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Directory & Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              All Registered Stores ({filteredVendors.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search store, owner, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Store & Category</th>
                  <th className="py-3.5 px-4">Owner Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Customers / Members</th>
                  <th className="py-3.5 px-4 text-center">Total Sales</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No vendor stores found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => {
                    const cleanWa = (v.phone || '').replace(/[^0-9]/g, '');
                    const waNum = cleanWa.startsWith('91') ? cleanWa : `91${cleanWa.replace(/^0+/, '')}`;
                    const waText = `👑 *Mithra CRM - Support & Store Access*\n\nNamaste *${v.owner_name}* garu! Here is your Mithra CRM access link:\n🌐 Portal: https://mithra-crm.vercel.app\n📧 Email: ${v.email}\n📱 Storefront QR: https://mithra-crm.vercel.app/storefront?merchant=${v.id}`;
                    const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`;

                    return (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        {/* Store & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                              {v.store_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>{v.store_name}</span>
                                {v.id === currentLoggedInMerchant?.id && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {v.category || 'Retail'}
                                </span>
                                <span>• ID #{v.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Owner Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{v.owner_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{v.phone}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{v.email}</div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{v.city || 'Hyderabad'}</div>
                          {v.address && <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{v.address}</div>}
                        </td>

                        {/* Customers & Members */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-white">{v.total_customers || 0}</div>
                          <div className="text-[10px] text-amber-400 font-semibold">
                            👑 {v.active_members || 0} VIPs
                          </div>
                        </td>

                        {/* Total Sales */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          ₹{Number(v.total_sales || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(v.id, v.is_active)}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                              v.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300'
                            }`}
                            title="Click to Toggle Active / Suspended Status"
                          >
                            {v.is_active ? '🟢 ACTIVE' : '🔴 SUSPENDED'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Dispatch */}
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition"
                              title="Send WhatsApp Login Link & QR to Vendor"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* View Customer Storefront QR */}
                            <a
                              href={`/storefront?merchant=${v.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition"
                              title="View Vendor's Public Digital QR Menu"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </a>

                            {/* Impersonate / Switch to this Vendor */}
                            <button
                              type="button"
                              onClick={() => handleImpersonate(v.id, v.store_name)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                              title="Log In As This Vendor (Switch Dashboard)"
                            >
                              <Key className="w-3 h-3 text-amber-400" />
                              <span>Switch</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: PROVISION NEW VENDOR */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="👑 Provision New Vendor Store (కొత్త వెండర్‌ని యాడ్ చేయండి)"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <p className="text-xs text-slate-300">
            కొత్త దుకాణం/రెస్టారెంట్ వివరాలను నమోదు చేయండి. అకౌంట్ క్రియేట్ అయిన వెంటనే 3 డిఫాల్ట్ VIP ప్లాన్స్ అమర్చబడతాయి మరియు వెండర్‌కు వాట్సాప్ లింక్ జనరేట్ అవుతుంది:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store / Business Name *</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Annapurna Grand, Royal Sweets"
                  value={newVendorForm.store_name}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, store_name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newVendorForm.owner_name}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, owner_name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Business Category *</label>
              <select
                value={newVendorForm.category}
                onChange={(e) => setNewVendorForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Restaurant & Dining">Restaurant & Dining</option>
                <option value="Cafe & Roastery">Cafe & Roastery</option>
                <option value="Bakery & Sweets">Bakery & Sweets</option>
                <option value="Retail & Supermarket">Retail & Supermarket</option>
                <option value="Salon & Spa">Salon & Spa</option>
                <option value="Apparel & Clothing">Apparel & Clothing</option>
                <option value="Electronics & Mobile">Electronics & Mobile</option>
                <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                <option value="General Retail">General Retail</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number (WhatsApp) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="tel"
                  required
                  placeholder="9848012345"
                  value={newVendorForm.phone}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Login Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="vendor@example.com"
                  value={newVendorForm.email}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Initial Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                >
                  🎲 Auto-Generate
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={newVendorForm.password}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="e.g. Mithra@789"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">City / Town</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Hyderabad, Vijayawada, Vizag..."
                  value={newVendorForm.city}
                  onChange={(e) => setNewVendorForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Address / Landmark</label>
              <input
                type="text"
                placeholder="Main Road, Shop #12"
                value={newVendorForm.address}
                onChange={(e) => setNewVendorForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={provisioning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              {provisioning ? <span>Creating Store...</span> : <span>✨ Create Store & Generate WhatsApp Link</span>}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: VENDOR PROVISIONED CELEBRATION & WHATSAPP DISPATCH */}
      {provisionedVendor && (
        <Modal
          isOpen={Boolean(provisionedVendor)}
          onClose={() => setProvisionedVendor(null)}
          title="🎉 Store Account Provisioned Successfully!"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl">
              👑
            </div>

            <div>
              <h3 className="text-base font-black text-white">{provisionedVendor.store_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Owner: <strong>{provisionedVendor.owner_name}</strong> ({provisionedVendor.phone})
              </p>
            </div>

            {/* Login Credentials Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-mono font-bold text-white">{provisionedVendor.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="font-mono font-bold text-amber-300">{provisionedVendor.rawPassword}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 mt-1.5">
                <span className="text-slate-400">Storefront QR:</span>
                <span className="text-[10px] text-sky-400 font-mono underline truncate max-w-[200px]">
                  /storefront?merchant={provisionedVendor.id}
                </span>
              </div>
            </div>

            {/* 1-Click WhatsApp Welcome Dispatch */}
            <div className="space-y-2 pt-2">
              <a
                href={provisionedVendor.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>💬 Send Login Link & QR to Vendor on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setProvisionedVendor(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white"
              >
                Done / Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
