import db from '../db/index.js';

/**
 * Purchase Orders & Stock Inwarding Controller
 */

// 1. GET /api/purchase-orders - List all POs with supplier details & item counts
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    const query = `
      SELECT po.*, 
        s.name AS supplier_name, 
        s.phone AS supplier_phone, 
        s.contact_person AS supplier_contact,
        (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) AS item_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.merchant_id = $1
      ORDER BY po.id DESC
    `;

    const result = await db.query(query, [merchantId]);
    const purchaseOrders = result.rows;

    const totalPOAmount = purchaseOrders.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
    const receivedCount = purchaseOrders.filter(p => p.status === 'RECEIVED').length;
    const sentCount = purchaseOrders.filter(p => p.status === 'SENT').length;
    const draftCount = purchaseOrders.filter(p => p.status === 'DRAFT').length;

    res.json({
      success: true,
      purchaseOrders,
      summary: {
        totalPOs: purchaseOrders.length,
        totalPOAmount: totalPOAmount.toFixed(2),
        receivedCount,
        sentCount,
        draftCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/purchase-orders/:id - Get PO details, line items, and WhatsApp PO broadcast link
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const poRes = await db.query(
      `SELECT po.*, 
        s.name AS supplier_name, 
        s.phone AS supplier_phone, 
        s.contact_person AS supplier_contact, 
        s.email AS supplier_email, 
        s.address AS supplier_address
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = $1 AND po.merchant_id = $2`,
      [id, merchantId]
    );

    if (poRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase Order not found' });
    }

    const po = poRes.rows[0];

    const itemsRes = await db.query(
      `SELECT poi.*, p.product_name, p.sku
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = $1
       ORDER BY poi.id ASC`,
      [id]
    );

    const items = itemsRes.rows;

    // Build pre-composed WhatsApp PO message
    const storeName = req.merchant.store_name || 'Our Store';
    const cleanPhone = (po.supplier_phone || '').replace(/[^0-9]/g, '');

    const itemsSummary = items
      .map((it, idx) => `${idx + 1}. ${it.quantity}x ${it.item_name} ($${parseFloat(it.unit_cost).toFixed(2)})`)
      .join('\n');

    const whatsappMessage = `*PURCHASE ORDER: ${po.po_number}*\nFrom: *${storeName}*\nTo: ${po.supplier_name}\nDate: ${po.order_date || 'Today'}\n${po.expected_delivery_date ? `Expected Delivery: ${po.expected_delivery_date}\n` : ''}\n*Order Items:*\n${itemsSummary}\n\n*Total Order Amount: $${parseFloat(po.total_amount).toFixed(2)}*\n${po.notes ? `Notes: ${po.notes}\n` : ''}\nPlease confirm order receipt and estimated dispatch time. Thank you!`;

    const whatsappLink = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    res.json({
      success: true,
      purchaseOrder: {
        ...po,
        items,
        whatsapp_link: whatsappLink,
        whatsapp_message: whatsappMessage
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/purchase-orders - Create PO with line items & record in Supplier Ledger
export const createPurchaseOrder = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const {
      supplier_id,
      po_number,
      order_date,
      expected_delivery_date,
      notes,
      status = 'SENT',
      items = []
    } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ success: false, error: 'supplier_id is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one line item is required' });
    }

    // Verify supplier
    const supRes = await db.query(
      `SELECT * FROM suppliers WHERE id = $1 AND merchant_id = $2`,
      [supplier_id, merchantId]
    );

    if (supRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    const supplier = supRes.rows[0];

    // Compute total & sanitize items
    let totalAmount = 0;
    const sanitizedItems = items.map(item => {
      const qty = parseInt(item.quantity, 10);
      const unitCost = parseFloat(item.unit_cost);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for item "${item.item_name || 'Product'}"`);
      }
      if (isNaN(unitCost) || unitCost < 0) {
        throw new Error(`Invalid unit cost for item "${item.item_name || 'Product'}"`);
      }
      const subtotal = qty * unitCost;
      totalAmount += subtotal;

      return {
        product_id: item.product_id ? parseInt(item.product_id, 10) : null,
        item_name: item.item_name ? String(item.item_name).trim() : 'Stock Item',
        quantity: qty,
        unit_cost: unitCost,
        subtotal
      };
    });

    const generatedPoNumber = po_number && po_number.trim()
      ? po_number.trim()
      : `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const orderDateVal = order_date || new Date().toISOString().split('T')[0];

    // 1. Insert Purchase Order
    const poRes = await db.query(
      `INSERT INTO purchase_orders 
        (merchant_id, supplier_id, po_number, status, total_amount, order_date, expected_delivery_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        merchantId,
        supplier_id,
        generatedPoNumber,
        status,
        totalAmount,
        orderDateVal,
        expected_delivery_date || null,
        notes ? notes.trim() : ''
      ]
    );

    const newPO = poRes.rows[0];

    // 2. Insert line items
    const createdItems = [];
    for (const item of sanitizedItems) {
      const itRes = await db.query(
        `INSERT INTO purchase_order_items 
          (purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          newPO.id,
          item.product_id,
          item.item_name,
          item.quantity,
          item.unit_cost,
          item.subtotal
        ]
      );
      createdItems.push(itRes.rows[0]);
    }

    // 3. Record Accounts Payable BILL in Supplier Ledger
    await db.query(
      `INSERT INTO supplier_ledgers 
        (merchant_id, supplier_id, purchase_order_id, transaction_type, amount, notes, reference_no, payment_date, payment_method, status)
       VALUES ($1, $2, $3, 'BILL', $4, $5, $6, $7, 'BANK_TRANSFER', 'PENDING')`,
      [
        merchantId,
        supplier_id,
        newPO.id,
        totalAmount,
        `Purchase Order invoice for ${supplier.name}`,
        newPO.po_number,
        orderDateVal
      ]
    );

    // Build WhatsApp link
    const storeName = req.merchant.store_name || 'Our Store';
    const cleanPhone = (supplier.phone || '').replace(/[^0-9]/g, '');
    const itemsSummary = createdItems
      .map((it, idx) => `${idx + 1}. ${it.quantity}x ${it.item_name} ($${parseFloat(it.unit_cost).toFixed(2)})`)
      .join('\n');

    const whatsappMessage = `*PURCHASE ORDER: ${newPO.po_number}*\nFrom: *${storeName}*\nTo: ${supplier.name}\nDate: ${newPO.order_date}\n${newPO.expected_delivery_date ? `Expected Delivery: ${newPO.expected_delivery_date}\n` : ''}\n*Order Items:*\n${itemsSummary}\n\n*Total Order Amount: $${totalAmount.toFixed(2)}*\n${newPO.notes ? `Notes: ${newPO.notes}\n` : ''}\nPlease confirm order receipt. Thank you!`;

    const whatsappLink = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(201).json({
      success: true,
      message: `Purchase Order ${newPO.po_number} created successfully`,
      purchaseOrder: {
        ...newPO,
        supplier_name: supplier.name,
        supplier_phone: supplier.phone,
        items: createdItems,
        whatsapp_link: whatsappLink
      }
    });
  } catch (err) {
    next(err);
  }
};

// 4. PUT /api/purchase-orders/:id/status - Update PO status (RECEIVED automatically increments stock levels)
export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    // Fetch existing PO
    const poRes = await db.query(
      `SELECT * FROM purchase_orders WHERE id = $1 AND merchant_id = $2`,
      [id, merchantId]
    );

    if (poRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase Order not found' });
    }

    const currentPO = poRes.rows[0];
    const previousStatus = currentPO.status;

    const todayStr = new Date().toISOString().split('T')[0];
    const receivedDate = status === 'RECEIVED' ? todayStr : currentPO.received_date;

    const updateRes = await db.query(
      `UPDATE purchase_orders 
       SET status = $1, received_date = $2 
       WHERE id = $3 AND merchant_id = $4
       RETURNING *`,
      [status, receivedDate, id, merchantId]
    );

    const updatedPO = updateRes.rows[0];

    // If status transitioned to RECEIVED, automatically increment product inventory levels
    const stockUpdates = [];
    if (status === 'RECEIVED' && previousStatus !== 'RECEIVED') {
      const itemsRes = await db.query(
        `SELECT poi.*, p.product_name, p.stock_quantity
         FROM purchase_order_items poi
         LEFT JOIN products p ON poi.product_id = p.id
         WHERE poi.purchase_order_id = $1`,
        [id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id) {
          const prodRes = await db.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1 
             WHERE id = $2 AND merchant_id = $3
             RETURNING id, product_name, stock_quantity`,
            [item.quantity, item.product_id, merchantId]
          );

          if (prodRes.rows.length > 0) {
            stockUpdates.push({
              product_id: item.product_id,
              product_name: prodRes.rows[0].product_name,
              incremented_by: item.quantity,
              new_stock: prodRes.rows[0].stock_quantity
            });
          }
        }
      }
    }

    res.json({
      success: true,
      message: status === 'RECEIVED' 
        ? `Purchase Order ${updatedPO.po_number} marked as RECEIVED! Inventory stock levels updated automatically.`
        : `Purchase Order ${updatedPO.po_number} status updated to ${status}`,
      purchaseOrder: updatedPO,
      stockUpdates
    });
  } catch (err) {
    next(err);
  }
};
