import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Crown, 
  Cake, 
  Heart, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Plan modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, plansRes] = await Promise.all([
        api.customers.getAll(),
        api.plans.getAll()
      ]);
      if (custRes.success) setCustomers(custRes.customers);
      if (plansRes.success) setPlans(plansRes.plans);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await api.customers.create({
        name,
        phone,
        birthday: birthday || undefined,
        anniversary: anniversary || undefined,
        plan_id: selectedPlanId ? parseInt(selectedPlanId, 10) : undefined
      });

      if (res.success) {
        setSuccess('Customer added successfully!');
        setIsAddModalOpen(false);
        setName('');
        setPhone('');
        setBirthday('');
        setAnniversary('');
        setSelectedPlanId('');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (!targetCustomer || !assignPlanId) return;

    try {
      setAssigning(true);
      setError('');
      const res = await api.memberships.assign({
        customer_id: targetCustomer.id,
        plan_id: parseInt(assignPlanId, 10)
      });

      if (res.success) {
        setSuccess(res.message || 'Membership plan assigned successfully!');
        setIsAssignModalOpen(false);
        setTargetCustomer(null);
        setAssignPlanId('');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign plan');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteCustomer = async (id, custName) => {
    if (!window.confirm(`Are you sure you want to delete customer ${custName}?`)) return;
    try {
      const res = await api.customers.delete(id);
      if (res.success) {
        setSuccess(`Deleted customer ${custName}`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Customer & Member Directory</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tenant-isolated customer profiles, birthday alerts, and active membership subscriptions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
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

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Milestones</th>
                <th className="px-6 py-4">Active Plan</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    No customers found. Click "Add New Customer" to register one.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-500">ID #{c.id}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {c.birthday ? (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <Cake className="w-3.5 h-3.5" />
                            <span>{c.birthday}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No birthday</span>
                        )}
                        {c.anniversary && (
                          <span className="flex items-center gap-1.5 text-rose-400">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{c.anniversary}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.plan_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{c.plan_name}</span>
                          <span className="text-emerald-400">({c.discount_percent}%)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Non-member</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {c.expiry_date ? (
                        <span className="text-slate-300">Expires: {c.expiry_date}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setTargetCustomer(c);
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold transition"
                        >
                          {c.plan_name ? 'Change Plan' : 'Enroll'}
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Store Customer"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Miller"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 5557788990"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Birthday (Optional)</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Anniversary (Optional)</label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Enroll in Membership Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No initial membership (Standard Customer)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plan_name} (${p.price} / {p.validity_months} mos • {p.discount_percent}% OFF)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
          >
            {submitting ? 'Creating Customer...' : 'Save Customer'}
          </button>
        </form>
      </Modal>

      {/* Assign Membership Plan Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setTargetCustomer(null);
        }}
        title={`Assign Membership to ${targetCustomer?.name || 'Customer'}`}
      >
        <form onSubmit={handleAssignPlan} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select the loyalty membership plan to activate. The customer will immediately receive the plan's discount perks during POS checkout.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Select Membership Plan</label>
            <select
              required
              value={assignPlanId}
              onChange={(e) => setAssignPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Plan --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plan_name} (${p.price} / {p.validity_months} months • {p.discount_percent}% OFF)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={assigning || !assignPlanId}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-50"
          >
            {assigning ? 'Activating...' : 'Activate Membership'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
