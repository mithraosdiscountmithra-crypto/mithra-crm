import db from '../db/index.js';

/**
 * Get all membership plans for current tenant
 */
export const getPlans = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    let result = await db.query(
      `SELECT * FROM membership_plans 
       WHERE merchant_id = $1 
       ORDER BY id ASC`,
      [merchantId]
    );

    // If merchant has no plans configured yet, auto-create 3 standard starter plans so POS works immediately!
    if (result.rows.length === 0) {
      const defaultPlans = [
        ['Silver Member', 99.00, 12, 10.00, '10% instant discount on all orders'],
        ['Gold VIP Pass', 199.00, 12, 20.00, '20% VIP discount on all orders + priority billing'],
        ['Platinum VIP Elite', 299.00, 12, 30.00, '30% Elite discount + special celebratory perks']
      ];

      for (const p of defaultPlans) {
        await db.query(
          `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [merchantId, p[0], p[1], p[2], p[3], p[4]]
        );
      }

      result = await db.query(
        `SELECT * FROM membership_plans 
         WHERE merchant_id = $1 
         ORDER BY id ASC`,
        [merchantId]
      );
    }

    return res.json({
      success: true,
      plans: result.rows
    });
  } catch (err) {
    console.error('[Get Plans Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new membership plan
 */
export const createPlan = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { plan_name, price, validity_months, discount_percent, benefits_description } = req.body;

    if (!plan_name) {
      return res.status(400).json({ success: false, error: 'Plan name is required.' });
    }

    const result = await db.query(
      `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        merchantId,
        plan_name.trim(),
        price ? parseFloat(price) : 0.00,
        validity_months ? parseInt(validity_months, 10) : 12,
        discount_percent !== undefined ? parseFloat(discount_percent) : 10.00,
        benefits_description ? benefits_description.trim() : ''
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      plan: result.rows[0]
    });
  } catch (err) {
    console.error('[Create Plan Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update a membership plan
 */
export const updatePlan = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const { plan_name, price, validity_months, discount_percent, benefits_description } = req.body;

    const result = await db.query(
      `UPDATE membership_plans
       SET plan_name = $1, price = $2, validity_months = $3, discount_percent = $4, benefits_description = $5
       WHERE id = $6 AND merchant_id = $7
       RETURNING *`,
      [
        plan_name,
        parseFloat(price) || 0,
        parseInt(validity_months, 10) || 12,
        parseFloat(discount_percent) || 0,
        benefits_description || '',
        id,
        merchantId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership plan not found.' });
    }

    return res.json({
      success: true,
      message: 'Plan updated successfully',
      plan: result.rows[0]
    });
  } catch (err) {
    console.error('[Update Plan Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete a membership plan
 */
export const deletePlan = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    // Unlink or clean up any customer memberships referencing this plan
    await db.query(
      'DELETE FROM customer_memberships WHERE plan_id = $1',
      [id]
    ).catch(() => {});

    const result = await db.query(
      'DELETE FROM membership_plans WHERE id = $1 AND merchant_id = $2',
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Plan not found.' });
    }

    return res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (err) {
    console.error('[Delete Plan Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
