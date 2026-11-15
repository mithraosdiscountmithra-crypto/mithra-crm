import db from '../db/index.js';

/**
 * Get Analytics & Summary Stats for Merchant Dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    // Fast summary aggregation
    const summaryRes = await db.query(
      `/* ANALYTICS_SUMMARY */
       SELECT 
         COALESCE(SUM(bill_amount), 0) as total_sales,
         COALESCE(SUM(discount_given), 0) as total_discounts,
         COUNT(id) as redemptions_count
       FROM redemptions
       WHERE merchant_id = $1`,
      [merchantId]
    );

    // Customer counts
    const custCountRes = await db.query(
      `SELECT COUNT(id) as total_customers FROM customers WHERE merchant_id = $1`,
      [merchantId]
    );

    // Active members count
    const activeMembersRes = await db.query(
      `SELECT COUNT(DISTINCT cm.customer_id) as active_members
       FROM customer_memberships cm
       JOIN customers c ON c.id = cm.customer_id
       WHERE c.merchant_id = $1 
         AND cm.status = 'ACTIVE' 
         AND cm.expiry_date >= CURRENT_DATE`,
      [merchantId]
    );

    // Recent 5 redemptions
    const recentRedemptionsRes = await db.query(
      `SELECT 
         r.id,
         r.bill_amount,
         r.discount_given,
         r.redeemed_at,
         c.name as customer_name,
         c.phone as customer_phone
       FROM redemptions r
       JOIN customers c ON c.id = r.customer_id
       WHERE r.merchant_id = $1
       ORDER BY r.redeemed_at DESC
       LIMIT 5`,
      [merchantId, 5]
    );

    const stats = summaryRes.rows[0] || {};
    const totalCustomers = custCountRes.rows[0]?.total_customers || 0;
    const activeMembers = activeMembersRes.rows[0]?.active_members || stats.active_members || 0;

    return res.json({
      success: true,
      stats: {
        totalSales: parseFloat(stats.total_sales || 0).toFixed(2),
        totalDiscounts: parseFloat(stats.total_discounts || 0).toFixed(2),
        netRevenue: (parseFloat(stats.total_sales || 0) - parseFloat(stats.total_discounts || 0)).toFixed(2),
        redemptionsCount: parseInt(stats.redemptions_count || 0, 10),
        totalCustomers: parseInt(totalCustomers, 10),
        activeMembers: parseInt(activeMembers, 10),
        memberLoyaltyRate: totalCustomers > 0 
          ? Math.round((parseInt(activeMembers, 10) / parseInt(totalCustomers, 10)) * 100)
          : 0
      },
      recentRedemptions: recentRedemptionsRes.rows || []
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
