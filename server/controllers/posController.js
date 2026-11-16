import db from '../db/index.js';

/**
 * Fast POS Verification by Customer Phone Number
 * Microsecond tenant-scoped query with index on (merchant_id, phone)
 */
export const verifyCustomerByPhone = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number parameter is required.'
      });
    }

    const cleanPhone = String(phone).trim();

    // Fast indexed query
    // Query tagged with POS_CUSTOMER_LOOKUP for in-memory & Neon DB optimization
    const result = await db.query(
      `/* POS_CUSTOMER_LOOKUP */
       SELECT 
         c.id as customer_id,
         c.name,
         c.phone,
         c.birthday,
         c.anniversary,
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
         AND c.phone = $2
       LIMIT 1`,
      [merchantId, cleanPhone]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: 'No customer found with this phone number under your store.'
      });
    }

    const record = result.rows[0];
    const hasActiveMembership = Boolean(
      record.membership_id &&
      record.membership_status === 'ACTIVE' &&
      new Date(record.expiry_date) >= new Date(new Date().toDateString())
    );

    // Check for Birthday or Anniversary perks today
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    let isBirthdayToday = false;
    let isAnniversaryToday = false;

    if (record.birthday) {
      const bDate = new Date(record.birthday);
      if (bDate.getUTCMonth() + 1 === currentMonth && bDate.getUTCDate() === currentDay) {
        isBirthdayToday = true;
      }
    }

    if (record.anniversary) {
      const aDate = new Date(record.anniversary);
      if (aDate.getUTCMonth() + 1 === currentMonth && aDate.getUTCDate() === currentDay) {
        isAnniversaryToday = true;
      }
    }

    return res.json({
      success: true,
      found: true,
      customer: {
        id: record.customer_id,
        name: record.name,
        phone: record.phone,
        birthday: record.birthday,
        anniversary: record.anniversary,
        isBirthdayToday,
        isAnniversaryToday
      },
      membership: hasActiveMembership ? {
        id: record.membership_id,
        plan_id: record.plan_id,
        plan_name: record.plan_name,
        discount_percent: parseFloat(record.discount_percent) || 0,
        expiry_date: record.expiry_date,
        benefits_description: record.benefits_description,
        is_active: true
      } : null,
      message: hasActiveMembership 
        ? `Active Member: ${record.plan_name} (${record.discount_percent}% Discount)`
        : 'Customer registered but does not have an active membership plan.'
    });
  } catch (err) {
    console.error('[POS Verify Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fast POS Redemption Execution
 * Verifies membership, computes discount, logs transaction into redemptions table
 */
export const processRedemption = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { customer_id, bill_amount, custom_discount_percent } = req.body;

    const parsedBill = parseFloat(bill_amount);
    if (isNaN(parsedBill) || parsedBill <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid bill amount greater than 0.'
      });
    }

    // 1. Verify customer exists under this tenant
    const custRes = await db.query(
      'SELECT id, name, phone FROM customers WHERE id = $1 AND merchant_id = $2',
      [customer_id, merchantId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found under your merchant account.'
      });
    }

    const customer = custRes.rows[0];

    // 2. Fetch active membership & default discount rate
    const memRes = await db.query(
      `SELECT cm.id, cm.status, cm.expiry_date, mp.plan_name, mp.discount_percent
       FROM customer_memberships cm
       JOIN membership_plans mp ON mp.id = cm.plan_id
       WHERE cm.customer_id = $1 
         AND cm.status = 'ACTIVE' 
         AND cm.expiry_date >= CURRENT_DATE
       ORDER BY cm.id DESC
       LIMIT 1`,
      [customer_id]
    );

    let applicableDiscountPercent = 0;
    let planName = 'Standard / Non-Member';

    if (memRes.rows.length > 0) {
      applicableDiscountPercent = parseFloat(memRes.rows[0].discount_percent) || 0;
      planName = memRes.rows[0].plan_name;
    }

    // Cashier can apply or override discount if needed
    if (custom_discount_percent !== undefined && custom_discount_percent !== null) {
      applicableDiscountPercent = parseFloat(custom_discount_percent);
    }

    // Calculate discount amount
    const discountGiven = (parsedBill * (applicableDiscountPercent / 100));
    const netPayable = Math.max(0, parsedBill - discountGiven);

    // 3. Log redemption in database
    const redemptionRes = await db.query(
      `INSERT INTO redemptions (merchant_id, customer_id, bill_amount, discount_given)
       VALUES ($1, $2, $3, $4)
       RETURNING id, merchant_id, customer_id, bill_amount, discount_given, redeemed_at`,
      [
        merchantId,
        customer.id,
        parsedBill.toFixed(2),
        discountGiven.toFixed(2)
      ]
    );

    const redemption = redemptionRes.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Redemption logged successfully!',
      receipt: {
        redemption_id: redemption.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        plan_name: planName,
        bill_amount: parsedBill.toFixed(2),
        discount_percent: applicableDiscountPercent,
        discount_given: discountGiven.toFixed(2),
        net_payable: netPayable.toFixed(2),
        redeemed_at: redemption.redeemed_at
      }
    });
  } catch (err) {
    console.error('[Process Redemption Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get Redemption Transaction History for Merchant
 */
export const getRedemptions = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

    const result = await db.query(
      `SELECT 
         r.id,
         r.merchant_id,
         r.customer_id,
         r.bill_amount,
         r.discount_given,
         r.redeemed_at,
         c.name as customer_name,
         c.phone as customer_phone
       FROM redemptions r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.merchant_id = $1
       ORDER BY r.redeemed_at DESC
       LIMIT $2`,
      [merchantId, limit]
    );

    return res.json({
      success: true,
      redemptions: result.rows
    });
  } catch (err) {
    console.error('[Get Redemptions Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 1-Step Quick Enroll VIP Member by Phone & Plan ID
 * Auto-creates customer if not exists, assigns active membership, and returns verified member profile
 */
export const quickEnrollVIP = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { phone, name, plan_id, custom_validity_months } = req.body;

    if (!phone || !plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Both phone number and VIP membership plan are required.'
      });
    }

    const cleanPhone = String(phone).trim();
    const cleanName = (name && String(name).trim()) || 'VIP Customer';
    const parsedPlanId = parseInt(plan_id, 10) || plan_id;

    // 1. Verify plan exists and belongs to this merchant
    let planRes = await db.query(
      'SELECT id, plan_name, validity_months, discount_percent, benefits_description FROM membership_plans WHERE id = $1 AND merchant_id = $2',
      [parsedPlanId, merchantId]
    );

    // Fallback: If not found by specific ID, pick the first available plan for this merchant
    if (planRes.rows.length === 0) {
      planRes = await db.query(
        'SELECT id, plan_name, validity_months, discount_percent, benefits_description FROM membership_plans WHERE merchant_id = $1 ORDER BY id ASC LIMIT 1',
        [merchantId]
      );
    }

    if (planRes.rows.length === 0) {
      // Auto-create a default Gold VIP plan if merchant has none
      const newPlanRes = await db.query(
        `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
         VALUES ($1, 'Gold VIP Pass', 199.00, 12, 20.00, '20% instant discount on all store items')
         RETURNING id, plan_name, validity_months, discount_percent, benefits_description`,
        [merchantId]
      );
      planRes = newPlanRes;
    }

    const plan = planRes.rows[0];

    // 2. Find or Create Customer
    let customer;
    const existingCust = await db.query(
      'SELECT id, name, phone FROM customers WHERE merchant_id = $1 AND phone = $2',
      [merchantId, cleanPhone]
    );

    if (existingCust.rows.length > 0) {
      customer = existingCust.rows[0];
      if (name && name.trim() && customer.name === 'VIP Customer') {
        await db.query('UPDATE customers SET name = $1 WHERE id = $2', [name.trim(), customer.id]);
        customer.name = name.trim();
      }
    } else {
      const newCustRes = await db.query(
        'INSERT INTO customers (merchant_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
        [merchantId, cleanName, cleanPhone]
      );
      customer = newCustRes.rows[0];
    }

    // 3. Deactivate any prior active memberships
    await db.query(
      `UPDATE customer_memberships 
       SET status = 'EXPIRED' 
       WHERE customer_id = $1 AND status = 'ACTIVE'`,
      [customer.id]
    );

    // 4. Calculate validity dates
    const months = custom_validity_months ? parseInt(custom_validity_months, 10) : (plan.validity_months || 12);
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const memRes = await db.query(
      `INSERT INTO customer_memberships (customer_id, plan_id, start_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING *`,
      [
        customer.id,
        plan.id,
        startDate.toISOString().split('T')[0],
        expiryDate.toISOString().split('T')[0]
      ]
    );

    const membership = memRes.rows[0];

    return res.status(201).json({
      success: true,
      message: `🎉 Successfully enrolled ${customer.name} into ${plan.plan_name} (${plan.discount_percent}% OFF)!`,
      customer,
      membership: {
        id: membership.id,
        plan_id: plan.id,
        plan_name: plan.plan_name,
        discount_percent: plan.discount_percent,
        benefits_description: plan.benefits_description,
        expiry_date: membership.expiry_date,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    console.error('[Quick Enroll VIP Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
