import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical,
  MessageSquare,
  GitCompare,
  Bug,
  Plus,
  Star,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

export default function RAndDPillar() {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback', 'experiments', 'beta'

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackMetrics, setFeedbackMetrics] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newCategory, setNewCategory] = useState('Quality');
  const [newFeedbackText, setNewFeedbackText] = useState('');

  // Experiments State
  const [experiments, setExperiments] = useState([]);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newTargetSegment, setNewTargetSegment] = useState('ALL');
  const [newVariantA, setNewVariantA] = useState('');
  const [newVariantB, setNewVariantB] = useState('');
  const [newConversionMetric, setNewConversionMetric] = useState('Order Conversion %');

  // Beta Logs State
  const [betaLogs, setBetaLogs] = useState([]);
  const [loadingBeta, setLoadingBeta] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newTesterName, setNewTesterName] = useState('');
  const [newFeedbackType, setNewFeedbackType] = useState('BUG');
  const [newSeverity, setNewSeverity] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');

  // Fetch functions
  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const res = await api.rd.getFeedback();
      if (res.success) {
        setFeedbacks(res.feedbacks || []);
        setFeedbackMetrics(res.metrics || null);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const fetchExperiments = async () => {
    try {
      setLoadingExperiments(true);
      const res = await api.rd.getExperiments();
      if (res.success) {
        setExperiments(res.experiments || []);
      }
    } catch (err) {
      console.error('Error fetching experiments:', err);
    } finally {
      setLoadingExperiments(false);
    }
  };

  const fetchBetaLogs = async () => {
    try {
      setLoadingBeta(true);
      const res = await api.rd.getBetaLogs();
      if (res.success) {
        setBetaLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Error fetching beta logs:', err);
    } finally {
      setLoadingBeta(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchExperiments();
    fetchBetaLogs();
  }, []);

  // Handlers
  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;
    try {
      const res = await api.rd.submitFeedback({
        customer_name: newCustName.trim(),
        customer_phone: newCustPhone.trim(),
        rating: parseInt(newRating, 10),
        category: newCategory,
        feedback_text: newFeedbackText.trim()
      });
      if (res.success) {
        setShowFeedbackModal(false);
        setNewFeedbackText('');
        fetchFeedback();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    }
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    if (!newTestName.trim() || !newHypothesis.trim() || !newVariantA.trim() || !newVariantB.trim()) return;
    try {
      const res = await api.rd.createExperiment({
        test_name: newTestName.trim(),
        hypothesis: newHypothesis.trim(),
        target_segment: newTargetSegment,
        variant_a: newVariantA.trim(),
        variant_b: newVariantB.trim(),
        conversion_metric: newConversionMetric.trim()
      });
      if (res.success) {
        setShowExpModal(false);
        setNewTestName('');
        setNewHypothesis('');
        setNewVariantA('');
        setNewVariantB('');
        fetchExperiments();
      }
    } catch (err) {
      alert(err.message || 'Failed to create experiment');
    }
  };

  const handleCreateBetaLog = async (e) => {
    e.preventDefault();
    if (!newFeatureName.trim() || !newDescription.trim()) return;
    try {
      const res = await api.rd.submitBetaLog({
        feature_name: newFeatureName.trim(),
        tester_name: newTesterName.trim(),
        feedback_type: newFeedbackType,
        severity: newSeverity,
        description: newDescription.trim()
      });
      if (res.success) {
        setShowBetaModal(false);
        setNewFeatureName('');
        setNewDescription('');
        fetchBetaLogs();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit beta log');
    }
  };

  const handleUpdateBetaStatus = async (id, newStatus) => {
    try {
      const res = await api.rd.updateBetaLogStatus(id, newStatus);
      if (res.success) {
        setBetaLogs(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span>Pillar 4: Research & Development (R&D)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Customer Feedback, NPS & A/B Experiments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Systematic customer sentiment analysis, feature experimentation hypothesis tracking, and beta tester bug logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'feedback' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>NPS & Feedback ({feedbacks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'experiments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>A/B Tests ({experiments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('beta')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'beta' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Beta Logs ({betaLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CUSTOMER FEEDBACK & NPS */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {feedbackMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Net Promoter Score (NPS)</span>
                <div className="text-2xl font-black text-amber-400">+{feedbackMetrics.npsScore} NPS</div>
                <p className="text-[10px] text-slate-500">{feedbackMetrics.promoters} Promoters, {feedbackMetrics.detractors} Detractors</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Average Star Rating</span>
                <div className="text-2xl font-black text-white flex items-center gap-1">
                  <span>{feedbackMetrics.avgRating}</span>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <p className="text-[10px] text-slate-500">{feedbackMetrics.totalFeedback} reviews submitted</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Positive Sentiment</span>
                <div className="text-2xl font-black text-emerald-400">{feedbackMetrics.positiveCount}</div>
                <p className="text-[10px] text-emerald-500/80">Delighted customers</p>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Neutral / Review</span>
                <div className="text-2xl font-black text-sky-400">{feedbackMetrics.neutralCount + feedbackMetrics.negativeCount}</div>
                <p className="text-[10px] text-slate-500">Service improvement cues</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Customer Experience & Sentiment Stream</h3>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Log Customer Feedback</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white">{fb.customer_name}</span>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    fb.sentiment === 'POSITIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : fb.sentiment === 'NEGATIVE'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {fb.sentiment}
                  </span>
                </div>

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{fb.feedback_text}"
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-bold">{fb.category}</span>
                  <span>{new Date(fb.created_at).toLocaleDateString()} • Status: <strong className="text-slate-300">{fb.status}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: FEATURE EXPERIMENTATION & A/B TESTING */}
      {/* ========================================================================= */}
      {activeTab === 'experiments' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">A/B Testing & Revenue Experimentation</h3>
              <p className="text-xs text-slate-400">Validate promotions, loyalty perks, and packaging changes with data-backed conversion metrics.</p>
            </div>
            <button
              onClick={() => setShowExpModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Experiment</span>
            </button>
          </div>

          <div className="space-y-4">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{exp.test_name}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        exp.status === 'RUNNING'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {exp.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        Target: {exp.target_segment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Hypothesis: <span className="text-slate-300 font-medium">{exp.hypothesis}</span></p>
                  </div>

                  <span className="text-xs font-mono text-amber-400 font-bold self-start sm:self-auto">
                    Sample: {exp.sample_size} customers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Variant A (Control)</span>
                    <div className="font-bold text-white text-sm">{exp.variant_a}</div>
                    <div className="text-emerald-400 font-black text-base">{exp.conversion_rate_a}% conversion</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Variant B (Challenger)</span>
                    <div className="font-bold text-white text-sm">{exp.variant_b}</div>
                    <div className="text-sky-400 font-black text-base">{exp.conversion_rate_b}% conversion</div>
                  </div>
                </div>

                {exp.results_summary && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>{exp.results_summary}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BETA TESTING LOGS & BUG TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'beta' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Beta Features & Quality Assurance Tracker</h3>
              <p className="text-xs text-slate-400">Internal staff & VIP customer feedback on pre-release capabilities.</p>
            </div>
            <button
              onClick={() => setShowBetaModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Log Beta Feedback</span>
            </button>
          </div>

          <div className="space-y-3">
            {betaLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{log.feature_name}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      log.feedback_type === 'BUG'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {log.feedback_type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      log.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] text-slate-500">Severity: {log.severity}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono">
                    "{log.description}"
                  </p>

                  <div className="text-[11px] text-slate-500">
                    Logged by <strong className="text-slate-400">{log.tester_name}</strong> {log.tester_phone ? `(${log.tester_phone})` : ''} on {new Date(log.created_at).toLocaleDateString()}
                  </div>
                </div>

                {log.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateBetaStatus(log.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Log Customer Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Log Customer Review & NPS Rating</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateFeedback} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Customer Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Rating (1 to 5 Stars)</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Promoter)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars - Promoter)</option>
                    <option value="3">⭐⭐⭐ (3 Stars - Passive)</option>
                    <option value="2">⭐⭐ (2 Stars - Detractor)</option>
                    <option value="1">⭐ (1 Star - Detractor)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Quality">Product Quality</option>
                    <option value="Service">Staff Service</option>
                    <option value="Ambience">Cafe Ambience</option>
                    <option value="Pricing">Pricing & Value</option>
                    <option value="Speed">Checkout Speed</option>
                    <option value="Cleanliness">Cleanliness</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Customer Feedback Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What did the customer say about their experience?"
                  value={newFeedbackText}
                  onChange={(e) => setNewFeedbackText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Launch Experiment */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Launch A/B Feature Experiment</h3>
              <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Free Cookie vs 10% Discount"
                  required
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Hypothesis *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Complimentary cookie will drive higher repeat visits than discount."
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Variant A (Control) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10% Discount"
                    value={newVariantA}
                    onChange={(e) => setNewVariantA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Variant B (Challenger) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Cookie"
                    value={newVariantB}
                    onChange={(e) => setNewVariantB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Launch Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Beta Testing Feedback */}
      {showBetaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Log Beta Testing Feedback / Bug</h3>
              <button onClick={() => setShowBetaModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateBetaLog} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Feature Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AI Debtor Calling"
                  required
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Feedback Type</label>
                  <select
                    value={newFeedbackType}
                    onChange={(e) => setNewFeedbackType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="BUG">Bug / Defect</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="UX_FEEDBACK">UX & Usability</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue, step-to-reproduce, or suggestion..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBetaModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
