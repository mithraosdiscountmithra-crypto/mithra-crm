import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Inventory from './Inventory';
import SuppliersAndPOs from './SuppliersAndPOs';
import {
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  Zap,
  Send,
  CheckCircle2,
  ListOrdered,
  Plus,
  ArrowRight,
  ExternalLink,
  MapPin
} from 'lucide-react';

export default function OperationsPillar() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'autopo', 'suppliers', 'deliveries'

  // Operations summary state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Auto-PO State
  const [isGeneratingAutoPO, setIsGeneratingAutoPO] = useState(false);
  const [autoPOResult, setAutoPOResult] = useState(null);

  // Deliveries & Pickup Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.operations.getSummary();
      if (res.success) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching operations summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.customer.getMerchantOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error fetching storefront orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'deliveries') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleGenerateAutoPO = async () => {
    try {
      setIsGeneratingAutoPO(true);
      setAutoPOResult(null);
      const res = await api.operations.generateAutoPO();
      if (res.success) {
        setAutoPOResult(res);
        fetchSummary();
      } else {
        alert(res.error || 'Failed to generate Auto-PO');
      }
    } catch (err) {
      console.error('Auto-PO error:', err);
      alert(err.message || 'Error generating Auto-PO');
    } finally {
      setIsGeneratingAutoPO(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.customer.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-sky-400" />
            <span>Pillar 3: Operations & Supply Chain</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Inventory Tracking & Auto-Purchase Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock valuation, automated supplier replenishment with WhatsApp PO links, and order delivery status logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'inventory' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock & SKUs</span>
          </button>
          <button
            onClick={() => setActiveTab('autopo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'autopo' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Auto-PO</span>
            {summary?.lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {summary.lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'suppliers' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers & POs</span>
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'deliveries' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Fulfillment Logs</span>
          </button>
        </div>
      </div>

      {/* Operations KPI Summary Ribbon */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Total Catalog SKUs</span>
            <div className="text-xl font-black text-white">{summary.totalSKUs} Products</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Low-Stock Alert Items</span>
            <div className="text-xl font-black text-amber-400">{summary.lowStockCount} Items Risk</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Inventory Asset Valuation</span>
            <div className="text-xl font-black text-emerald-400">₹{summary.totalAssetValuation}</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Pending Deliveries</span>
            <div className="text-xl font-black text-sky-400">{summary.pendingDeliveries} Orders</div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div>
          <Inventory />
        </div>
      )}

      {/* SUB-VIEW 2: 1-CLICK AUTO-PURCHASE ORDER */}
      {activeTab === 'autopo' && (
        <div className="space-y-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-xs font-bold border border-amber-400/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Automated Stock Replenishment Engine</span>
                </div>
                <h3 className="text-lg font-black text-white">Generate Auto-PO for Low Stock Items</h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  Automatically audits your catalog for products at or below their low-stock threshold, calculates optimal reorder quantities, and drafts a Purchase Order with a 1-click WhatsApp vendor dispatch link.
                </p>
              </div>

              <button
                onClick={handleGenerateAutoPO}
                disabled={isGeneratingAutoPO}
                className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isGeneratingAutoPO ? (
                  <span>Auditing Inventory & Generating PO...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run 1-Click Auto-PO</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Auto-PO Result Banner */}
          {autoPOResult && (
            <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-5 space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-white">{autoPOResult.message}</h4>
                </div>
                {autoPOResult.whatsapp_dispatch_link && (
                  <a
                    href={autoPOResult.whatsapp_dispatch_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch PO via WhatsApp</span>
                  </a>
                )}
              </div>

              {autoPOResult.po && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">PO Number: <strong className="text-white">{autoPOResult.po.po_number}</strong></span>
                    <span className="text-slate-400">Total Value: <strong className="text-emerald-400">₹{autoPOResult.total_amount}</strong></span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Items Drafted in PO:</span>
                    {(autoPOResult.po.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>• {it.product_name} ({it.quantity} units)</span>
                        <span className="font-semibold text-white">₹{it.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: SUPPLIERS & PURCHASE ORDERS */}
      {activeTab === 'suppliers' && (
        <div>
          <SuppliersAndPOs />
        </div>
      )}

      {/* SUB-VIEW 4: DELIVERY & PICKUP STATUS LOGS */}
      {activeTab === 'deliveries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Storefront Orders & Delivery Fulfillment Stream</h3>
              <p className="text-xs text-slate-400">Real-time status updates for customer deliveries and store pickups.</p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{ord.order_number}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ord.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {ord.order_type} • {ord.payment_mode === 'khata' ? 'Khata Credit' : 'Online Paid'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Customer: <strong className="text-white">{ord.customer_name}</strong> ({ord.customer_phone})
                    {ord.customer_address && ` • 📍 ${ord.customer_address}`}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Net Total: ₹{ord.total_amount}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {ord.status !== 'COMPLETED' && (
                    <div className="flex items-center gap-1.5">
                      {ord.status !== 'PREPARING' && ord.status !== 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                          disabled={updatingOrderId === ord.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold"
                        >
                          Preparing
                        </button>
                      )}
                      {ord.status !== 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'OUT_FOR_DELIVERY')}
                          disabled={updatingOrderId === ord.id}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold"
                        >
                          Dispatch
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                        disabled={updatingOrderId === ord.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
