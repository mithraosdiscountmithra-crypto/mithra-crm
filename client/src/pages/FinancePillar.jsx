import React, { useState, useEffect } from 'react';
import api from '../api/client';
import DigitalKhata from './DigitalKhata';
import Expenses from './Expenses';
import {
  DollarSign,
  BookOpen,
  TrendingDown,
  FileCheck2,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Building,
  CreditCard,
  Percent
} from 'lucide-react';

export default function FinancePillar() {
  const [activeTab, setActiveTab] = useState('khata'); // 'khata', 'expenses', 'tax'
  const [taxReport, setTaxReport] = useState(null);
  const [loadingTax, setLoadingTax] = useState(false);

  const fetchTaxReport = async () => {
    try {
      setLoadingTax(true);
      const res = await api.finance.getTaxReport();
      if (res.success) {
        setTaxReport(res.report);
      }
    } catch (err) {
      console.error('Error fetching GST tax report:', err);
    } finally {
      setLoadingTax(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tax') {
      fetchTaxReport();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-rose-400" />
            <span>Pillar 5: Accounts & Financial Accounting</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Digital Khata, P&L & GST Tax Compliance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage customer credit ledgers with AI calling, track operating expenses, compute net profits, and generate monthly GSTR-3B tax reports.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('khata')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'khata' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Digital Khata / Udhaar</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'expenses' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Expenses & P&L</span>
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'tax' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Tax & GST Reports</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: DIGITAL KHATA */}
      {activeTab === 'khata' && (
        <div>
          <DigitalKhata />
        </div>
      )}

      {/* SUB-VIEW 2: EXPENSES & P&L */}
      {activeTab === 'expenses' && (
        <div>
          <Expenses />
        </div>
      )}

      {/* SUB-VIEW 3: GST & TAX COMPLIANCE REPORT */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Monthly Indian GST Compliance Summary (GSTR-3B)
              </h3>
              <p className="text-xs text-slate-400">
                Automated tax liability computation based on sales turnover and eligible Input Tax Credit (ITC).
              </p>
            </div>
            <button
              onClick={fetchTaxReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Tax Ledger</span>
            </button>
          </div>

          {loadingTax ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent mx-auto"></div>
              <p className="text-xs font-semibold">Aggregating GST invoices & computing Input Tax Credit...</p>
            </div>
          ) : taxReport ? (
            <div className="space-y-6">
              {/* GST Identification Header Card */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Registered Legal Entity</span>
                    <h4 className="text-base font-black text-white">{taxReport.merchant_name}</h4>
                    <p className="text-xs font-mono text-emerald-400 font-bold mt-0.5">GSTIN: {taxReport.gstin}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Tax Return Period</span>
                    <div className="text-sm font-black text-white">{taxReport.tax_period}</div>
                    <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      GSTR-3B Due: {taxReport.complianceStatus?.filingDueDate}
                    </span>
                  </div>
                </div>

                {/* 3 Key Tax Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Gross Taxable Turnover</span>
                    <div className="text-xl font-black text-white">₹{taxReport.turnover?.grossTurnover}</div>
                    <span className="text-[10px] text-slate-500">POS & Online Store Orders</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Output GST</span>
                    <div className="text-xl font-black text-amber-400">₹{taxReport.outputTax?.totalOutputGST}</div>
                    <span className="text-[10px] text-slate-500">CGST: ₹{taxReport.outputTax?.cgst} | SGST: ₹{taxReport.outputTax?.sgst}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Eligible Input Tax Credit (ITC)</span>
                    <div className="text-xl font-black text-emerald-400">₹{taxReport.inputTaxCredit?.totalITC}</div>
                    <span className="text-[10px] text-emerald-500/80">From Vendor Bills & OPEX</span>
                  </div>
                </div>
              </div>

              {/* Tax Brackets Breakdown Table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Outward Taxable Supplies by GST Rate Slab
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Tax Slab & Category</th>
                        <th className="py-2.5 px-3">Taxable Value</th>
                        <th className="py-2.5 px-3">CGST (Central)</th>
                        <th className="py-2.5 px-3">SGST (State)</th>
                        <th className="py-2.5 px-3 text-right">Total Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      {taxReport.taxBrackets?.map((bracket, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-white">{bracket.slab}</td>
                          <td className="py-3 px-3">₹{bracket.taxableValue}</td>
                          <td className="py-3 px-3 text-slate-400">₹{bracket.cgst}</td>
                          <td className="py-3 px-3 text-slate-400">₹{bracket.sgst}</td>
                          <td className="py-3 px-3 text-right font-black text-amber-400">₹{bracket.totalTax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Net Tax Summary Bar */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400">Net GST Cash Liability Payable to Government:</span>
                    <div className="text-xl font-black text-emerald-400">₹{taxReport.netTaxPayable?.totalNetPayable}</div>
                    <span className="text-[10px] text-slate-500">Output Tax minus Input Tax Credit adjustment</span>
                  </div>

                  <button
                    onClick={() => alert('GSTR-3B monthly JSON summary generated and ready for upload to GST Portal.')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download GSTR-3B JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
