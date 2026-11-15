import db from '../db/index.js';

/**
 * Assign or Renew a membership plan for a customer
 */
export const assignMembership = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { customer_id, plan_id, custom_validity_months } = req.body;

    if (!customer_id || !plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both customer_id and plan_id.'
      });
    }

    // Verify customer belongs to merchant
    const custRes = await db.query(
      'SELECT id, name FROM customers WHERE id = $1 AND merchant_id = $2',
      [customer_id, merchantId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found under your merchant account.'
      });
    }

    // Verify plan belongs to merchant
    const planRes = await db.query(
      'SELECT id, plan_name, validity_months, discount_percent FROM membership_plans WHERE id = $1 AND merchant_id = $2',
      [plan_id, merchantId]
    );

    if (planRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Membership plan not found.'
      });
    }

    const plan = planRes.rows[0];
    const months = custom_validity_months ? parseInt(custom_validity_months, 10) : plan.validity_months;

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // Deactivate prior active memberships for this customer
    await db.query(
      `UPDATE customer_memberships 
       SET status = 'EXPIRED' 
       WHERE customer_id = $1 AND status = 'ACTIVE'`,
      [customer_id]
    );

    // Create new active membership
    const result = await db.query(
      `INSERT INTO customer_memberships (customer_id, plan_id, start_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING *`,
      [
        customer_id,
        plan.id,
        startDate.toISOString().split('T')[0],
        expiryDate.toISOString().split('T')[0]
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Enrolled ${custRes.rows[0].name} in ${plan.plan_name} successfully!`,
      membership: {
        ...result.rows[0],
        plan_name: plan.plan_name,
        discount_percent: plan.discount_percent
      }
    });
  } catch (err) {
    console.error('[Assign Membership Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Cancel an active customer membership
 */
export const cancelMembership = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    // Verify the membership belongs to a customer of this merchant
    const memRes = await db.query(
      `SELECT cm.id 
       FROM customer_memberships cm
       JOIN customers c ON c.id = cm.customer_id
       WHERE cm.id = $1 AND c.merchant_id = $2`,
      [id, merchantId]
    );

    if (memRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Membership record not found.'
      });
    }

    await db.query(
      `UPDATE customer_memberships 
       SET status = 'CANCELLED' 
       WHERE id = $1`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Membership cancelled successfully.'
    });
  } catch (err) {
    console.error('[Cancel Membership Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
