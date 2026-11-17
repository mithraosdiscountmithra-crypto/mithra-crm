import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { uploadToCloudinary } from '../utils/cloudinary';
import VendorQRModal from '../components/VendorQRModal';
import { 
  Store, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Camera, 
  Image, 
  Upload, 
  Cloud, 
  Loader2, 
  Sparkles,
  ExternalLink,
  QrCode,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  Sliders
} from 'lucide-react';

export default function Settings() {
  const { merchant, updateMerchant } = useAuth();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [storeName, setStoreName] = useState(merchant?.store_name || '');
  const [ownerName, setOwnerName] = useState(merchant?.owner_name || '');
  const [category, setCategory] = useState(merchant?.category || 'Retail');
  const [phone, setPhone] = useState(merchant?.phone || '');
  const [address, setAddress] = useState(merchant?.address || '');
  const [city, setCity] = useState(merchant?.city || '');
  const [bannerUrl, setBannerUrl] = useState(merchant?.banner_url || '');
  const [photoUrl, setPhotoUrl] = useState(merchant?.photo_url || '');

  // Ordering Channels State (Delivery, Takeaway / Pickup, Dine-In Table Booking)
  const tenantId = merchant?.id || 1;
  const [enableDelivery, setEnableDelivery] = useState(() => {
    try {
      const saved = localStorage.getItem(`store_order_channels_${tenantId}`);
      if (saved) return JSON.parse(saved).delivery !== false;
    } catch (e) {}
    return merchant?.enable_delivery !== false;
  });

  const [enableTakeaway, setEnableTakeaway] = useState(() => {
    try {
      const saved = localStorage.getItem(`store_order_channels_${tenantId}`);
      if (saved) return JSON.parse(saved).takeaway !== false;
    } catch (e) {}
    return merchant?.enable_takeaway !== false;
  });

  const [enableDineIn, setEnableDineIn] = useState(() => {
    try {
      const saved = localStorage.getItem(`store_order_channels_${tenantId}`);
      if (saved) return JSON.parse(saved).dine_in !== false;
    } catch (e) {}
    return merchant?.enable_dine_in !== false;
  });

  // File Upload states for Banner & Logo
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Cloudinary Settings State (Persisted to localStorage)
  const [cloudName, setCloudName] = useState(localStorage.getItem('cloudinary_cloud_name') || 'abek7mb8');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('cloudinary_upload_preset') || 'mithra_preset');
  const [cloudinarySaved, setCloudinarySaved] = useState(false);
  const [testingUpload, setTestingUpload] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const res = await uploadToCloudinary(file);
      if (res.success && res.url) {
        setBannerUrl(res.url);
      } else {
        setError(res.error || 'Failed to upload banner');
      }
    } catch (err) {
      setError(err.message || 'Error uploading banner');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await uploadToCloudinary(file);
      if (res.success && res.url) {
        setPhotoUrl(res.url);
      } else {
        setError(res.error || 'Failed to upload logo');
      }
    } catch (err) {
      setError(err.message || 'Error uploading logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSaveCloudinary = (e) => {
    e.preventDefault();
    localStorage.setItem('cloudinary_cloud_name', cloudName.trim());
    localStorage.setItem('cloudinary_upload_preset', uploadPreset.trim());
    setCloudinarySaved(true);
    setTimeout(() => setCloudinarySaved(false), 4000);
  };

  const handleTestUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setTestingUpload(true);
      setTestResult(null);
      const res = await uploadToCloudinary(file);
      if (res.success) {
        setTestResult({ success: true, url: res.url });
      } else {
        setTestResult({ success: false, error: res.error });
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingUpload(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!enableDelivery && !enableTakeaway && !enableDineIn) {
      setError('Please keep at least one ordering option (Delivery, Takeaway, or Dine-In) enabled.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const channels = {
        delivery: enableDelivery,
        takeaway: enableTakeaway,
        dine_in: enableDineIn
      };
      try {
        localStorage.setItem(`store_order_channels_${tenantId}`, JSON.stringify(channels));
      } catch (e) {}

      const res = await api.auth.updateProfile({
        store_name: storeName,
        owner_name: ownerName,
        category,
        phone,
        address,
        city,
        banner_url: bannerUrl,
        photo_url: photoUrl,
        enable_delivery: enableDelivery,
        enable_takeaway: enableTakeaway,
        enable_dine_in: enableDineIn
      });

      if (res.success && res.merchant) {
        updateMerchant({ ...res.merchant, ...channels });
        setSuccess('Store profile, ordering channels and shop photos updated successfully!');
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

        {/* Storefront Customer Ordering Channels (Delivery, Takeaway, Dine-In) */}
        <div className="pt-5 border-t border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Storefront Customer Ordering Channels (ఆర్డరింగ్ ఆప్షన్లు)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn ON or OFF the channels your store currently supports for online customers:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Delivery Switch */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              enableDelivery ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  enableDelivery ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black">Home Delivery</div>
                  <div className="text-[10px] text-slate-400">ఇంటి వద్దకు డెలివరీ {enableDelivery ? '(🟢 ఆన్)' : '(🔴 ఆఫ్)'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableDelivery(!enableDelivery)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  enableDelivery ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title="Toggle Home Delivery"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableDelivery ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Takeaway Switch */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              enableTakeaway ? 'bg-amber-500/10 border-amber-500/30 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  enableTakeaway ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black">Takeaway / Pickup</div>
                  <div className="text-[10px] text-slate-400">స్టోర్ పికప్ / పార్సిల్ {enableTakeaway ? '(🟢 ఆన్)' : '(🔴 ఆఫ్)'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableTakeaway(!enableTakeaway)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  enableTakeaway ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                title="Toggle Takeaway / Pickup"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableTakeaway ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Dine-In Switch */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              enableDineIn ? 'bg-purple-500/10 border-purple-500/30 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  enableDineIn ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black">Dine-In Booking</div>
                  <div className="text-[10px] text-slate-400">టేబుల్ వద్ద ఆర్డరింగ్ {enableDineIn ? '(🟢 ఆన్)' : '(🔴 ఆఫ్)'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableDineIn(!enableDineIn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  enableDineIn ? 'bg-purple-500' : 'bg-slate-700'
                }`}
                title="Toggle Dine-In Table Booking"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableDineIn ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Shop Banner URL</label>
                <label className="cursor-pointer text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload Banner File</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                  />
                </label>
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Shop Logo / Facade Photo URL</label>
                <label className="cursor-pointer text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload Logo File</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
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

      {/* Cloudinary Image & Media Cloud Storage Settings */}
      <div className="p-6 rounded-3xl border border-indigo-500/30 bg-slate-900/80 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Cloudinary Cloud Image Storage</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CDN & Fast Delivery
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct uploads from phone gallery or PC are hosted on Cloudinary and linked in PostgreSQL Neon DB.
              </p>
            </div>
          </div>
          <a
            href="https://cloudinary.com/users/register_free"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold underline"
          >
            <span>Free 25GB Account</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {cloudinarySaved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✅ Cloudinary credentials saved in browser storage successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveCloudinary} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cloudinary Cloud Name
              </label>
              <input
                type="text"
                placeholder="e.g. mithracrm or your_cloud_name"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found on your Cloudinary Dashboard under "Cloud name".
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Upload Preset (Unsigned)
              </label>
              <input
                type="text"
                placeholder="e.g. mithra_unsigned or your_preset"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Cloudinary Settings → Upload → Add Upload Preset (Signing Mode: Unsigned).
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition">
                {testingUpload ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Testing Upload...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Test Upload from Device</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTestUpload}
                  disabled={testingUpload}
                />
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
            >
              Save Cloudinary Configuration
            </button>
          </div>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {testResult.success ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold">Image Upload Succeeded!</p>
                    <p className="text-[10px] text-emerald-400/80 truncate max-w-sm">{testResult.url}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Upload failed: {testResult.error}</span>
                </>
              )}
            </div>
            {testResult.url && (
              <img src={testResult.url} alt="Test" className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40" />
            )}
          </div>
        )}
      </div>

      {/* Vendor Storefront QR Code & Table Standee Card */}
      <div className="p-6 rounded-3xl border border-sky-500/30 bg-slate-900/80 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Digital QR Code & Dining Table Standee</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Customer Ordering
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generate high-resolution scannable QR codes, send on WhatsApp, or print table standees with table numbers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-lg shadow-sky-500/20 active:scale-95 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Open QR Code & Standee Generator</span>
          </button>
        </div>
      </div>

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

      {/* Vendor QR Code & Table Standee Modal */}
      <VendorQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        merchant={merchant}
      />
    </div>
  );
}
