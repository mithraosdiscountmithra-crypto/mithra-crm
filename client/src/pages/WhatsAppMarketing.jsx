import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Sparkles, 
  Calendar, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Search, 
  Tag, 
  Phone, 
  Check, 
  AlertCircle,
  Copy,
  RefreshCw,
  Gift,
  Flame,
  Award
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    title: 'Weekend Flash Discount',
    icon: Flame,
    text: 'Hey {customer_name}! 🔥 Treat yourself this weekend at {store_name}! Show this WhatsApp message at the counter to get an exclusive 20% OFF your entire bill. Valid through Sunday! ☕'
  },
  {
    title: 'Festival Celebration Offer',
    icon: Gift,
    text: 'Happy Holidays from the team at {store_name}, {customer_name}! 🎉 To celebrate, enjoy a complimentary artisanal treat with any purchase above ₹250. See you at the counter!'
  },
  {
    title: 'VIP Loyalty Reward',
    icon: Award,
    text: 'Hello {customer_name}! 🌟 As one of our most valued VIP guests at {store_name}, your double reward points week is live! Drop by for handcrafted specials.'
  },
  {
    title: 'Membership Invitation',
    icon: Sparkles,
    text: 'Hi {customer_name}! Unlock unlimited 15% discounts, birthday perks, and skip-the-line benefits by joining our {store_name} Loyalty Club on your next visit!'
  }
];

