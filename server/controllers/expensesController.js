import db from '../db/index.js';

/**
 * Get all expenses for the authenticated merchant
 */
export const getExpenses = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { category, startDate, endDate } = req.query;

    const result = await db.query(
      `SELECT * FROM expenses 
       WHERE merchant_id = $1 
       ORDER BY expense_date DESC, id DESC`,
      [merchantId]
    );

    let expenses = result.rows;

    if (category && category !== 'All') {
      expenses = expenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    if (startDate) {
      expenses = expenses.filter(e => e.expense_date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.expense_date <= endDate);
    }

    const totalExpenseAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return res.json({
      success: true,
      expenses,
      totalExpenseAmount: totalExpenseAmount.toFixed(2),
      count: expenses.length
    });
  } catch (err) {
    console.error('[Get Expenses Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new expense entry
 */
export const createExpense = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { title, category, amount, expense_date, payment_method, notes } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide expense title and amount.'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number.'
      });
    }

    const result = await db.query(
      `INSERT INTO expenses (merchant_id, title, category, amount, expense_date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        merchantId,
        title.trim(),
        category ? category.trim() : 'General',
        parsedAmount.toFixed(2),
        expense_date || new Date().toISOString().split('T')[0],
        payment_method ? payment_method.trim() : 'Cash',
        notes ? notes.trim() : ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense: result.rows[0]
    });
  } catch (err) {
    console.error('[Create Expense Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete an expense entry
 */
export const deleteExpense = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM expenses WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found.' });
    }

    return res.json({
      success: true,
      message: 'Expense deleted successfully.'
    });
  } catch (err) {
    console.error('[Delete Expense Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * P&L Summary: Combines Gross Sales, Discounts, Expenses, and computes Net Profit/Loss
 */
export const getProfitLossSummary = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    // 1. Fetch Sales & Redemptions
    const salesRes = await db.query(
      `/* ANALYTICS_SUMMARY */
       SELECT 
         COALESCE(SUM(bill_amount), 0) as total_sales,
         COALESCE(SUM(discount_given), 0) as total_discounts
       FROM redemptions
       WHERE merchant_id = $1`,
      [merchantId]
    );

    const grossSales = parseFloat(salesRes.rows[0]?.total_sales || 0);
    const discountsGiven = parseFloat(salesRes.rows[0]?.total_discounts || 0);
    const netRevenue = Math.max(0, grossSales - discountsGiven);

    // 2. Fetch Expenses
    const expensesRes = await db.query(
      `SELECT * FROM expenses WHERE merchant_id = $1`,
      [merchantId]
    );
    const expenses = expensesRes.rows;

    let totalExpenses = 0;
    const categoryBreakdown = {};

    expenses.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      totalExpenses += amt;
      const cat = e.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    });

    // 3. Compute Net Profit / Loss
    const netProfitLoss = netRevenue - totalExpenses;
    const isProfitable = netProfitLoss >= 0;
    const profitMargin = netRevenue > 0 
      ? Math.round((netProfitLoss / netRevenue) * 100) 
      : 0;

    // Format category breakdown for visual charts/bars
    const categoriesArray = Object.keys(categoryBreakdown).map(cat => ({
      category: cat,
      amount: categoryBreakdown[cat].toFixed(2),
      percentage: totalExpenses > 0 ? Math.round((categoryBreakdown[cat] / totalExpenses) * 100) : 0
    })).sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    return res.json({
      success: true,
      pnl: {
        grossSales: grossSales.toFixed(2),
        discountsGiven: discountsGiven.toFixed(2),
        netRevenue: netRevenue.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfitLoss: netProfitLoss.toFixed(2),
        isProfitable,
        profitMargin,
        categoryBreakdown: categoriesArray,
        recentExpenses: expenses.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('[P&L Summary Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
