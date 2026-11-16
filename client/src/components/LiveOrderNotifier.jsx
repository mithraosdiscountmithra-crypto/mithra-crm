import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { playOrderChime } from '../utils/sound';
import { Bell, Volume2, VolumeX, X, ShoppingBag, ArrowRight } from 'lucide-react';

export default function LiveOrderNotifier({ activeTab, setActiveTab }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('mithra_order_sound') !== 'false';
  });
  const [autoOpenOrders, setAutoOpenOrders] = useState(() => {
    return localStorage.getItem('mithra_auto_open_orders') === 'true';
  });
  const [incomingOrder, setIncomingOrder] = useState(null);
  const seenOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Toggle Sound Preference
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('mithra_order_sound', String(nextVal));
    if (nextVal) {
      playOrderChime();
    }
  };

  // Toggle Auto-open preference
  const toggleAutoOpen = () => {
    const nextVal = !autoOpenOrders;
    setAutoOpenOrders(nextVal);
    localStorage.setItem('mithra_auto_open_orders', String(nextVal));
  };

  // Poll for incoming customer orders every 6 seconds
  useEffect(() => {
    let isMounted = true;

    const checkIncomingOrders = async () => {
      try {
        const token = localStorage.getItem('loyalty_token');
        if (!token) return;

        const res = await api.customer.getMerchantOrders();
        if (!isMounted || !res.success || !Array.isArray(res.orders)) return;

        const currentOrders = res.orders;

        if (isInitialLoadRef.current) {
          // First load: seed all existing order IDs without ringing chime
          currentOrders.forEach((o) => seenOrderIdsRef.current.add(o.id));
          isInitialLoadRef.current = false;
          return;
        }

        // Find brand new incoming orders
        const newOrders = currentOrders.filter((o) => !seenOrderIdsRef.current.has(o.id));

        if (newOrders.length > 0) {
          // Add all new IDs to seen set
          newOrders.forEach((o) => seenOrderIdsRef.current.add(o.id));

          const newest = newOrders[0];
          setIncomingOrder(newest);

          // 1. Play Sound Chime
          if (soundEnabled) {
            playOrderChime();
          }

          // 2. Auto-open Orders tab if user preference is ON
          if (autoOpenOrders && activeTab !== 'orders') {
            setActiveTab('orders');
          }
        }
      } catch (err) {
        // Silently skip background poll network errors
      }
    };

    // Initial check
    checkIncomingOrders();

    // Set polling interval
    const interval = setInterval(checkIncomingOrders, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [soundEnabled, autoOpenOrders, activeTab, setActiveTab]);

  // Handle clicking the banner
  const handleOpenOrders = () => {
    setActiveTab('orders');
    setIncomingOrder(null);
  };

  if (!incomingOrder) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-bounce sm:animate-none transition-all duration-300">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border-2 border-emerald-300/40 shadow-emerald-950/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-2xl animate-pulse">🔔</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>New Order Booked!</span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              {incomingOrder.customer_name || 'Customer'} • ₹{parseFloat(incomingOrder.total_amount).toFixed(2)}
            </h4>
            <p className="text-[11px] text-emerald-100 font-mono">
              Order #{incomingOrder.order_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95"
          >
            <span>Open Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIncomingOrder(null)}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
