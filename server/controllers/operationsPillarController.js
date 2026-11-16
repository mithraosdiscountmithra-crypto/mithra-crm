import db from '../db/index.js';

/**
 * Operations Pillar Controller
 * Features:
 * 1. Live inventory tracking & low-stock alerts
 * 2. 1-Click Auto-Purchase Orders (Auto-PO) generation for low stock items
 * 3. Delivery and pickup fulfillment logs
 */

export const generateAutoPO = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    // 1. Fetch products where stock <= threshold
    const lowStockRes = await db.query(
      `SELECT * FROM products WHERE merchant_id = $1 AND stock_quantity <= low_stock_threshold`,
      [merchantId]
    );

    const lowStockProducts = lowStockRes.rows || [];

    if (lowStockProducts.length === 0) {
      return res.json({
        success: true,
        message: 'All inventory stock levels are healthy. No replenishment purchase orders required!',
        po: null,
        items_reordered: 0
      });
    }

    // 2. Fetch available suppliers
    const suppliersRes = await db.query(
      `SELECT * FROM suppliers WHERE merchant_id = $1 AND is_active = true`,
      [merchantId]
    );

    const suppliers = suppliersRes.rows || [];
    const defaultSupplier = suppliers[0] || {
      id: 1,
      name: 'Primary Wholesale Distributor',
      phone: '+91-98765-00000'
    };

    // 3. Draft Auto-PO items: suggested quantity = (threshold * 3) - current stock (min 5 units)
    let totalAmount = 0;
    const poItems = lowStockProducts.map(p => {
      const suggestedQty = Math.max(5, (p.low_stock_threshold * 3) - p.stock_quantity);
      const unitCost = parseFloat(p.purchase_price || 0);
      const subtotal = parseFloat((suggestedQty * unitCost).toFixed(2));
      totalAmount += subtotal;

      return {
        product_id: p.id,
        product_name: p.product_name,
        quantity: suggestedQty,
        unit_cost: unitCost,
        subtotal
      };
    });

    totalAmount = parseFloat(totalAmount.toFixed(2));
    const poNumber = `PO-AUTO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Insert Purchase Order
    const poRes = await db.query(
      `INSERT INTO purchase_orders 
        (merchant_id, supplier_id, po_number, total_amount, status, expected_delivery_date, notes)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        merchantId,
        defaultSupplier.id,
        poNumber,
        totalAmount,
        'DRAFT',
        new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString().split('T')[0],
        `Automated Reorder PO for ${lowStockProducts.length} low-stock inventory items.`
      ]
    );

    const createdPO = poRes.rows[0];

    // 5. Insert PO line items
    const insertedItems = [];
    for (const it of poItems) {
      const itRes = await db.query(
        `INSERT INTO purchase_order_items 
          (purchase_order_id, product_id, product_name, quantity, unit_cost, subtotal)
         VALUES 
          ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [createdPO.id, it.product_id, it.product_name, it.quantity, it.unit_cost, it.subtotal]
      );
      insertedItems.push(itRes.rows[0]);
    }

    createdPO.items = insertedItems;

    // 6. Generate 1-Click WhatsApp PO dispatch link
    const supplierPhone = String(defaultSupplier.phone || '').replace(/\D/g, '');
    const itemsText = poItems
      .map(it => `• ${it.product_name}: ${it.quantity} units @ ₹${it.unit_cost} = ₹${it.subtotal}`)
      .join('%0A');

    const waText = `📦 *AUTO REORDER PURCHASE ORDER: ${poNumber}*%0A%0A` +
      `🏢 *Merchant:* ${encodeURIComponent(req.merchant.store_name)}%0A` +
      `🤝 *Supplier:* ${encodeURIComponent(defaultSupplier.name)}%0A%0A` +
      `📋 *Reorder Items:*%0A${itemsText}%0A%0A` +
      `💰 *Total Estimated Value:* ₹${totalAmount}%0A%0A` +
      `Please confirm stock availability and dispatch date. Thank you!`;

    const whatsappLink = `https://wa.me/${supplierPhone}?text=${waText}`;

    res.status(201).json({
      success: true,
      message: `Generated Auto-PO #${poNumber} for ${lowStockProducts.length} low-stock items!`,
      po: createdPO,
      supplier: defaultSupplier,
      items_reordered: lowStockProducts.length,
      total_amount: totalAmount,
      whatsapp_dispatch_link: whatsappLink
    });
  } catch (err) {
    next(err);
  }
};

export const getOperationsSummary = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    const [productsRes, lowStockRes, poRes, ordersRes] = await Promise.all([
      db.query(`SELECT * FROM products WHERE merchant_id = $1`, [merchantId]),
      db.query(`SELECT * FROM products WHERE merchant_id = $1 AND stock_quantity <= low_stock_threshold`, [merchantId]),
      db.query(`SELECT * FROM purchase_orders WHERE merchant_id = $1`, [merchantId]),
      db.query(`SELECT * FROM customer_orders WHERE merchant_id = $1`, [merchantId])
    ]);

    const products = productsRes.rows || [];
    const lowStock = lowStockRes.rows || [];
    const pos = poRes.rows || [];
    const orders = ordersRes.rows || [];

    const totalAssetValuation = products.reduce(
      (acc, p) => acc + (p.stock_quantity * parseFloat(p.purchase_price || 0)), 0
    );

    const pendingDeliveries = orders.filter(
      o => o.order_type === 'delivery' && (o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY')
    ).length;

    const pendingPickups = orders.filter(
      o => o.order_type === 'pickup' && (o.status === 'CONFIRMED' || o.status === 'PREPARING')
    ).length;

    res.json({
      success: true,
      summary: {
        totalSKUs: products.length,
        lowStockCount: lowStock.length,
        totalAssetValuation: parseFloat(totalAssetValuation.toFixed(2)),
        pendingPOs: pos.filter(p => p.status === 'DRAFT' || p.status === 'SENT').length,
        pendingDeliveries,
        pendingPickups,
        totalOrdersProcessed: orders.length
      }
    });
  } catch (err) {
    next(err);
  }
};
