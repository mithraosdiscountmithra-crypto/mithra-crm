import db from '../db/index.js';

/**
 * List all WhatsApp marketing campaigns
 */
export const getCampaigns = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    const result = await db.query(
      `SELECT * FROM whatsapp_campaigns WHERE merchant_id = $1 ORDER BY created_at DESC`,
      [merchantId]
    );

    const campaigns = result.rows;
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);

    return res.json({
      success: true,
      campaigns,
      stats: {
        totalCampaigns: campaigns.length,
        totalMessagesSent: totalSent
      }
    });
  } catch (err) {
    console.error('[Get Campaigns Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create and log a new WhatsApp marketing broadcast campaign
 */
export const createCampaign = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { campaign_name, target_audience, message_template, discount_offer, sent_count } = req.body;

    if (!campaign_name || !message_template) {
      return res.status(400).json({
        success: false,
        error: 'Please provide campaign_name and message_template.'
      });
    }

    const result = await db.query(
      `INSERT INTO whatsapp_campaigns (merchant_id, campaign_name, target_audience, message_template, discount_offer, status, sent_count)
       VALUES ($1, $2, $3, $4, $5, 'SENT', $6)
       RETURNING *`,
      [
        merchantId,
        campaign_name.trim(),
        target_audience || 'ALL',
        message_template.trim(),
        discount_offer ? discount_offer.trim() : '',
        parseInt(sent_count, 10) || 0
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'WhatsApp broadcast campaign logged successfully',
      campaign: result.rows[0]
    });
  } catch (err) {
    console.error('[Create Campaign Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get targeted customer audience for WhatsApp Broadcast with personalized link generator
 */
export const getAudienceList = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const target = req.query.target || 'ALL'; // 'ALL', 'ACTIVE_MEMBERS', 'VIP', 'NON_MEMBERS'
    const template = req.query.template || 'Hello {customer_name}! Special greeting from {store_name}.';

    // Fetch store name
    const storeName = req.merchant.store_name || 'Our Store';

    // Fetch customers with active memberships
    const custRes = await db.query(
      `SELECT 
         c.id as customer_id,
         c.name,
         c.phone,
         cm.status as membership_status,
         mp.plan_name,
         mp.discount_percent
       FROM customers c
       LEFT JOIN customer_memberships cm 
         ON cm.customer_id = c.id 
         AND cm.status = 'ACTIVE' 
         AND cm.expiry_date >= CURRENT_DATE
       LEFT JOIN membership_plans mp ON mp.id = cm.plan_id
       WHERE c.merchant_id = $1`,
      [merchantId]
    );

    let customers = custRes.rows;

    if (target === 'ACTIVE_MEMBERS') {
      customers = customers.filter(c => c.membership_status === 'ACTIVE');
    } else if (target === 'VIP') {
      customers = customers.filter(c => c.membership_status === 'ACTIVE' && (c.plan_name?.toLowerCase().includes('vip') || parseFloat(c.discount_percent) >= 20));
    } else if (target === 'NON_MEMBERS') {
      customers = customers.filter(c => !c.membership_status || c.membership_status !== 'ACTIVE');
    }

    // Build personalized WhatsApp links
    const audienceWithLinks = customers.map(c => {
      const cleanPhone = String(c.phone).replace(/\D/g, '');
      const personalizedMessage = template
        .replace(/{customer_name}/gi, c.name)
        .replace(/{store_name}/gi, storeName);

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;

      return {
        ...c,
        personalizedMessage,
        whatsappUrl
      };
    });

    return res.json({
      success: true,
      target,
      count: audienceWithLinks.length,
      customers: audienceWithLinks
    });
  } catch (err) {
    console.error('[Get Audience Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
