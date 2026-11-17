import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { playOrderChime } from '../utils/sound';
import { uploadToCloudinary } from '../utils/cloudinary';
import VendorQRModal from '../components/VendorQRModal';
import Modal from '../components/Modal';
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
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  QrCode,
  Crown,
  Sliders
} from 'lucide-react';

export default function CustomerStorefront({ initialSubView = 'store', isPublicCustomer = false }) {
  const { merchant } = useAuth();
  
  // Parse dynamic tenant/merchant ID and Table Number from URL (e.g. ?store=1&table=4)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const paramTenant = urlParams?.get('store') || urlParams?.get('merchantId') || urlParams?.get('merchant_id');
  const paramTable = urlParams?.get('table');
  const tenantId = paramTenant ? parseInt(paramTenant, 10) : (merchant?.id || 1);

  // Check if viewing as customer (scanned QR code or public store link)
  // Vendor controls (+ Add Menu Item, Change Shop Photo, Store QR, Incoming Orders) are strictly hidden for customers!
  const isVendorView = Boolean(
    merchant && 
    merchant.id === tenantId && 
    !isPublicCustomer && 
    (!urlParams || !urlParams.has('store'))
  );

  // Active sub-view: 'store' (Live Customer Storefront) or 'orders' (Merchant Order Fulfillment)
  // Customers are locked into the ordering storefront view!
  const [subView, setSubView] = useState(isVendorView ? initialSubView : 'store');

  // Vendor QR Code & Table Standee Modal
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  useEffect(() => {
    if (paramTable) {
      setOrderType('dine_in');
      setTableNumber(paramTable);
    }
  }, [paramTable]);

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

  // VIP / Mithra Plus Membership Verification & Storefront Pass Purchases
  const [membershipPhone, setMembershipPhone] = useState('');
  const [isCheckingVip, setIsCheckingVip] = useState(false);
  const [vipStatus, setVipStatus] = useState(null); // { has_membership, customer, membership, message }
  const [vipError, setVipError] = useState('');

  // Storefront VIP Pass Purchase State
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedStorePlanId, setSelectedStorePlanId] = useState('');
  const [vipBuyerName, setVipBuyerName] = useState('');
  const [isJoiningVIP, setIsJoiningVIP] = useState(false);
  const [showBuyVipModal, setShowBuyVipModal] = useState(false);
  const [joinVipSuccess, setJoinVipSuccess] = useState('');

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState('delivery'); // 'delivery', 'pickup', or 'dine_in'
  const [tableNumber, setTableNumber] = useState(''); // Table number for dine-in
  const [guestsCount, setGuestsCount] = useState('2'); // Number of guests
  const [paymentMode, setPaymentMode] = useState('online'); // 'online', 'cash'
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Ordering Channels Config (Delivery, Takeaway / Pickup, Dine-In Table Booking)
  const [orderChannels, setOrderChannels] = useState(() => {
    try {
      const saved = localStorage.getItem(`store_order_channels_${tenantId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      delivery: true,
      takeaway: true,
      dine_in: true
    };
  });

  const handleToggleChannel = (channelKey) => {
    setOrderChannels(prev => {
      const updated = { ...prev, [channelKey]: !prev[channelKey] };
      // Prevent turning all 3 channels off simultaneously
      if (!updated.delivery && !updated.takeaway && !updated.dine_in) {
        alert('⚠️ At least one order option (Delivery, Takeaway, or Dine-In) must remain enabled.');
        return prev;
      }
      try {
        localStorage.setItem(`store_order_channels_${tenantId}`, JSON.stringify(updated));
      } catch (e) {}

      // If merchant is logged in, sync to server profile
      if (!isPublicCustomer) {
        api.auth.updateProfile({
          enable_delivery: updated.delivery,
          enable_takeaway: updated.takeaway,
          enable_dine_in: updated.dine_in
        }).catch(() => {});
      }

      return updated;
    });
  };

  // Ensure orderType matches an active enabled channel
  useEffect(() => {
    if (!orderChannels.delivery && orderType === 'delivery') {
      if (orderChannels.takeaway) setOrderType('pickup');
      else if (orderChannels.dine_in) setOrderType('dine_in');
    } else if (!orderChannels.takeaway && orderType === 'pickup') {
      if (orderChannels.delivery) setOrderType('delivery');
      else if (orderChannels.dine_in) setOrderType('dine_in');
    } else if (!orderChannels.dine_in && orderType === 'dine_in') {
      if (orderChannels.delivery) setOrderType('delivery');
      else if (orderChannels.takeaway) setOrderType('pickup');
    }
  }, [orderChannels, orderType]);

  // Vendor Add Menu Item Modal State
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    product_name: '',
    category: 'Beverages',
    selling_price: '',
    stock_quantity: '50',
    unit: 'pcs',
    is_veg: true,
    image_url: '', // Optional Dish Photo URL
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

  // Image Uploading States (Cloudinary / Direct Gallery Upload)
  const [isUploadingDishPhoto, setIsUploadingDishPhoto] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleDishPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingDishPhoto(true);
      const res = await uploadToCloudinary(file);
      if (res.success && res.url) {
        setMenuForm(prev => ({ ...prev, image_url: res.url }));
      } else {
        alert(res.error || 'Failed to upload image. Please try again.');
      }
    } catch (err) {
      alert(err.message || 'Error processing image file.');
    } finally {
      setIsUploadingDishPhoto(false);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const res = await uploadToCloudinary(file);
      if (res.success && res.url) {
        setPhotoForm(prev => ({ ...prev, banner_url: res.url }));
      } else {
        alert(res.error || 'Failed to upload banner. Please try again.');
      }
    } catch (err) {
      alert(err.message || 'Error processing banner file.');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const res = await uploadToCloudinary(file);
      if (res.success && res.url) {
        setPhotoForm(prev => ({ ...prev, photo_url: res.url }));
      } else {
        alert(res.error || 'Failed to upload logo. Please try again.');
      }
    } catch (err) {
      alert(err.message || 'Error processing logo file.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

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
        // Sync Ordering Channels (Delivery, Takeaway, Dine-In)
        try {
          const raw = localStorage.getItem(`store_order_channels_${tenantId}`);
          if (raw) {
            setOrderChannels(JSON.parse(raw));
          } else if (res.merchant) {
            setOrderChannels({
              delivery: res.merchant.enable_delivery !== false,
              takeaway: res.merchant.enable_takeaway !== false,
              dine_in: res.merchant.enable_dine_in !== false
            });
          }
        } catch (e) {}
        setPhotoForm({
          banner_url: res.merchant?.banner_url || '',
          photo_url: res.merchant?.photo_url || ''
        });
        setProducts(res.products || []);
        setCategories(res.categories || ['All']);
        if (res.membership_plans && res.membership_plans.length > 0) {
          setAvailablePlans(res.membership_plans);
          setSelectedStorePlanId(res.membership_plans[0].id);
        } else {
          const defaultPlans = [
            { id: 1, plan_name: 'Silver Member', discount_percent: 10, price: 99, validity_months: 12, benefits_description: '10% instant discount on all orders' },
            { id: 2, plan_name: 'Gold VIP Pass', discount_percent: 20, price: 199, validity_months: 12, benefits_description: '20% VIP discount on all orders + priority billing' },
            { id: 3, plan_name: 'Platinum VIP Elite', discount_percent: 30, price: 299, validity_months: 12, benefits_description: '30% Elite discount + special celebratory perks' }
          ];
          setAvailablePlans(defaultPlans);
          setSelectedStorePlanId(defaultPlans[0].id);
        }
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
        unit: menuForm.unit || 'pcs',
        image_url: menuForm.image_url && menuForm.image_url.trim() ? menuForm.image_url.trim() : null
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
          image_url: '',
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
      setJoinVipSuccess('');
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
        setVipStatus({ has_membership: false, message: res.message || 'No active VIP membership found for this number.' });
      }
    } catch (err) {
      console.error('VIP verification failed:', err);
      setVipError('Failed to verify membership. Please check phone number.');
    } finally {
      setIsCheckingVip(false);
    }
  };

  // Public Customer Buy VIP Pass Handler (1-Click Storefront Join)
  const handleBuyVIPStorefront = async (e) => {
    if (e) e.preventDefault();
    const phone = (membershipPhone || customerPhone).trim();
    if (!phone) {
      setVipError('Please enter your 10-digit mobile number.');
      return;
    }
    const planToBuy = selectedStorePlanId || (availablePlans[0]?.id || 1);

    try {
      setIsJoiningVIP(true);
      setVipError('');
      setJoinVipSuccess('');

      const res = await api.customer.joinVIP({
        tenant_id: tenantId,
        phone: phone,
        name: vipBuyerName.trim() || customerName.trim() || 'VIP Member',
        plan_id: planToBuy
      });

      if (res.success) {
        setVipStatus({
          has_membership: true,
          customer: res.customer,
          membership: res.membership
        });
        setJoinVipSuccess(res.message);
        if (res.customer?.name) setCustomerName(res.customer.name);
        if (res.customer?.phone) {
          setCustomerPhone(res.customer.phone);
          setMembershipPhone(res.customer.phone);
        }
        setShowBuyVipModal(false);
      } else {
        setVipError(res.error || 'Failed to activate VIP pass.');
      }
    } catch (err) {
      console.error('Error joining VIP:', err);
      setVipError(err.message || 'Error activating VIP pass.');
    } finally {
      setIsJoiningVIP(false);
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
      {/* Top Header & View Switcher - STRICTLY HIDDEN FOR CUSTOMERS SCANNING QR CODE */}
      {isVendorView ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Store className="w-4 h-4" />
              <span>Merchant Management Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{storeInfo?.store_name || 'My Store'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Vendor Mode
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage your live storefront catalog, add dishes with photos, customize banners, and process incoming live orders.
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

            <button
              onClick={() => setIsQRModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="View, download, or print your Store QR Code & Table Standee"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>📱 Store QR & Standee</span>
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

          {/* QUICK ORDER CHANNELS ON/OFF SWITCHER (VENDOR CONTROL) */}
          <div className="w-full pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Customer Ordering Channels (కస్టమర్లకు కనిపించే ఆర్డర్ ఆప్షన్లు)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click switch to enable or disable options instantly on live storefront:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
              {/* 1. Delivery Switch */}
              <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                orderChannels.delivery 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-sm' 
                  : 'bg-slate-950/70 border-slate-800 text-slate-500 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    orderChannels.delivery ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Home Delivery</div>
                    <div className="text-[10px] text-slate-400">
                      {orderChannels.delivery ? '🟢 Active (కస్టమర్లకు ఆన్)' : '🔴 Disabled (ఆపివేయబడింది)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChannel('delivery')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    orderChannels.delivery ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title="Toggle Home Delivery"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    orderChannels.delivery ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* 2. Takeaway Switch */}
              <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                orderChannels.takeaway 
                  ? 'bg-amber-500/10 border-amber-500/30 text-white shadow-sm' 
                  : 'bg-slate-950/70 border-slate-800 text-slate-500 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    orderChannels.takeaway ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Takeaway / Pickup</div>
                    <div className="text-[10px] text-slate-400">
                      {orderChannels.takeaway ? '🟢 Active (స్టోర్ పికప్ ఆన్)' : '🔴 Disabled (ఆపివేయబడింది)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChannel('takeaway')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    orderChannels.takeaway ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  title="Toggle Takeaway / Pickup"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    orderChannels.takeaway ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* 3. Dine-In Booking Switch */}
              <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                orderChannels.dine_in 
                  ? 'bg-purple-500/10 border-purple-500/30 text-white shadow-sm' 
                  : 'bg-slate-950/70 border-slate-800 text-slate-500 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    orderChannels.dine_in ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Dine-In Table Booking</div>
                    <div className="text-[10px] text-slate-400">
                      {orderChannels.dine_in ? '🟢 Active (టేబుల్ బుకింగ్ ఆన్)' : '🔴 Disabled (ఆపివేయబడింది)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleChannel('dine_in')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    orderChannels.dine_in ? 'bg-purple-500' : 'bg-slate-700'
                  }`}
                  title="Toggle Dine-In Table Booking"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    orderChannels.dine_in ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CUSTOMER QR SCANNER HEADER - PURE ORDERING EXPERIENCE */
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-xl shadow-md shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white">{storeInfo?.store_name || 'Welcome to our Store'}</h1>
                {paramTable && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                    🍽️ Table #{paramTable}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {paramTable ? 'Dine-In Contactless Ordering • Pay Cash or Online' : 'Browse live menu & order directly from your mobile'}
              </p>
            </div>
          </div>
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Ordering Open</span>
          </div>
        </div>
      )}

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

                {/* VIP Verification & Pass Purchase Card */}
                <div className="bg-slate-950/80 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-slate-800 w-full md:w-80 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> VIP Member Perks
                    </span>
                    {vipStatus?.has_membership ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {vipStatus.membership?.discount_percent}% OFF
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBuyVipModal(true)}
                        className="text-[10px] text-amber-300 font-bold bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-500/30 transition flex items-center gap-1"
                      >
                        <Crown className="w-2.5 h-2.5 text-amber-400" />
                        <span>+ Buy VIP Pass</span>
                      </button>
                    )}
                  </div>

                  {vipStatus?.has_membership ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>🎉 VIP Member: {vipStatus.customer?.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Plan: <span className="font-semibold text-white">{vipStatus.membership?.plan_name}</span> ({vipStatus.membership?.discount_percent}% VIP Discount Applied)
                      </div>
                      <button
                        onClick={() => { setVipStatus(null); setMembershipPhone(''); }}
                        className="text-[10px] text-slate-400 hover:text-white underline mt-1 block"
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
                          placeholder="Enter mobile number to check..."
                          value={membershipPhone}
                          onChange={(e) => setMembershipPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isCheckingVip}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/20"
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

                      {/* NEW USER / NO ACTIVE PLAN -> SHOW INLINE 1-CLICK VIP PASS PURCHASE */}
                      {vipStatus && !vipStatus.has_membership && (
                        <div className="pt-2.5 border-t border-amber-500/30 space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span>New User? Buy VIP Pass Now:</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                              Instant Discount
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-300">
                            ఈ నెంబర్‌పై ఇంకా VIP ప్లాన్ లేదు. ప్లాన్ ఎంచుకుని వెంటనే జాయిన్ అవ్వండి:
                          </p>

                          <input
                            type="text"
                            placeholder="Your Full Name (e.g. Anil)"
                            value={vipBuyerName}
                            onChange={(e) => setVipBuyerName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />

                          {/* Plan options */}
                          <div className="space-y-1.5">
                            {availablePlans.map((p) => {
                              const isSelected = selectedStorePlanId === p.id || availablePlans.length === 1;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => setSelectedStorePlanId(p.id)}
                                  className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                                    isSelected 
                                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm' 
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                                    <span className="font-bold">{p.plan_name}</span>
                                    <span className="text-[10px] text-amber-300 font-mono">₹{p.price || 0}</span>
                                  </div>
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                                    {p.discount_percent}% OFF
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Big Buy Button */}
                          <button
                            type="button"
                            onClick={handleBuyVIPStorefront}
                            disabled={isJoiningVIP}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                          >
                            {isJoiningVIP ? (
                              <span>Activating VIP Pass...</span>
                            ) : (
                              <>
                                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                                <span>👑 Buy VIP Pass & Apply Discount (జాయిన్ అవ్వండి)</span>
                              </>
                            )}
                          </button>
                        </div>
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
                        {/* Optional Dish Photo Image */}
                        {product.image_url && (
                          <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800/80 relative">
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                            />
                          </div>
                        )}

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
                  {/* Delivery vs Takeaway vs Dine-In Selector (Dynamic based on Vendor Settings) */}
                  <div className={`grid gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 ${
                    ((orderChannels.delivery ? 1 : 0) + (orderChannels.takeaway ? 1 : 0) + (orderChannels.dine_in ? 1 : 0)) === 3
                      ? 'grid-cols-3'
                      : ((orderChannels.delivery ? 1 : 0) + (orderChannels.takeaway ? 1 : 0) + (orderChannels.dine_in ? 1 : 0)) === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-1'
                  }`}>
                    {orderChannels.delivery && (
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
                    )}
                    {orderChannels.takeaway && (
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
                        <span>Takeaway</span>
                      </button>
                    )}
                    {orderChannels.dine_in && (
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
                    )}
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
                    <div className="grid grid-cols-2 gap-2">
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
              {/* Delivery vs Takeaway vs Dine-In Selector (Dynamic based on Vendor Settings) */}
              <div className={`grid gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 ${
                ((orderChannels.delivery ? 1 : 0) + (orderChannels.takeaway ? 1 : 0) + (orderChannels.dine_in ? 1 : 0)) === 3
                  ? 'grid-cols-3'
                  : ((orderChannels.delivery ? 1 : 0) + (orderChannels.takeaway ? 1 : 0) + (orderChannels.dine_in ? 1 : 0)) === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              }`}>
                {orderChannels.delivery && (
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      orderType === 'delivery' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery</span>
                  </button>
                )}
                {orderChannels.takeaway && (
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      orderType === 'pickup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Takeaway</span>
                  </button>
                )}
                {orderChannels.dine_in && (
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      orderType === 'dine_in' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Dine-In</span>
                  </button>
                )}
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

              {/* Payment selector: Online UPI vs Cash on Delivery / Counter */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMode === 'online' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-0.5" />
                  <span className="block text-xs font-bold">UPI / Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMode === 'cash' ? 'bg-amber-500/15 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-0.5" />
                  <span className="block text-xs font-bold">{orderType === 'delivery' ? 'COD' : 'Cash at Counter'}</span>
                </button>
              </div>

              {/* VIP Membership Upsell Banner in Checkout */}
              {!vipStatus?.has_membership && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-indigo-950/40 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-white">Join VIP & Save on this bill!</div>
                      <div className="text-[10px] text-amber-300">Get up to 30% instant discount</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBuyVipModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow transition shrink-0"
                  >
                    👑 Buy Pass
                  </button>
                </div>
              )}

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
      {/* VENDOR MODALS: STRICTLY ACCESSIBLE ONLY TO AUTHENTICATED SHOP OWNERS */}
      {/* ========================================================================= */}
      {isVendorView && (
        <>
          {/* MODAL 1: VENDOR ADD NEW MENU ITEM */}
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
                  { name: 'Chicken Dum Biryani', cat: 'Main Course', price: '280', veg: false, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
                  { name: 'Special Cappuccino', cat: 'Beverages', price: '160', veg: true, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
                  { name: 'Paneer Butter Masala', cat: 'Main Course', price: '240', veg: true, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
                  { name: 'Crispy Masala Dosa', cat: 'Fast Food', price: '90', veg: true, img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80' },
                  { name: 'Chocolate Brownie', cat: 'Desserts', price: '140', veg: true, img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
                  { name: 'Fresh Mango Smoothie', cat: 'Beverages', price: '120', veg: true, img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
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
                        is_veg: preset.veg,
                        image_url: preset.img
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

              {/* Optional Dish Photo Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dish Photo</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        Optional (ఐచ్చికం)
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">ఫోటో ఉంటే యాడ్ చేయండి, లేదా ఖాళీగా ఉంచవచ్చు</p>
                  </div>
                  {menuForm.image_url && (
                    <button
                      type="button"
                      onClick={() => setMenuForm(prev => ({ ...prev, image_url: '' }))}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Direct Phone / Gallery File Upload via Cloudinary */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-sm">
                    {isUploadingDishPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Uploading Photo to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>📤 Upload from Phone Gallery / Camera</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDishPhotoUpload}
                      disabled={isUploadingDishPhoto}
                    />
                  </label>
                </div>

                <div className="relative">
                  <span className="text-[10px] text-slate-500 block mb-1">...or paste direct image URL:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={menuForm.image_url || ''}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 1-Click Dish Photo Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    📸 ...or choose 1-Click Food Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🍗 Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
                      { label: '☕ Cappuccino', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
                      { label: '🧀 Paneer Curry', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
                      { label: '🥞 Dosa', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80' },
                      { label: '🍕 Pizza / Fast Food', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
                      { label: '🍫 Brownie / Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
                      { label: '🥤 Juice / Shake', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
                      { label: '🥗 Starter / Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMenuForm(prev => ({ ...prev, image_url: p.url }))}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          menuForm.image_url === p.url
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Photo Preview */}
                {menuForm.image_url && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 mt-1">
                    <img
                      src={menuForm.image_url}
                      alt="Dish Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] font-bold bg-slate-950/80 px-2 py-0.5 rounded text-amber-300">
                      Live Preview
                    </span>
                  </div>
                )}
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
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Storefront Banner</label>
                  <label className="cursor-pointer text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    {isUploadingBanner ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoForm.banner_url}
                  onChange={(e) => setPhotoForm(prev => ({ ...prev, banner_url: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Shop Logo / Facade Photo</label>
                  <label className="cursor-pointer text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>
                </div>
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

      {/* Customer Storefront Buy VIP Pass Modal */}
      <Modal
        isOpen={showBuyVipModal}
        onClose={() => setShowBuyVipModal(false)}
        title="👑 Join Mithra Plus VIP Membership"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Select a membership tier below to get instant discounts on this order and all future orders!
          </p>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Your 10-Digit Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={membershipPhone || customerPhone}
                onChange={(e) => {
                  setMembershipPhone(e.target.value);
                  setCustomerPhone(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Your Full Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Anil Kumar"
              value={vipBuyerName || customerName}
              onChange={(e) => {
                setVipBuyerName(e.target.value);
                setCustomerName(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              Choose VIP Membership Tier:
            </label>
            <div className="space-y-2">
              {availablePlans.map((p) => {
                const isSelected = selectedStorePlanId === p.id || availablePlans.length === 1;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedStorePlanId(p.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{p.plan_name}</div>
                        <div className="text-[10px] text-slate-400">
                          ₹{p.price || 0} • {p.validity_months || 12} months validity
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950">
                      {p.discount_percent}% OFF
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {vipError && (
            <p className="text-xs text-rose-400 font-medium">{vipError}</p>
          )}

          <button
            type="button"
            onClick={handleBuyVIPStorefront}
            disabled={isJoiningVIP || (!membershipPhone && !customerPhone)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition disabled:opacity-50"
          >
            {isJoiningVIP ? (
              <span>Activating VIP Pass...</span>
            ) : (
              <>
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>👑 Confirm & Activate VIP Pass (జాయిన్ అవ్వండి)</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Vendor QR Code & Table Standee Modal */}
      <VendorQRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        merchant={merchant || storeInfo} 
      />
        </>
      )}
    </div>
  );
}
