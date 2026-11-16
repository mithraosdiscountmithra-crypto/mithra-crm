import db from '../db/index.js';

/**
 * Customer Digital Storefront & Ordering Controller
 * Mithra CRM Platform
 * 
 * Features:
 * 1. GET /api/customer/products?tenant_id=X (live catalog with stock > 0)
 * 2. GET /api/customer/membership-check?tenant_id=X&phone=Y (Mithra Plus VIP discount check)
 * 3. POST /api/customer/orders (checkout, stock decrement & Digital Khata debit entry)
 * 4. GET /api/customer/orders (customer order history)
 * 5. GET /api/customer/merchant-orders (merchant dashboard order stream)
 * 6. PUT /api/customer/orders/:id/status (merchant order status update)
 */

// 1. GET /api/customer/products - Fetch active products with stock > 0 for tenant storefront
export const getStorefrontProducts = async (req, res, next) => {
  try {
    const tenantId = parseInt(req.query.tenant_id || req.query.merchant_id || 1, 10);

    // 1. Verify merchant exists and get store info
    const merchantRes = await db.query(
      `SELECT id, store_name, owner_name, category, phone, email, address, city FROM merchants WHERE id = $1`,
      [tenantId]
    );

    if (merchantRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Storefront for Merchant ID #${tenantId} not found.`
      });
    }

    const merchant = {
      ...merchantRes.rows[0],
      banner_url: merchantRes.rows[0].banner_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      photo_url: merchantRes.rows[0].photo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
      logo_url: merchantRes.rows[0].logo_url || null
    };

    // 2. Fetch live products with stock > 0
    const productsRes = await db.query(
      `SELECT * FROM products WHERE merchant_id = $1 AND stock_quantity > 0 ORDER BY category ASC, product_name ASC`,
      [tenantId]
    );

    const products = productsRes.rows || [];

    // 3. Extract unique categories
    const categoriesSet = new Set(products.map(p => p.category || 'General'));
    const categories = ['All', ...Array.from(categoriesSet)];

    // 4. Fetch active loyalty membership plans for promotional banner
    const plansRes = await db.query(
      `SELECT * FROM membership_plans WHERE merchant_id = $1`,
      [tenantId]
    );
    const membershipPlans = plansRes.rows || [];

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        store_name: merchant.store_name,
        owner_name: merchant.owner_name,
        category: merchant.category,
        phone: merchant.phone,
        email: merchant.email,
        address: merchant.address,
        city: merchant.city,
        banner_url: merchant.banner_url,
        photo_url: merchant.photo_url,
        logo_url: merchant.logo_url
      },
      categories,
      products,
      membership_plans: membershipPlans,
      total_products: products.length
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/customer/membership-check - Check Mithra Plus / VIP Member Discount
export const checkCustomerMembership = async (req, res, next) => {
  try {
    const tenantId = parseInt(req.query.tenant_id || req.query.merchant_id || 1, 10);
    const phone = req.query.phone ? String(req.query.phone).trim() : '';

    if (!phone) {
      return res.json({
        success: true,
        has_membership: false,
        message: 'Phone number is required to verify membership'
      });
    }

    // Lookup customer and active membership
    const result = await db.query(
      `SELECT c.id as customer_id, c.name, c.phone, 
              cm.id as membership_id, cm.status as membership_status, cm.expiry_date,
              mp.id as plan_id, mp.plan_name, mp.discount_percent, mp.benefits_description
       FROM customers c
       JOIN customer_memberships cm ON c.id = cm.customer_id
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE c.merchant_id = $1 AND c.phone = $2`,
      [tenantId, phone]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        has_membership: false,
        message: 'No active Mithra Plus / VIP membership found for this phone.'
      });
    }

    const row = result.rows[0];

    // Check if membership is currently active
    const isActive = (row.membership_status === 'ACTIVE' || row.status === 'ACTIVE') && 
      (!row.expiry_date || new Date(row.expiry_date) >= new Date(new Date().toDateString()));

    if (!isActive) {
      return res.json({
        success: true,
        has_membership: false,
        customer: { id: row.customer_id, name: row.name, phone: row.phone },
        message: 'Membership has expired or is inactive.'
      });
    }

    res.json({
      success: true,
      has_membership: true,
      customer: {
        id: row.customer_id,
        name: row.name,
        phone: row.phone
      },
      membership: {
        plan_id: row.plan_id,
        plan_name: row.plan_name,
        discount_percent: parseFloat(row.discount_percent || 0),
        expiry_date: row.expiry_date,
        benefits_description: row.benefits_description
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2b. POST /api/customer/join-vip - Public Customer VIP Pass Purchase / Self-Enrollment
export const joinVIPStorefront = async (req, res, next) => {
  try {
    const { tenant_id, merchant_id, phone, name, plan_id } = req.body;
    const mId = parseInt(tenant_id || merchant_id || 1, 10);

    if (!phone || !plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Both phone number and VIP Membership Plan are required.'
      });
    }

    const cleanPhone = String(phone).trim();
    const cleanName = (name && String(name).trim()) || 'VIP Member';
    const parsedPlanId = parseInt(plan_id, 10) || plan_id;

    // 1. Verify plan exists and belongs to this merchant
    let planRes = await db.query(
      'SELECT id, plan_name, price, validity_months, discount_percent, benefits_description FROM membership_plans WHERE id = $1 AND merchant_id = $2',
      [parsedPlanId, mId]
    );

    if (planRes.rows.length === 0) {
      planRes = await db.query(
        'SELECT id, plan_name, price, validity_months, discount_percent, benefits_description FROM membership_plans WHERE merchant_id = $1 ORDER BY id ASC LIMIT 1',
        [mId]
      );
    }

    if (planRes.rows.length === 0) {
      // Auto-create starter Gold VIP plan if merchant has none
      const newPlanRes = await db.query(
        `INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
         VALUES ($1, 'Gold VIP Pass', 199.00, 12, 20.00, '20% VIP discount on all store items')
         RETURNING id, plan_name, price, validity_months, discount_percent, benefits_description`,
        [mId]
      );
      planRes = newPlanRes;
    }

    const plan = planRes.rows[0];

    // 2. Find or create customer
    let customer;
    const existingCust = await db.query(
      'SELECT id, name, phone FROM customers WHERE merchant_id = $1 AND phone = $2',
      [mId, cleanPhone]
    );

    if (existingCust.rows.length > 0) {
      customer = existingCust.rows[0];
      if (name && name.trim() && customer.name === 'VIP Member') {
        await db.query('UPDATE customers SET name = $1 WHERE id = $2', [name.trim(), customer.id]);
        customer.name = name.trim();
      }
    } else {
      const newCustRes = await db.query(
        'INSERT INTO customers (merchant_id, name, phone) VALUES ($1, $2, $3) RETURNING id, name, phone',
        [mId, cleanName, cleanPhone]
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

    // 4. Create new active membership
    const months = plan.validity_months || 12;
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
      message: `🎉 Welcome ${customer.name}! You are now a VIP Member (${plan.plan_name}) with ${plan.discount_percent}% OFF!`,
      customer,
      membership: {
        plan_id: plan.id,
        plan_name: plan.plan_name,
        discount_percent: parseFloat(plan.discount_percent || 0),
        price: parseFloat(plan.price || 0),
        benefits_description: plan.benefits_description,
        expiry_date: membership.expiry_date,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/customer/orders - Handle customer checkout, stock decrement & Digital Khata debit
export const placeCustomerOrder = async (req, res, next) => {
  try {
    const {
      tenant_id,
      merchant_id,
      customer_name,
      customer_phone,
      customer_address,
      order_type = 'delivery',
      payment_mode = 'online',
      table_number = '',
      guests_count = '',
      items = [],
      membership_phone,
      notes = ''
    } = req.body;

    const mId = parseInt(tenant_id || merchant_id || 1, 10);

    // Validation
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    if (!customer_phone || !customer_phone.trim()) {
      return res.status(400).json({ success: false, error: 'Customer phone number is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }
    if (order_type === 'delivery' && (!customer_address || !customer_address.trim())) {
      return res.status(400).json({ success: false, error: 'Delivery address is required for home delivery orders' });
    }
    if (order_type === 'dine_in' && (!table_number || !String(table_number).trim())) {
      return res.status(400).json({ success: false, error: 'Table number is required for Dine-in orders (e.g. Table 4)' });
    }

    // Verify merchant
    const merchantRes = await db.query(
      `SELECT id, store_name, phone FROM merchants WHERE id = $1`,
      [mId]
    );
    if (merchantRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Merchant store not found' });
    }
    const merchant = merchantRes.rows[0];

    // Verify products and inventory stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);

      if (!pId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid product or quantity for item: ${item.product_name || 'Item'}`
        });
      }

      const prodRes = await db.query(
        `SELECT * FROM products WHERE id = $1 AND merchant_id = $2`,
        [pId, mId]
      );

      if (prodRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Product #${pId} (${item.product_name}) not found under this merchant.`
        });
      }

      const product = prodRes.rows[0];

      if (product.stock_quantity < qty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.product_name}". Only ${product.stock_quantity} available.`
        });
      }

      const unitPrice = parseFloat(item.unit_price || product.selling_price || 0);
      const lineSubtotal = parseFloat((unitPrice * qty).toFixed(2));
      subtotal += lineSubtotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.product_name,
        quantity: qty,
        unit_price: unitPrice,
        subtotal: lineSubtotal
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Check for VIP / Mithra Plus membership discount
    const phoneToCheck = (membership_phone || customer_phone).trim();
    let discountPercent = 0;
    let discountAmount = 0;

    const membershipCheckRes = await db.query(
      `SELECT c.id, c.name, cm.status, cm.expiry_date, mp.plan_name, mp.discount_percent
       FROM customers c
       JOIN customer_memberships cm ON c.id = cm.customer_id
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE c.merchant_id = $1 AND c.phone = $2`,
      [mId, phoneToCheck]
    );

    if (membershipCheckRes.rows.length > 0) {
      const memRow = membershipCheckRes.rows[0];
      const today = new Date().toISOString().split('T')[0];
      const isMemActive = (memRow.status === 'ACTIVE' || memRow.membership_status === 'ACTIVE') && 
        (!memRow.expiry_date || memRow.expiry_date >= today);

      if (isMemActive) {
        discountPercent = parseFloat(memRow.discount_percent || 0);
        discountAmount = parseFloat(((subtotal * discountPercent) / 100).toFixed(2));
      }
    }

    const totalAmount = parseFloat(Math.max(0, subtotal - discountAmount).toFixed(2));

    // Find or create customer record in customers table
    let customerId = null;
    const custRes = await db.query(
      `SELECT * FROM customers WHERE merchant_id = $1 AND phone = $2`,
      [mId, customer_phone.trim()]
    );

    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
    } else {
      const createCustRes = await db.query(
        `INSERT INTO customers (merchant_id, name, phone) VALUES ($1, $2, $3) RETURNING *`,
        [mId, customer_name.trim(), customer_phone.trim()]
      );
      if (createCustRes.rows.length > 0) {
        customerId = createCustRes.rows[0].id;
      }
    }

    // Generate unique order number (e.g. DM-ORD-389104)
    const orderNumber = `DM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderNotes = [
      order_type === 'dine_in' ? `[Dine-In Table #${table_number}${guests_count ? ` - ${guests_count} Guests` : ''}]` : null,
      (payment_mode === 'cash' || payment_mode === 'cod') ? (order_type === 'delivery' ? '[Cash on Delivery (COD)]' : '[Pay Cash at Counter/Table]') : null,
      notes ? notes.trim() : null
    ].filter(Boolean).join(' | ');

    // Insert customer_orders
    const orderInsertRes = await db.query(
      `INSERT INTO customer_orders 
        (merchant_id, customer_id, order_number, customer_name, customer_phone, customer_address, order_type, payment_mode, subtotal, discount_amount, membership_discount_percent, total_amount, status, notes)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        mId,
        customerId,
        orderNumber,
        customer_name.trim(),
        customer_phone.trim(),
        order_type === 'delivery' ? customer_address.trim() : null,
        order_type,
        payment_mode,
        subtotal,
        discountAmount,
        discountPercent,
        totalAmount,
        'CONFIRMED',
        orderNotes || null
      ]
    );

    const order = {
      ...orderInsertRes.rows[0],
      table_number: table_number || null,
      guests_count: guests_count || null
    };

    // Insert customer_order_items and automatically decrement inventory stock
    const insertedItems = [];
    for (const item of validatedItems) {
      const itemRes = await db.query(
        `INSERT INTO customer_order_items 
          (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES 
          ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [order.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
      );
      insertedItems.push(itemRes.rows[0]);

      // Decrement product stock in inventory
      await db.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND merchant_id = $3`,
        [item.quantity, item.product_id, mId]
      );
    }

    order.items = insertedItems;

    // Digital Khata Ledger Integration: If payment_mode is 'khata', insert debit entry into customer_khata / customer_ledgers
    let khataEntry = null;
    if (payment_mode.toLowerCase() === 'khata' && customerId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Default repayment due date: 7 days
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const khataNotes = `Digital Storefront Order #${orderNumber} (${order_type.toUpperCase()}) - Pay Later on Khata`;

      const khataRes = await db.query(
        `INSERT INTO customer_ledgers 
          (merchant_id, customer_id, transaction_type, amount, notes, due_date, status)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          mId,
          customerId,
          'GIVEN', // Debit to customer (merchant gave credit)
          totalAmount,
          khataNotes,
          dueDateStr,
          'PENDING'
        ]
      );
      khataEntry = khataRes.rows[0];
    }

    // Pre-compose WhatsApp Order Confirmation message
    const storePhone = String(merchant.phone || '').replace(/\D/g, '');
    const itemListText = validatedItems
      .map(it => `• ${it.product_name} x ${it.quantity} = ₹${it.subtotal}`)
      .join('%0A');

    let addressText = `%0A🏪 *Type:* In-Store Pickup`;
    if (order_type === 'delivery') {
      addressText = `%0A📍 *Delivery Address:* ${encodeURIComponent(customer_address || '')}`;
    } else if (order_type === 'dine_in') {
      addressText = `%0A🍽️ *Dine-In:* Table #${encodeURIComponent(table_number)}${guests_count ? ` (${guests_count} Guests)` : ''}`;
    }

    let paymentText = 'Online / UPI Paid';
    if (payment_mode === 'khata') {
      paymentText = 'Pay Later (Khata Ledger)';
    } else if (payment_mode === 'cash' || payment_mode === 'cod') {
      paymentText = order_type === 'delivery' ? '💵 Cash on Delivery (COD)' : '💵 Cash at Counter/Table';
    }

    const waText = `🛍️ *NEW ONLINE ORDER: ${orderNumber}*%0A%0A` +
      `👤 *Customer:* ${encodeURIComponent(customer_name)} (${customer_phone})` +
      addressText + `%0A` +
      `💳 *Payment Mode:* ${paymentText}%0A%0A` +
      `📦 *Items Ordered:*%0A${itemListText}%0A%0A` +
      `💰 *Subtotal:* ₹${subtotal}%0A` +
      (discountAmount > 0 ? `🎁 *Mithra Plus VIP Discount (${discountPercent}%):* -₹${discountAmount}%0A` : '') +
      `💵 *Net Total:* ₹${totalAmount}%0A%0A` +
      `Thank you for ordering with ${encodeURIComponent(merchant.store_name)}!`;

    const whatsappLink = `https://wa.me/${storePhone}?text=${waText}`;

    res.status(201).json({
      success: true,
      message: payment_mode === 'khata' 
        ? `Order ${orderNumber} placed successfully on Customer Khata credit!` 
        : (payment_mode === 'cash' || payment_mode === 'cod')
        ? `Order ${orderNumber} placed with Cash on Delivery / Counter payment!`
        : `Order ${orderNumber} confirmed successfully!`,
      order: {
        ...order,
        items: insertedItems,
        khata_entry: khataEntry
      },
      khata_entry: khataEntry,
      whatsapp_link: whatsappLink,
      whatsapp_order_link: whatsappLink
    });
  } catch (err) {
    next(err);
  }
};

// 4. GET /api/customer/orders - Fetch customer previous orders by phone
export const getCustomerOrders = async (req, res, next) => {
  try {
    const tenantId = parseInt(req.query.tenant_id || req.query.merchant_id || 1, 10);
    const phone = req.query.phone ? String(req.query.phone).trim() : '';

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required to look up orders' });
    }

    const result = await db.query(
      `SELECT * FROM customer_orders WHERE merchant_id = $1 AND customer_phone = $2 ORDER BY created_at DESC`,
      [tenantId, phone]
    );

    const orders = result.rows || [];

    // Attach items for each order
    for (const ord of orders) {
      if (!ord.items) {
        const itemsRes = await db.query(
          `SELECT * FROM customer_order_items WHERE order_id = $1`,
          [ord.id]
        );
        ord.items = itemsRes.rows || [];
      }
    }

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (err) {
    next(err);
  }
};

// 5. GET /api/customer/merchant-orders - For Merchant Portal to manage incoming storefront orders
export const getMerchantStorefrontOrders = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    const result = await db.query(
      `SELECT * FROM customer_orders WHERE merchant_id = $1 ORDER BY created_at DESC`,
      [merchantId]
    );

    const orders = result.rows || [];

    for (const ord of orders) {
      if (!ord.items) {
        const itemsRes = await db.query(
          `SELECT * FROM customer_order_items WHERE order_id = $1`,
          [ord.id]
        );
        ord.items = itemsRes.rows || [];
      }
    }

    const totalRevenue = orders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;

    res.json({
      success: true,
      orders,
      summary: {
        totalOrders: orders.length,
        totalRevenue: totalRevenue.toFixed(2),
        pendingOrders,
        completedOrders
      }
    });
  } catch (err) {
    next(err);
  }
};

// 6. PUT /api/customer/orders/:id/status - Update order status (Merchant dashboard)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE customer_orders SET status = $1 WHERE id = $2 AND merchant_id = $3 RETURNING *`,
      [status, parseInt(id, 10), merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found under your merchant account' });
    }

    res.json({
      success: true,
      message: `Order #${result.rows[0].order_number} status updated to ${status}`,
      order: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};
