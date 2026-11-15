import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Boxes, 
  ArrowUpDown,
  Filter,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'low-stock', 'out-of-stock'

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Coffee Beans');
  const [purchasePrice, setPurchasePrice] = useState('0.00');
  const [sellingPrice, setSellingPrice] = useState('0.00');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [unit, setUnit] = useState('pcs');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.products.getAll();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductName('');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setCategory('Coffee Beans');
    setPurchasePrice('5.00');
    setSellingPrice('12.00');
    setStockQuantity('20');
    setLowStockThreshold('5');
    setUnit('pcs');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductName(p.product_name);
    setSku(p.sku || '');
    setCategory(p.category || 'General');
    setPurchasePrice(String(p.purchase_price));
    setSellingPrice(String(p.selling_price));
    setStockQuantity(String(p.stock_quantity));
    setLowStockThreshold(String(p.low_stock_threshold));
    setUnit(p.unit || 'pcs');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        product_name: productName.trim(),
        sku: sku.trim(),
        category: category.trim(),
        purchase_price: parseFloat(purchasePrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        unit: unit.trim() || 'pcs'
      };

      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, payload);
        if (res.success) {
          setSuccess(`Updated "${res.product.product_name}" successfully!`);
        }
      } else {
        const res = await api.products.create(payload);
        if (res.success) {
          setSuccess(`Added "${res.product.product_name}" to inventory!`);
        }
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick inline stock adjustment (+ / -)
  const handleQuickStockAdjust = async (product, delta) => {
    const newQty = Math.max(0, product.stock_quantity + delta);
    try {
      const res = await api.products.update(product.id, {
        stock_quantity: newQty
      });
      if (res.success) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQty } : p));
      }
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from inventory?`)) return;
    try {
      const res = await api.products.delete(id);
      if (res.success) {
        setSuccess(`Product "${name}" deleted.`);
        fetchProducts();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStatus = true;
    if (filterMode === 'low-stock') {
      matchesStatus = p.stock_quantity <= p.low_stock_threshold;
    } else if (filterMode === 'out-of-stock') {
      matchesStatus = p.stock_quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI calculations
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length;
  const totalUnits = products.reduce((acc, p) => acc + (parseInt(p.stock_quantity, 10) || 0), 0);
  const costValuation = products.reduce((acc, p) => acc + ((parseFloat(p.purchase_price) || 0) * (parseInt(p.stock_quantity, 10) || 0)), 0);
  const retailValuation = products.reduce((acc, p) => acc + ((parseFloat(p.selling_price) || 0) * (parseInt(p.stock_quantity, 10) || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Inventory & Stock CRM</span>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{lowStockCount} Items Low Stock</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Store Inventory & SKU Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-tenant stock tracking, purchase/retail margins, and automated reorder alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchProducts}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total SKUs</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{totalProducts}</div>
          <div className="text-xs text-slate-500 mt-1">{totalUnits} units in warehouse</div>
        </div>

        <div className={`p-5 rounded-2xl border backdrop-blur-md ${
          lowStockCount > 0 
            ? 'border-amber-500/30 bg-amber-500/10' 
            : 'border-slate-800 bg-slate-900/60'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span className={lowStockCount > 0 ? 'text-amber-300' : 'text-slate-400'}>Low Stock Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black text-white mt-2">{lowStockCount}</div>
          <div className="text-xs text-slate-400 mt-1">At or below reorder threshold</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Inventory Cost Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">${costValuation.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Purchase cost valuation</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Estimated Retail Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-2">${retailValuation.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Potential margin: ${(retailValuation - costValuation).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="w-44 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('low-stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterMode === 'low-stock'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Margin</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 text-center">Quick Adjust</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No inventory products match your criteria. Click "Add New Product" to stock items.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity <= p.low_stock_threshold;
                  const isOutOfStock = p.stock_quantity === 0;
                  const purchase = parseFloat(p.purchase_price) || 0;
                  const selling = parseFloat(p.selling_price) || 0;
                  const marginPct = selling > 0 ? Math.round(((selling - purchase) / selling) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{p.product_name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{p.sku || 'No SKU'}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/50">
                          {p.category || 'General'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                        ${purchase.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 font-mono text-white font-bold text-sm">
                        ${selling.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={marginPct >= 50 ? 'text-emerald-400' : 'text-slate-300'}>
                          {marginPct}%
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-black font-mono ${
                            isOutOfStock 
                              ? 'text-rose-400' 
                              : isLowStock 
                              ? 'text-amber-400' 
                              : 'text-white'
                          }`}>
                            {p.stock_quantity}
                          </span>
                          <span className="text-xs text-slate-500">{p.unit}</span>

                          {isOutOfStock ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Low (&le;{p.low_stock_threshold})</span>
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick inline increment / decrement */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => handleQuickStockAdjust(p, -1)}
                            disabled={p.stock_quantity <= 0}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                            title="Decrease stock by 1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono font-bold px-2 text-slate-200">
                            {p.stock_quantity}
                          </span>
                          <button
                            onClick={() => handleQuickStockAdjust(p, 1)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                            title="Increase stock by 1"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.product_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Colombian Supremo Beans 500g"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">SKU / Barcode</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. COF-COL-500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Coffee Beans, Merchandise, Syrups"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Purchase Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Selling / Retail Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Current Stock *</label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Reorder Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. pcs, bags, kg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update Inventory Item' : 'Add Item to Inventory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