export default function WhatsAppMarketing() {
  const { merchant } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Composer State
  const [campaignName, setCampaignName] = useState('');
  const [targetSegment, setTargetSegment] = useState('ALL');
  const [messageTemplate, setMessageTemplate] = useState(
    'Hey {customer_name}! Enjoy an exclusive 15% discount at {store_name} today. Show this message at checkout! ☕'
  );
  const [audienceList, setAudienceList] = useState([]);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // Sent Tracker for local UI
  const [sentMap, setSentMap] = useState({});

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.whatsapp.getCampaigns();
      if (res.success) {
        setCampaigns(res.campaigns || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch WhatsApp campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAudience = async (segment = targetSegment, template = messageTemplate) => {
    try {
      setLoadingAudience(true);
      const res = await api.whatsapp.getAudience(segment, template);
      if (res.success) {
        setAudienceList(res.audience || []);
      }
    } catch (err) {
      console.error('Error fetching target audience:', err);
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchAudience(targetSegment, messageTemplate);
  }, [targetSegment, messageTemplate]);

  const handleApplyPreset = (text) => {
    setMessageTemplate(text);
  };

  const handleCreateAndLogCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setError('Please provide a campaign title');
      return;
    }
    if (!messageTemplate.trim()) {
      setError('Please write a promotional message');
      return;
    }

    try {
      setSubmittingCampaign(true);
      setError('');

      const res = await api.whatsapp.createCampaign({
        name: campaignName.trim(),
        target_segment: targetSegment,
        message: messageTemplate.trim()
      });

      if (res.success) {
        setSuccess(`Campaign "${campaignName}" launched and logged for ${res.recipientsCount} customers!`);
        setCampaignName('');
        await fetchCampaigns();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to log WhatsApp campaign');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleMarkSent = (customerId) => {
    setSentMap(prev => ({ ...prev, [customerId]: true }));
  };

  // Preview formatted text with sample customer
  const sampleCustomerName = audienceList[0]?.name || 'Alex Rivera';
  const previewText = messageTemplate
    .replace(/{customer_name}/g, sampleCustomerName)
    .replace(/{store_name}/g, merchant?.store_name || 'Artisan Cafe');

  // Stats
  const totalMessagesSent = campaigns.reduce((acc, c) => acc + (c.recipients_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Marketing & Retention</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Bulk Broadcasts
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Bulk WhatsApp Marketing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Send customized promotional offers, festive discounts, and tier rewards to customer segments directly via WhatsApp Web.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              fetchCampaigns();
              fetchAudience();
            }}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Marketing"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
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
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Broadcast Campaigns</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{campaigns.length} Launched</div>
          <div className="text-[11px] text-slate-500">Historical merchant broadcasts</div>
        </div>

        {/* Total Dispatched */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Customer Touches</span>
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300 tracking-tight">{totalMessagesSent} Messages</div>
          <div className="text-[11px] text-slate-500">Promotional deliveries logged</div>
        </div>

        {/* Current Segment Audience */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Selected Segment Reach</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            {loadingAudience ? '...' : `${audienceList.length} Customers`}
          </div>
          <div className="text-[11px] text-slate-500">Filter: {targetSegment}</div>
        </div>

        {/* WhatsApp Conversion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Channel Delivery Rate</span>
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 tracking-tight">98.5%</div>
          <div className="text-[11px] text-slate-500">Direct WhatsApp Web deep-links</div>
        </div>
      </div>

      {/* Main Campaign Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Broadcast Campaign Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Compose Broadcast Campaign</h2>
              </div>
              <span className="text-xs text-slate-400">Target Segment & Message</span>
            </div>

            <form onSubmit={handleCreateAndLogCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Campaign Name / Purpose *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. November Weekend Special / Diwali Celebration 20% Off"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Customer Segment *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ALL', label: 'All Customers' },
                    { id: 'ACTIVE_MEMBERS', label: 'Active Members' },
                    { id: 'VIP', label: 'VIP Members' },
                    { id: 'NON_MEMBERS', label: 'Non-Members' }
                  ].map(seg => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setTargetSegment(seg.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition text-center ${
                        targetSegment === seg.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Presets */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Quick Campaign Templates</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_TEMPLATES.map((tmpl, idx) => {
                    const Icon = tmpl.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(tmpl.text)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-left hover:border-emerald-500/40 hover:bg-slate-900 transition space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <Icon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{tmpl.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{tmpl.text}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Composer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Broadcast Message *</label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Tags:</span>
                    <button
                      type="button"
                      onClick={() => setMessageTemplate(prev => prev + ' {customer_name}')}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 font-mono"
                    >
                      {'{customer_name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageTemplate(prev => prev + ' {store_name}')}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 font-mono"
                    >
                      {'{store_name}'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans text-xs sm:text-sm leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  Ready to send to <strong className="text-white">{audienceList.length}</strong> contacts
                </div>
                <button
                  type="submit"
                  disabled={submittingCampaign || audienceList.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-95 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingCampaign ? 'Recording...' : 'Log & Save Campaign'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Message Live Preview Card */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Live Customer WhatsApp Preview
              </span>
              <span className="text-[11px] text-slate-500">Sample recipient: {sampleCustomerName}</span>
            </div>
            {/* WhatsApp bubble mockup */}
            <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#202c33] max-w-md mx-auto space-y-2">
              <div className="p-3.5 rounded-xl bg-[#005c4b] text-white text-xs leading-relaxed shadow-sm font-sans whitespace-pre-wrap">
                {previewText}
                <div className="text-[10px] text-emerald-200/60 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Check className="w-3 h-3 text-sky-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Target Audience Queue & 1-Click WhatsApp Launcher (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Audience Queue</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {audienceList.length} Recipients
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Click the green WhatsApp button next to any customer to open WhatsApp Web with their pre-filled personalized offer!
            </p>

            {loadingAudience ? (
              <div className="py-12 flex justify-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              </div>
            ) : audienceList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No customers found matching segment "{targetSegment}".
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {audienceList.map((customer) => {
                  const isSent = sentMap[customer.id];
                  return (
                    <div 
                      key={customer.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{customer.name}</span>
                          {customer.membership_plan && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold truncate max-w-[120px]">
                              {customer.membership_plan}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSent && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Sent</span>
                          </span>
                        )}
                        <a
                          href={customer.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleMarkSent(customer.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                            isSent 
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30'
                          }`}
                          title="Open WhatsApp Web chat with prefilled message"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isSent ? 'Resend' : 'Send'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Broadcast Log Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Campaign Broadcast History</h2>
          </div>
          <span className="text-xs text-slate-400">{campaigns.length} past campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Launched Date</th>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Broadcast Message</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No campaigns launched yet. Create your first broadcast above!
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                      {camp.created_at ? new Date(camp.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {camp.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {camp.target_segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {camp.recipients_count} customers
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-sm truncate">
                      {camp.message}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>{camp.status || 'SENT'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
