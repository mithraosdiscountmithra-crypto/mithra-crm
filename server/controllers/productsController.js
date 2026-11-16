import db from '../db/index.js';

/**
 * List all products for the authenticated merchant
 */
export const getProducts = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { search, category } = req.query;

    const result = await db.query(
      `SELECT * FROM products 
       WHERE merchant_id = $1 
       ORDER BY id DESC`,
      [merchantId]
    );

    let products = result.rows;

    // Optional query filtering
    if (search) {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.product_name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    return res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (err) {
    console.error('[Get Products Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get low stock products where stock_quantity <= low_stock_threshold
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    const result = await db.query(
      `SELECT * FROM products 
       WHERE merchant_id = $1 
         AND stock_quantity <= low_stock_threshold 
       ORDER BY stock_quantity ASC`,
      [merchantId]
    );

    return res.json({
      success: true,
      lowStockProducts: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[Get Low Stock Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM products WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    return res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (err) {
    console.error('[Get Product By Id Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Add a new product
 */
export const createProduct = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const {
      product_name,
      sku,
      category,
      purchase_price,
      selling_price,
      stock_quantity,
      low_stock_threshold,
      unit,
      image_url
    } = req.body;

    if (!product_name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required.'
      });
    }

    const cleanSku = sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`;
    const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;

    let result;
    try {
      result = await db.query(
        `INSERT INTO products 
         (merchant_id, product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          merchantId,
          product_name.trim(),
          cleanSku,
          category ? category.trim() : 'General',
          parseFloat(purchase_price) || 0.00,
          parseFloat(selling_price) || 0.00,
          parseInt(stock_quantity, 10) || 0,
          parseInt(low_stock_threshold, 10) || 5,
          unit ? unit.trim() : 'pcs',
          cleanImageUrl
        ]
      );
    } catch (dbErr) {
      // Fallback if image_url column not yet present
      result = await db.query(
        `INSERT INTO products 
         (merchant_id, product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          merchantId,
          product_name.trim(),
          cleanSku,
          category ? category.trim() : 'General',
          parseFloat(purchase_price) || 0.00,
          parseFloat(selling_price) || 0.00,
          parseInt(stock_quantity, 10) || 0,
          parseInt(low_stock_threshold, 10) || 5,
          unit ? unit.trim() : 'pcs'
        ]
      );
      if (result.rows?.[0] && cleanImageUrl) {
        result.rows[0].image_url = cleanImageUrl;
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('[Create Product Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update an existing product & adjust stock quantity
 */
export const updateProduct = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;
    const {
      product_name,
      sku,
      category,
      purchase_price,
      selling_price,
      stock_quantity,
      low_stock_threshold,
      unit
    } = req.body;

    // Check if product exists
    const check = await db.query(
      `SELECT * FROM products WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const current = check.rows[0];

    const result = await db.query(
      `UPDATE products 
       SET product_name = $1, sku = $2, category = $3, purchase_price = $4, selling_price = $5, stock_quantity = $6, low_stock_threshold = $7, unit = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND merchant_id = $10
       RETURNING *`,
      [
        product_name !== undefined ? product_name.trim() : current.product_name,
        sku !== undefined ? sku.trim() : current.sku,
        category !== undefined ? category.trim() : current.category,
        purchase_price !== undefined ? parseFloat(purchase_price) : current.purchase_price,
        selling_price !== undefined ? parseFloat(selling_price) : current.selling_price,
        stock_quantity !== undefined ? parseInt(stock_quantity, 10) : current.stock_quantity,
        low_stock_threshold !== undefined ? parseInt(low_stock_threshold, 10) : current.low_stock_threshold,
        unit !== undefined ? unit.trim() : current.unit,
        id,
        merchantId
      ]
    );

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('[Update Product Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM products WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    return res.json({
      success: true,
      message: 'Product removed from inventory successfully.'
    });
  } catch (err) {
    console.error('[Delete Product Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
