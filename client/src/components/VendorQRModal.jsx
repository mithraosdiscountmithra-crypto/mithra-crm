import React, { useState } from 'react';
import { 
  QrCode, 
  X, 
  Download, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  UtensilsCrossed, 
  Sparkles, 
  ExternalLink,
  Store,
  MapPin,
  Phone
} from 'lucide-react';

export default function VendorQRModal({ isOpen, onClose, merchant }) {
  if (!isOpen) return null;

  const [tableNumber, setTableNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const merchantId = merchant?.id || 1;
  const storeName = merchant?.store_name || 'My Store';
  const category = merchant?.category || 'Retail & Food';
  const city = merchant?.city || '';
  const phone = merchant?.phone || '';

  // Determine base URL (supports localhost or production domain)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mithra-crm.vercel.app';
  const storefrontUrl = `${origin}/?store=${merchantId}${tableNumber ? `&table=${encodeURIComponent(tableNumber)}` : ''}`;

  // QR Code Image URL (High Resolution 500x500 PNG)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=${encodeURIComponent(storefrontUrl)}`;

  // Copy Link to Clipboard
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Share to Customer on WhatsApp
  const handleShareWhatsApp = () => {
    const tableText = tableNumber ? ` (Table #${tableNumber})` : '';
    const text = `👋 Hello! Welcome to *${storeName}*${tableText}!\n\n🍽️ Scan our QR Code or click the link below to view our live menu and order directly from your phone:\n👉 ${storefrontUrl}\n\n✨ Enjoy fresh food, fast service & instant VIP discounts!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Download High-Resolution QR PNG Image
  const handleDownloadQR = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(qrCodeImageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
      const tableSuffix = tableNumber ? `_Table_${tableNumber}` : '';
      link.download = `${cleanName}_QR${tableSuffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: Open in new tab for direct save
      window.open(qrCodeImageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Table Standee / Poster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Vendor Storefront QR Code</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live & Scannable
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Share with customers on WhatsApp, display at shop counter, or print for dining tables
            </p>
          </div>
        </div>

        {/* Table Selector (Optional for Dine-In Restaurants) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Select QR Destination / Table (Optional):</span>
            </span>
            {tableNumber && (
              <button
                type="button"
                onClick={() => setTableNumber('')}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Reset to General Store QR
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTableNumber('')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                !tableNumber
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              🏪 General Store (Counter / Takeaway)
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTableNumber(String(t))}
                className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all border ${
                  tableNumber === String(t)
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Table {t}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Standee Card (Screen & Print Format) */}
        <div 
          id="vendor-qr-standee" 
          className="relative bg-white text-slate-950 rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-indigo-600 flex flex-col items-center text-center space-y-4 overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="w-full border-b-2 border-dashed border-slate-200 pb-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-2xl shadow-md mb-2">
              👑
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {storeName}
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-0.5">
              <span>{category}</span>
              {city && (
                <>
                  <span>•</span>
                  <span>{city}</span>
                </>
              )}
            </div>
            {tableNumber ? (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm">
                🍽️ Dine-In Table #{tableNumber}
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                📱 Digital Menu & Contactless Ordering
              </div>
            )}
          </div>

          {/* QR Code Canvas / Image */}
          <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200 relative group">
            <img
              src={qrCodeImageUrl}
              alt={`${storeName} QR Code`}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
            />
          </div>

          {/* Instructions Callout */}
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-black text-indigo-700 tracking-wide uppercase flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Scan with Phone Camera to View Menu & Order</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              No App Required • Paytm / GPay / WhatsApp / Camera • Live Order Tracking
            </p>
          </div>

          {/* Standee Footer */}
          <div className="w-full pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2">
            <span>Powered by Mithra CRM</span>
            <span>Fast Cash & Online Checkout</span>
          </div>
        </div>

        {/* Quick URL & Copy Row */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
          <input
            type="text"
            readOnly
            value={storefrontUrl}
            className="w-full bg-transparent text-xs text-slate-300 font-mono outline-none select-all truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Instant Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Share on WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          {/* Download QR Code Image */}
          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Saving...' : 'Download QR Image'}</span>
          </button>

          {/* Print Table Standee / Poster */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print Standee Poster</span>
          </button>
        </div>
      </div>
    </div>
  );
}