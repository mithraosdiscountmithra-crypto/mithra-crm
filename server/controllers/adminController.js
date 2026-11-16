import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_loyalty_crm_2026_dev_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Super Admin Master SaaS Platform Overview & Metrics
 */
export const getPlatformOverview = async (req, res) => {
  try {
    // 1. Get all merchants
    const merchantsRes = await db.query(
      `SELECT id, store_name, owner_name, category, phone, email, address, city, is_active, created_at 
       FROM merchants 
       ORDER BY id DESC`
    );

    const merchants = merchantsRes.rows || [];

    // 2. Fetch aggregate stats for each merchant
    const enrichedVendors = await Promise.all(
      merchants.map(async (m) => {
        try {
          const custRes = await db.query(
            'SELECT COUNT(*) as count FROM customers WHERE merchant_id = $1',
            [m.id]
          );
          const membersRes = await db.query(
            `SELECT COUNT(*) as count 
             FROM customer_memberships cm 
             JOIN customers c ON cm.customer_id = c.id 
             WHERE c.merchant_id = $1 AND cm.status = 'ACTIVE'`,
            [m.id]
          );
          const prodRes = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE merchant_id = $1',
            [m.id]
          );
          const salesRes = await db.query(
            'SELECT COALESCE(SUM(bill_amount), 0) as total_sales, COALESCE(SUM(discount_given), 0) as total_discount FROM redemptions WHERE merchant_id = $1',
            [m.id]
          );

          return {
            ...m,
            total_customers: parseInt(custRes.rows[0]?.count || 0, 10),
            active_members: parseInt(membersRes.rows[0]?.count || 0, 10),
            total_products: parseInt(prodRes.rows[0]?.count || 0, 10),
            total_sales: parseFloat(salesRes.rows[0]?.total_sales || 0),
            total_discount: parseFloat(salesRes.rows[0]?.total_discount || 0)
          };
        } catch (err) {
          return {
            ...m,
            total_customers: 0,
            active_members: 0,
            total_products: 0,
            total_sales: 0,
            total_discount: 0
          };
        }
      })
    );

    // Platform aggregates
    const totalVendors = enrichedVendors.length;
    const activeVendors = enrichedVendors.filter(v => v.is_active).length;
    const totalPlatformCustomers = enrichedVendors.reduce((sum, v) => sum + v.total_customers, 0);
    const totalPlatformMembers = enrichedVendors.reduce((sum, v) => sum + v.active_members, 0);
    const totalPlatformGMV = enrichedVendors.reduce((sum, v) => sum + v.total_sales, 0);
    const totalPlatformProducts = enrichedVendors.reduce((sum, v) => sum + v.total_products, 0);

    return res.json({
      success: true,
      stats: {
        total_vendors: totalVendors,
        active_vendors: activeVendors,
        total_customers: totalPlatformCustomers,
        total_members: totalPlatformMembers,
        total_gmv: totalPlatformGMV,
        total_products: totalPlatformProducts
      },
      vendors: enrichedVendors
    });
  } catch (err) {
    console.error('[Admin Overview Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Super Admin Provision / Add New Vendor Store
 */
export const createVendor = async (req, res) => {
  try {
    const { store_name, owner_name, category, phone, email, password, address, city } = req.body;

    if (!store_name || !owner_name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide store_name, owner_name, phone, email, and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check if email already registered
    const existing = await db.query('SELECT id FROM merchants WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A vendor store with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new merchant
    const insertRes = await db.query(
      `INSERT INTO merchants (store_name, owner_name, category, phone, email, password_hash, address, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, store_name, owner_name, category, phone, email, address, city, is_active, created_at`,
      [
        store_name.trim(),
        owner_name.trim(),
        category ? category.trim() : 'Retail',
        cleanPhone,
        cleanEmail,
        passwordHash,
        address ? address.trim() : '',
        city ? city.trim() : ''
      ]
    );

    const newVendor = insertRes.rows[0];

    // Auto-create 3 starter VIP Membership Plans for this new vendor
    const starterPlans = [
      { name: 'Silver VIP Saver', price: 199.00, months: 6, discount: 10.00, desc: '10% discount on all purchases & seasonal offers' },
      { name: 'Gold VIP Premier', price: 499.00, months: 12, discount: 20.00, desc: '20% discount on all purchases + priority billing' },
      { name: 'Platinum Elite VIP', price: 999.00, months: 12, discount: 30.00, desc: '30% elite discount, festive gifts & exclusive specials' }
    ];

    for (const p of starterPlans) {
      await db.query(
        `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newVendor.id, p.name, p.price, p.months, p.discount, p.desc]
      );
    }

    // Generate WhatsApp Welcome Text for this vendor
    const whatsappText = `👑 *Mithra CRM - Store Account Activated!*

Namaste *${owner_name}* garu! Your store *${store_name}* is now live on Mithra Loyalty CRM & POS SaaS platform.

🌐 *Login Portal:* https://mithra-crm.vercel.app
📧 *Email:* ${cleanEmail}
🔑 *Password:* ${password}

📱 *Your Storefront QR & Digital Menu:*
https://mithra-crm.vercel.app/storefront?merchant=${newVendor.id}

Start issuing VIP passes, adding menu items, and boosting customer repeat visits today!
For support, contact Mithra OS team.`;

    const cleanWaPhone = cleanPhone.replace(/[^0-9]/g, '');
    const formattedWaPhone = cleanWaPhone.startsWith('91') ? cleanWaPhone : `91${cleanWaPhone.replace(/^0+/, '')}`;
    const whatsappLink = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(whatsappText)}`;

    return res.status(201).json({
      success: true,
      message: `🎉 Vendor store "${store_name}" provisioned successfully!`,
      vendor: newVendor,
      whatsapp_message: whatsappText,
      whatsapp_link: whatsappLink
    });
  } catch (err) {
    console.error('[Create Vendor Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Super Admin Toggle Vendor Status (Active / Suspended)
 */
export const toggleVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const vendorId = parseInt(id, 10);
    const updated = await db.query(
      `UPDATE merchants SET is_active = $1 WHERE id = $2 RETURNING id, store_name, is_active`,
      [Boolean(is_active), vendorId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    return res.json({
      success: true,
      message: `Vendor "${updated.rows[0].store_name}" is now ${is_active ? 'ACTIVE' : 'SUSPENDED'}.`,
      vendor: updated.rows[0]
    });
  } catch (err) {
    console.error('[Toggle Vendor Status Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Super Admin Impersonate Vendor (Generate Vendor JWT to log in as them)
 */
export const impersonateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = parseInt(id, 10);

    const vendorRes = await db.query(
      `SELECT id, store_name, owner_name, category, phone, email, address, city, is_active, created_at 
       FROM merchants WHERE id = $1`,
      [vendorId]
    );

    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vendor store not found' });
    }

    const vendor = vendorRes.rows[0];

    // Generate JWT token for this vendor
    const token = jwt.sign(
      { merchantId: vendor.id, email: vendor.email, isImpersonated: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: `Logged in as vendor: ${vendor.store_name}`,
      token,
      merchant: vendor
    });
  } catch (err) {
    console.error('[Impersonate Vendor Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
