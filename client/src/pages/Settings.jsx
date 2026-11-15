import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Store, User, Phone, MapPin, Tag, Database, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function Settings() {
  const { merchant, updateMerchant } = useAuth();

  const [storeName, setStoreName] = useState(merchant?.store_name || '');
  const [ownerName, setOwnerName] = useState(merchant?.owner_name || '');
  const [category, setCategory] = useState(merchant?.category || 'Retail');
  const [phone, setPhone] = useState(merchant?.phone || '');
  const [address, setAddress] = useState(merchant?.address || '');
  const [city, setCity] = useState(merchant?.city || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await api.auth.updateProfile({
        store_name: storeName,
        owner_name: ownerName,
        category,
        phone,
        address,
        city
      });

      if (res.success && res.merchant) {
        updateMerchant(res.merchant);
        setSuccess('Store profile updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl font-black text-white">Merchant Store Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Update your store identity, address, and view tenant database isolation properties.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Store / Brand Name *</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Owner Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Store Category</label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cafe & Roastery">Cafe & Roastery</option>
                <option value="Restaurant & Dining">Restaurant & Dining</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Spa & Salon">Spa & Salon</option>
                <option value="Fitness & Gym">Fitness & Gym</option>
                <option value="Supermarket / Grocery">Supermarket / Grocery</option>
                <option value="Retail & Electronics">Retail & Electronics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Store Contact Phone *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">City</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. San Francisco"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Store Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 450 Market Street, Suite 10"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Database & Multi-Tenant Info */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-white text-base">PostgreSQL Neon DB Connection Architecture</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          This SaaS uses tenant-scoped database relations. Each query enforces <code className="text-sky-300">merchant_id = {merchant?.id}</code> to prevent any cross-tenant data leaks. Customer phone numbers are uniquely scoped per merchant with <code className="text-sky-300">UNIQUE (merchant_id, phone)</code>.
        </p>
      </div>
    </div>
  );
}
