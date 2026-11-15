import db from '../db/index.js';

/**
 * Suppliers & Supplier Ledger (Accounts Payable) Controller
 */

// 1. GET /api/suppliers - List all suppliers with outstanding payable balance & PO stats
export const getSuppliers = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    const query = `
      SELECT s.*,
        COALESCE((
          SELECT SUM(CASE WHEN sl.transaction_type = 'BILL' THEN sl.amount ELSE -sl.amount END)
          FROM supplier_ledgers sl
          WHERE sl.supplier_id = s.id AND sl.merchant_id = s.merchant_id
        ), 0) AS net_balance,
        COALESCE((
          SELECT SUM(sl.amount)
          FROM supplier_ledgers sl
          WHERE sl.supplier_id = s.id AND sl.merchant_id = s.merchant_id AND sl.transaction_type = 'BILL'
        ), 0) AS total_billed,
        COALESCE((
          SELECT SUM(sl.amount)
          FROM supplier_ledgers sl
          WHERE sl.supplier_id = s.id AND sl.merchant_id = s.merchant_id AND sl.transaction_type = 'PAYMENT'
        ), 0) AS total_paid,
        (
          SELECT COUNT(*)
          FROM purchase_orders po
          WHERE po.supplier_id = s.id AND po.merchant_id = s.merchant_id
        ) AS po_count
      FROM suppliers s
      WHERE s.merchant_id = $1
      ORDER BY s.id ASC
    `;

    const result = await db.query(query, [merchantId]);
    const suppliers = result.rows;

    const totalPayable = suppliers.reduce((sum, s) => {
      const bal = parseFloat(s.net_balance) || 0;
      return bal > 0 ? sum + bal : sum;
    }, 0);

    const totalBilled = suppliers.reduce((sum, s) => sum + (parseFloat(s.total_billed) || 0), 0);
    const totalPaid = suppliers.reduce((sum, s) => sum + (parseFloat(s.total_paid) || 0), 0);

    res.json({
      success: true,
      suppliers,
      summary: {
        totalSuppliers: suppliers.length,
        totalPayable: totalPayable.toFixed(2),
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2)
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/suppliers/:id - Get single supplier details
export const getSupplierById = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM suppliers WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/suppliers - Add new wholesaler/vendor
export const createSupplier = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      name,
      contact_person,
      phone,
      email,
      address,
      gst_or_tax_id,
      payment_terms,
      is_active
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Supplier company/vendor name is required' });
    }

    const result = await db.query(
      `INSERT INTO suppliers 
        (merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        merchantId,
        name.trim(),
        contact_person ? contact_person.trim() : '',
        phone ? phone.trim() : '',
        email ? email.trim() : '',
        address ? address.trim() : '',
        gst_or_tax_id ? gst_or_tax_id.trim() : '',
        payment_terms ? payment_terms.trim() : 'Net 30',
        is_active !== undefined ? Boolean(is_active) : true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 4. PUT /api/suppliers/:id - Update supplier info
export const updateSupplier = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const {
      name,
      contact_person,
      phone,
      email,
      address,
      gst_or_tax_id,
      payment_terms,
      is_active
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Supplier company/vendor name is required' });
    }

    const result = await db.query(
      `UPDATE suppliers 
       SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, gst_or_tax_id = $6, payment_terms = $7, is_active = $8
       WHERE id = $9 AND merchant_id = $10
       RETURNING *`,
      [
        name.trim(),
        contact_person ? contact_person.trim() : '',
        phone ? phone.trim() : '',
        email ? email.trim() : '',
        address ? address.trim() : '',
        gst_or_tax_id ? gst_or_tax_id.trim() : '',
        payment_terms ? payment_terms.trim() : 'Net 30',
        is_active !== undefined ? Boolean(is_active) : true,
        id,
        merchantId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 5. DELETE /api/suppliers/:id - Remove supplier
export const deleteSupplier = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM suppliers WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// 6. GET /api/suppliers/:id/ledger - Full statement of accounts payable for supplier
export const getSupplierLedger = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const supRes = await db.query(
      `SELECT * FROM suppliers WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (supRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    const supplier = supRes.rows[0];

    const ledgerRes = await db.query(
      `SELECT * FROM supplier_ledgers 
       WHERE supplier_id = $1 AND merchant_id = $2 
       ORDER BY payment_date DESC, id DESC`,
      [id, merchantId]
    );

    const entries = ledgerRes.rows;

    const totalBilled = entries
      .filter(e => e.transaction_type === 'BILL')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const totalPaid = entries
      .filter(e => e.transaction_type === 'PAYMENT')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netPayable = totalBilled - totalPaid;

    res.json({
      success: true,
      supplier,
      statement: {
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        netPayable: netPayable.toFixed(2),
        entriesCount: entries.length,
        entries
      }
    });
  } catch (err) {
    next(err);
  }
};

// 7. POST /api/suppliers/payment - Record settlement / payment made to wholesaler
export const recordSupplierPayment = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      supplier_id,
      purchase_order_id,
      amount,
      notes,
      reference_no,
      payment_date,
      payment_method
    } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ success: false, error: 'supplier_id is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount greater than 0 is required' });
    }

    // Verify supplier belongs to merchant
    const supRes = await db.query(
      `SELECT * FROM suppliers WHERE id = $1 AND merchant_id = $2`,
      [supplier_id, merchantId]
    );

    if (supRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    const supplier = supRes.rows[0];

    const result = await db.query(
      `INSERT INTO supplier_ledgers 
        (merchant_id, supplier_id, purchase_order_id, transaction_type, amount, notes, reference_no, payment_date, payment_method, status)
       VALUES ($1, $2, $3, 'PAYMENT', $4, $5, $6, $7, $8, 'SETTLED')
       RETURNING *`,
      [
        merchantId,
        supplier_id,
        purchase_order_id || null,
        parsedAmount,
        notes ? notes.trim() : 'Payment made to supplier',
        reference_no ? reference_no.trim() : `TXN-${Date.now().toString().slice(-6)}`,
        payment_date || new Date().toISOString().split('T')[0],
        payment_method || 'BANK_TRANSFER'
      ]
    );

    res.status(201).json({
      success: true,
      message: `Payment of $${parsedAmount.toFixed(2)} recorded for ${supplier.name}`,
      payment: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};
