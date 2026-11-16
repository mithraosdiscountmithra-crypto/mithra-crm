import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { playOrderChime } from '../utils/sound';
import { 
  Store, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  CreditCard, 
  BookOpen, 
  Sparkles, 
  Phone, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Filter, 
  RotateCcw, 
  Package, 
  X, 
  ChevronRight, 
  User,
  Check,
  Percent,
  BadgeAlert,
  Send,
  Eye,
  ListOrdered,
  Volume2,
  Camera,
  UtensilsCrossed,
  Banknote,
  PlusCircle,
  Image as ImageIcon
} from 'lucide-react';

export default function CustomerStorefront({ initialSubView = 'store' }) {
  const { merchant } = useAuth();
  const tenantId = merchant?.id || 1;

  // Active sub-view: 'store' (Live Customer Storefront) or 'orders' (Merchant Order Fulfillment)
  const [subView, setSubView] = useState(initialSubView);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  // Storefront Catalog & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State: { [productId]: { product, quantity } }
  const [cart, setCart] = useState({});
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // VIP / Mithra Plus Membership Verification
  const [membershipPhone, setMembershipPhone] = useState('');
  const [isCheckingVip, setIsCheckingVip] = useState(false);
  const [vipStatus, setVipStatus] = useState(null); // { has_membership, customer, membership, message }
  const [vipError, setVipError] = useState('');

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState('delivery'); // 'delivery', 'pickup', or 'dine_in'
  const [tableNumber, setTableNumber] = useState(''); // Table number for dine-in
  const [guestsCount, setGuestsCount] = useState('2'); // Number of guests
  const [paymentMode, setPaymentMode] = useState('online'); // 'online', 'cash', or 'khata'
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Vendor Add Menu Item Modal State
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    product_name: '',
    category: 'Beverages',
    selling_price: '',
    stock_quantity: '50',
    unit: 'pcs',
    is_veg: true,
    description: ''
  });
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Vendor Shop Photo & Banner Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    banner_url: '',
    photo_url: ''
  });
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Merchant Orders Management State
  const [merchantOrders, setMerchantOrders] = useState([]);
  const [merchantOrdersSummary, setMerchantOrdersSummary] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Fetch Storefront Catalog
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.customer.getProducts(tenantId);
      if (res.success) {
        setStoreInfo(res.merchant);
        setPhotoForm({
          banner_url: res.merchant?.banner_url || '',
          photo_url: res.merchant?.photo_url || ''
        });
        setProducts(res.products || []);
        setCategories(res.categories || ['All']);
      } else {
        setError(res.error || 'Failed to load storefront catalog.');
      }
    } catch (err) {
      console.error('Error loading storefront catalog:', err);
      setError(err.message || 'Error connecting to storefront server.');
    } finally {
      setLoading(false);
    }
  };

  // Add New Menu Item Handler
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.product_name.trim()) {
      alert('Please enter a dish or product name.');
      return;
    }
    if (!menuForm.selling_price || parseFloat(menuForm.selling_price) <= 0) {
      alert('Please enter a valid selling price.');
      return;
    }
    try {
      setIsSavingMenu(true);
      const res = await api.products.create({
        product_name: menuForm.product_name.trim(),
        category: menuForm.category,
        selling_price: parseFloat(menuForm.selling_price),
        purchase_price: parseFloat(menuForm.selling_price) * 0.6,
        stock_quantity: parseInt(menuForm.stock_quantity, 10) || 50,
        low_stock_threshold: 5,
        unit: menuForm.unit || 'pcs'
      });
      if (res.success) {
        alert(`✅ Dish "${menuForm.product_name}" added to menu successfully!`);
        setIsAddMenuModalOpen(false);
        setMenuForm({
          product_name: '',
          category: 'Beverages',
          selling_price: '',
          stock_quantity: '50',
          unit: 'pcs',
          is_veg: true,
          description: ''
        });
        fetchCatalog();
      } else {
        alert(res.error || 'Failed to add menu item');
      }
    } catch (err) {
      alert(err.message || 'Error creating menu item');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Update Shop Photo & Banner Handler
  const handleSaveShopPhoto = async (e) => {
    e.preventDefault();
    try {
      setIsSavingPhoto(true);
      const res = await api.auth.updateProfile({
        banner_url: photoForm.banner_url,
        photo_url: photoForm.photo_url
      });
      if (res.success) {
        setStoreInfo(prev => ({
          ...prev,
          banner_url: photoForm.banner_url || prev?.banner_url,
          photo_url: photoForm.photo_url || prev?.photo_url
        }));
        alert('✅ Shop photo and storefront banner updated successfully!');
        setIsPhotoModalOpen(false);
      } else {
        alert(res.error || 'Failed to update shop photo');
      }
    } catch (err) {
      alert(err.message || 'Failed to update shop photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Fetch Merchant Storefront Orders
  const fetchMerchantOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.customer.getMerchantOrders();
      if (res.success) {
        setMerchantOrders(res.orders || []);
        setMerchantOrdersSummary(res.summary || null);
      }
    } catch (err) {
      console.error('Error fetching storefront orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [tenantId]);

  useEffect(() => {
    if (subView === 'orders') {
      fetchMerchantOrders();
      const interval = setInterval(fetchMerchantOrders, 6000);
      return () => clearInterval(interval);
    }
  }, [subView]);

  // Cart Calculations
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.quantity, 0), [cartItems]);
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (parseFloat(it.product.selling_price || 0) * it.quantity), 0);
  }, [cartItems]);

  const discountPercent = vipStatus?.has_membership ? parseFloat(vipStatus.membership?.discount_percent || 0) : 0;
  const discountAmount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    return parseFloat(((subtotal * discountPercent) / 100).toFixed(2));
  }, [subtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Cart Actions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty >= product.stock_quantity) return prev; // Cannot exceed stock
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: currentQty + 1
        }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1
        }
      };
    });
  };

  const deleteFromCart = (productId) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // VIP Membership Check Handler
  const handleVerifyMembership = async (e) => {
    if (e) e.preventDefault();
    if (!membershipPhone || !membershipPhone.trim()) {
      setVipError('Please enter a registered phone number.');
      return;
    }
    try {
      setIsCheckingVip(true);
      setVipError('');
      const res = await api.customer.checkMembership(tenantId, membershipPhone.trim());
      if (res.success && res.has_membership) {
        setVipStatus(res);
        // Autofill checkout details if available
        if (res.customer?.name && !customerName) {
          setCustomerName(res.customer.name);
        }
        if (res.customer?.phone && !customerPhone) {
          setCustomerPhone(res.customer.phone);
        }
      } else {
        setVipStatus({ has_membership: false, message: res.message || 'No active VIP membership found.' });
      }
    } catch (err) {
      console.error('VIP verification failed:', err);
      setVipError('Failed to verify membership. Please verify phone number.');
    } finally {
      setIsCheckingVip(false);
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items to checkout.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and phone number.');
      return;
    }
    if (orderType === 'delivery' && !customerAddress.trim()) {
      alert('Please provide your delivery address.');
      return;
    }
    if (orderType === 'dine_in' && !tableNumber.trim()) {
      alert('Please enter your Table Number (e.g. Table 4) for Dine-in orders.');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const payload = {
        tenant_id: tenantId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: orderType === 'delivery' ? customerAddress.trim() : '',
        order_type: orderType,
        table_number: orderType === 'dine_in' ? tableNumber.trim() : '',
        guests_count: orderType === 'dine_in' ? guestsCount : '',
        payment_mode: paymentMode,
        membership_phone: membershipPhone ? membershipPhone.trim() : customerPhone.trim(),
        notes: orderNotes.trim(),
        items: cartItems.map(it => ({
          product_id: it.product.id,
          product_name: it.product.product_name,
          quantity: it.quantity,
          unit_price: parseFloat(it.product.selling_price || 0)
        }))
      };

      const res = await api.customer.placeOrder(payload);
      if (res.success) {
        setOrderSuccessData(res);
        clearCart();
        setIsMobileCartOpen(false);
        // Refresh catalog to reflect decremented stock
        fetchCatalog();
      } else {
        alert(res.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'An error occurred during checkout.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Merchant Status Transition Handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.customer.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setMerchantOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert(res.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Filtered Merchant Orders
  const filteredMerchantOrders = useMemo(() => {
    if (orderFilterStatus === 'ALL') return merchantOrders;
    return merchantOrders.filter(o => o.status === orderFilterStatus);
  }, [merchantOrders, orderFilterStatus]);

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Mithra CRM • Digital Storefront</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{storeInfo?.store_name || 'Mithra CRM Digital Storefront'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Live Catalog
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse live merchant inventory, verify Mithra Plus VIP membership for instant discounts, and checkout with online UPI or Pay Later on Khata.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Quick Vendor Management Actions */}
          <button
            onClick={() => setIsAddMenuModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Add a new dish or product to your storefront menu"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Add Menu Item</span>
          </button>

          <button
            onClick={() => {
              setPhotoForm({
                banner_url: storeInfo?.banner_url || '',
                photo_url: storeInfo?.photo_url || ''
              });
              setIsPhotoModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Change storefront cover banner and store facade photo"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>📸 Change Shop Photo</span>
          </button>

          {/* View Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setSubView('store')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subView === 'store'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Customer Storefront</span>
            </button>
            <button
              onClick={() => setSubView('orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subView === 'orders'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Incoming Orders</span>
              {merchantOrdersSummary?.pendingOrders > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {merchantOrdersSummary.pendingOrders}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: LIVE CUSTOMER STOREFRONT (MOBILE + DESKTOP RESPONSIVE) */}
      {/* ========================================================================= */}
      {subView === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Catalog Column (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Storefront Hero Banner & VIP Phone Checker */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
              {/* Background Shop Banner Cover Image */}
              {storeInfo?.banner_url && (
                <div className="h-36 sm:h-44 w-full overflow-hidden relative">
                  <img
                    src={storeInfo.banner_url}
                    alt={storeInfo?.store_name}
                    className="w-full h-full object-cover brightness-75 hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  <button
                    onClick={() => {
                      setPhotoForm({
                        banner_url: storeInfo?.banner_url || '',
                        photo_url: storeInfo?.photo_url || ''
                      });
                      setIsPhotoModalOpen(true);
                    }}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-white border border-slate-700 flex items-center gap-1.5 hover:bg-slate-900 transition-colors shadow-lg"
                  >
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Edit Banner</span>
                  </button>
                </div>
              )}

              <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Store Facade / Profile Photo Badge */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-amber-400/60 overflow-hidden shadow-2xl shrink-0">
                    {storeInfo?.photo_url ? (
                      <img
                        src={storeInfo.photo_url}
                        alt="Shop Facade"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black text-2xl">
                        {storeInfo?.store_name?.[0] || '🏪'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mithra Plus VIP Loyalty Store</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {storeInfo?.store_name || 'Store'}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md">
                      {storeInfo?.address ? `📍 ${storeInfo.address}, ${storeInfo.city || ''}` : 'Instant delivery, store pickup & dine-in table ordering.'}
                    </p>
                  </div>
                </div>

                {/* VIP Verification Card */}
                <div className="bg-slate-950/80 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800 w-full md:w-80 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> VIP Member Check
                    </span>
                    {vipStatus?.has_membership && (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {vipStatus.membership?.discount_percent}% OFF
                      </span>
                    )}
                  </div>

                  {vipStatus?.has_membership ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                      <div className="font-bold text-emerald-300">
                        🎉 VIP Member: {vipStatus.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Plan: <span className="font-semibold text-white">{vipStatus.membership?.plan_name}</span> ({vipStatus.membership?.discount_percent}% VIP Discount)
                      </div>
                      <button
                        onClick={() => { setVipStatus(null); setMembershipPhone(''); }}
                        className="text-[10px] text-slate-400 hover:text-white underline mt-1"
                      >
                        Change Member Number
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyMembership} className="space-y-2">
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="Enter VIP member phone..."
                          value={membershipPhone}
                          onChange={(e) => setMembershipPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isCheckingVip}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isCheckingVip ? (
                            <span>Checking...</span>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Verify VIP Discount</span>
                            </>
                          )}
                        </button>
                      </div>
                      {vipError && (
                        <p className="text-[11px] text-rose-400 font-medium">{vipError}</p>
                      )}
                      {vipStatus && !vipStatus.has_membership && (
                        <p className="text-[11px] text-slate-400 font-medium">{vipStatus.message}</p>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar & Category Horizontal Scroll */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search coffee beans, syrups, merchandise, equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills (Touch friendly scroller for mobile) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      activeCategory === cat
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
                <p className="text-xs font-semibold">Loading live catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Products Found</h3>
                <p className="text-xs max-w-sm mx-auto">
                  No active products with available stock match "{searchQuery || activeCategory}". Try searching for another item or view All categories.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const inCartQty = cart[product.id]?.quantity || 0;
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isMaxReached = inCartQty >= product.stock_quantity;

                  return (
                    <div
                      key={product.id}
                      className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-xl group"
                    >
                      <div>
                        {/* Category & Stock Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {product.category || 'General'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            product.stock_quantity <= 5
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {product.stock_quantity} {product.unit || 'units'} left
                          </span>
                        </div>

                        {/* Title & SKU */}
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {product.product_name}
                        </h3>
                        {product.sku && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">SKU: {product.sku}</p>
                        )}
                      </div>

                      {/* Pricing & Cart Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-base font-black text-white">
                            ₹{parseFloat(product.selling_price).toFixed(2)}
                          </div>
                          {vipStatus?.has_membership && (
                            <div className="text-[10px] font-bold text-amber-400">
                              VIP: ₹{(parseFloat(product.selling_price) * (1 - discountPercent / 100)).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {/* Stepper or Add button */}
                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 rounded-xl p-1 shadow-sm">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-emerald-400 px-1.5 min-w-[20px] text-center">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={isMaxReached}
                              className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Desktop Cart Panel (Sticky on desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Your Cart</h3>
                    <p className="text-[11px] text-slate-400">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {cartItemCount > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cartItems.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-xs font-medium">Your shopping bag is empty.</p>
                  <p className="text-[11px] text-slate-600">Select products from the catalog to build your order.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{product.product_name}</div>
                        <div className="text-[10px] text-slate-400">₹{parseFloat(product.selling_price).toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white px-1">{quantity}</span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={quantity >= product.stock_quantity}
                          className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteFromCart(product.id)}
                          className="w-6 h-6 rounded-md text-slate-500 hover:text-rose-400 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              {cartItems.length > 0 && (
                <form onSubmit={handlePlaceOrder} className="space-y-4 pt-3 border-t border-slate-800">
                  {/* Delivery vs Pickup vs Dine-In Selector */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        orderType === 'delivery'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('pickup')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        orderType === 'pickup'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('dine_in')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        orderType === 'dine_in'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Dine-In</span>
                    </button>
                  </div>

                  {/* Dine-In Table Booking Form */}
                  {orderType === 'dine_in' && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                        <span className="flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400" />
                          Table Booking
                        </span>
                        <span className="text-[10px] text-purple-400/80">Dine-in Order</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 block mb-1">Table Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. Table 4"
                            required
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-300 block mb-1">Number of Guests</label>
                          <select
                            value={guestsCount}
                            onChange={(e) => setGuestsCount(e.target.value)}
                            className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                          >
                            <option value="1">1 Guest</option>
                            <option value="2">2 Guests</option>
                            <option value="3">3 Guests</option>
                            <option value="4">4 Guests</option>
                            <option value="5">5 Guests</option>
                            <option value="6+">6+ Guests</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Details */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Rivera"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {orderType === 'delivery' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Delivery Address *</label>
                        <textarea
                          rows={2}
                          placeholder="Street, Building, Apartment No, Landmark..."
                          required
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Mode Selector: Online / UPI vs Cash on Delivery / Counter vs Digital Khata */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 block">Payment Mode</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('online')}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          paymentMode === 'online'
                            ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mb-0.5">
                          <CreditCard className="w-3 h-3" />
                          <span>Online/UPI</span>
                        </div>
                        <p className="text-[9px] text-slate-400">Instant QR</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode('cash')}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          paymentMode === 'cash'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-0.5">
                          <Banknote className="w-3 h-3" />
                          <span>{orderType === 'delivery' ? 'Cash on Del.' : 'Cash Pay'}</span>
                        </div>
                        <p className="text-[9px] text-slate-400">
                          {orderType === 'delivery' ? 'COD at Door' : 'Pay at Counter'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode('khata')}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          paymentMode === 'khata'
                            ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 mb-0.5">
                          <BookOpen className="w-3 h-3" />
                          <span>Pay Later</span>
                        </div>
                        <p className="text-[9px] text-slate-400">Khata (7d)</p>
                      </button>
                    </div>
                  </div>

                  {/* Price Summary Breakdown */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-amber-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> VIP Discount ({discountPercent}%)
                        </span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-400 font-bold">FREE</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                      <span>Total Amount</span>
                      <span className="text-emerald-400">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <span>Place Order • ₹{totalAmount.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM STICKY CART BAR & SLIDE-UP DRAWER */}
      {/* ========================================================================= */}
      {subView === 'store' && cartItemCount > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <div className="max-w-md mx-auto bg-emerald-600 rounded-2xl p-3 px-4 shadow-2xl flex items-center justify-between text-white border border-emerald-400/30">
            <div>
              <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart</span>
              </div>
              <div className="text-base font-black">₹{totalAmount.toFixed(2)}</div>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="bg-white text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <span>View Cart & Pay</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Modal / Drawer */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Review Order & Checkout</h3>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Cart Items */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{product.product_name}</div>
                    <div className="text-[10px] text-slate-400">₹{parseFloat(product.selling_price).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white px-1.5">{quantity}</span>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={quantity >= product.stock_quantity}
                      className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Form Details */}
            <form onSubmit={handlePlaceOrder} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === 'delivery' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === 'pickup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderType === 'dine_in' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400'
                  }`}
                >
                  🍽️ Dine-In
                </button>
              </div>

              {/* Mobile Dine-In Table Booking Form */}
              {orderType === 'dine_in' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400" />
                      Table Booking
                    </span>
                    <span className="text-[10px] text-purple-400/80">Dine-in Order</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Table Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. Table 4"
                        required
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">Guests</label>
                      <select
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(e.target.value)}
                        className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                      >
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4 Guests</option>
                        <option value="5">5 Guests</option>
                        <option value="6+">6+ Guests</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Your Full Name *"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Your Mobile Number *"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600"
                />
              </div>

              {orderType === 'delivery' && (
                <div>
                  <textarea
                    rows={2}
                    placeholder="Delivery Address *"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 resize-none"
                  />
                </div>
              )}

              {/* Payment selector: Online, Cash on Del/Counter, Pay Later Khata */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMode === 'online' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span className="block text-[10px]">UPI/Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMode === 'cash' ? 'bg-amber-500/15 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span className="block text-[10px]">{orderType === 'delivery' ? 'COD' : 'Cash Pay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('khata')}
                  className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMode === 'khata' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span className="block text-[10px]">Khata</span>
                </button>
              </div>

              {/* Price summary */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>VIP Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-800 flex justify-between font-black text-sm text-white">
                  <span>Net Payable</span>
                  <span className="text-emerald-400">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2"
              >
                {isSubmittingOrder ? <span>Placing Order...</span> : <span>Confirm Order • ₹{totalAmount.toFixed(2)}</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER CONFIRMATION MODAL & WHATSAPP SHARE */}
      {/* ========================================================================= */}
      {orderSuccessData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setOrderSuccessData(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white">Order Confirmed!</h2>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-emerald-400 text-xs font-mono font-bold">
                Order #{orderSuccessData.order?.order_number}
              </div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                {orderSuccessData.message}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Customer</span>
                <span className="font-semibold text-white">{orderSuccessData.order?.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fulfillment Mode</span>
                <span className="font-semibold text-white uppercase flex items-center gap-1">
                  {orderSuccessData.order?.order_type === 'dine_in' ? (
                    <span className="text-purple-400 font-bold">
                      🍽️ Dine-In {orderSuccessData.order?.table_number ? `(Table #${orderSuccessData.order.table_number})` : ''}
                    </span>
                  ) : orderSuccessData.order?.order_type === 'pickup' ? (
                    '🏪 In-Store Pickup'
                  ) : (
                    '🚚 Home Delivery'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Mode</span>
                <span className={`font-bold ${
                  orderSuccessData.order?.payment_mode === 'cash' || orderSuccessData.order?.payment_mode === 'cod'
                    ? 'text-amber-400'
                    : orderSuccessData.order?.payment_mode === 'khata'
                    ? 'text-indigo-400'
                    : 'text-emerald-400'
                }`}>
                  {orderSuccessData.order?.payment_mode === 'cash' || orderSuccessData.order?.payment_mode === 'cod'
                    ? (orderSuccessData.order?.order_type === 'delivery' ? '💵 Cash on Delivery (COD)' : '💵 Cash at Counter/Table')
                    : orderSuccessData.order?.payment_mode === 'khata'
                    ? 'Pay Later (Khata Ledger)'
                    : 'Paid Online / UPI'}
                </span>
              </div>

              {orderSuccessData.khata_entry && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  📋 ₹{orderSuccessData.khata_entry.amount} has been added to your Customer Khata ledger balance (Due date: {orderSuccessData.khata_entry.due_date || '7 days'}).
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-sm text-white">
                <span>Total Amount</span>
                <span className="text-emerald-400">₹{orderSuccessData.order?.total_amount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {orderSuccessData.whatsapp_order_link && (
                <a
                  href={orderSuccessData.whatsapp_order_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order Receipt via WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => setOrderSuccessData(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: MERCHANT STOREFRONT ORDERS FULFILLMENT STREAM */}
      {/* ========================================================================= */}
      {subView === 'orders' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          {merchantOrdersSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block mb-1">Total Store Orders</span>
                <div className="text-xl sm:text-2xl font-black text-white">{merchantOrdersSummary.totalOrders}</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block mb-1">Online Store Revenue</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">₹{merchantOrdersSummary.totalRevenue}</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block mb-1">Pending Fulfillment</span>
                <div className="text-xl sm:text-2xl font-black text-amber-400">{merchantOrdersSummary.pendingOrders}</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 block mb-1">Completed</span>
                <div className="text-xl sm:text-2xl font-black text-sky-400">{merchantOrdersSummary.completedOrders}</div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['ALL', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    orderFilterStatus === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={playOrderChime}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 border border-amber-500/30 transition-all shadow-sm active:scale-95"
                title="Test synthesized incoming order notification sound"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Sound</span>
              </button>

              <button
                onClick={fetchMerchantOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Orders</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {loadingOrders ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
              <p className="text-xs font-semibold">Loading orders stream...</p>
            </div>
          ) : filteredMerchantOrders.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <ListOrdered className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Orders Found</h3>
              <p className="text-xs">No customer orders matching the status "{orderFilterStatus}".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMerchantOrders.map((order) => {
                const isPending = order.status === 'PENDING' || order.status === 'CONFIRMED';
                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-white">{order.order_number}</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : order.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : order.status === 'PREPARING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>

                          {/* Dine-In Table Badge */}
                          {(order.order_type === 'dine_in' || order.notes?.includes('[Dine-In')) && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shadow-sm">
                              🍽️ {order.table_number ? `Table #${order.table_number}` : (order.notes?.match(/Table #([^\] -]+)/)?.[0] || 'Dine-In Table')}
                            </span>
                          )}

                          {/* Payment Badge (Cash on Delivery / UPI / Khata) */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            order.payment_mode === 'cash' || order.payment_mode === 'cod' || order.notes?.includes('[Cash on Delivery') || order.notes?.includes('[Pay Cash')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : order.payment_mode === 'khata'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {order.payment_mode === 'cash' || order.payment_mode === 'cod' || order.notes?.includes('[Cash on Delivery') || order.notes?.includes('[Pay Cash')
                              ? (order.order_type === 'delivery' ? '💵 Cash on Delivery (COD)' : '💵 Cash at Counter/Table')
                              : order.payment_mode === 'khata' ? 'Digital Khata' : 'Online / UPI'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Placed on {new Date(order.created_at).toLocaleString()} • Type: <span className="font-bold uppercase text-white">{order.order_type}</span>
                        </p>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-2">
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-1.5">
                            {order.status !== 'PREPARING' && order.status !== 'OUT_FOR_DELIVERY' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                disabled={updatingOrderId === order.id}
                                className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-colors"
                              >
                                Mark Preparing
                              </button>
                            )}
                            {order.status !== 'OUT_FOR_DELIVERY' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                                disabled={updatingOrderId === order.id}
                                className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold transition-colors"
                              >
                                Dispatch
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                              disabled={updatingOrderId === order.id}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                            >
                              Complete
                            </button>
                          </div>
                        )}

                        {order.customer_phone && (
                          <a
                            href={`https://wa.me/${String(order.customer_phone).replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(order.customer_name)},%20regarding%20your%20Store%20Order%20${order.order_number}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Order Details: Customer Info & Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-slate-400 font-bold">Customer Details</div>
                        <div className="text-white font-semibold">{order.customer_name} ({order.customer_phone})</div>
                        {order.customer_address && (
                          <div className="text-slate-400 flex items-start gap-1 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span>{order.customer_address}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-amber-400 text-[11px] pt-1">
                            Note: {order.notes}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-slate-400 font-bold">Line Items Ordered</div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                              <span>{it.product_name} x {it.quantity}</span>
                              <span className="font-semibold text-white">₹{parseFloat(it.subtotal || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-xs">
                          <span className="text-slate-400">Net Total</span>
                          <span className="text-emerald-400 text-sm">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VENDOR ADD NEW MENU ITEM */}
      {/* ========================================================================= */}
      {isAddMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddMenuModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Add New Menu Item</h3>
                <p className="text-xs text-slate-400">Instantly publish dishes or products to your digital storefront</p>
              </div>
            </div>

            {/* Quick 1-Click Dish Presets */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                ⚡ Quick 1-Click Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Chicken Dum Biryani', cat: 'Main Course', price: '280', veg: false },
                  { name: 'Special Cappuccino', cat: 'Beverages', price: '160', veg: true },
                  { name: 'Paneer Butter Masala', cat: 'Main Course', price: '240', veg: true },
                  { name: 'Crispy Masala Dosa', cat: 'Fast Food', price: '90', veg: true },
                  { name: 'Chocolate Brownie', cat: 'Desserts', price: '140', veg: true },
                  { name: 'Fresh Mango Smoothie', cat: 'Beverages', price: '120', veg: true },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMenuForm(prev => ({
                        ...prev,
                        product_name: preset.name,
                        category: preset.cat,
                        selling_price: preset.price,
                        is_veg: preset.veg
                      }));
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700 transition-all font-medium"
                  >
                    {preset.veg ? '🟢' : '🔴'} {preset.name} (₹{preset.price})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Dish / Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Dum Biryani, Cold Brew..."
                  value={menuForm.product_name}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, product_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Retail & Packaged">Retail & Packaged</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 180"
                    value={menuForm.selling_price}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, selling_price: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={menuForm.stock_quantity}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Dietary Type</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setMenuForm(prev => ({ ...prev, is_veg: true }))}
                      className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        menuForm.is_veg
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>🟢 Pure Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuForm(prev => ({ ...prev, is_veg: false }))}
                      className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        !menuForm.is_veg
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>🔴 Non-Veg</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMenu}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingMenu ? <span>Adding Dish...</span> : <span>Publish to Menu</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VENDOR CHANGE SHOP PHOTO & STOREFRONT BANNER */}
      {/* ========================================================================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Customize Shop Photo & Banner</h3>
                <p className="text-xs text-slate-400">Personalize your customer-facing digital storefront</p>
              </div>
            </div>

            {/* Curated 1-Click Storefront Themes */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                🎨 Curated 1-Click Themes & Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: '☕ Cafe & Roastery',
                    banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
                    photo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'
                  },
                  {
                    label: '🍽️ Restaurant & Dining',
                    banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
                    photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
                  },
                  {
                    label: '🍰 Bakery & Sweets',
                    banner: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
                    photo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80'
                  },
                  {
                    label: '🛒 Supermarket / Grocery',
                    banner: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
                    photo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80'
                  }
                ].map((theme, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPhotoForm({
                        banner_url: theme.banner,
                        photo_url: theme.photo
                      });
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-semibold text-slate-200"
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveShopPhoto} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Storefront Banner URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoForm.banner_url}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, banner_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Shop Logo / Facade Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoForm.photo_url}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Preview</span>
                <div className="relative rounded-xl overflow-hidden h-24 bg-slate-900 border border-slate-800">
                  {photoForm.banner_url ? (
                    <img src={photoForm.banner_url} alt="Preview Banner" className="w-full h-full object-cover brightness-75" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-600">No banner selected</div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-700">
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-800 shrink-0">
                      {photoForm.photo_url ? (
                        <img src={photoForm.photo_url} alt="Preview Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] flex items-center justify-center h-full">🏪</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white">{storeInfo?.store_name || 'My Store'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhoto}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingPhoto ? <span>Saving...</span> : <span>Save Shop Photos</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
