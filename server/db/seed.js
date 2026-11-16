import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function seedData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[Seed] No DATABASE_URL specified. In-memory demo data is already active.');
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[Seed] Seeding comprehensive mock data across all 25 tables and 7 Pillars into Neon DB...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('merchant123', salt);

    // 1. Insert Demo Merchant (Tenancy Root)
    const merchantRes = await client.query(`
      INSERT INTO merchants (store_name, owner_name, category, phone, email, password_hash, address, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET store_name = EXCLUDED.store_name
      RETURNING id;
    `, [
      'Artisan Coffee Roasters',
      'Sarah Jenkins',
      'Cafe & Roastery',
      '+91-98450-12345',
      'demo@artisancoffee.com',
      passwordHash,
      '100 Specialty Way, Indiranagar',
      'Bengaluru'
    ]);
    const merchantId = merchantRes.rows[0].id;

    // 2. Insert Membership Plans (All priced in ₹)
    const plansRes = await client.query(`
      INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
      VALUES 
        ($1, 'Coffee Club Basic', 499.00, 6, 10.0, '10% off on all espresso & bakery items + free size upgrade on Tuesdays'),
        ($1, 'Gold Brew Connoisseur', 1199.00, 12, 20.0, '20% off all beverages & merchandise, priority mobile ordering & birthday gift'),
        ($1, 'VIP Roaster Pass', 2499.00, 12, 25.0, '25% discount, complimentary pour-over tasting monthly, free 250g bean bag')
      RETURNING id, plan_name;
    `, [merchantId]);

    const basicPlan = plansRes.rows[0].id;
    const goldPlan = plansRes.rows[1].id;
    const vipPlan = plansRes.rows[2].id;

    // 3. Insert Customers (Realistic retail customer directory)
    const cust1 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Alex Rivera', '5551234567', '1992-05-14', '2018-09-20')
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust2 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Emily Watson', '5559876543', '1988-11-23', '2020-11-20')
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust3 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'David Chen', '5553456789', '1995-03-30', '2021-06-18')
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust4 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Sophia Martinez', '5554567890', '1990-08-12', NULL)
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust5 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Priya Sharma', '9876541122', '1994-11-25', NULL)
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust6 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Rohan Verma', '9988776655', '1991-07-19', '2019-12-08')
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    // 4. Assign Memberships (Active Tiers)
    await client.query(`
      INSERT INTO customer_memberships (customer_id, plan_id, start_date, expiry_date, status)
      VALUES 
        ($1, $2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'ACTIVE'),
        ($3, $4, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '170 days', 'ACTIVE'),
        ($5, $6, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '360 days', 'ACTIVE'),
        ($7, $6, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '363 days', 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `, [
      cust1.rows[0].id, goldPlan,
      cust2.rows[0].id, basicPlan,
      cust3.rows[0].id, vipPlan,
      cust6.rows[0].id
    ]);

    // 5. Seed Redemptions (Cashier POS Billing with ₹ pricing)
    await client.query(`
      INSERT INTO redemptions (merchant_id, customer_id, bill_amount, discount_given, redeemed_at)
      VALUES 
        ($1, $2, 1450.00, 290.00, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
        ($1, $3, 680.00, 68.00, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
        ($1, $4, 2850.00, 712.50, CURRENT_TIMESTAMP - INTERVAL '36 hours'),
        ($1, $2, 1950.00, 390.00, CURRENT_TIMESTAMP - INTERVAL '72 hours'),
        ($1, $3, 840.00, 84.00, CURRENT_TIMESTAMP - INTERVAL '96 hours'),
        ($1, $5, 3200.00, 800.00, CURRENT_TIMESTAMP - INTERVAL '120 hours');
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id, cust6.rows[0].id]);

    // 6. Seed Inventory Products (10 SKUs in ₹ with low-stock alerts)
    await client.query(`
      INSERT INTO products (merchant_id, product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit)
      VALUES 
        ($1, 'Ethiopian Yirgacheffe Whole Beans 250g', 'COF-ETH-250', 'Coffee Beans', 350.00, 650.00, 42, 10, 'bags'),
        ($1, 'House Espresso Blend 1kg', 'COF-ESP-1KG', 'Coffee Beans', 650.00, 1250.00, 3, 8, 'bags'),
        ($1, 'Barista Series Oat Milk 1L', 'ING-OAT-1L', 'Ingredients', 140.00, 260.00, 4, 12, 'cartons'),
        ($1, 'Ceramic V60 Dripper #02', 'BRW-V60-02', 'Brewing Gear', 850.00, 1650.00, 15, 5, 'pcs'),
        ($1, 'Double-Walled Glass Tumbler 16oz', 'MRCH-TMB-16', 'Merchandise', 420.00, 850.00, 2, 6, 'pcs'),
        ($1, 'Paper Coffee Filters (Pack of 100)', 'ACC-FLT-100', 'Accessories', 110.00, 240.00, 35, 10, 'packs'),
        ($1, 'Vanilla Hazelnut Syrup 750ml', 'SYR-VAN-750', 'Syrups', 320.00, 620.00, 18, 5, 'bottles'),
        ($1, 'Monsooned Malabar AA Dark Roast 500g', 'COF-MAL-500', 'Coffee Beans', 380.00, 720.00, 25, 6, 'bags'),
        ($1, 'Artisanal Butter Croissant (Box of 4)', 'BAK-CRS-04', 'Bakery', 120.00, 240.00, 14, 4, 'boxes'),
        ($1, 'Signature Cold Brew Bottle 300ml', 'BEV-CBW-300', 'Beverages', 90.00, 210.00, 20, 5, 'bottles')
      ON CONFLICT DO NOTHING;
    `, [merchantId]);

    // 7. Seed Customer Ledgers / Digital Udhaar (Credit & Repayment in ₹)
    await client.query(`
      INSERT INTO customer_ledgers (merchant_id, customer_id, transaction_type, amount, notes, due_date, status, created_at)
      VALUES 
        ($1, $2, 'GIVEN', 1250.00, '2x Ethiopian beans & bakery box on credit', CURRENT_DATE + INTERVAL '5 days', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '3 days'),
        ($1, $3, 'GIVEN', 580.00, 'Breakfast croissant & artisan latte', CURRENT_DATE - INTERVAL '2 days', 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '6 days'),
        ($1, $3, 'PAID', 580.00, 'Paid via UPI/GPay', NULL, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
        ($1, $4, 'GIVEN', 2100.00, 'Monthly coffee subscription renewal credit', CURRENT_DATE + INTERVAL '10 days', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1 day'),
        ($1, $4, 'PAID', 900.00, 'Part payment received via UPI', NULL, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
        ($1, $5, 'GIVEN', 1712.00, 'Cold Brew reserve crate on store credit', CURRENT_DATE + INTERVAL '14 days', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '12 hours')
      ON CONFLICT DO NOTHING;
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id, cust6.rows[0].id]);

    // 8. Seed Expenses (Operating & Shop Fixed Costs in ₹)
    await client.query(`
      INSERT INTO expenses (merchant_id, title, category, amount, expense_date, payment_method, notes)
      VALUES 
        ($1, 'Monthly Roastery Space Rent', 'Rent', 45000.00, CURRENT_DATE - INTERVAL '12 days', 'Bank Transfer', 'Indiranagar flagship roastery space rent'),
        ($1, 'Specialty Green Coffee Bean Sacks', 'Inventory', 18500.00, CURRENT_DATE - INTERVAL '5 days', 'Card', '120kg raw green beans from Coorg estate importer'),
        ($1, 'Electricity & Roaster Gas Bill', 'Utilities', 6800.00, CURRENT_DATE - INTERVAL '7 days', 'UPI', 'Commercial power & LPG cylinder utilities'),
        ($1, 'Espresso Machine Quarterly Tune-up', 'Maintenance', 3500.00, CURRENT_DATE - INTERVAL '2 days', 'Cash', 'Gasket, pressure gauge & grouphead filter replacement'),
        ($1, 'Compostable Takeaway Cups & Kraft Bags', 'Packaging', 4200.00, CURRENT_DATE - INTERVAL '3 days', 'Card', 'Eco-friendly branded packaging batch'),
        ($1, 'High-Speed Commercial Fiber Internet', 'Utilities', 1999.00, CURRENT_DATE - INTERVAL '10 days', 'UPI', 'Airtel Xstream 300 Mbps fiber & POS backup line')
      ON CONFLICT DO NOTHING;
    `, [merchantId]);

    // 9. Seed Staff (Team with ₹ Monthly Salaries)
    const staff1 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Marcus Brody', 'Head Barista & Roaster', '+91-98765-01111', 38000.00, '2025-06-01', true)
      RETURNING id;
    `, [merchantId]);

    const staff2 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Jessica Lin', 'Store Cashier & POS Lead', '+91-98765-02222', 26000.00, '2025-08-15', true)
      RETURNING id;
    `, [merchantId]);

    const staff3 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Carlos Mendez', 'Roastery Operations Assistant', '+91-98765-03333', 22000.00, '2026-01-10', true)
      RETURNING id;
    `, [merchantId]);

    const staff4 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Anita Desai', 'Shift Supervisor & Inventory Lead', '+91-98765-04444', 32000.00, '2025-11-01', true)
      RETURNING id;
    `, [merchantId]);

    // 10. Seed Staff Attendance (Today's Matrix)
    await client.query(`
      INSERT INTO staff_attendance (merchant_id, staff_id, attendance_date, status, check_in_time, notes)
      VALUES 
        ($1, $2, CURRENT_DATE, 'PRESENT', '07:45 AM', 'Opened morning shift & roaster calibration'),
        ($1, $3, CURRENT_DATE, 'PRESENT', '08:30 AM', 'Front desk POS register on duty'),
        ($1, $4, CURRENT_DATE, 'HALF_DAY', '12:00 PM', 'Afternoon bean packing shift'),
        ($1, $5, CURRENT_DATE, 'PRESENT', '08:00 AM', 'Inventory inspection & supplier receiving')
      ON CONFLICT (staff_id, attendance_date) DO NOTHING;
    `, [merchantId, staff1.rows[0].id, staff2.rows[0].id, staff3.rows[0].id, staff4.rows[0].id]);

    // 11. Seed WhatsApp Campaigns (AiSensy integrated templates)
    await client.query(`
      INSERT INTO whatsapp_campaigns (merchant_id, campaign_name, target_audience, message_template, discount_offer, status, sent_count)
      VALUES 
        ($1, 'Weekend Espresso Festival Broadcast', 'ALL', 'Hey {customer_name}! Enjoy our Weekend Special at {store_name}: 20% off all pour-over specials and bean bags! Show this message at checkout.', '20% OFF Beans', 'SENT', 6),
        ($1, 'VIP Connoisseur Tasting Invitation', 'ACTIVE_MEMBERS', 'Dear {customer_name}, as a valued loyalty member of {store_name}, your complimentary private tasting pass is ready this Friday evening!', 'Free Tasting Pass', 'SENT', 4),
        ($1, 'Festive Scratch Card Blast (AiSensy)', 'ALL', 'Namaste {customer_name}! Reveal your exclusive Festive Scratch Card reward at {store_name}: up to ₹250 cashback and complimentary treats!', 'Scratch Card Special', 'SENT', 6)
      ON CONFLICT DO NOTHING;
    `, [merchantId]);

    // 12. Seed Suppliers (Vendors with GST & Contact info)
    const sup1 = await client.query(`
      INSERT INTO suppliers (merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active)
      VALUES ($1, 'Malabar & Coorg Specialty Beans Co.', 'Mateo Vargas', '+91-98440-11771', 'orders@malabarbeans.in', '45 Plantations Rd, Madikeri, Coorg, KA', '29AABCM89211Z1', 'Net 30', true)
      RETURNING id;
    `, [merchantId]);

    const sup2 = await client.query(`
      INSERT INTO suppliers (merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active)
      VALUES ($1, 'Barista Gear & Dairy Supplies', 'Rachel Green', '+91-98440-22772', 'supplies@baristagear.in', '120 Logistics Blvd, Peenya Indl Area, Bengaluru', '29AADCB44102Q1', 'Net 15', true)
      RETURNING id;
    `, [merchantId]);

    // 13. Seed Purchase Orders & Line Items (Procurement in ₹)
    const po1 = await client.query(`
      INSERT INTO purchase_orders (merchant_id, supplier_id, po_number, status, total_amount, order_date, received_date, notes)
      VALUES ($1, $2, 'PO-202611-001', 'RECEIVED', 14500.00, CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '2 days', 'Monthly specialty roast bean stock')
      ON CONFLICT (merchant_id, po_number) DO NOTHING
      RETURNING id;
    `, [merchantId, sup1.rows[0].id]);

    if (po1.rows.length > 0) {
      await client.query(`
        INSERT INTO purchase_order_items (purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal)
        VALUES 
          ($1, 1, 'Ethiopian Yirgacheffe Single Origin 1kg', 25, 350.00, 8750.00),
          ($1, 8, 'Monsooned Malabar AA Dark Roast 500g', 15, 380.00, 5750.00);
      `, [po1.rows[0].id]);
    }

    const po2 = await client.query(`
      INSERT INTO purchase_orders (merchant_id, supplier_id, po_number, status, total_amount, order_date, expected_delivery_date, notes)
      VALUES ($1, $2, 'PO-202611-002', 'SENT', 8400.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 'Restock double-wall tumblers and stainless frothing pitchers')
      ON CONFLICT (merchant_id, po_number) DO NOTHING
      RETURNING id;
    `, [merchantId, sup2.rows[0].id]);

    if (po2.rows.length > 0) {
      await client.query(`
        INSERT INTO purchase_order_items (purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal)
        VALUES 
          ($1, 5, 'Double-Walled Glass Tumbler 16oz', 12, 420.00, 5040.00),
          ($1, 6, 'Stainless Steel Milk Frothing Pitcher', 8, 420.00, 3360.00);
      `, [po2.rows[0].id]);
    }

    // 14. Seed Supplier Ledgers / Khata
    const po1Id = po1.rows[0]?.id || null;
    const po2Id = po2.rows[0]?.id || null;

    await client.query(`
      INSERT INTO supplier_ledgers (merchant_id, supplier_id, purchase_order_id, transaction_type, amount, notes, reference_no, payment_date, status)
      VALUES 
        ($1, $2, $3, 'BILL', 14500.00, 'Invoice for Malabar & Coorg beans shipment', 'PO-202611-001', CURRENT_DATE - INTERVAL '6 days', 'PENDING'),
        ($1, $2, NULL, 'PAYMENT', 8000.00, 'Partial RTGS wire payment against PO-202611-001', 'TXN-RTGS-9811', CURRENT_DATE - INTERVAL '1 day', 'SETTLED'),
        ($1, $4, $5, 'BILL', 8400.00, 'Invoice for Barista Gear order', 'PO-202611-002', CURRENT_DATE - INTERVAL '1 day', 'PENDING');
    `, [merchantId, sup1.rows[0].id, po1Id, sup2.rows[0].id, po2Id]);

    // 15. Seed Debtor AI Voice Call Logs & Scheduled Callbacks
    await client.query(`
      INSERT INTO debtor_call_logs (merchant_id, customer_id, call_sid, call_status, intent, transcript, summary, promised_date, callback_scheduled_at, payment_link_sent, payment_link_url, upi_intent_string)
      VALUES 
        ($1, $2, 'CALL-VOICE-8811', 'COMPLETED', 'PROMISE_TO_PAY', 
         'AI: Namaste Alex, this is Artisan Coffee calling regarding your pending ₹1,250 balance. Alex: I will be there this Friday to pay the amount. AI: Perfect, noted for Friday!',
         'Customer promised to pay ₹1,250 balance on Friday.', CURRENT_DATE + INTERVAL '4 days', NULL, false, NULL, NULL),
        
        ($1, $3, 'CALL-VOICE-8822', 'COMPLETED', 'REQUEST_PAYMENT_LINK',
         'AI: Hello David, calling regarding your ₹1,200 coffee subscription ledger. David: Can you send me a UPI payment link on WhatsApp? AI: Dispatching your UPI link right now via WhatsApp!',
         'Debtor requested WhatsApp UPI payment link.', NULL, NULL, true, 
         'https://pay.loyaltyhub.app/upi?pa=artisan@upi&am=1200.00',
         'upi://pay?pa=artisan@upi&pn=Artisan%20Coffee&am=1200.00&cu=INR&tn=Khata-Settlement-3'),
        
        ($1, $4, 'CALL-VOICE-8833', 'COMPLETED', 'REQUEST_CALLBACK',
         'AI: Hi Emily, calling from Artisan Coffee. Emily: I am in a work meeting right now, please call me tomorrow morning. AI: Scheduled a callback for tomorrow at 11 AM.',
         'Debtor requested callback tomorrow morning due to busy schedule.', NULL, CURRENT_TIMESTAMP + INTERVAL '1 day', false, NULL, NULL);
    `, [merchantId, cust1.rows[0].id, cust3.rows[0].id, cust2.rows[0].id]);

    // 16. Seed Customer Digital Storefront Orders & Items (Catalog in ₹)
    const ord1 = await client.query(`
      INSERT INTO customer_orders (merchant_id, customer_id, order_number, customer_name, customer_phone, customer_address, order_type, payment_mode, subtotal, discount_amount, membership_discount_percent, total_amount, status, notes)
      VALUES 
        ($1, $2, 'DM-ORD-101', 'Alex Rivera', '5551234567', '742 Evergreen Terrace, Apt 4B, Indiranagar, Bengaluru', 'delivery', 'online', 1300.00, 260.00, 20.00, 1040.00, 'CONFIRMED', 'Ring doorbell twice, leave with reception')
      ON CONFLICT (merchant_id, order_number) DO NOTHING
      RETURNING id;
    `, [merchantId, cust1.rows[0].id]);

    if (ord1.rows.length > 0) {
      await client.query(`
        INSERT INTO customer_order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES ($1, 1, 'Ethiopian Yirgacheffe Whole Beans 250g', 2, 650.00, 1300.00);
      `, [ord1.rows[0].id]);
    }

    const ord2 = await client.query(`
      INSERT INTO customer_orders (merchant_id, customer_id, order_number, customer_name, customer_phone, customer_address, order_type, payment_mode, subtotal, discount_amount, membership_discount_percent, total_amount, status, notes)
      VALUES 
        ($1, $2, 'DM-ORD-102', 'David Chen', '5553456789', NULL, 'pickup', 'khata', 850.00, 212.50, 25.00, 637.50, 'PREPARING', 'Pick up around 4 PM')
      ON CONFLICT (merchant_id, order_number) DO NOTHING
      RETURNING id;
    `, [merchantId, cust3.rows[0].id]);

    if (ord2.rows.length > 0) {
      await client.query(`
        INSERT INTO customer_order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES ($1, 5, 'Double-Walled Glass Tumbler 16oz', 1, 850.00, 850.00);
      `, [ord2.rows[0].id]);
    }

    const ord3 = await client.query(`
      INSERT INTO customer_orders (merchant_id, customer_id, order_number, customer_name, customer_phone, customer_address, order_type, payment_mode, subtotal, discount_amount, membership_discount_percent, total_amount, status, notes)
      VALUES 
        ($1, $2, 'DM-ORD-103', 'Emily Watson', '5559876543', '12 Palm Grove, Koramangala 4th Block, Bengaluru', 'delivery', 'online', 960.00, 96.00, 10.00, 864.00, 'OUT_FOR_DELIVERY', 'Call on arrival')
      ON CONFLICT (merchant_id, order_number) DO NOTHING
      RETURNING id;
    `, [merchantId, cust2.rows[0].id]);

    if (ord3.rows.length > 0) {
      await client.query(`
        INSERT INTO customer_order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES 
          ($1, 8, 'Monsooned Malabar AA Dark Roast 500g', 1, 720.00, 720.00),
          ($1, 6, 'Paper Coffee Filters (Pack of 100)', 1, 240.00, 240.00);
      `, [ord3.rows[0].id]);
    }

    const ord4 = await client.query(`
      INSERT INTO customer_orders (merchant_id, customer_id, order_number, customer_name, customer_phone, customer_address, order_type, payment_mode, subtotal, discount_amount, membership_discount_percent, total_amount, status, notes)
      VALUES 
        ($1, $2, 'DM-ORD-104', 'Sophia Martinez', '5554567890', NULL, 'pickup', 'cash', 450.00, 0.00, 0.00, 450.00, 'COMPLETED', 'Counter takeaway')
      ON CONFLICT (merchant_id, order_number) DO NOTHING
      RETURNING id;
    `, [merchantId, cust4.rows[0].id]);

    if (ord4.rows.length > 0) {
      await client.query(`
        INSERT INTO customer_order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES 
          ($1, 9, 'Artisanal Butter Croissant (Box of 4)', 1, 240.00, 240.00),
          ($1, 10, 'Signature Cold Brew Bottle 300ml', 1, 210.00, 210.00);
      `, [ord4.rows[0].id]);
    }

    // 17. Seed Coupons & Scratch Cards (Marketing Pillar in ₹)
    await client.query(`
      INSERT INTO coupons (merchant_id, code, title, discount_type, discount_value, min_spend, max_discount, is_scratch_card, revealed_perk, expiry_date, usage_limit, used_count)
      VALUES 
        ($1, 'FESTIVE50', 'Festive Weekend Flat ₹50 OFF', 'FLAT', 50.00, 300.00, NULL, false, NULL, '2026-12-31', 100, 18),
        ($1, 'MITHRAGIFT25', 'VIP Scratch Card Special', 'PERCENT', 25.00, 200.00, 150.00, true, 'Free Cold Brew with any Bagel', '2026-11-30', 50, 12),
        ($1, 'BIRTHDAY100', 'Birthday Celebration Gift Card', 'FLAT', 100.00, 250.00, NULL, true, 'Complimentary Artisanal Dessert Slice', '2026-12-31', 50, 8),
        ($1, 'DIWALI20', 'Diwali Festive Scratch Card', 'PERCENT', 20.00, 600.00, 300.00, true, '₹150 Cashback on next visit', '2026-12-31', 75, 15),
        ($1, 'WELCOME150', 'Welcome First Order Discount', 'FLAT', 150.00, 500.00, NULL, false, NULL, '2026-12-31', 100, 22)
      ON CONFLICT (merchant_id, code) DO NOTHING;
    `, [merchantId]);

    // 18. Seed Automated Greetings (Marketing Pillar WhatsApp Queue)
    await client.query(`
      INSERT INTO customer_greetings (merchant_id, customer_id, greeting_type, event_date, scheduled_date, channel, message, status, coupon_code)
      VALUES 
        ($1, $2, 'BIRTHDAY', '2026-11-18', '2026-11-18', 'WHATSAPP', '🎂 Happy Birthday Alex Rivera! Enjoy ₹100 off your coffee order with code BIRTHDAY100 at Artisan Coffee Roasters.', 'SCHEDULED', 'BIRTHDAY100'),
        ($1, $3, 'ANNIVERSARY', '2026-11-20', '2026-11-20', 'WHATSAPP', '💍 Happy Anniversary Emily Watson! Thank you for being our valued patron. Enjoy 25% off with code MITHRAGIFT25.', 'SCHEDULED', 'MITHRAGIFT25'),
        ($1, $4, 'BIRTHDAY', '2026-11-10', '2026-11-10', 'WHATSAPP', '🎉 Happy Birthday David! Celebrate with ₹100 off your favorite cold brew with code BIRTHDAY100.', 'SENT', 'BIRTHDAY100'),
        ($1, $5, 'BIRTHDAY', '2026-11-25', '2026-11-25', 'WHATSAPP', '🎂 Happy Birthday Priya Sharma! Enjoy ₹100 off your coffee order with code BIRTHDAY100 at Artisan Coffee Roasters.', 'SCHEDULED', 'BIRTHDAY100'),
        ($1, $6, 'ANNIVERSARY', '2026-12-08', '2026-12-08', 'WHATSAPP', '💍 Happy Anniversary Rohan! Thank you for choosing Artisan Coffee. Enjoy 25% off with code MITHRAGIFT25.', 'SCHEDULED', 'MITHRAGIFT25')
      ON CONFLICT DO NOTHING;
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id, cust5.rows[0].id, cust6.rows[0].id]);

    // 19. Seed Customer Feedback (R&D Pillar NPS Reviews)
    await client.query(`
      INSERT INTO customer_feedback (merchant_id, customer_id, customer_name, customer_phone, rating, sentiment, category, feedback_text, status)
      VALUES 
        ($1, $2, 'Alex Rivera', '5551234567', 5, 'POSITIVE', 'Quality', 'The Monsooned Malabar and Ethiopian Yirgacheffe roasts are exceptionally rich with delicate floral and citrus aromas. World-class bean selection!', 'ACKNOWLEDGED'),
        ($1, $3, 'Emily Watson', '5559876543', 4, 'POSITIVE', 'Ambience', 'Lovely cafe vibes and fast WiFi, perfect for remote working. A bit crowded during lunchtime rush.', 'NEW'),
        ($1, $4, 'David Chen', '5553456789', 3, 'NEUTRAL', 'Speed', 'Coffee is great but checkout line took almost 10 minutes on Saturday morning. Fast POS helped though.', 'NEW'),
        ($1, $5, 'Priya Sharma', '9876541122', 5, 'POSITIVE', 'Service', 'Cashier was super helpful and verified my Mithra Plus membership in seconds. Saved ₹260!', 'ACKNOWLEDGED'),
        ($1, $6, 'Rohan Verma', '9988776655', 5, 'POSITIVE', 'Pricing', 'Mithra VIP pass easily paid for itself in two visits! Outstanding loyalty perks, scratch cards, and friendly staff.', 'ACKNOWLEDGED'),
        ($1, NULL, 'Ananya Iyer', '9845011223', 4, 'POSITIVE', 'Quality', 'Organic Oat Milk iced latte was creamy and perfectly balanced. Love that all takeaway packaging is 100% compostable.', 'NEW')
      ON CONFLICT DO NOTHING;
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id, cust5.rows[0].id, cust6.rows[0].id]);

    // 20. Seed Experiments (R&D Pillar A/B Tests)
    await client.query(`
      INSERT INTO experiments (merchant_id, test_name, hypothesis, target_segment, variant_a, variant_b, conversion_metric, status, sample_size, conversion_rate_a, conversion_rate_b, results_summary)
      VALUES 
        ($1, 'VIP Tier Free Doorstep Delivery vs Flat ₹50 Coupon', 'Offering free doorstep delivery to VIP members will increase repeat orders by 25% compared to ₹50 coupon.', 'VIP', 'Free Delivery on All Orders', 'Flat ₹50 Coupon on ₹300+', '7-Day Repeat Order Rate', 'RUNNING', 140, 32.50, 24.00, 'Variant A (Free Delivery) is outperforming by +8.5% conversion uplift.'),
        ($1, 'Interactive Digital Scratch Card vs Plain SMS Coupon', 'Digital scratch cards with reveal animation increase redemption rate by over 40%.', 'ALL', 'Interactive Scratch Card URL', 'Standard Plain SMS Discount Code', 'Redemption Rate %', 'CONCLUDED', 250, 44.80, 18.20, 'Concluded with high statistical significance: Scratch cards increased redemptions by 2.4x.'),
        ($1, 'Dynamic Khata Credit Limit Notification at Checkout', 'Displaying remaining Udhaar credit balance inside the storefront drawer reduces abandoned checkouts.', 'UDHAAR_USERS', 'Live Remaining Khata Balance Banner', 'Standard Pay Later (Khata) Button', 'Checkout Completion %', 'RUNNING', 85, 28.00, 19.50, 'Showing remaining credit limit increases checkout completion by +8.5%.')
      ON CONFLICT DO NOTHING;
    `, [merchantId]);

    // 23. Seed Beta Testing Logs (R&D Pillar)
    await client.query(`
      INSERT INTO beta_testing_logs (merchant_id, feature_name, tester_name, tester_phone, feedback_type, severity, description, status)
      VALUES 
        ($1, 'AI Voice Debtor Callback Scheduler', 'Alex Rivera', '5551234567', 'UX_FEEDBACK', 'LOW', 'Voice bot sounded very polite and dispatched the WhatsApp payment link within 3 seconds. Very convenient!', 'RESOLVED'),
        ($1, 'Customer Storefront Pay Later (Khata)', 'David Chen', '5553456789', 'FEATURE_REQUEST', 'MEDIUM', 'Would love to see my current remaining Khata credit limit displayed directly inside the storefront checkout drawer.', 'OPEN'),
        ($1, 'AiSensy WhatsApp Template Sync', 'Sarah Jenkins (Owner)', '5550199999', 'BUG', 'LOW', 'Variable tag {customer_name} should trim whitespace before encoding.', 'RESOLVED'),
        ($1, '1-Click Auto-PO WhatsApp Replenishment', 'Anita Desai (Supervisor)', '9876504444', 'UX_FEEDBACK', 'LOW', 'Auto-PO correctly picked up the 3 low stock items and generated the WhatsApp message to our Coorg supplier in one click.', 'RESOLVED')
      ON CONFLICT DO NOTHING;
    `, [merchantId]);

    // 24. Seed Branches (Executive Pillar in Bengaluru)
    await client.query(`
      INSERT INTO branches (merchant_id, branch_name, branch_code, address, city, phone, manager_name, daily_target)
      VALUES 
        ($1, 'Artisan Coffee - Flagship Roastery', 'BR-MAIN-01', '100 Specialty Way, Indiranagar', 'Bengaluru', '+91-80-2345-0001', 'Sarah Jenkins', 45000.00),
        ($1, 'Artisan Coffee - Downtown Tech Park', 'BR-DOWN-02', 'Tech Hub, 3rd Floor, Outer Ring Rd', 'Bengaluru', '+91-80-2345-0002', 'Vikram Rathore', 35000.00),
        ($1, 'Artisan Coffee - Airport Express Kiosk', 'BR-AIR-03', 'Terminal 2 Departures, Kempegowda Intl', 'Bengaluru', '+91-80-2345-0003', 'Anita Desai', 65000.00)
      ON CONFLICT (merchant_id, branch_code) DO NOTHING;
    `, [merchantId]);

    // 25. Seed RBAC Roles (HR Pillar)
    await client.query(`
      INSERT INTO roles_permissions (merchant_id, role_name, description, can_executive, can_marketing, can_pos, can_operations, can_rd, can_finance, can_hr)
      VALUES 
        ($1, 'Owner / CEO', 'Full unrestricted administrative access to all 7 Pillars & Executive Suite', true, true, true, true, true, true, true),
        ($1, 'Store Manager', 'Operations, POS terminal, staff attendance, customer relations and marketing campaigns', false, true, true, true, true, false, true),
        ($1, 'Cashier / Front Desk', 'Fast POS checkout billing, member lookup, voucher redemption, customer feedback', false, false, true, false, true, false, false),
        ($1, 'Chief Accountant', 'Digital Khata ledger, supplier payments, expenses, P&L reports, and GST compliance', false, false, false, true, false, true, true)
      ON CONFLICT (merchant_id, role_name) DO NOTHING;
    `, [merchantId]);

    console.log('[Seed] Comprehensive mock demo data successfully seeded into PostgreSQL!');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await client.end();
  }
}

seedData();
