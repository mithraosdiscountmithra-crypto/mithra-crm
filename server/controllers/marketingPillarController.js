import db from '../db/index.js';

/**
 * Marketing Pillar Controller
 * Features:
 * 1. WhatsApp AiSensy broadcast campaign triggers
 * 2. Digital Scratch Cards & Coupons manager
 * 3. Automated Customer Birthday & Anniversary greetings scheduler
 */

// 1. Trigger AiSensy WhatsApp Campaign Broadcast
export const triggerAiSensyCampaign = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      campaign_name,
      template_name = 'festival_weekend_special',
      target_segment = 'ALL',
      message_text,
      coupon_code
    } = req.body;

    if (!campaign_name || !campaign_name.trim()) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' });
    }

    // Fetch targeted audience
    const customersRes = await db.query(
      `SELECT id, name, phone FROM customers WHERE merchant_id = $1`,
      [merchantId]
    );
    const audience = customersRes.rows || [];

    // Simulated AiSensy payload format
    const aisensyDispatchList = audience.map(cust => {
      const cleanPhone = String(cust.phone).replace(/\D/g, '');
      const personalizedMsg = (message_text || 'Exclusive discount for our valued customer!')
        .replace(/{customer_name}/gi, cust.name)
        .replace(/{coupon_code}/gi, coupon_code || 'MITHRAVIP');

      return {
        userName: cust.name,
        userPhone: cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`,
        templateParams: [cust.name, coupon_code || 'MITHRAVIP', req.merchant.store_name],
        personalizedMessage: personalizedMsg
      };
    });

    // Record campaign log in database
    const insertRes = await db.query(
      `INSERT INTO whatsapp_campaigns (merchant_id, campaign_name, target_segment, message_template, audience_count, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        merchantId,
        `[AiSensy] ${campaign_name.trim()}`,
        target_segment,
        message_text || template_name,
        audience.length,
        'DISPATCHED'
      ]
    );

    res.status(201).json({
      success: true,
      message: `AiSensy campaign "${campaign_name}" successfully dispatched to ${audience.length} customers!`,
      campaign: insertRes.rows[0],
      provider: 'AiSensy WhatsApp Business API',
      dispatch_summary: {
        total_recipients: audience.length,
        template_used: template_name,
        delivery_status: 'SENT_TO_GATEWAY',
        preview_recipient: aisensyDispatchList[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Coupons & Digital Scratch Cards CRUD
export const getCoupons = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM coupons WHERE merchant_id = $1 ORDER BY created_at DESC`,
      [merchantId]
    );
    res.json({
      success: true,
      coupons: result.rows || [],
      count: result.rows ? result.rows.length : 0
    });
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      code,
      title,
      discount_type = 'PERCENT',
      discount_value = 10.00,
      min_spend = 0.00,
      max_discount,
      is_scratch_card = false,
      revealed_perk,
      expiry_date,
      usage_limit = 100
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Coupon title is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    const insertRes = await db.query(
      `INSERT INTO coupons 
        (merchant_id, code, title, discount_type, discount_value, min_spend, max_discount, is_scratch_card, revealed_perk, expiry_date, usage_limit)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        merchantId,
        cleanCode,
        title.trim(),
        discount_type,
        parseFloat(discount_value) || 10.00,
        parseFloat(min_spend) || 0.00,
        max_discount ? parseFloat(max_discount) : null,
        Boolean(is_scratch_card),
        revealed_perk ? revealed_perk.trim() : null,
        expiry_date || null,
        parseInt(usage_limit, 10) || 100
      ]
    );

    res.status(201).json({
      success: true,
      message: `Coupon code "${cleanCode}" created successfully!`,
      coupon: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

export const verifyCoupon = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { code, bill_amount = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a coupon code' });
    }

    const cleanCode = code.trim().toUpperCase();
    const result = await db.query(
      `SELECT * FROM coupons WHERE merchant_id = $1 AND code = $2`,
      [merchantId, cleanCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: `Coupon code "${cleanCode}" is invalid or does not exist.`
      });
    }

    const coupon = result.rows[0];
    const bill = parseFloat(bill_amount) || 0;

    // Validation checks
    if (!coupon.is_active) {
      return res.json({ success: true, valid: false, error: 'This coupon is inactive.' });
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.json({ success: true, valid: false, error: 'Coupon usage limit has been exhausted.' });
    }
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date(new Date().toDateString())) {
      return res.json({ success: true, valid: false, error: 'This coupon has expired.' });
    }
    if (coupon.min_spend && bill < parseFloat(coupon.min_spend)) {
      return res.json({
        success: true,
        valid: false,
        error: `Minimum bill amount of ₹${coupon.min_spend} required to apply this coupon.`
      });
    }

    // Compute discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENT') {
      discountAmount = (bill * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
        discountAmount = parseFloat(coupon.max_discount);
      }
    } else {
      discountAmount = Math.min(bill, parseFloat(coupon.discount_value));
    }

    res.json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        is_scratch_card: coupon.is_scratch_card,
        revealed_perk: coupon.revealed_perk
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    await db.query(
      `DELETE FROM coupons WHERE id = $1 AND merchant_id = $2`,
      [parseInt(id, 10), merchantId]
    );

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// 3. Automated Customer Greetings (Birthday / Anniversary Scheduler)
export const getScheduledGreetings = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT * FROM customer_greetings WHERE merchant_id = $1`,
      [merchantId]
    );

    const greetings = result.rows || [];
    const pendingGreetings = greetings.filter(g => g.status === 'SCHEDULED');
    const sentGreetings = greetings.filter(g => g.status === 'SENT');

    res.json({
      success: true,
      greetings,
      summary: {
        total: greetings.length,
        scheduled: pendingGreetings.length,
        sent: sentGreetings.length
      }
    });
  } catch (err) {
    next(err);
  }
};

export const triggerGreeting = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE customer_greetings SET status = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
      ['SENT', parseInt(id, 10), merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Greeting not found' });
    }

    const greeting = result.rows[0];

    // WhatsApp Web Direct Dispatch URL
    const waText = encodeURIComponent(greeting.message);
    const whatsappLink = `https://wa.me/?text=${waText}`;

    res.json({
      success: true,
      message: `Greeting #${greeting.id} triggered successfully!`,
      greeting,
      whatsapp_link: whatsappLink
    });
  } catch (err) {
    next(err);
  }
};
