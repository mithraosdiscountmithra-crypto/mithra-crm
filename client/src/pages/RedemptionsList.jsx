import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Receipt, Search, RefreshCw, Calendar, IndianRupee, Tag, TrendingDown } from 'lucide-react';

export default function RedemptionsList() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const res = await api.pos.getRedemptions(100);
      if (res.success) {
        setRedemptions(res.redemptions);
      }
    } catch (err) {
      setError(err.message || 'Failed to load redemption history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const filtered = redemptions.filter(r => 
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_phone?.includes(searchTerm)
  );

  const totalSales = filtered.reduce((acc, r) => acc + parseFloat(r.bill_amount), 0);
  const totalDiscounts = filtered.reduce((acc, r) => acc + parseFloat(r.discount_given), 0);
  const totalNet = totalSales - totalDiscounts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Redemption Audit Log</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical transaction ledger of all member discounts applied at the checkout register.
          </p>
        </div>

        <button
          onClick={fetchRedemptions}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-2 text-xs font-bold shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Ledger Gross Sales</div>
            <div className="text-xl font-black text-white mt-0.5">₹{totalSales.toFixed(2)}</div>
          </div>
          <IndianRupee className="w-5 h-5 text-sky-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Discounts Saved</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">-₹{totalDiscounts.toFixed(2)}</div>
          </div>
          <TrendingDown className="w-5 h-5 text-rose-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Net Collected</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">₹{totalNet.toFixed(2)}</div>
          </div>
          <Tag className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by customer name or phone number..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Redemptions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Receipt #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Gross Bill</th>
                <th className="px-6 py-4">Discount Given</th>
                <th className="px-6 py-4">Net Collected</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No redemption records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const net = parseFloat(r.bill_amount) - parseFloat(r.discount_given);
                  const dateStr = new Date(r.redeemed_at).toLocaleString();
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                        #{r.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {r.customer_name}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                        {r.customer_phone}
                      </td>
                      <td className="px-6 py-4 font-mono text-white">
                        ₹{parseFloat(r.bill_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-rose-400 font-semibold">
                        -₹{parseFloat(r.discount_given).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold">
                        ₹{net.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {dateStr}
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
  );
}
