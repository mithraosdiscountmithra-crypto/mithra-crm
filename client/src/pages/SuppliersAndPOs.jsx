import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  Truck, 
  Package, 
  FileText, 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Check, 
  ExternalLink,
  ChevronRight,
  CreditCard,
  Building2,
  AlertTriangle,
  Receipt
} from 'lucide-react';

export default function SuppliersAndPOs() {
  const { merchant } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('pos'); // 'pos' or 'suppliers'
  
  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [poSummary, setPoSummary] = useState({});
  const [supplierSummary, setSupplierSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create PO Modal State
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poFormData, setPoFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    items: [
      { product_id: '', item_name: '', quantity: 10, unit_cost: 0 }
    ]
  });
  const [submittingPO, setSubmittingPO] = useState(false);

  // View PO Details Modal
  const [viewingPO, setViewingPO] = useState(null);
  const [loadingPODetails, setLoadingPODetails] = useState(false);

  // Add/Edit Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_or_tax_id: '',
    payment_terms: 'Net 30',
    is_active: true
  });
  const [submittingSupplier, setSubmittingSupplier] = useState(false);

  // Supplier Ledger Statement Modal State
  const [statementSupplier, setStatementSupplier] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    supplier_id: '',
    amount: '',
    payment_method: 'BANK_TRANSFER',
    reference_no: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0]
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [supRes, poRes, prodRes, lowRes] = await Promise.all([
        api.suppliers.getAll(),
        api.purchaseOrders.getAll(),
        api.products.getAll(),
        api.products.getLowStock()
      ]);

      if (supRes.success) {
        setSuppliers(supRes.suppliers || []);
        setSupplierSummary(supRes.summary || {});
      }
      if (poRes.success) {
        setPurchaseOrders(poRes.purchaseOrders || []);
        setPoSummary(poRes.summary || {});
      }
      if (prodRes.success) {
        setProducts(prodRes.products || []);
      }
      if (lowRes.success) {
        setLowStockProducts(lowRes.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch suppliers and purchase orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Purchase Order Form Helpers ---
  const handleAddItemRow = () => {
    setPoFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', item_name: '', quantity: 10, unit_cost: 0 }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (poFormData.items.length <= 1) return;
    setPoFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemFieldChange = (index, field, value) => {
    setPoFormData(prev => {
      const updated = [...prev.items];
      if (field === 'product_id') {
        const prod = products.find(p => p.id === parseInt(value, 10));
        updated[index] = {
          ...updated[index],
          product_id: value,
          item_name: prod ? prod.product_name : updated[index].item_name,
          unit_cost: prod ? prod.purchase_price : updated[index].unit_cost
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: field === 'quantity' || field === 'unit_cost' ? (parseFloat(value) || 0) : value
        };
      }
      return { ...prev, items: updated };
    });
  };

  // 1-Click Auto-Populate Low Stock items into PO
  const handleAutoPopulateLowStock = () => {
    if (lowStockProducts.length === 0) {
      alert('All products are currently well stocked! No low-stock items detected.');
      return;
    }

    const lowStockItems = lowStockProducts.map(prod => {
      // Recommend ordering enough to reach 2.5x the threshold
      const reorderQty = Math.max((prod.low_stock_threshold * 2) - prod.stock_quantity, 10);
      return {
        product_id: prod.id,
        item_name: prod.product_name,
        quantity: reorderQty,
        unit_cost: prod.purchase_price || 0
      };
    });

    setPoFormData(prev => ({
      ...prev,
      items: lowStockItems,
      notes: prev.notes || 'Automated restock order based on low inventory warning levels'
    }));

    setSuccess(`Auto-populated ${lowStockItems.length} low-stock inventory items!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const calculatePoTotal = () => {
    return poFormData.items.reduce((sum, it) => sum + (parseFloat(it.quantity || 0) * parseFloat(it.unit_cost || 0)), 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poFormData.supplier_id) {
      setError('Please select a supplier');
      return;
    }
    if (poFormData.items.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    try {
      setSubmittingPO(true);
      setError('');

      const payload = {
        ...poFormData,
        supplier_id: parseInt(poFormData.supplier_id, 10)
      };

      const res = await api.purchaseOrders.create(payload);
      if (res.success) {
        setSuccess(`Purchase Order ${res.purchaseOrder.po_number} created successfully!`);
        setIsPoModalOpen(false);
        setPoFormData({
          supplier_id: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: '',
          notes: '',
          items: [{ product_id: '', item_name: '', quantity: 10, unit_cost: 0 }]
        });
        await fetchData();
        setTimeout(() => setSuccess(''), 4000);

        // Open details to preview WhatsApp link
        setViewingPO(res.purchaseOrder);
      }
    } catch (err) {
      setError(err.message || 'Failed to create Purchase Order');
    } finally {
      setSubmittingPO(false);
    }
  };

  const handleOpenPODetails = async (poId) => {
    try {
      setLoadingPODetails(true);
      const res = await api.purchaseOrders.getById(poId);
      if (res.success) {
        setViewingPO(res.purchaseOrder);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch Purchase Order details');
    } finally {
      setLoadingPODetails(false);
    }
  };

  const handleUpdatePOStatus = async (poId, newStatus) => {
    if (newStatus === 'RECEIVED') {
      const confirmInward = window.confirm(
        'Are you sure you want to mark this Purchase Order as RECEIVED? Product stock levels will be incremented automatically in your inventory catalog.'
      );
      if (!confirmInward) return;
    }

    try {
      const res = await api.purchaseOrders.updateStatus(poId, newStatus);
      if (res.success) {
        setSuccess(res.message);
        await fetchData();
        if (viewingPO && viewingPO.id === poId) {
          setViewingPO(prev => ({ ...prev, status: newStatus }));
        }
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update PO status');
    }
  };

  // --- Supplier Form Helpers ---
  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      gst_or_tax_id: '',
      payment_terms: 'Net 30',
      is_active: true
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplierId(sup.id);
    setSupplierFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      gst_or_tax_id: sup.gst_or_tax_id || '',
      payment_terms: sup.payment_terms || 'Net 30',
      is_active: sup.is_active !== undefined ? sup.is_active : true
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) {
      setError('Supplier company name is required');
      return;
    }

    try {
      setSubmittingSupplier(true);
      setError('');
      if (editingSupplierId) {
        await api.suppliers.update(editingSupplierId, supplierFormData);
        setSuccess('Supplier updated successfully');
      } else {
        await api.suppliers.create(supplierFormData);
        setSuccess('New supplier registered successfully');
      }
      setIsSupplierModalOpen(false);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSubmittingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (supId, supName) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${supName}"?`)) {
      return;
    }
    try {
      const res = await api.suppliers.delete(supId);
      if (res.success) {
        setSuccess(`Supplier ${supName} removed`);
        await fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    }
  };

  // --- Supplier Statement & Payment Helpers ---
  const handleOpenStatement = async (supplier) => {
    try {
      setStatementSupplier(supplier);
      setLoadingStatement(true);
      const res = await api.suppliers.getLedger(supplier.id);
      if (res.success) {
        setStatementData(res.statement);
      }
    } catch (err) {
      setError(err.message || 'Failed to load supplier ledger');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleOpenRecordPayment = (supplier) => {
    setPaymentFormData({
      supplier_id: supplier.id,
      amount: '',
      payment_method: 'BANK_TRANSFER',
      reference_no: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Settlement payment to ${supplier.name}`,
      payment_date: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentFormData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    try {
      setSubmittingPayment(true);
      setError('');
      const res = await api.suppliers.recordPayment(paymentFormData);
      if (res.success) {
        setSuccess(res.message);
        setIsPaymentModalOpen(false);
        await fetchData();
        if (statementSupplier && statementSupplier.id === paymentFormData.supplier_id) {
          await handleOpenStatement(statementSupplier);
        }
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to record supplier payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtered POs
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.supplier_name && po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (po.notes && po.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(sup => 
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.contact_person && sup.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sup.phone && sup.phone.includes(searchTerm)) ||
    (sup.email && sup.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Supply Chain & Procurement</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Accounts Payable & Inwarding
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Purchase Orders & Suppliers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Create vendor POs with 1-click low-stock population, dispatch orders via WhatsApp Web, and automate inventory stock inwarding.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Supply Chain"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsPoModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts Payable */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Accounts Payable (You Owe)</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            ${supplierSummary.totalPayable || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500">Across {suppliers.length} active suppliers</div>
        </div>

        {/* Total Purchase Orders */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Purchase Orders</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {purchaseOrders.length} Orders
          </div>
          <div className="text-[11px] text-slate-500">${poSummary.totalPOAmount || '0.00'} procurement volume</div>
        </div>

        {/* Inwarding Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>PO Status Breakdown</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2 pt-1">
            <span className="text-sky-400">{poSummary.sentCount || 0} Sent</span>
            <span className="text-emerald-400">{poSummary.receivedCount || 0} Received</span>
            <span className="text-slate-400">{poSummary.draftCount || 0} Draft</span>
          </div>
          <div className="text-[11px] text-slate-500">Active supply pipeline</div>
        </div>

        {/* Low Stock Items Alert */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Inventory Reorder Trigger</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {lowStockProducts.length} Items Low
          </div>
          <div className="text-[11px] text-slate-500">Ready for 1-click PO auto-population</div>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'pos'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase Orders ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'suppliers'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers Directory & Khata ({suppliers.length})</span>
          </button>
        </div>

        {activeSubTab === 'suppliers' && (
          <button
            onClick={handleOpenAddSupplier}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-sky-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Purchase Orders */}
      {activeSubTab === 'pos' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Purchase Orders Ledger</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {filteredPOs.length} POs
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search PO#, supplier, notes..."
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition w-44 sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="RECEIVED">Received</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No purchase orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isReceived = po.status === 'RECEIVED';
                    return (
                      <tr key={po.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {po.po_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>{po.supplier_name}</div>
                          {po.supplier_contact && (
                            <div className="text-[11px] text-slate-500 font-normal">{po.supplier_contact}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {po.order_date ? String(po.order_date).split('T')[0] : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {po.item_count} items
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                          ${parseFloat(po.total_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            isReceived
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : po.status === 'SENT'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : po.status === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {isReceived && <Check className="w-3 h-3" />}
                            <span>{po.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenPODetails(po.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                              title="View PO Details & WhatsApp Dispatch"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {!isReceived && (
                              <button
                                onClick={() => handleUpdatePOStatus(po.id, 'RECEIVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-sm"
                                title="Inward Stock (Increments Product Quantities)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Receive</span>
                              </button>
                            )}
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
      )}

      {/* Sub-Tab 2: Suppliers Directory & Khata */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Wholesalers & Vendors Directory</h2>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search supplier name, contact, phone..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition w-56 sm:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No suppliers registered yet. Click "Add Supplier" to register your wholesalers.
              </div>
            ) : (
              filteredSuppliers.map((sup) => {
                const netBal = parseFloat(sup.net_balance) || 0;
                const hasPendingDues = netBal > 0;

                return (
                  <div 
                    key={sup.id} 
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">{sup.name}</h3>
                          {sup.contact_person && (
                            <div className="text-xs text-slate-400 font-medium">Attn: {sup.contact_person}</div>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {sup.payment_terms || 'Net 30'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400">
                        {sup.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-mono text-slate-300">{sup.phone}</span>
                          </div>
                        )}
                        {sup.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{sup.email}</span>
                          </div>
                        )}
                        {sup.address && (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Accounts Payable Net Balance Pill */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        hasPendingDues 
                          ? 'bg-rose-950/20 border-rose-500/30' 
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            {hasPendingDues ? 'You Owe Supplier' : 'Khata Settled'}
                          </div>
                          <div className={`text-base font-black font-mono ${
                            hasPendingDues ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            ${Math.abs(netBal).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <div>Billed: ${sup.total_billed || '0.00'}</div>
                          <div>Paid: ${sup.total_paid || '0.00'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenStatement(sup)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1"
                          title="View Ledger Statement"
                        >
                          <Receipt className="w-3.5 h-3.5 text-sky-400" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenRecordPayment(sup)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1"
                          title="Record Payment Made"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSupplier(sup)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Supplier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Purchase Order */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Create New Purchase Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Supplier *</label>
              <select
                value={poFormData.supplier_id}
                onChange={(e) => setPoFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition text-sm"
              >
                <option value="">-- Choose Wholesaler / Vendor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.payment_terms || 'Net 30'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Order Date</label>
                <input
                  type="date"
                  value={poFormData.order_date}
                  onChange={(e) => setPoFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Expected Delivery</label>
                <input
                  type="date"
                  value={poFormData.expected_delivery_date}
                  onChange={(e) => setPoFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Quick Auto-Populate Button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-950/20 border border-sky-500/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <div>
                <div className="font-bold text-white">Smart Inventory Reorder Helper</div>
                <div className="text-[11px] text-slate-400">
                  {lowStockProducts.length > 0 
                    ? `${lowStockProducts.length} items currently below safety reorder threshold`
                    : 'All catalog items currently above safety threshold'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoPopulateLowStock}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition text-xs shadow-sm shadow-sky-600/30 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Populate Low Stock</span>
            </button>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold text-xs uppercase tracking-wider">Order Line Items</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {poFormData.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <div className="w-full sm:w-1/2">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemFieldChange(idx, 'product_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Existing Product or Type Item --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} (Stock: {p.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      placeholder="Item name description"
                      value={item.item_name}
                      onChange={(e) => handleItemFieldChange(idx, 'item_name', e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono text-center focus:outline-none"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cost $"
                      value={item.unit_cost}
                      onChange={(e) => handleItemFieldChange(idx, 'unit_cost', e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono text-right focus:outline-none"
                    />
                  </div>

                  <div className="w-20 text-right font-mono font-bold text-white">
                    ${(parseFloat(item.quantity || 0) * parseFloat(item.unit_cost || 0)).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={poFormData.items.length <= 1}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Order Notes / Instructions</label>
            <textarea
              value={poFormData.notes}
              onChange={(e) => setPoFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="e.g. Deliver to back loading dock. Call manager upon arrival."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-sm">
              <span className="text-slate-400">Total Purchase Order: </span>
              <strong className="text-white font-mono font-black text-lg">${calculatePoTotal().toFixed(2)}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPO}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:opacity-95 transition shadow-lg shadow-sky-500/25 disabled:opacity-50"
              >
                {submittingPO ? 'Creating...' : 'Create & Dispatch PO'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: View PO Details & 1-Click WhatsApp Send */}
      <Modal
        isOpen={Boolean(viewingPO)}
        onClose={() => setViewingPO(null)}
        title={viewingPO ? `Purchase Order: ${viewingPO.po_number}` : 'PO Details'}
        maxWidth="max-w-2xl"
      >
        {viewingPO && (
          <div className="space-y-4 text-xs">
            {/* Supplier & Header Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{viewingPO.supplier_name}</div>
                  <div className="text-slate-400">{viewingPO.supplier_contact} • {viewingPO.supplier_phone}</div>
                  {viewingPO.supplier_email && <div className="text-slate-500">{viewingPO.supplier_email}</div>}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  viewingPO.status === 'RECEIVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                }`}>
                  {viewingPO.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Order Date: <strong>{viewingPO.order_date ? String(viewingPO.order_date).split('T')[0] : 'Today'}</strong></span>
                <span>Expected: <strong>{viewingPO.expected_delivery_date || 'Standard Delivery'}</strong></span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-2">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Ordered Line Items</div>
              <div className="divide-y divide-slate-800/80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                {(viewingPO.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{it.item_name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">
                        {it.quantity} units @ ${parseFloat(it.unit_cost).toFixed(2)} each
                      </div>
                    </div>
                    <div className="font-mono font-bold text-white">
                      ${parseFloat(it.subtotal || (it.quantity * it.unit_cost)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm">
              <span className="font-bold text-slate-300">Total Order Amount</span>
              <span className="font-black text-white text-lg">${parseFloat(viewingPO.total_amount).toFixed(2)}</span>
            </div>

            {/* 1-Click WhatsApp Dispatch Button */}
            <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <Send className="w-4 h-4" />
                  Dispatch PO to Supplier via WhatsApp Web
                </span>
                <span className="text-[10px] text-slate-500">Opens WhatsApp pre-filled chat</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Send formal PO with complete item breakdown directly to {viewingPO.supplier_name}'s phone.
              </p>
              <a
                href={viewingPO.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp Web Chat</span>
              </a>
            </div>

            {/* Inwarding / Action buttons */}
            <div className="flex items-center justify-between pt-2">
              {viewingPO.status !== 'RECEIVED' ? (
                <button
                  type="button"
                  onClick={() => handleUpdatePOStatus(viewingPO.id, 'RECEIVED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Received (Inward Stock)</span>
                </button>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stock Received & Inwarded</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setViewingPO(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Add / Edit Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplierId ? 'Edit Supplier Details' : 'Add New Wholesaler / Vendor'}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Company / Vendor Name *</label>
            <input
              type="text"
              value={supplierFormData.name}
              onChange={(e) => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="e.g. Andean Specialty Beans Co."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={supplierFormData.contact_person}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="e.g. Mateo Vargas"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={supplierFormData.phone}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. +1 555-7711"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={supplierFormData.email}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. orders@supplier.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Terms</label>
              <select
                value={supplierFormData.payment_terms}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 transition"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                <option value="Advance Payment">Advance Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tax ID / GST / EIN</label>
              <input
                type="text"
                value={supplierFormData.gst_or_tax_id}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, gst_or_tax_id: e.target.value }))}
                placeholder="e.g. US-TAX-89211"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Warehouse / City Address</label>
              <input
                type="text"
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 450 Export Way, Miami, FL"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingSupplier}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:opacity-95 transition shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              {submittingSupplier ? 'Saving...' : editingSupplierId ? 'Update Supplier' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Supplier Statement / Ledger View */}
      <Modal
        isOpen={Boolean(statementSupplier)}
        onClose={() => setStatementSupplier(null)}
        title={statementSupplier ? `Khata Ledger: ${statementSupplier.name}` : 'Ledger Statement'}
        maxWidth="max-w-3xl"
      >
        {statementSupplier && (
          <div className="space-y-4 text-xs">
            {/* Net Dues Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase font-bold text-slate-400">Net Balance Payable</div>
                <div className="text-2xl font-mono font-black text-rose-400">
                  ${statementData?.netPayable || '0.00'}
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[11px] text-slate-500">Total Billed (Bills)</div>
                  <div className="text-sm font-mono font-bold text-white">${statementData?.totalBilled || '0.00'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Total Settled (Paid)</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">${statementData?.totalPaid || '0.00'}</div>
                </div>
              </div>
            </div>

            {/* Statement Entries Table */}
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference #</th>
                    <th className="py-2.5 px-3">Description / Notes</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingStatement ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto text-sky-400" />
                      </td>
                    </tr>
                  ) : statementData?.entries?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No transactions recorded in this ledger yet.
                      </td>
                    </tr>
                  ) : (
                    statementData?.entries?.map((entry) => {
                      const isBill = entry.transaction_type === 'BILL';
                      return (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                            {entry.payment_date ? String(entry.payment_date).split('T')[0] : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${
                              isBill ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {isBill ? 'BILL' : 'PAYMENT'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {entry.reference_no || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                            {entry.notes || '—'}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isBill ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isBill ? `+$${parseFloat(entry.amount).toFixed(2)}` : `-$${parseFloat(entry.amount).toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleOpenRecordPayment(statementSupplier)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record New Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setStatementSupplier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              >
                Close Statement
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 5: Record Payment Made to Supplier */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Supplier Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Amount Paid ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={paymentFormData.amount}
              onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
              <select
                value={paymentFormData.payment_method}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                <option value="CHECK">Business Check</option>
                <option value="UPI">UPI / Online</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentFormData.payment_date}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Reference / Cheque / Transaction #</label>
            <input
              type="text"
              value={paymentFormData.reference_no}
              onChange={(e) => setPaymentFormData(prev => ({ ...prev, reference_no: e.target.value }))}
              placeholder="e.g. TXN-WIRE-9921 or CHK-4402"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notes / Remarks</label>
            <textarea
              value={paymentFormData.notes}
              onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="e.g. Settled invoice against PO-202611-001"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-95 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {submittingPayment ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
