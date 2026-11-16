import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Store, User, Phone, MapPin, Tag, Database, CheckCircle, AlertCircle, Save, Camera, Image } from 'lucide-react';

export default function Settings() {
  const { merchant, updateMerchant } = useAuth();

  const [storeName, setStoreName] = useState(merchant?.store_name || '');
  const [ownerName, setOwnerName] = useState(merchant?.owner_name || '');
  const [category, setCategory] = useState(merchant?.category || 'Retail');
  const [phone, setPhone] = useState(merchant?.phone || '');
  const [address, setAddress] = useState(merchant?.address || '');
  const [city, setCity] = useState(merchant?.city || '');
  const [bannerUrl, setBannerUrl] = useState(merchant?.banner_url || '');
  const [photoUrl, setPhotoUrl] = useState(merchant?.photo_url || '');

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
        city,
        banner_url: bannerUrl,
        photo_url: photoUrl
      });

      if (res.success && res.merchant) {
        updateMerchant(res.merchant);
        setSuccess('Store profile and shop photos updated successfully!');
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

        {/* Shop Photo & Storefront Banner */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Storefront Shop Photo & Banner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize the look of your digital storefront. Paste image URLs or pick from curated presets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Shop Banner URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 py-0.5">Presets:</span>
                <button
                  type="button"
                  onClick={() => setBannerUrl('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cafe/Coffee
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUrl('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUrl('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Supermarket
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUrl('https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Bakery
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Shop Logo / Facade Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 py-0.5">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cafe Shop
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Dining Room
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Grocery Mart
                </button>
              </div>
            </div>
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
