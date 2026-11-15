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
    console.log('[Seed] Seeding sample merchant, plans, customers and redemptions into Neon DB...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('merchant123', salt);

    // 1. Insert Demo Merchant
    const merchantRes = await client.query(`
      INSERT INTO merchants (store_name, owner_name, category, phone, email, password_hash, address, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET store_name = EXCLUDED.store_name
      RETURNING id;
    `, [
      'Artisan Coffee Roasters',
      'Sarah Jenkins',
      'Cafe & Roastery',
      '+1-555-0199',
      'demo@artisancoffee.com',
      passwordHash,
      '450 Market Street, Suite 10',
      'San Francisco'
    ]);
    const merchantId = merchantRes.rows[0].id;

    // 2. Insert Membership Plans
    const plansRes = await client.query(`
      INSERT INTO membership_plans (merchant_id, plan_name, price, validity_months, discount_percent, benefits_description)
      VALUES 
        ($1, 'Coffee Club Basic', 19.99, 6, 10.0, '10% off on all espresso & bakery items + free size upgrade on Tuesdays'),
        ($1, 'Gold Brew Connoisseur', 49.99, 12, 20.0, '20% off all beverages & merchandise, priority mobile ordering & birthday gift'),
        ($1, 'VIP Roaster Pass', 99.00, 12, 25.0, '25% discount, complimentary pour-over tasting monthly, free 250g bean bag')
      RETURNING id, plan_name;
    `, [merchantId]);

    const basicPlan = plansRes.rows[0].id;
    const goldPlan = plansRes.rows[1].id;
    const vipPlan = plansRes.rows[2].id;

    // 3. Insert Customers
    const cust1 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Alex Rivera', '5551234567', '1992-05-14', '2018-09-20')
      ON CONFLICT (merchant_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [merchantId]);

    const cust2 = await client.query(`
      INSERT INTO customers (merchant_id, name, phone, birthday, anniversary)
      VALUES ($1, 'Emily Watson', '5559876543', '1988-11-23', NULL)
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

    // 4. Assign Memberships
    await client.query(`
      INSERT INTO customer_memberships (customer_id, plan_id, start_date, expiry_date, status)
      VALUES 
        ($1, $2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'ACTIVE'),
        ($3, $4, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '170 days', 'ACTIVE'),
        ($5, $6, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '360 days', 'ACTIVE');
    `, [
      cust1.rows[0].id, goldPlan,
      cust2.rows[0].id, basicPlan,
      cust3.rows[0].id, vipPlan
    ]);

    // 5. Seed Redemptions
    await client.query(`
      INSERT INTO redemptions (merchant_id, customer_id, bill_amount, discount_given, redeemed_at)
      VALUES 
        ($1, $2, 32.50, 6.50, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
        ($1, $3, 18.00, 1.80, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
        ($1, $4, 85.00, 21.25, CURRENT_TIMESTAMP - INTERVAL '36 hours');
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id]);

    // 6. Seed Inventory Products
    await client.query(`
      INSERT INTO products (merchant_id, product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit)
      VALUES 
        ($1, 'Ethiopian Yirgacheffe Whole Beans 250g', 'COF-ETH-250', 'Coffee Beans', 7.50, 18.00, 42, 10, 'bags'),
        ($1, 'House Espresso Blend 1kg', 'COF-ESP-1KG', 'Coffee Beans', 14.00, 32.00, 3, 8, 'bags'),
        ($1, 'Barista Series Oat Milk 1L', 'ING-OAT-1L', 'Ingredients', 1.80, 4.50, 4, 12, 'cartons'),
        ($1, 'Ceramic V60 Dripper #02', 'BRW-V60-02', 'Brewing Gear', 12.00, 26.00, 15, 5, 'pcs'),
        ($1, 'Double-Walled Glass Tumbler 16oz', 'MRCH-TMB-16', 'Merchandise', 8.00, 22.00, 2, 6, 'pcs'),
        ($1, 'Paper Coffee Filters (Pack of 100)', 'ACC-FLT-100', 'Accessories', 2.50, 6.50, 35, 10, 'packs')
    `, [merchantId]);

    // 7. Seed Customer Ledgers / Digital Udhaar
    await client.query(`
      INSERT INTO customer_ledgers (merchant_id, customer_id, transaction_type, amount, notes, due_date, status, created_at)
      VALUES 
        ($1, $2, 'GIVEN', 45.00, '2x Ethiopian beans & bakery box on credit', CURRENT_DATE + INTERVAL '5 days', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '3 days'),
        ($1, $3, 'GIVEN', 25.00, 'Breakfast sandwich & latte', CURRENT_DATE - INTERVAL '2 days', 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '6 days'),
        ($1, $3, 'PAID', 25.00, 'Paid via UPI/Cash', NULL, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '2 days'),
        ($1, $4, 'GIVEN', 70.00, 'Monthly coffee subscription renewal credit', CURRENT_DATE + INTERVAL '10 days', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1 day'),
        ($1, $4, 'PAID', 30.00, 'Part payment received', NULL, 'SETTLED', CURRENT_TIMESTAMP - INTERVAL '4 hours')
    `, [merchantId, cust1.rows[0].id, cust2.rows[0].id, cust3.rows[0].id]);

    // 8. Seed Expenses
    await client.query(`
      INSERT INTO expenses (merchant_id, title, category, amount, expense_date, payment_method, notes)
      VALUES 
        ($1, 'Monthly Roastery Space Rent', 'Rent', 850.00, CURRENT_DATE - INTERVAL '12 days', 'Bank Transfer', 'Downtown retail space rent'),
        ($1, 'Specialty Green Coffee Bean Sacks', 'Inventory', 320.00, CURRENT_DATE - INTERVAL '5 days', 'Card', '60kg raw green beans from importer'),
        ($1, 'Electricity & Roaster Gas Bill', 'Utilities', 115.00, CURRENT_DATE - INTERVAL '7 days', 'UPI', 'Commercial power utilities'),
        ($1, 'Espresso Machine Tune-up & Filters', 'Maintenance', 65.00, CURRENT_DATE - INTERVAL '2 days', 'Cash', 'Gasket & grouphead filter replacement')
    `, [merchantId]);

    // 9. Seed Staff
    const staff1 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Marcus Brody', 'Head Barista', '+1-555-0811', 2800.00, '2025-06-01', true)
      RETURNING id;
    `, [merchantId]);

    const staff2 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Jessica Lin', 'Store Cashier & Lead', '+1-555-0822', 2200.00, '2025-08-15', true)
      RETURNING id;
    `, [merchantId]);

    const staff3 = await client.query(`
      INSERT INTO staff (merchant_id, name, role, phone, monthly_salary, joining_date, is_active)
      VALUES ($1, 'Carlos Mendez', 'Roastery Assistant', '+1-555-0833', 1900.00, '2026-01-10', true)
      RETURNING id;
    `, [merchantId]);

    // 10. Seed Staff Attendance
    await client.query(`
      INSERT INTO staff_attendance (merchant_id, staff_id, attendance_date, status, check_in_time, notes)
      VALUES 
        ($1, $2, CURRENT_DATE, 'PRESENT', '07:45 AM', 'Opened morning shift'),
        ($1, $3, CURRENT_DATE, 'PRESENT', '08:30 AM', 'POS register on duty'),
        ($1, $4, CURRENT_DATE, 'HALF_DAY', '12:00 PM', 'Afternoon bean packing shift')
      ON CONFLICT (staff_id, attendance_date) DO NOTHING;
    `, [merchantId, staff1.rows[0].id, staff2.rows[0].id, staff3.rows[0].id]);

    // 11. Seed WhatsApp Campaigns
    await client.query(`
      INSERT INTO whatsapp_campaigns (merchant_id, campaign_name, target_audience, message_template, discount_offer, status, sent_count)
      VALUES 
        ($1, 'Weekend Espresso Festival Broadcast', 'ALL', 'Hey {customer_name}! Enjoy our Weekend Special at {store_name}: 20% off all pour-over specials and bean bags! Show this message at checkout.', '20% OFF Beans', 'SENT', 4),
        ($1, 'VIP Connoisseur Tasting Invitation', 'ACTIVE_MEMBERS', 'Dear {customer_name}, as a valued loyalty member of {store_name}, your complimentary private tasting pass is ready this Friday evening!', 'Free Tasting Pass', 'SENT', 3)
    `, [merchantId]);

    // 12. Seed Suppliers
    const sup1 = await client.query(`
      INSERT INTO suppliers (merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active)
      VALUES ($1, 'Andean Specialty Beans Co.', 'Mateo Vargas', '+1-555-7711', 'orders@andeanbeans.com', '450 Export Way, Miami, FL', 'US-TAX-89211', 'Net 30', true)
      RETURNING id;
    `, [merchantId]);

    const sup2 = await client.query(`
      INSERT INTO suppliers (merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active)
      VALUES ($1, 'Barista Gear & Dairy Supplies', 'Rachel Green', '+1-555-7722', 'supplies@baristagear.com', '120 Logistics Blvd, Chicago, IL', 'US-TAX-44102', 'Net 15', true)
      RETURNING id;
    `, [merchantId]);

    // 13. Seed Purchase Orders & Line Items
    const po1 = await client.query(`
      INSERT INTO purchase_orders (merchant_id, supplier_id, po_number, status, total_amount, order_date, received_date, notes)
      VALUES ($1, $2, 'PO-202611-001', 'RECEIVED', 450.00, CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '2 days', 'Monthly specialty roast stock')
      RETURNING id;
    `, [merchantId, sup1.rows[0].id]);

    await client.query(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal)
      VALUES 
        ($1, 1, 'Ethiopian Yirgacheffe Single Origin 1kg', 25, 12.00, 300.00),
        ($1, 2, 'Colombia Supremo Dark Roast 500g', 15, 10.00, 150.00)
    `, [po1.rows[0].id]);

    const po2 = await client.query(`
      INSERT INTO purchase_orders (merchant_id, supplier_id, po_number, status, total_amount, order_date, expected_delivery_date, notes)
      VALUES ($1, $2, 'PO-202611-002', 'SENT', 280.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 'Restock milk frothers and double wall tumblers')
      RETURNING id;
    `, [merchantId, sup2.rows[0].id]);

    await client.query(`
      INSERT INTO purchase_order_items (purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal)
      VALUES 
        ($1, 5, 'Double-Walled Glass Tumbler 16oz', 20, 7.00, 140.00),
        ($1, 6, 'Stainless Steel Milk Frothing Pitcher', 14, 10.00, 140.00)
    `, [po2.rows[0].id]);

    // 14. Seed Supplier Ledgers
    await client.query(`
      INSERT INTO supplier_ledgers (merchant_id, supplier_id, purchase_order_id, transaction_type, amount, notes, reference_no, payment_date, status)
      VALUES 
        ($1, $2, $3, 'BILL', 450.00, 'Invoice for Andean Beans shipment', 'PO-202611-001', CURRENT_DATE - INTERVAL '6 days', 'PENDING'),
        ($1, $2, NULL, 'PAYMENT', 250.00, 'Partial wire payment against PO-202611-001', 'TXN-BNK-9811', CURRENT_DATE - INTERVAL '1 day', 'SETTLED'),
        ($1, $4, $5, 'BILL', 280.00, 'Invoice for Barista Gear order', 'PO-202611-002', CURRENT_DATE - INTERVAL '1 day', 'PENDING')
    `, [merchantId, sup1.rows[0].id, po1.rows[0].id, sup2.rows[0].id, po2.rows[0].id]);

    // 15. Seed Debtor AI Voice Call Logs & Scheduled Callbacks
    await client.query(`
      INSERT INTO debtor_call_logs (merchant_id, customer_id, call_sid, call_status, intent, transcript, summary, promised_date, callback_scheduled_at, payment_link_sent, payment_link_url, upi_intent_string)
      VALUES 
        ($1, $2, 'CALL-VOICE-8811', 'COMPLETED', 'PROMISE_TO_PAY', 
         'AI: Hello Alex, this is Artisan Coffee calling regarding your balance. Alex: I will be there this Friday to pay the $45. AI: Perfect, noted for Friday!',
         'Customer promised to pay $45 balance on Friday.', CURRENT_DATE + INTERVAL '4 days', NULL, false, NULL, NULL),
        
        ($1, $3, 'CALL-VOICE-8822', 'COMPLETED', 'REQUEST_PAYMENT_LINK',
         'AI: Hello David, calling regarding your $40 coffee subscription ledger. David: Can you send me a UPI payment link on WhatsApp? AI: Dispatching your UPI link right now via WhatsApp!',
         'Debtor requested WhatsApp UPI payment link.', NULL, NULL, true, 
         'https://pay.loyaltyhub.app/upi?pa=artisan@upi&am=40.00',
         'upi://pay?pa=artisan@upi&pn=Artisan%20Coffee&am=40.00&cu=INR&tn=Khata-Settlement-3'),
        
        ($1, $4, 'CALL-VOICE-8833', 'COMPLETED', 'REQUEST_CALLBACK',
         'AI: Hi Emily, calling from Artisan Coffee. Emily: I am in a work meeting right now, please call me tomorrow morning. AI: Scheduled a callback for tomorrow at 11 AM.',
         'Debtor requested callback tomorrow morning due to busy schedule.', NULL, CURRENT_TIMESTAMP + INTERVAL '1 day', false, NULL, NULL)
    `, [merchantId, cust1.rows[0].id, cust3.rows[0].id, cust2.rows[0].id]);

    console.log('[Seed] Demo data seeded successfully into PostgreSQL!');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await client.end();
  }
}

seedData();
