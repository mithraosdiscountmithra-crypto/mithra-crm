import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_loyalty_crm_2026_dev_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new merchant tenant
 */
export const register = async (req, res) => {
  try {
    const { store_name, owner_name, category, phone, email, password, address, city } = req.body;

    if (!store_name || !owner_name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide store_name, owner_name, phone, email, and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await db.query('SELECT id FROM merchants WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert merchant
    const result = await db.query(
      `INSERT INTO merchants (store_name, owner_name, category, phone, email, password_hash, address, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, store_name, owner_name, category, phone, email, address, city, is_active, created_at`,
      [
        store_name.trim(),
        owner_name.trim(),
        category ? category.trim() : 'Retail',
        phone.trim(),
        cleanEmail,
        passwordHash,
        address ? address.trim() : '',
        city ? city.trim() : ''
      ]
    );

    const merchant = result.rows[0];

    // Create a starter membership plan for this new merchant
    await db.query(
      `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        merchant.id,
        'Standard VIP Membership',
        29.99,
        12,
        15.00,
        '15% instant discount on all purchases, seasonal store offers'
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Merchant tenant registered successfully!',
      token,
      merchant
    });
  } catch (err) {
    console.error('[Register Controller Error]:', err);
    return res.status(500).json({ success: false, error: 'Registration failed. ' + err.message });
  }
};

/**
 * Merchant Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const result = await db.query(
      'SELECT id, store_name, owner_name, category, phone, email, password_hash, address, city, is_active FROM merchants WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const merchant = result.rows[0];

    if (!merchant.is_active) {
      return res.status(403).json({
        success: false,
        error: 'This merchant account has been deactivated.'
      });
    }

    const isMatch = await bcrypt.compare(password, merchant.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password_hash, ...safeMerchant } = merchant;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      merchant: safeMerchant
    });
  } catch (err) {
    console.error('[Login Controller Error]:', err);
    return res.status(500).json({ success: false, error: 'Login failed. ' + err.message });
  }
};

/**
 * Get Current Merchant Profile
 */
export const getProfile = async (req, res) => {
  return res.json({
    success: true,
    merchant: req.merchant
  });
};

/**
 * Update Merchant Profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { store_name, owner_name, category, phone, address, city } = req.body;
    const merchantId = req.merchantId;

    const result = await db.query(
      `UPDATE merchants 
       SET store_name = $1, owner_name = $2, category = $3, phone = $4, address = $5, city = $6
       WHERE id = $7
       RETURNING id, store_name, owner_name, category, phone, email, address, city, is_active`,
      [
        store_name || req.merchant.store_name,
        owner_name || req.merchant.owner_name,
        category || req.merchant.category,
        phone || req.merchant.phone,
        address !== undefined ? address : req.merchant.address,
        city !== undefined ? city : req.merchant.city,
        merchantId
      ]
    );

    return res.json({
      success: true,
      message: 'Store profile updated successfully',
      merchant: result.rows[0]
    });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
