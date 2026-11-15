import db from '../db/index.js';

/**
 * Get all customers for the authenticated merchant with membership details
 */
export const getCustomers = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    const result = await db.query(
      `SELECT 
         c.id,
         c.merchant_id,
         c.name,
         c.phone,
         c.birthday,
         c.anniversary,
         c.created_at,
         cm.id as membership_id,
         cm.status as membership_status,
         cm.start_date,
         cm.expiry_date,
         mp.id as plan_id,
         mp.plan_name,
         mp.discount_percent,
         mp.benefits_description
       FROM customers c
       LEFT JOIN customer_memberships cm 
         ON cm.customer_id = c.id 
         AND cm.status = 'ACTIVE' 
         AND cm.expiry_date >= CURRENT_DATE
       LEFT JOIN membership_plans mp 
         ON mp.id = cm.plan_id
       WHERE c.merchant_id = $1
       ORDER BY c.created_at DESC`,
      [merchantId]
    );

    return res.json({
      success: true,
      customers: result.rows
    });
  } catch (err) {
    console.error('[Get Customers Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new customer and optionally assign a membership plan
 */
export const createCustomer = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { name, phone, birthday, anniversary, plan_id } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and phone number are required.'
      });
    }

    const cleanPhone = phone.trim();

    // Check if customer with this phone already exists under this merchant
    const existing = await db.query(
      'SELECT id, name FROM customers WHERE merchant_id = $1 AND phone = $2',
      [merchantId, cleanPhone]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `A customer with phone number ${cleanPhone} already exists (${existing.rows[0].name}).`
      });
    }

    // Insert customer
    const custResult = await db.query(
      `INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        merchantId,
        name.trim(),
        cleanPhone,
        birthday || null,
        anniversary || null
      ]
    );

    const customer = custResult.rows[0];
    let membership = null;

    // If an initial plan was selected, enroll them immediately
    if (plan_id) {
      const planRes = await db.query(
        'SELECT id, plan_name, validity_months FROM membership_plans WHERE id = $1 AND merchant_id = $2',
        [plan_id, merchantId]
      );

      if (planRes.rows.length > 0) {
        const plan = planRes.rows[0];
        const validityMonths = plan.validity_months || 12;

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

        const memRes = await db.query(
          `INSERT INTO customer_memberships (customer_id, plan_id, start_date, expiry_date, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            customer.id,
            plan.id,
            startDate.toISOString().split('T')[0],
            expiryDate.toISOString().split('T')[0],
            'ACTIVE'
          ]
        );
        membership = memRes.rows[0];
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        ...customer,
        membership
      }
    });
  } catch (err) {
    console.error('[Create Customer Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update Customer details
 */
export const updateCustomer = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { name, phone, birthday, anniversary } = req.body;

    const result = await db.query(
      `UPDATE customers
       SET name = $1, phone = $2, birthday = $3, anniversary = $4
       WHERE id = $5 AND merchant_id = $6
       RETURNING *`,
      [
        name,
        phone,
        birthday || null,
        anniversary || null,
        id,
        merchantId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('[Update Customer Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM customers WHERE id = $1 AND merchant_id = $2',
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    return res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    console.error('[Delete Customer Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
