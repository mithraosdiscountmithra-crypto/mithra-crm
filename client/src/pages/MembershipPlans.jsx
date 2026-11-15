import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { 
  Award, 
  Plus, 
  Crown, 
  Percent, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export default function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('29.99');
  const [validityMonths, setValidityMonths] = useState('12');
  const [discountPercent, setDiscountPercent] = useState('15');
  const [benefitsDescription, setBenefitsDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.plans.getAll();
      if (res.success) {
        setPlans(res.plans);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch membership plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setPrice('29.99');
    setValidityMonths('12');
    setDiscountPercent('15');
    setBenefitsDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setPlanName(p.plan_name);
    setPrice(String(p.price));
    setValidityMonths(String(p.validity_months));
    setDiscountPercent(String(p.discount_percent));
    setBenefitsDescription(p.benefits_description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        plan_name: planName,
        price: parseFloat(price) || 0,
        validity_months: parseInt(validityMonths, 10) || 12,
        discount_percent: parseFloat(discountPercent) || 0,
        benefits_description: benefitsDescription
      };

      if (editingPlan) {
        const res = await api.plans.update(editingPlan.id, payload);
        if (res.success) {
          setSuccess('Membership plan updated!');
        }
      } else {
        const res = await api.plans.create(payload);
        if (res.success) {
          setSuccess('Membership plan created successfully!');
        }
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      setError(err.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await api.plans.delete(id);
      if (res.success) {
        setSuccess(`Plan ${name} removed`);
        fetchPlans();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Membership Plans & Loyalty Tiers</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure subscription tiers, discount rules, validity terms, and VIP member perks.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Plan"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.plan_name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{p.plan_name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-white">${parseFloat(p.price).toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {p.validity_months} months</span>
                </div>
              </div>

              {/* Discount Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                <Percent className="w-3.5 h-3.5" />
                <span>{p.discount_percent}% Instant POS Discount</span>
              </div>

              {/* Benefits */}
              <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
                {p.benefits_description || 'Standard membership privileges included.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 mt-6 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Validity: {p.validity_months} Months</span>
              </div>
              <span>Plan #{p.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Plan Name *</label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Platinum VIP Pass"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Validity (Mo) *</label>
              <input
                type="number"
                min="1"
                required
                value={validityMonths}
                onChange={(e) => setValidityMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Discount (%) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Benefits Description</label>
            <textarea
              rows="3"
              value={benefitsDescription}
              onChange={(e) => setBenefitsDescription(e.target.value)}
              placeholder="e.g. 15% discount on all purchases, 1 complimentary upgrade per visit, birthday gift"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
          >
            {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
