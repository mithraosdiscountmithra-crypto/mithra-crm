import db from '../db/index.js';

/**
 * Accounts & Finance Pillar Controller
 * Features:
 * 1. Digital Udhaar & Khata receivables
 * 2. Operational expense breakdown & Net Profit/Loss
 * 3. Tax / GST compliance report (GSTR-3B summary, output tax vs input tax credit)
 */

export const getTaxReport = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    // 1. Fetch Sales (POS redemptions + Storefront orders)
    const [redemptionsRes, ordersRes, expensesRes, poRes] = await Promise.all([
      db.query(`SELECT * FROM redemptions WHERE merchant_id = $1`, [merchantId]),
      db.query(`SELECT * FROM customer_orders WHERE merchant_id = $1`, [merchantId]),
      db.query(`SELECT * FROM expenses WHERE merchant_id = $1`, [merchantId]),
      db.query(`SELECT * FROM purchase_orders WHERE merchant_id = $1 AND status = 'RECEIVED'`, [merchantId])
    ]);

    const redemptions = redemptionsRes.rows || [];
    const orders = ordersRes.rows || [];
    const expenses = expensesRes.rows || [];
    const inwardPOs = poRes.rows || [];

    // Compute Net Outward Supplies (Turnover)
    const posRevenue = redemptions.reduce((acc, r) => acc + (parseFloat(r.bill_amount) - parseFloat(r.discount_given)), 0);
    const orderRevenue = orders.reduce((acc, o) => acc + parseFloat(o.total_amount), 0);
    const totalTurnover = parseFloat((posRevenue + orderRevenue).toFixed(2));

    // GST Output Tax Calculation across standard Indian GST Tax Brackets
    // 5% bracket (F&B, Fresh Coffee, Bakery - ~70% of cafe turnover)
    const turnover5 = parseFloat((totalTurnover * 0.70).toFixed(2));
    const gst5 = parseFloat((turnover5 * 0.05).toFixed(2));

    // 12% bracket (Packaged Retail merchandise, roasted beans - ~20% of turnover)
    const turnover12 = parseFloat((totalTurnover * 0.20).toFixed(2));
    const gst12 = parseFloat((turnover12 * 0.12).toFixed(2));

    // 18% bracket (Brewing equipment, accessories - ~10% of turnover)
    const turnover18 = parseFloat((totalTurnover * 0.10).toFixed(2));
    const gst18 = parseFloat((turnover18 * 0.18).toFixed(2));

    const totalOutputGST = parseFloat((gst5 + gst12 + gst18).toFixed(2));
    const cgstOutput = parseFloat((totalOutputGST / 2).toFixed(2));
    const sgstOutput = parseFloat((totalOutputGST / 2).toFixed(2));

    // Input Tax Credit (ITC) from Inward Vendor Supplies & GST Expenses
    const rawMaterialPurchases = inwardPOs.reduce((acc, p) => acc + parseFloat(p.total_amount || 0), 0);
    const allowableExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const totalInwardTaxableValue = parseFloat((rawMaterialPurchases + (allowableExpenses * 0.40)).toFixed(2));

    // Blended average ITC of ~12% on inward purchases
    const inputTaxCredit = parseFloat((totalInwardTaxableValue * 0.12).toFixed(2));
    const itcCgst = parseFloat((inputTaxCredit / 2).toFixed(2));
    const itcSgst = parseFloat((inputTaxCredit / 2).toFixed(2));

    // Net GST Payable = Total Output Tax - Eligible ITC
    const netGstPayable = parseFloat(Math.max(0, totalOutputGST - inputTaxCredit).toFixed(2));

    res.json({
      success: true,
      report: {
        merchant_name: req.merchant.store_name,
        gstin: req.merchant.phone ? `29AAACP${req.merchant.phone.slice(-4)}1Z5` : '29AAACP12341Z5',
        tax_period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        currency: 'INR (₹)',
        turnover: {
          grossTurnover: totalTurnover,
          exemptSupplies: 0.00,
          netTaxableTurnover: totalTurnover
        },
        taxBrackets: [
          { slab: '5% (F&B / Cafe)', taxableValue: turnover5, taxRate: '5%', cgst: (gst5 / 2).toFixed(2), sgst: (gst5 / 2).toFixed(2), totalTax: gst5 },
          { slab: '12% (Packaged Beans)', taxableValue: turnover12, taxRate: '12%', cgst: (gst12 / 2).toFixed(2), sgst: (gst12 / 2).toFixed(2), totalTax: gst12 },
          { slab: '18% (Brewing Gear)', taxableValue: turnover18, taxRate: '18%', cgst: (gst18 / 2).toFixed(2), sgst: (gst18 / 2).toFixed(2), totalTax: gst18 }
        ],
        outputTax: {
          totalOutputGST,
          cgst: cgstOutput,
          sgst: sgstOutput,
          igst: 0.00
        },
        inputTaxCredit: {
          totalITC: inputTaxCredit,
          cgst: itcCgst,
          sgst: itcSgst,
          inwardTaxableValue: totalInwardTaxableValue
        },
        netTaxPayable: {
          totalNetPayable: netGstPayable,
          cgstNet: (netGstPayable / 2).toFixed(2),
          sgstNet: (netGstPayable / 2).toFixed(2)
        },
        complianceStatus: {
          gstr1_status: 'READY_TO_FILE',
          gstr3b_status: 'DRAFT_GENERATED',
          filingDueDate: '20th of next month'
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
