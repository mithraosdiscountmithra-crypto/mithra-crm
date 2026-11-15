import db from '../db/index.js';

/**
 * Get Udhaar / Khata Summary for the logged-in merchant
 * Aggregates net balances per customer and overall outstanding debt
 */
export const getUdhaarSummary = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    // 1. Fetch all customers for merchant
    const custRes = await db.query(
      `SELECT id, name, phone FROM customers WHERE merchant_id = $1 ORDER BY name ASC`,
      [merchantId]
    );
    const customers = custRes.rows;

    // 2. Fetch all ledger transactions for merchant
    const ledgerRes = await db.query(
      `SELECT cl.*, c.name as customer_name, c.phone as customer_phone
       FROM customer_ledgers cl
       JOIN customers c ON c.id = cl.customer_id
       WHERE cl.merchant_id = $1
       ORDER BY cl.created_at DESC`,
      [merchantId]
    );
    const transactions = ledgerRes.rows;

    // 3. Compute per-customer aggregates
    let totalOutstanding = 0;
    let totalCollected = 0;
    let totalGivenOverall = 0;

    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.id] = {
        customer_id: c.id,
        name: c.name,
        phone: c.phone,
        total_given: 0,
        total_paid: 0,
        net_balance: 0,
        pending_count: 0,
        last_transaction: null,
        due_date: null
      };
    });

    transactions.forEach(t => {
      const cid = t.customer_id;
      if (!customerMap[cid]) {
        customerMap[cid] = {
          customer_id: cid,
          name: t.customer_name || 'Customer',
          phone: t.customer_phone || '',
          total_given: 0,
          total_paid: 0,
          net_balance: 0,
          pending_count: 0,
          last_transaction: null,
          due_date: null
        };
      }

      const amt = parseFloat(t.amount) || 0;
      if (t.transaction_type === 'GIVEN') {
        customerMap[cid].total_given += amt;
        totalGivenOverall += amt;
        if (t.status === 'PENDING') {
          customerMap[cid].pending_count += 1;
          if (t.due_date && !customerMap[cid].due_date) {
            customerMap[cid].due_date = t.due_date;
          }
        }
      } else if (t.transaction_type === 'PAID') {
        customerMap[cid].total_paid += amt;
        totalCollected += amt;
      }

      if (!customerMap[cid].last_transaction) {
        customerMap[cid].last_transaction = t.created_at;
      }
    });

    // Calculate net balances
    const customerSummaries = Object.values(customerMap).map(c => {
      const net = Math.max(0, c.total_given - c.total_paid);
      if (net > 0) {
        totalOutstanding += net;
      }
      return {
        ...c,
        total_given: c.total_given.toFixed(2),
        total_paid: c.total_paid.toFixed(2),
        net_balance: net.toFixed(2)
      };
    }).sort((a, b) => parseFloat(b.net_balance) - parseFloat(a.net_balance));

    const pendingCustomersCount = customerSummaries.filter(c => parseFloat(c.net_balance) > 0).length;

    return res.json({
      success: true,
      summary: {
        totalOutstanding: totalOutstanding.toFixed(2),
        totalCollected: totalCollected.toFixed(2),
        totalGivenOverall: totalGivenOverall.toFixed(2),
        pendingCustomersCount,
        totalCustomers: customers.length
      },
      customers: customerSummaries,
      recentTransactions: transactions.slice(0, 10)
    });
  } catch (err) {
    console.error('[Get Udhaar Summary Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get full passbook statement for a specific customer
 */
export const getCustomerLedger = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { customerId } = req.params;

    // Verify customer belongs to merchant
    const custRes = await db.query(
      `SELECT id, name, phone, birthday, anniversary FROM customers WHERE id = $1 AND merchant_id = $2`,
      [customerId, merchantId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found under your merchant account.'
      });
    }

    const customer = custRes.rows[0];

    // Fetch full ledger statement
    const ledgerRes = await db.query(
      `SELECT cl.*, c.name as customer_name, c.phone as customer_phone
       FROM customer_ledgers cl
       JOIN customers c ON c.id = cl.customer_id
       WHERE cl.merchant_id = $1 AND cl.customer_id = $2
       ORDER BY cl.created_at DESC`,
      [merchantId, customerId]
    );

    const transactions = ledgerRes.rows;

    let totalGiven = 0;
    let totalPaid = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.transaction_type === 'GIVEN') totalGiven += amt;
      if (t.transaction_type === 'PAID') totalPaid += amt;
    });

    const netBalance = Math.max(0, totalGiven - totalPaid);

    return res.json({
      success: true,
      customer,
      summary: {
        totalGiven: totalGiven.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        netBalance: netBalance.toFixed(2)
      },
      transactions
    });
  } catch (err) {
    console.error('[Get Customer Ledger Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Record a new Udhaar entry (GIVEN or PAID)
 */
export const addUdhaarEntry = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { customer_id, transaction_type, amount, notes, due_date } = req.body;

    if (!customer_id || !transaction_type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide customer_id, transaction_type (GIVEN or PAID), and amount.'
      });
    }

    const type = transaction_type.toUpperCase();
    if (type !== 'GIVEN' && type !== 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Transaction type must be either GIVEN or PAID.'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number greater than 0.'
      });
    }

    // Check customer exists for merchant
    const custRes = await db.query(
      `SELECT id, name, phone FROM customers WHERE id = $1 AND merchant_id = $2`,
      [customer_id, merchantId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found under your merchant account.'
      });
    }

    const customer = custRes.rows[0];
    const initialStatus = type === 'PAID' ? 'SETTLED' : 'PENDING';

    const result = await db.query(
      `INSERT INTO customer_ledgers (merchant_id, customer_id, transaction_type, amount, notes, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        merchantId,
        customer.id,
        type,
        parsedAmount.toFixed(2),
        notes ? notes.trim() : '',
        due_date || null,
        initialStatus
      ]
    );

    return res.status(201).json({
      success: true,
      message: type === 'GIVEN' 
        ? `Recorded $${parsedAmount.toFixed(2)} credit given to ${customer.name}`
        : `Recorded $${parsedAmount.toFixed(2)} payment received from ${customer.name}`,
      entry: {
        ...result.rows[0],
        customer_name: customer.name,
        customer_phone: customer.phone
      }
    });
  } catch (err) {
    console.error('[Add Udhaar Entry Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Mark a pending ledger entry as SETTLED
 */
export const settleUdhaarEntry = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE customer_ledgers 
       SET status = 'SETTLED'
       WHERE id = $1 AND merchant_id = $2
       RETURNING *`,
      [id, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ledger entry not found.'
      });
    }

    return res.json({
      success: true,
      message: 'Ledger entry marked as settled.',
      entry: result.rows[0]
    });
  } catch (err) {
    console.error('[Settle Udhaar Entry Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
