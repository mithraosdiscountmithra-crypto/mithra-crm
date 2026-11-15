import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

let pool = null;
let useFallback = false;

// Initialize PostgreSQL Pool if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false }, // Required for Neon DB Serverless
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20
    });

    pool.on('error', (err) => {
      console.error('[DB Error] Unexpected PostgreSQL client error:', err.message);
    });
  } catch (err) {
    console.warn('[DB Warning] Failed to initialize PostgreSQL pool:', err.message);
  }
}

// In-Memory Fallback Store (Allows running instantly without a Neon database or when testing offline)
class MemoryStore {
  constructor() {
    this.merchants = [];
    this.membership_plans = [];
    this.customers = [];
    this.customer_memberships = [];
    this.redemptions = [];
    this.products = [];
    this.customer_ledgers = [];
    this.expenses = [];
    this.staff = [];
    this.staff_attendance = [];
    this.whatsapp_campaigns = [];
    this.suppliers = [];
    this.purchase_orders = [];
    this.purchase_order_items = [];
    this.supplier_ledgers = [];
    this.debtor_call_logs = [];
    this.merchantSeq = 1;
    this.planSeq = 1;
    this.customerSeq = 1;
    this.membershipSeq = 1;
    this.redemptionSeq = 1;
    this.productSeq = 1;
    this.ledgerSeq = 1;
    this.expenseSeq = 1;
    this.staffSeq = 1;
    this.attendanceSeq = 1;
    this.campaignSeq = 1;
    this.supplierSeq = 1;
    this.poSeq = 1;
    this.poItemSeq = 1;
    this.supplierLedgerSeq = 1;
    this.callLogSeq = 1;

    this.seedDemoData();
  }

  seedDemoData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('merchant123', salt);

    // Seed Demo Merchant
    const merchant = {
      id: this.merchantSeq++,
      store_name: "Artisan Coffee Roasters",
      owner_name: "Sarah Jenkins",
      category: "Cafe & Roastery",
      phone: "+1-555-0199",
      email: "demo@artisancoffee.com",
      password_hash: demoPasswordHash,
      address: "450 Market Street, Suite 10",
      city: "San Francisco",
      is_active: true,
      created_at: new Date('2026-01-15T08:00:00Z'),
      updated_at: new Date('2026-01-15T08:00:00Z')
    };
    this.merchants.push(merchant);

    // Seed Membership Plans
    const plans = [
      {
        id: this.planSeq++,
        merchant_id: merchant.id,
        plan_name: "Coffee Club Basic",
        price: 19.99,
        validity_months: 6,
        discount_percent: 10.0,
        benefits_description: "10% off on all espresso & bakery items + free size upgrade on Tuesdays",
        is_active: true,
        created_at: new Date()
      },
      {
        id: this.planSeq++,
        merchant_id: merchant.id,
        plan_name: "Gold Brew Connoisseur",
        price: 49.99,
        validity_months: 12,
        discount_percent: 20.0,
        benefits_description: "20% off all beverages & merchandise, priority mobile ordering & birthday gift",
        is_active: true,
        created_at: new Date()
      },
      {
        id: this.planSeq++,
        merchant_id: merchant.id,
        plan_name: "VIP Roaster Pass",
        price: 99.00,
        validity_months: 12,
        discount_percent: 25.0,
        benefits_description: "25% discount, complimentary pour-over tasting monthly, free 250g bean bag",
        is_active: true,
        created_at: new Date()
      }
    ];
    this.membership_plans.push(...plans);

    // Seed Customers
    const customers = [
      {
        id: this.customerSeq++,
        merchant_id: merchant.id,
        name: "Alex Rivera",
        phone: "5551234567",
        birthday: "1992-05-14",
        anniversary: "2018-09-20",
        created_at: new Date('2026-02-01')
      },
      {
        id: this.customerSeq++,
        merchant_id: merchant.id,
        name: "Emily Watson",
        phone: "5559876543",
        birthday: "1988-11-23",
        anniversary: null,
        created_at: new Date('2026-02-10')
      },
      {
        id: this.customerSeq++,
        merchant_id: merchant.id,
        name: "David Chen",
        phone: "5553456789",
        birthday: "1995-03-30",
        anniversary: "2021-06-18",
        created_at: new Date('2026-03-01')
      },
      {
        id: this.customerSeq++,
        merchant_id: merchant.id,
        name: "Sophia Martinez",
        phone: "5554567890",
        birthday: "1990-08-12",
        anniversary: null,
        created_at: new Date('2026-03-15')
      }
    ];
    this.customers.push(...customers);

    // Seed Customer Memberships
    const memberships = [
      {
        id: this.membershipSeq++,
        customer_id: customers[0].id,
        plan_id: plans[1].id, // Gold (20%)
        start_date: '2026-01-01',
        expiry_date: '2027-01-01',
        status: 'ACTIVE',
        created_at: new Date()
      },
      {
        id: this.membershipSeq++,
        customer_id: customers[1].id,
        plan_id: plans[0].id, // Basic (10%)
        start_date: '2026-02-15',
        expiry_date: '2026-08-15',
        status: 'ACTIVE',
        created_at: new Date()
      },
      {
        id: this.membershipSeq++,
        customer_id: customers[2].id,
        plan_id: plans[2].id, // VIP (25%)
        start_date: '2026-03-01',
        expiry_date: '2027-03-01',
        status: 'ACTIVE',
        created_at: new Date()
      }
      // Customer 3 (Sophia) has no active plan (regular customer)
    ];
    this.customer_memberships.push(...memberships);

    // Seed Redemptions
    const redemptions = [
      {
        id: this.redemptionSeq++,
        merchant_id: merchant.id,
        customer_id: customers[0].id,
        bill_amount: 32.50,
        discount_given: 6.50,
        redeemed_at: new Date(Date.now() - 3600 * 1000 * 2)
      },
      {
        id: this.redemptionSeq++,
        merchant_id: merchant.id,
        customer_id: customers[1].id,
        bill_amount: 18.00,
        discount_given: 1.80,
        redeemed_at: new Date(Date.now() - 3600 * 1000 * 18)
      },
      {
        id: this.redemptionSeq++,
        merchant_id: merchant.id,
        customer_id: customers[2].id,
        bill_amount: 85.00,
        discount_given: 21.25,
        redeemed_at: new Date(Date.now() - 3600 * 1000 * 36)
      },
      {
        id: this.redemptionSeq++,
        merchant_id: merchant.id,
        customer_id: customers[0].id,
        bill_amount: 45.00,
        discount_given: 9.00,
        redeemed_at: new Date(Date.now() - 3600 * 1000 * 72)
      }
    ];
    this.redemptions.push(...redemptions);

    // Seed Demo Products for Merchant
    const products = [
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "Ethiopian Yirgacheffe Whole Beans 250g",
        sku: "COF-ETH-250",
        category: "Coffee Beans",
        purchase_price: 7.50,
        selling_price: 18.00,
        stock_quantity: 42,
        low_stock_threshold: 10,
        unit: "bags",
        created_at: new Date('2026-02-01T10:00:00Z'),
        updated_at: new Date('2026-02-01T10:00:00Z')
      },
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "House Espresso Blend 1kg",
        sku: "COF-ESP-1KG",
        category: "Coffee Beans",
        purchase_price: 14.00,
        selling_price: 32.00,
        stock_quantity: 3,
        low_stock_threshold: 8,
        unit: "bags",
        created_at: new Date('2026-02-05T10:00:00Z'),
        updated_at: new Date('2026-02-05T10:00:00Z')
      },
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "Barista Series Oat Milk 1L",
        sku: "ING-OAT-1L",
        category: "Ingredients",
        purchase_price: 1.80,
        selling_price: 4.50,
        stock_quantity: 4,
        low_stock_threshold: 12,
        unit: "cartons",
        created_at: new Date('2026-02-10T10:00:00Z'),
        updated_at: new Date('2026-02-10T10:00:00Z')
      },
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "Ceramic V60 Dripper #02",
        sku: "BRW-V60-02",
        category: "Brewing Gear",
        purchase_price: 12.00,
        selling_price: 26.00,
        stock_quantity: 15,
        low_stock_threshold: 5,
        unit: "pcs",
        created_at: new Date('2026-02-12T10:00:00Z'),
        updated_at: new Date('2026-02-12T10:00:00Z')
      },
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "Double-Walled Glass Tumbler 16oz",
        sku: "MRCH-TMB-16",
        category: "Merchandise",
        purchase_price: 8.00,
        selling_price: 22.00,
        stock_quantity: 2,
        low_stock_threshold: 6,
        unit: "pcs",
        created_at: new Date('2026-02-15T10:00:00Z'),
        updated_at: new Date('2026-02-15T10:00:00Z')
      },
      {
        id: this.productSeq++,
        merchant_id: merchant.id,
        product_name: "Paper Coffee Filters (Pack of 100)",
        sku: "ACC-FLT-100",
        category: "Accessories",
        purchase_price: 2.50,
        selling_price: 6.50,
        stock_quantity: 35,
        low_stock_threshold: 10,
        unit: "packs",
        created_at: new Date('2026-02-20T10:00:00Z'),
        updated_at: new Date('2026-02-20T10:00:00Z')
      }
    ];
    this.products.push(...products);

    // Seed Demo Customer Ledgers / Udhaar
    const ledgers = [
      {
        id: this.ledgerSeq++,
        merchant_id: merchant.id,
        customer_id: customers[0].id, // Alex Rivera
        transaction_type: 'GIVEN',
        amount: 45.00,
        notes: '2x Ethiopian beans & bakery box on credit',
        due_date: '2026-11-20',
        status: 'PENDING',
        created_at: new Date(Date.now() - 3600 * 1000 * 72)
      },
      {
        id: this.ledgerSeq++,
        merchant_id: merchant.id,
        customer_id: customers[1].id, // Emily Watson
        transaction_type: 'GIVEN',
        amount: 25.00,
        notes: 'Breakfast sandwich & latte',
        due_date: '2026-11-10',
        status: 'SETTLED',
        created_at: new Date(Date.now() - 3600 * 1000 * 120)
      },
      {
        id: this.ledgerSeq++,
        merchant_id: merchant.id,
        customer_id: customers[1].id, // Emily Watson
        transaction_type: 'PAID',
        amount: 25.00,
        notes: 'Paid via UPI/Cash',
        due_date: null,
        status: 'SETTLED',
        created_at: new Date(Date.now() - 3600 * 1000 * 48)
      },
      {
        id: this.ledgerSeq++,
        merchant_id: merchant.id,
        customer_id: customers[2].id, // David Chen
        transaction_type: 'GIVEN',
        amount: 70.00,
        notes: 'Monthly coffee subscription renewal credit',
        due_date: '2026-11-25',
        status: 'PENDING',
        created_at: new Date(Date.now() - 3600 * 1000 * 24)
      },
      {
        id: this.ledgerSeq++,
        merchant_id: merchant.id,
        customer_id: customers[2].id, // David Chen
        transaction_type: 'PAID',
        amount: 30.00,
        notes: 'Part payment received',
        due_date: null,
        status: 'SETTLED',
        created_at: new Date(Date.now() - 3600 * 1000 * 4)
      }
    ];
    this.customer_ledgers.push(...ledgers);

    // Seed Expenses
    const expenses = [
      {
        id: this.expenseSeq++,
        merchant_id: merchant.id,
        title: "Monthly Roastery Space Rent",
        category: "Rent",
        amount: 850.00,
        expense_date: new Date(Date.now() - 3600 * 1000 * 24 * 12).toISOString().split('T')[0],
        payment_method: "Bank Transfer",
        notes: "Downtown retail space rent",
        created_at: new Date()
      },
      {
        id: this.expenseSeq++,
        merchant_id: merchant.id,
        title: "Specialty Green Coffee Bean Sacks",
        category: "Inventory",
        amount: 320.00,
        expense_date: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString().split('T')[0],
        payment_method: "Card",
        notes: "60kg raw green beans from importer",
        created_at: new Date()
      },
      {
        id: this.expenseSeq++,
        merchant_id: merchant.id,
        title: "Electricity & Roaster Gas Bill",
        category: "Utilities",
        amount: 115.00,
        expense_date: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString().split('T')[0],
        payment_method: "UPI",
        notes: "Commercial power utilities",
        created_at: new Date()
      },
      {
        id: this.expenseSeq++,
        merchant_id: merchant.id,
        title: "Espresso Machine Tune-up & Filters",
        category: "Maintenance",
        amount: 65.00,
        expense_date: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString().split('T')[0],
        payment_method: "Cash",
        notes: "Gasket & grouphead filter replacement",
        created_at: new Date()
      }
    ];
    this.expenses.push(...expenses);

    // Seed Staff
    const staffMembers = [
      {
        id: this.staffSeq++,
        merchant_id: merchant.id,
        name: "Marcus Brody",
        role: "Head Barista",
        phone: "+1-555-0811",
        monthly_salary: 2800.00,
        joining_date: "2025-06-01",
        is_active: true,
        created_at: new Date()
      },
      {
        id: this.staffSeq++,
        merchant_id: merchant.id,
        name: "Jessica Lin",
        role: "Store Cashier & Lead",
        phone: "+1-555-0822",
        monthly_salary: 2200.00,
        joining_date: "2025-08-15",
        is_active: true,
        created_at: new Date()
      },
      {
        id: this.staffSeq++,
        merchant_id: merchant.id,
        name: "Carlos Mendez",
        role: "Roastery Assistant",
        phone: "+1-555-0833",
        monthly_salary: 1900.00,
        joining_date: "2026-01-10",
        is_active: true,
        created_at: new Date()
      }
    ];
    this.staff.push(...staffMembers);

    // Seed Staff Attendance for Today
    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceRecords = [
      {
        id: this.attendanceSeq++,
        merchant_id: merchant.id,
        staff_id: staffMembers[0].id,
        attendance_date: todayStr,
        status: "PRESENT",
        check_in_time: "07:45 AM",
        notes: "Opened morning shift",
        created_at: new Date()
      },
      {
        id: this.attendanceSeq++,
        merchant_id: merchant.id,
        staff_id: staffMembers[1].id,
        attendance_date: todayStr,
        status: "PRESENT",
        check_in_time: "08:30 AM",
        notes: "POS register on duty",
        created_at: new Date()
      },
      {
        id: this.attendanceSeq++,
        merchant_id: merchant.id,
        staff_id: staffMembers[2].id,
        attendance_date: todayStr,
        status: "HALF_DAY",
        check_in_time: "12:00 PM",
        notes: "Afternoon bean packing shift",
        created_at: new Date()
      }
    ];
    this.staff_attendance.push(...attendanceRecords);

    // Seed WhatsApp Campaigns
    const campaigns = [
      {
        id: this.campaignSeq++,
        merchant_id: merchant.id,
        campaign_name: "Weekend Espresso Festival Broadcast",
        target_audience: "ALL",
        message_template: "Hey {customer_name}! Enjoy our Weekend Special at {store_name}: 20% off all pour-over specials and bean bags! Show this message at checkout.",
        discount_offer: "20% OFF Beans",
        status: "SENT",
        sent_count: 4,
        created_at: new Date(Date.now() - 3600 * 1000 * 48)
      },
      {
        id: this.campaignSeq++,
        merchant_id: merchant.id,
        campaign_name: "VIP Connoisseur Tasting Invitation",
        target_audience: "ACTIVE_MEMBERS",
        message_template: "Dear {customer_name}, as a valued loyalty member of {store_name}, your complimentary private tasting pass is ready this Friday evening!",
        discount_offer: "Free Tasting Pass",
        status: "SENT",
        sent_count: 3,
        created_at: new Date(Date.now() - 3600 * 1000 * 24)
      }
    ];
    this.whatsapp_campaigns.push(...campaigns);

    // Seed Suppliers
    const suppliers = [
      {
        id: this.supplierSeq++,
        merchant_id: merchant.id,
        name: "Andean Specialty Beans Co.",
        contact_person: "Mateo Vargas",
        phone: "+1-555-7711",
        email: "orders@andeanbeans.com",
        address: "450 Export Way, Miami, FL",
        gst_or_tax_id: "US-TAX-89211",
        payment_terms: "Net 30",
        is_active: true,
        created_at: new Date()
      },
      {
        id: this.supplierSeq++,
        merchant_id: merchant.id,
        name: "Barista Gear & Dairy Supplies",
        contact_person: "Rachel Green",
        phone: "+1-555-7722",
        email: "supplies@baristagear.com",
        address: "120 Logistics Blvd, Chicago, IL",
        gst_or_tax_id: "US-TAX-44102",
        payment_terms: "Net 15",
        is_active: true,
        created_at: new Date()
      }
    ];
    this.suppliers.push(...suppliers);

    // Seed Purchase Orders & Items
    const po1 = {
      id: this.poSeq++,
      merchant_id: merchant.id,
      supplier_id: suppliers[0].id,
      po_number: "PO-202611-001",
      status: "RECEIVED",
      total_amount: 450.00,
      order_date: new Date(Date.now() - 3600 * 1000 * 24 * 6).toISOString().split('T')[0],
      expected_delivery_date: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString().split('T')[0],
      received_date: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString().split('T')[0],
      notes: "Monthly specialty roast stock",
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 6)
    };
    this.purchase_orders.push(po1);

    const po1Items = [
      {
        id: this.poItemSeq++,
        purchase_order_id: po1.id,
        product_id: 1,
        item_name: "Ethiopian Yirgacheffe Single Origin 1kg",
        quantity: 25,
        unit_cost: 12.00,
        subtotal: 300.00,
        created_at: new Date()
      },
      {
        id: this.poItemSeq++,
        purchase_order_id: po1.id,
        product_id: 2,
        item_name: "Colombia Supremo Dark Roast 500g",
        quantity: 15,
        unit_cost: 10.00,
        subtotal: 150.00,
        created_at: new Date()
      }
    ];
    this.purchase_order_items.push(...po1Items);

    const po2 = {
      id: this.poSeq++,
      merchant_id: merchant.id,
      supplier_id: suppliers[1].id,
      po_number: "PO-202611-002",
      status: "SENT",
      total_amount: 280.00,
      order_date: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString().split('T')[0],
      expected_delivery_date: new Date(Date.now() + 3600 * 1000 * 24 * 3).toISOString().split('T')[0],
      received_date: null,
      notes: "Restock milk frothers and double wall tumblers",
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 1)
    };
    this.purchase_orders.push(po2);

    const po2Items = [
      {
        id: this.poItemSeq++,
        purchase_order_id: po2.id,
        product_id: 5,
        item_name: "Double-Walled Glass Tumbler 16oz",
        quantity: 20,
        unit_cost: 7.00,
        subtotal: 140.00,
        created_at: new Date()
      },
      {
        id: this.poItemSeq++,
        purchase_order_id: po2.id,
        product_id: 6,
        item_name: "Stainless Steel Milk Frothing Pitcher",
        quantity: 14,
        unit_cost: 10.00,
        subtotal: 140.00,
        created_at: new Date()
      }
    ];
    this.purchase_order_items.push(...po2Items);

    // Seed Supplier Ledgers
    const supplierLedgers = [
      {
        id: this.supplierLedgerSeq++,
        merchant_id: merchant.id,
        supplier_id: suppliers[0].id,
        purchase_order_id: po1.id,
        transaction_type: "BILL",
        amount: 450.00,
        notes: "Invoice for Andean Beans shipment",
        reference_no: "PO-202611-001",
        payment_date: new Date(Date.now() - 3600 * 1000 * 24 * 6).toISOString().split('T')[0],
        payment_method: "BANK_TRANSFER",
        status: "PENDING",
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 6)
      },
      {
        id: this.supplierLedgerSeq++,
        merchant_id: merchant.id,
        supplier_id: suppliers[0].id,
        purchase_order_id: null,
        transaction_type: "PAYMENT",
        amount: 250.00,
        notes: "Partial wire payment against PO-202611-001",
        reference_no: "TXN-BNK-9811",
        payment_date: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString().split('T')[0],
        payment_method: "BANK_TRANSFER",
        status: "SETTLED",
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 1)
      },
      {
        id: this.supplierLedgerSeq++,
        merchant_id: merchant.id,
        supplier_id: suppliers[1].id,
        purchase_order_id: po2.id,
        transaction_type: "BILL",
        amount: 280.00,
        notes: "Invoice for Barista Gear order",
        reference_no: "PO-202611-002",
        payment_date: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString().split('T')[0],
        payment_method: "BANK_TRANSFER",
        status: "PENDING",
        created_at: new Date(Date.now() - 3600 * 1000 * 24 * 1)
      }
    ];
    this.supplier_ledgers.push(...supplierLedgers);

    // Seed Debtor Call Logs
    const callLogs = [
      {
        id: this.callLogSeq++,
        merchant_id: merchant.id,
        customer_id: customers[0].id, // Alex Rivera
        call_sid: "CALL-VOICE-8811",
        call_status: "COMPLETED",
        intent: "PROMISE_TO_PAY",
        transcript: "AI: Hello Alex, this is Artisan Coffee calling regarding your balance. Alex: I will be there this Friday to pay the $45. AI: Perfect, noted for Friday!",
        summary: "Customer promised to pay $45 balance on Friday.",
        promised_date: new Date(Date.now() + 3600 * 1000 * 24 * 4).toISOString().split('T')[0],
        callback_scheduled_at: null,
        payment_link_sent: false,
        payment_link_url: null,
        upi_intent_string: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 6)
      },
      {
        id: this.callLogSeq++,
        merchant_id: merchant.id,
        customer_id: customers[2].id, // David Chen
        call_sid: "CALL-VOICE-8822",
        call_status: "COMPLETED",
        intent: "REQUEST_PAYMENT_LINK",
        transcript: "AI: Hello David, calling regarding your $40 coffee subscription ledger. David: Can you send me a UPI payment link on WhatsApp? AI: Dispatching your UPI link right now via WhatsApp!",
        summary: "Debtor requested WhatsApp UPI payment link.",
        promised_date: null,
        callback_scheduled_at: null,
        payment_link_sent: true,
        payment_link_url: "https://pay.loyaltyhub.app/upi?pa=artisan@upi&am=40.00",
        upi_intent_string: "upi://pay?pa=artisan@upi&pn=Artisan%20Coffee&am=40.00&cu=INR&tn=Khata-Settlement-3",
        created_at: new Date(Date.now() - 3600 * 1000 * 3)
      },
      {
        id: this.callLogSeq++,
        merchant_id: merchant.id,
        customer_id: customers[1].id, // Emily Watson
        call_sid: "CALL-VOICE-8833",
        call_status: "COMPLETED",
        intent: "REQUEST_CALLBACK",
        transcript: "AI: Hi Emily, calling from Artisan Coffee. Emily: I am in a work meeting right now, please call me tomorrow morning. AI: Scheduled a callback for tomorrow at 11 AM.",
        summary: "Debtor requested callback tomorrow morning due to busy schedule.",
        promised_date: null,
        callback_scheduled_at: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
        payment_link_sent: false,
        payment_link_url: null,
        upi_intent_string: null,
        created_at: new Date(Date.now() - 3600 * 1000 * 1)
      }
    ];
    this.debtor_call_logs.push(...callLogs);
  }
}

export const memoryStore = new MemoryStore();

/**
 * Universal query runner:
 * Executes on real Neon PostgreSQL if DATABASE_URL is reachable.
 * Automatically falls back to in-memory store if DATABASE_URL is not set or times out.
 */
export const query = async (text, params = []) => {
  if (pool && !useFallback) {
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'production') {
        // console.log('[DB Query]', { text: text.slice(0, 80), duration, rows: res.rowCount });
      }
      return res;
    } catch (err) {
      console.warn('[PostgreSQL Pool Query Failed - falling back to memory store]:', err.message);
      useFallback = true;
    }
  }

  // Fallback in-memory handler for seamless offline / zero-config demo
  return executeMemoryQuery(text, params);
};

function executeMemoryQuery(text, params) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // 1. SELECT * FROM merchants WHERE email = $1
  if (normalized.includes('FROM merchants WHERE email = $1')) {
    const email = params[0]?.toLowerCase().trim();
    const rows = memoryStore.merchants.filter(m => m.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  // 2. SELECT * FROM merchants WHERE id = $1
  if (normalized.includes('FROM merchants WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    const rows = memoryStore.merchants.filter(m => m.id === id);
    return { rows, rowCount: rows.length };
  }

  // 3. INSERT INTO merchants
  if (normalized.startsWith('INSERT INTO merchants')) {
    const [store_name, owner_name, category, phone, email, password_hash, address, city] = params;
    const newMerchant = {
      id: memoryStore.merchantSeq++,
      store_name,
      owner_name,
      category: category || 'Retail',
      phone,
      email: email.toLowerCase(),
      password_hash,
      address: address || '',
      city: city || '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.merchants.push(newMerchant);
    return { rows: [newMerchant], rowCount: 1 };
  }

  // 4. UPDATE merchants SET
  if (normalized.startsWith('UPDATE merchants SET')) {
    const [store_name, owner_name, category, phone, address, city, id] = params;
    const merchant = memoryStore.merchants.find(m => m.id === parseInt(id, 10));
    if (merchant) {
      merchant.store_name = store_name;
      merchant.owner_name = owner_name;
      merchant.category = category;
      merchant.phone = phone;
      merchant.address = address;
      merchant.city = city;
      merchant.updated_at = new Date();
      return { rows: [merchant], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 5. Membership Plans: SELECT * FROM membership_plans WHERE merchant_id = $1
  if (normalized.includes('FROM membership_plans WHERE merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.membership_plans
      .filter(p => p.merchant_id === merchant_id && p.is_active !== false)
      .sort((a, b) => a.id - b.id);
    return { rows, rowCount: rows.length };
  }

  // Customers simple list: SELECT id, name, phone FROM customers WHERE merchant_id = $1
  if (normalized.includes('FROM customers WHERE merchant_id = $1') && !normalized.includes('phone =')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.customers
      .filter(c => c.merchant_id === merchant_id)
      .map(c => ({ id: c.id, name: c.name, phone: c.phone, birthday: c.birthday, anniversary: c.anniversary }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { rows, rowCount: rows.length };
  }

  // 6. INSERT INTO membership_plans
  if (normalized.startsWith('INSERT INTO membership_plans')) {
    const [merchant_id, plan_name, price, validity_months, discount_percent, benefits_description] = params;
    const newPlan = {
      id: memoryStore.planSeq++,
      merchant_id: parseInt(merchant_id, 10),
      plan_name,
      price: parseFloat(price) || 0,
      validity_months: parseInt(validity_months, 10) || 12,
      discount_percent: parseFloat(discount_percent) || 10,
      benefits_description: benefits_description || '',
      is_active: true,
      created_at: new Date()
    };
    memoryStore.membership_plans.push(newPlan);
    return { rows: [newPlan], rowCount: 1 };
  }

  // 7. UPDATE membership_plans
  if (normalized.startsWith('UPDATE membership_plans SET')) {
    const [plan_name, price, validity_months, discount_percent, benefits_description, id, merchant_id] = params;
    const plan = memoryStore.membership_plans.find(p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10));
    if (plan) {
      plan.plan_name = plan_name;
      plan.price = parseFloat(price);
      plan.validity_months = parseInt(validity_months, 10);
      plan.discount_percent = parseFloat(discount_percent);
      plan.benefits_description = benefits_description;
      return { rows: [plan], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 8. DELETE FROM membership_plans
  if (normalized.startsWith('DELETE FROM membership_plans WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const initialLen = memoryStore.membership_plans.length;
    memoryStore.membership_plans = memoryStore.membership_plans.filter(
      p => !(p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10))
    );
    const deleted = initialLen - memoryStore.membership_plans.length;
    return { rows: [], rowCount: deleted };
  }

  // POS Lookup by Phone (Check this before generic customers list)
  if (normalized.includes('POS_CUSTOMER_LOOKUP') || (normalized.includes('FROM customers c') && normalized.includes('c.phone = $2'))) {
    const merchant_id = parseInt(params[0], 10);
    const searchPhone = String(params[1]).replace(/\D/g, '');
    const today = new Date().toISOString().split('T')[0];

    const customer = memoryStore.customers.find(
      c => c.merchant_id === merchant_id && String(c.phone).replace(/\D/g, '') === searchPhone
    );

    if (!customer) {
      return { rows: [], rowCount: 0 };
    }

    const membership = memoryStore.customer_memberships.find(
      m => m.customer_id === customer.id && m.status === 'ACTIVE' && m.expiry_date >= today
    );

    const plan = membership ? memoryStore.membership_plans.find(p => p.id === membership.plan_id) : null;

    const row = {
      customer_id: customer.id,
      name: customer.name,
      phone: customer.phone,
      birthday: customer.birthday,
      anniversary: customer.anniversary,
      membership_id: membership ? membership.id : null,
      membership_status: membership ? membership.status : 'NO_MEMBERSHIP',
      start_date: membership ? membership.start_date : null,
      expiry_date: membership ? membership.expiry_date : null,
      plan_id: plan ? plan.id : null,
      plan_name: plan ? plan.plan_name : null,
      discount_percent: plan ? parseFloat(plan.discount_percent) : 0,
      benefits_description: plan ? plan.benefits_description : 'No active membership benefits'
    };

    return { rows: [row], rowCount: 1 };
  }

  // 9. Customers List with Membership Details
  if (normalized.includes('FROM customers c') && normalized.includes('WHERE c.merchant_id = $1') && !normalized.includes('c.phone = $2')) {
    const merchant_id = parseInt(params[0], 10);
    const today = new Date().toISOString().split('T')[0];

    const merchantCustomers = memoryStore.customers.filter(c => c.merchant_id === merchant_id);
    const rows = merchantCustomers.map(cust => {
      // Find active membership
      const membership = memoryStore.customer_memberships.find(
        m => m.customer_id === cust.id && m.status === 'ACTIVE' && m.expiry_date >= today
      );
      const plan = membership ? memoryStore.membership_plans.find(p => p.id === membership.plan_id) : null;

      return {
        ...cust,
        membership_id: membership ? membership.id : null,
        membership_status: membership ? membership.status : 'NO_MEMBERSHIP',
        start_date: membership ? membership.start_date : null,
        expiry_date: membership ? membership.expiry_date : null,
        plan_id: plan ? plan.id : null,
        plan_name: plan ? plan.plan_name : null,
        discount_percent: plan ? plan.discount_percent : 0,
        benefits_description: plan ? plan.benefits_description : null
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { rows, rowCount: rows.length };
  }

  // 10. Check customer phone exists for merchant: SELECT * FROM customers WHERE merchant_id = $1 AND phone = $2
  if (normalized.includes('FROM customers WHERE merchant_id = $1 AND phone = $2')) {
    const [merchant_id, phone] = params;
    const cleanPhone = String(phone).replace(/\D/g, '');
    const rows = memoryStore.customers.filter(
      c => c.merchant_id === parseInt(merchant_id, 10) &&
           String(c.phone).replace(/\D/g, '') === cleanPhone
    );
    return { rows, rowCount: rows.length };
  }

  // 11. INSERT INTO customers
  if (normalized.startsWith('INSERT INTO customers')) {
    const [merchant_id, name, phone, birthday, anniversary] = params;
    const newCust = {
      id: memoryStore.customerSeq++,
      merchant_id: parseInt(merchant_id, 10),
      name,
      phone: String(phone).trim(),
      birthday: birthday || null,
      anniversary: anniversary || null,
      created_at: new Date()
    };
    memoryStore.customers.push(newCust);
    return { rows: [newCust], rowCount: 1 };
  }

  // 12. UPDATE customers
  if (normalized.startsWith('UPDATE customers SET')) {
    const [name, phone, birthday, anniversary, id, merchant_id] = params;
    const cust = memoryStore.customers.find(
      c => c.id === parseInt(id, 10) && c.merchant_id === parseInt(merchant_id, 10)
    );
    if (cust) {
      cust.name = name;
      cust.phone = phone;
      cust.birthday = birthday || null;
      cust.anniversary = anniversary || null;
      return { rows: [cust], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 13. DELETE FROM customers
  if (normalized.startsWith('DELETE FROM customers WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const cId = parseInt(id, 10);
    const mId = parseInt(merchant_id, 10);
    const initLen = memoryStore.customers.length;
    memoryStore.customers = memoryStore.customers.filter(c => !(c.id === cId && c.merchant_id === mId));
    memoryStore.customer_memberships = memoryStore.customer_memberships.filter(m => m.customer_id !== cId);
    return { rows: [], rowCount: initLen - memoryStore.customers.length };
  }

  // 14. Customer Memberships: INSERT INTO customer_memberships
  if (normalized.startsWith('INSERT INTO customer_memberships')) {
    const [customer_id, plan_id, start_date, expiry_date, status] = params;
    // Mark previous active memberships for this customer as CANCELLED or EXPIRED
    memoryStore.customer_memberships.forEach(m => {
      if (m.customer_id === parseInt(customer_id, 10) && m.status === 'ACTIVE') {
        m.status = 'EXPIRED';
      }
    });

    const newMembership = {
      id: memoryStore.membershipSeq++,
      customer_id: parseInt(customer_id, 10),
      plan_id: parseInt(plan_id, 10),
      start_date: start_date || new Date().toISOString().split('T')[0],
      expiry_date: expiry_date,
      status: status || 'ACTIVE',
      created_at: new Date()
    };
    memoryStore.customer_memberships.push(newMembership);
    return { rows: [newMembership], rowCount: 1 };
  }

  // 15. POS Lookup by Phone:
  // SELECT c.id as customer_id ... WHERE c.merchant_id = $1 AND (c.phone = $2 OR ...)
  if (normalized.includes('POS_CUSTOMER_LOOKUP') || (normalized.includes('FROM customers c') && normalized.includes('WHERE c.merchant_id = $1 AND') && normalized.includes('phone'))) {
    const merchant_id = parseInt(params[0], 10);
    const searchPhone = String(params[1]).replace(/\D/g, '');
    const today = new Date().toISOString().split('T')[0];

    const customer = memoryStore.customers.find(
      c => c.merchant_id === merchant_id && String(c.phone).replace(/\D/g, '') === searchPhone
    );

    if (!customer) {
      return { rows: [], rowCount: 0 };
    }

    const membership = memoryStore.customer_memberships.find(
      m => m.customer_id === customer.id && m.status === 'ACTIVE' && m.expiry_date >= today
    );

    const plan = membership ? memoryStore.membership_plans.find(p => p.id === membership.plan_id) : null;

    const row = {
      customer_id: customer.id,
      name: customer.name,
      phone: customer.phone,
      birthday: customer.birthday,
      anniversary: customer.anniversary,
      membership_id: membership ? membership.id : null,
      membership_status: membership ? membership.status : 'NO_MEMBERSHIP',
      start_date: membership ? membership.start_date : null,
      expiry_date: membership ? membership.expiry_date : null,
      plan_id: plan ? plan.id : null,
      plan_name: plan ? plan.plan_name : null,
      discount_percent: plan ? parseFloat(plan.discount_percent) : 0,
      benefits_description: plan ? plan.benefits_description : 'No active membership benefits'
    };

    return { rows: [row], rowCount: 1 };
  }

  // 16. Redemptions: INSERT INTO redemptions
  if (normalized.startsWith('INSERT INTO redemptions')) {
    const [merchant_id, customer_id, bill_amount, discount_given] = params;
    const newRedemption = {
      id: memoryStore.redemptionSeq++,
      merchant_id: parseInt(merchant_id, 10),
      customer_id: parseInt(customer_id, 10),
      bill_amount: parseFloat(bill_amount),
      discount_given: parseFloat(discount_given),
      redeemed_at: new Date()
    };
    memoryStore.redemptions.push(newRedemption);
    return { rows: [newRedemption], rowCount: 1 };
  }

  // 17. Redemptions List for Merchant:
  if (normalized.includes('FROM redemptions r') && normalized.includes('WHERE r.merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const limit = params[1] ? parseInt(params[1], 10) : 50;
    const rows = memoryStore.redemptions
      .filter(r => r.merchant_id === merchant_id)
      .map(r => {
        const cust = memoryStore.customers.find(c => c.id === r.customer_id);
        return {
          ...r,
          customer_name: cust ? cust.name : 'Unknown Customer',
          customer_phone: cust ? cust.phone : 'N/A'
        };
      })
      .sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at))
      .slice(0, limit);

    return { rows, rowCount: rows.length };
  }

  // 18. Analytics / Dashboard summary
  if (normalized.includes('ANALYTICS_SUMMARY') || (normalized.includes('SELECT') && normalized.includes('redemptions') && normalized.includes('COUNT('))) {
    const merchant_id = parseInt(params[0], 10);
    const today = new Date().toISOString().split('T')[0];

    const merchantRedemptions = memoryStore.redemptions.filter(r => r.merchant_id === merchant_id);
    const totalSales = merchantRedemptions.reduce((acc, r) => acc + parseFloat(r.bill_amount), 0);
    const totalDiscounts = merchantRedemptions.reduce((acc, r) => acc + parseFloat(r.discount_given), 0);
    const redemptionsCount = merchantRedemptions.length;

    const merchantCustomers = memoryStore.customers.filter(c => c.merchant_id === merchant_id);
    const totalCustomers = merchantCustomers.length;

    const activeMembers = merchantCustomers.filter(c => {
      return memoryStore.customer_memberships.some(
        m => m.customer_id === c.id && m.status === 'ACTIVE' && m.expiry_date >= today
      );
    }).length;

    const summary = {
      total_sales: totalSales.toFixed(2),
      total_discounts: totalDiscounts.toFixed(2),
      redemptions_count: redemptionsCount,
      total_customers: totalCustomers,
      active_members: activeMembers
    };

    return { rows: [summary], rowCount: 1 };
  }

  // 19. SELECT id, name, phone FROM customers WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('FROM customers WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const rows = memoryStore.customers.filter(
      c => c.id === parseInt(id, 10) && c.merchant_id === parseInt(merchant_id, 10)
    );
    return { rows, rowCount: rows.length };
  }

  // 20. Fetch active membership for customer: FROM customer_memberships cm JOIN membership_plans mp
  if (normalized.includes('FROM customer_memberships cm') && normalized.includes('JOIN membership_plans mp') && normalized.includes('WHERE cm.customer_id = $1')) {
    const customer_id = parseInt(params[0], 10);
    const today = new Date().toISOString().split('T')[0];

    const membership = memoryStore.customer_memberships.find(
      m => m.customer_id === customer_id && m.status === 'ACTIVE' && m.expiry_date >= today
    );

    if (!membership) {
      return { rows: [], rowCount: 0 };
    }

    const plan = memoryStore.membership_plans.find(p => p.id === membership.plan_id);
    const row = {
      id: membership.id,
      status: membership.status,
      expiry_date: membership.expiry_date,
      plan_name: plan ? plan.plan_name : 'Unknown Plan',
      discount_percent: plan ? plan.discount_percent : 0
    };

    return { rows: [row], rowCount: 1 };
  }

  // 21. Total customers count
  if (normalized.includes('COUNT(id) as total_customers FROM customers WHERE merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const count = memoryStore.customers.filter(c => c.merchant_id === merchant_id).length;
    return { rows: [{ total_customers: count }], rowCount: 1 };
  }

  // 22. Active members count
  if (normalized.includes('COUNT(DISTINCT cm.customer_id) as active_members')) {
    const merchant_id = parseInt(params[0], 10);
    const today = new Date().toISOString().split('T')[0];
    const merchantCustomers = memoryStore.customers.filter(c => c.merchant_id === merchant_id);
    const activeCount = merchantCustomers.filter(c => {
      return memoryStore.customer_memberships.some(
        m => m.customer_id === c.id && m.status === 'ACTIVE' && m.expiry_date >= today
      );
    }).length;
    return { rows: [{ active_members: activeCount }], rowCount: 1 };
  }

  // 23. Find plan by id and merchant: FROM membership_plans WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('FROM membership_plans WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const rows = memoryStore.membership_plans.filter(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    return { rows, rowCount: rows.length };
  }

  // 24. Deactivate prior active memberships: UPDATE customer_memberships SET status = 'EXPIRED'
  if (normalized.startsWith("UPDATE customer_memberships SET status = 'EXPIRED'")) {
    const customer_id = parseInt(params[0], 10);
    memoryStore.customer_memberships.forEach(m => {
      if (m.customer_id === customer_id && m.status === 'ACTIVE') {
        m.status = 'EXPIRED';
      }
    });
    return { rows: [], rowCount: 1 };
  }

  // 25. Low-stock products query: SELECT * FROM products WHERE merchant_id = $1 AND stock_quantity <= low_stock_threshold
  if (normalized.includes('FROM products') && normalized.includes('stock_quantity <= low_stock_threshold')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.products
      .filter(p => p.merchant_id === merchant_id && p.stock_quantity <= p.low_stock_threshold)
      .sort((a, b) => a.stock_quantity - b.stock_quantity);
    return { rows, rowCount: rows.length };
  }

  // 26. All products query: SELECT * FROM products WHERE merchant_id = $1
  if (normalized.includes('FROM products') && normalized.includes('WHERE merchant_id = $1') && !normalized.includes('stock_quantity <=')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.products
      .filter(p => p.merchant_id === merchant_id)
      .sort((a, b) => b.id - a.id);
    return { rows, rowCount: rows.length };
  }

  // 27. Single product by id: SELECT * FROM products WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('FROM products WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const rows = memoryStore.products.filter(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    return { rows, rowCount: rows.length };
  }

  // 28. INSERT INTO products
  if (normalized.startsWith('INSERT INTO products')) {
    const [merchant_id, product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit] = params;
    const newProduct = {
      id: memoryStore.productSeq++,
      merchant_id: parseInt(merchant_id, 10),
      product_name,
      sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
      category: category ? category.trim() : 'General',
      purchase_price: parseFloat(purchase_price) || 0,
      selling_price: parseFloat(selling_price) || 0,
      stock_quantity: parseInt(stock_quantity, 10) || 0,
      low_stock_threshold: parseInt(low_stock_threshold, 10) || 5,
      unit: unit ? unit.trim() : 'pcs',
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.products.push(newProduct);
    return { rows: [newProduct], rowCount: 1 };
  }

  // 29a. Increment Stock Quantity: UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND merchant_id = $3
  if (normalized.includes('UPDATE products SET stock_quantity = stock_quantity +')) {
    const [qty, id, merchant_id] = params;
    const prod = memoryStore.products.find(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    if (prod) {
      prod.stock_quantity = (prod.stock_quantity || 0) + parseInt(qty, 10);
      prod.updated_at = new Date();
      return { rows: [prod], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 29b. General UPDATE products SET
  if (normalized.startsWith('UPDATE products SET') && !normalized.includes('stock_quantity = stock_quantity +')) {
    const [product_name, sku, category, purchase_price, selling_price, stock_quantity, low_stock_threshold, unit, id, merchant_id] = params;
    const product = memoryStore.products.find(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    if (product) {
      if (product_name !== undefined) product.product_name = product_name;
      if (sku !== undefined) product.sku = sku;
      if (category !== undefined) product.category = category;
      if (purchase_price !== undefined) product.purchase_price = parseFloat(purchase_price);
      if (selling_price !== undefined) product.selling_price = parseFloat(selling_price);
      if (stock_quantity !== undefined) product.stock_quantity = parseInt(stock_quantity, 10);
      if (low_stock_threshold !== undefined) product.low_stock_threshold = parseInt(low_stock_threshold, 10);
      if (unit !== undefined) product.unit = unit;
      product.updated_at = new Date();
      return { rows: [product], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 30. DELETE FROM products WHERE id = $1 AND merchant_id = $2
  if (normalized.startsWith('DELETE FROM products WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const initialLen = memoryStore.products.length;
    memoryStore.products = memoryStore.products.filter(
      p => !(p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10))
    );
    return { rows: [], rowCount: initialLen - memoryStore.products.length };
  }

  // 31a. Customer Ledger: WHERE customer_id = $1 AND merchant_id = $2
  if (normalized.includes('FROM customer_ledgers') && normalized.includes('WHERE customer_id = $1 AND merchant_id = $2')) {
    const [customer_id, merchant_id] = params;
    const rows = memoryStore.customer_ledgers
      .filter(l => l.merchant_id === parseInt(merchant_id, 10) && l.customer_id === parseInt(customer_id, 10))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  // 31. Customer Ledger: Specific Customer History
  if (normalized.includes('FROM customer_ledgers cl') && (normalized.includes('cl.customer_id = $2') || normalized.includes('customer_id = $2'))) {
    const [merchant_id, customer_id] = params;
    const rows = memoryStore.customer_ledgers
      .filter(l => l.merchant_id === parseInt(merchant_id, 10) && l.customer_id === parseInt(customer_id, 10))
      .map(l => {
        const cust = memoryStore.customers.find(c => c.id === l.customer_id);
        return {
          ...l,
          customer_name: cust ? cust.name : 'Unknown',
          customer_phone: cust ? cust.phone : ''
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  // 32. Customer Ledgers List for Merchant (All transactions or aggregated)
  if (normalized.includes('FROM customer_ledgers cl') && normalized.includes('cl.merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.customer_ledgers
      .filter(l => l.merchant_id === merchant_id)
      .map(l => {
        const cust = memoryStore.customers.find(c => c.id === l.customer_id);
        return {
          ...l,
          customer_name: cust ? cust.name : 'Unknown',
          customer_phone: cust ? cust.phone : ''
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  // 33. INSERT INTO customer_ledgers
  if (normalized.startsWith('INSERT INTO customer_ledgers')) {
    const [merchant_id, customer_id, transaction_type, amount, notes, due_date, status] = params;
    const newEntry = {
      id: memoryStore.ledgerSeq++,
      merchant_id: parseInt(merchant_id, 10),
      customer_id: parseInt(customer_id, 10),
      transaction_type: transaction_type.toUpperCase(),
      amount: parseFloat(amount),
      notes: notes || '',
      due_date: due_date || null,
      status: status || (transaction_type.toUpperCase() === 'PAID' ? 'SETTLED' : 'PENDING'),
      created_at: new Date()
    };
    memoryStore.customer_ledgers.push(newEntry);
    return { rows: [newEntry], rowCount: 1 };
  }

  // 34. UPDATE customer_ledgers SET status = 'SETTLED' WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('UPDATE customer_ledgers SET status') || (normalized.startsWith('UPDATE customer_ledgers') && normalized.includes('SETTLED'))) {
    const [id, merchant_id] = params;
    const entry = memoryStore.customer_ledgers.find(
      l => l.id === parseInt(id, 10) && l.merchant_id === parseInt(merchant_id, 10)
    );
    if (entry) {
      entry.status = 'SETTLED';
      return { rows: [entry], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 35. Expenses: SELECT * FROM expenses WHERE merchant_id = $1
  if (normalized.includes('FROM expenses') && normalized.includes('WHERE merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.expenses
      .filter(e => e.merchant_id === merchant_id)
      .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
    return { rows, rowCount: rows.length };
  }

  // 36. INSERT INTO expenses
  if (normalized.startsWith('INSERT INTO expenses')) {
    const [merchant_id, title, category, amount, expense_date, payment_method, notes] = params;
    const newExpense = {
      id: memoryStore.expenseSeq++,
      merchant_id: parseInt(merchant_id, 10),
      title: title ? title.trim() : 'Expense',
      category: category ? category.trim() : 'General',
      amount: parseFloat(amount) || 0,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      payment_method: payment_method ? payment_method.trim() : 'Cash',
      notes: notes ? notes.trim() : '',
      created_at: new Date()
    };
    memoryStore.expenses.push(newExpense);
    return { rows: [newExpense], rowCount: 1 };
  }

  // 37. DELETE FROM expenses WHERE id = $1 AND merchant_id = $2
  if (normalized.startsWith('DELETE FROM expenses WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const initLen = memoryStore.expenses.length;
    memoryStore.expenses = memoryStore.expenses.filter(
      e => !(e.id === parseInt(id, 10) && e.merchant_id === parseInt(merchant_id, 10))
    );
    return { rows: [], rowCount: initLen - memoryStore.expenses.length };
  }

  // Staff by id: SELECT id, name FROM staff WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('FROM staff WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const rows = memoryStore.staff.filter(
      s => s.id === parseInt(id, 10) && s.merchant_id === parseInt(merchant_id, 10)
    );
    return { rows, rowCount: rows.length };
  }

  // 38. Staff list: SELECT * FROM staff WHERE merchant_id = $1
  if (normalized.includes('FROM staff') && !normalized.includes('staff_attendance') && !normalized.includes('FROM staff WHERE id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.staff
      .filter(s => s.merchant_id === merchant_id)
      .sort((a, b) => a.id - b.id);
    return { rows, rowCount: rows.length };
  }

  // 39. INSERT INTO staff (note trailing space to avoid collision with staff_attendance)
  if (normalized.startsWith('INSERT INTO staff ') && !normalized.startsWith('INSERT INTO staff_attendance')) {
    const [merchant_id, name, role, phone, monthly_salary, joining_date, is_active] = params;
    const newStaff = {
      id: memoryStore.staffSeq++,
      merchant_id: parseInt(merchant_id, 10),
      name: name ? String(name).trim() : '',
      role: role ? String(role).trim() : 'Staff',
      phone: phone ? String(phone).trim() : '',
      monthly_salary: parseFloat(monthly_salary) || 0,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date()
    };
    memoryStore.staff.push(newStaff);
    return { rows: [newStaff], rowCount: 1 };
  }

  // 40. UPDATE staff SET
  if (normalized.startsWith('UPDATE staff SET')) {
    const [name, role, phone, monthly_salary, is_active, id, merchant_id] = params;
    const staffMember = memoryStore.staff.find(
      s => s.id === parseInt(id, 10) && s.merchant_id === parseInt(merchant_id, 10)
    );
    if (staffMember) {
      if (name !== undefined) staffMember.name = name.trim();
      if (role !== undefined) staffMember.role = role.trim();
      if (phone !== undefined) staffMember.phone = phone.trim();
      if (monthly_salary !== undefined) staffMember.monthly_salary = parseFloat(monthly_salary);
      if (is_active !== undefined) staffMember.is_active = Boolean(is_active);
      return { rows: [staffMember], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 41. DELETE FROM staff WHERE id = $1 AND merchant_id = $2
  if (normalized.startsWith('DELETE FROM staff WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const sId = parseInt(id, 10);
    const mId = parseInt(merchant_id, 10);
    const initLen = memoryStore.staff.length;
    memoryStore.staff = memoryStore.staff.filter(s => !(s.id === sId && s.merchant_id === mId));
    memoryStore.staff_attendance = memoryStore.staff_attendance.filter(a => a.staff_id !== sId);
    return { rows: [], rowCount: initLen - memoryStore.staff.length };
  }

  // 42. Staff Attendance: SELECT * FROM staff_attendance WHERE merchant_id = $1
  if (normalized.includes('FROM staff_attendance') && normalized.includes('WHERE merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const dateFilter = params[1] ? String(params[1]) : null;

    let rows = memoryStore.staff_attendance.filter(a => a.merchant_id === merchant_id);
    if (dateFilter) {
      rows = rows.filter(a => a.attendance_date === dateFilter);
    }
    return { rows, rowCount: rows.length };
  }

  // 43. INSERT INTO staff_attendance / ON CONFLICT UPDATE
  if (normalized.startsWith('INSERT INTO staff_attendance')) {
    const [merchant_id, staff_id, attendance_date, status, check_in_time, notes] = params;
    const sId = parseInt(staff_id, 10);
    const mId = parseInt(merchant_id, 10);
    const aDate = attendance_date || new Date().toISOString().split('T')[0];

    // Check if attendance for this staff & date exists
    let existing = memoryStore.staff_attendance.find(
      a => a.staff_id === sId && a.attendance_date === aDate
    );

    if (existing) {
      existing.status = status;
      if (check_in_time) existing.check_in_time = check_in_time;
      if (notes !== undefined) existing.notes = notes;
      return { rows: [existing], rowCount: 1 };
    }

    const newAttendance = {
      id: memoryStore.attendanceSeq++,
      merchant_id: mId,
      staff_id: sId,
      attendance_date: aDate,
      status: status || 'PRESENT',
      check_in_time: check_in_time || '09:00 AM',
      notes: notes || '',
      created_at: new Date()
    };
    memoryStore.staff_attendance.push(newAttendance);
    return { rows: [newAttendance], rowCount: 1 };
  }

  // 44. WhatsApp Campaigns: SELECT * FROM whatsapp_campaigns WHERE merchant_id = $1
  if (normalized.includes('FROM whatsapp_campaigns') && normalized.includes('WHERE merchant_id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.whatsapp_campaigns
      .filter(w => w.merchant_id === merchant_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  // 45. INSERT INTO whatsapp_campaigns
  if (normalized.startsWith('INSERT INTO whatsapp_campaigns')) {
    const [merchant_id, campaign_name, target_audience, message_template, discount_offer, status, sent_count] = params;
    const newCampaign = {
      id: memoryStore.campaignSeq++,
      merchant_id: parseInt(merchant_id, 10),
      campaign_name: campaign_name ? campaign_name.trim() : 'Campaign',
      target_audience: target_audience || 'ALL',
      message_template: message_template || '',
      discount_offer: discount_offer || '',
      status: status || 'SENT',
      sent_count: parseInt(sent_count, 10) || 0,
      created_at: new Date()
    };
    memoryStore.whatsapp_campaigns.push(newCampaign);
    return { rows: [newCampaign], rowCount: 1 };
  }

  // 46. Single Supplier by ID: SELECT * FROM suppliers WHERE id = $1 AND merchant_id = $2
  if (normalized.includes('FROM suppliers') && normalized.includes('WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const rows = memoryStore.suppliers.filter(
      s => s.id === parseInt(id, 10) && s.merchant_id === parseInt(merchant_id, 10)
    );
    return { rows, rowCount: rows.length };
  }

  // 47. Suppliers list with net_balance & po_count: SELECT s.* ... FROM suppliers s WHERE s.merchant_id = $1
  if (normalized.includes('FROM suppliers') && !normalized.includes('WHERE id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.suppliers
      .filter(s => s.merchant_id === merchant_id)
      .map(s => {
        const ledgers = memoryStore.supplier_ledgers.filter(
          sl => sl.supplier_id === s.id && sl.merchant_id === s.merchant_id
        );
        const billed = ledgers
          .filter(l => l.transaction_type === 'BILL')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        const paid = ledgers
          .filter(l => l.transaction_type === 'PAYMENT')
          .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
        const po_count = memoryStore.purchase_orders.filter(
          po => po.supplier_id === s.id && po.merchant_id === s.merchant_id
        ).length;

        return {
          ...s,
          net_balance: (billed - paid).toFixed(2),
          total_billed: billed.toFixed(2),
          total_paid: paid.toFixed(2),
          po_count: po_count
        };
      })
      .sort((a, b) => a.id - b.id);
    return { rows, rowCount: rows.length };
  }

  // 48. INSERT INTO suppliers
  if (normalized.startsWith('INSERT INTO suppliers')) {
    const [merchant_id, name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active] = params;
    const newSupplier = {
      id: memoryStore.supplierSeq++,
      merchant_id: parseInt(merchant_id, 10),
      name: name ? name.trim() : 'Supplier',
      contact_person: contact_person ? contact_person.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      gst_or_tax_id: gst_or_tax_id ? gst_or_tax_id.trim() : '',
      payment_terms: payment_terms ? payment_terms.trim() : 'Net 30',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at: new Date()
    };
    memoryStore.suppliers.push(newSupplier);
    return { rows: [newSupplier], rowCount: 1 };
  }

  // 49. UPDATE suppliers SET
  if (normalized.startsWith('UPDATE suppliers SET')) {
    const [name, contact_person, phone, email, address, gst_or_tax_id, payment_terms, is_active, id, merchant_id] = params;
    const sup = memoryStore.suppliers.find(
      s => s.id === parseInt(id, 10) && s.merchant_id === parseInt(merchant_id, 10)
    );
    if (sup) {
      if (name !== undefined) sup.name = name.trim();
      if (contact_person !== undefined) sup.contact_person = contact_person.trim();
      if (phone !== undefined) sup.phone = phone.trim();
      if (email !== undefined) sup.email = email.trim();
      if (address !== undefined) sup.address = address.trim();
      if (gst_or_tax_id !== undefined) sup.gst_or_tax_id = gst_or_tax_id.trim();
      if (payment_terms !== undefined) sup.payment_terms = payment_terms.trim();
      if (is_active !== undefined) sup.is_active = Boolean(is_active);
      return { rows: [sup], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 50. DELETE FROM suppliers WHERE id = $1 AND merchant_id = $2
  if (normalized.startsWith('DELETE FROM suppliers WHERE id = $1 AND merchant_id = $2')) {
    const [id, merchant_id] = params;
    const sId = parseInt(id, 10);
    const mId = parseInt(merchant_id, 10);
    const initLen = memoryStore.suppliers.length;
    memoryStore.suppliers = memoryStore.suppliers.filter(s => !(s.id === sId && s.merchant_id === mId));
    // cascade
    memoryStore.supplier_ledgers = memoryStore.supplier_ledgers.filter(sl => sl.supplier_id !== sId);
    memoryStore.purchase_orders = memoryStore.purchase_orders.filter(po => po.supplier_id !== sId);
    return { rows: [], rowCount: initLen - memoryStore.suppliers.length };
  }

  // 51. Single Purchase Order by ID: SELECT po.* ... WHERE po.id = $1 AND po.merchant_id = $2 (or id = $1 AND merchant_id = $2)
  if (normalized.includes('FROM purchase_orders') && (normalized.includes('WHERE po.id = $1') || normalized.includes('WHERE id = $1'))) {
    const [id, merchant_id] = params;
    const po = memoryStore.purchase_orders.find(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    if (po) {
      const supplier = memoryStore.suppliers.find(s => s.id === po.supplier_id) || {};
      const enriched = {
        ...po,
        supplier_name: supplier.name || 'Unknown',
        supplier_phone: supplier.phone || '',
        supplier_contact: supplier.contact_person || '',
        supplier_email: supplier.email || '',
        supplier_address: supplier.address || ''
      };
      return { rows: [enriched], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 52. Purchase Orders list: SELECT po.* ... FROM purchase_orders po ... WHERE po.merchant_id = $1
  if (normalized.includes('FROM purchase_orders') && !normalized.includes('WHERE po.id = $1') && !normalized.includes('WHERE id = $1')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.purchase_orders
      .filter(p => p.merchant_id === merchant_id)
      .map(po => {
        const supplier = memoryStore.suppliers.find(s => s.id === po.supplier_id) || {};
        const itemCount = memoryStore.purchase_order_items.filter(poi => poi.purchase_order_id === po.id).length;
        return {
          ...po,
          supplier_name: supplier.name || 'Unknown',
          supplier_phone: supplier.phone || '',
          supplier_contact: supplier.contact_person || '',
          item_count: itemCount
        };
      })
      .sort((a, b) => b.id - a.id);
    return { rows, rowCount: rows.length };
  }

  // 53. Purchase Order Items: SELECT poi.* ... FROM purchase_order_items poi ... WHERE poi.purchase_order_id = $1
  if (normalized.includes('FROM purchase_order_items')) {
    const po_id = parseInt(params[0], 10);
    const rows = memoryStore.purchase_order_items
      .filter(poi => poi.purchase_order_id === po_id)
      .map(poi => {
        const prod = poi.product_id ? memoryStore.products.find(p => p.id === poi.product_id) : null;
        return {
          ...poi,
          product_name: prod ? prod.product_name : poi.item_name,
          sku: prod ? prod.sku : null
        };
      })
      .sort((a, b) => a.id - b.id);
    return { rows, rowCount: rows.length };
  }

  // 54. INSERT INTO purchase_orders
  if (normalized.startsWith('INSERT INTO purchase_orders')) {
    const [merchant_id, supplier_id, po_number, status, total_amount, order_date, expected_delivery_date, notes] = params;
    const newPO = {
      id: memoryStore.poSeq++,
      merchant_id: parseInt(merchant_id, 10),
      supplier_id: parseInt(supplier_id, 10),
      po_number: po_number ? po_number.trim() : `PO-${Date.now().toString().slice(-6)}`,
      status: status || 'SENT',
      total_amount: parseFloat(total_amount) || 0,
      order_date: order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: expected_delivery_date || null,
      received_date: null,
      notes: notes || '',
      created_at: new Date()
    };
    memoryStore.purchase_orders.push(newPO);
    return { rows: [newPO], rowCount: 1 };
  }

  // 55. INSERT INTO purchase_order_items
  if (normalized.startsWith('INSERT INTO purchase_order_items')) {
    const [purchase_order_id, product_id, item_name, quantity, unit_cost, subtotal] = params;
    const newItem = {
      id: memoryStore.poItemSeq++,
      purchase_order_id: parseInt(purchase_order_id, 10),
      product_id: product_id ? parseInt(product_id, 10) : null,
      item_name: item_name ? item_name.trim() : 'Item',
      quantity: parseInt(quantity, 10) || 1,
      unit_cost: parseFloat(unit_cost) || 0,
      subtotal: parseFloat(subtotal) || 0,
      created_at: new Date()
    };
    memoryStore.purchase_order_items.push(newItem);
    return { rows: [newItem], rowCount: 1 };
  }

  // 56. UPDATE purchase_orders SET status
  if (normalized.startsWith('UPDATE purchase_orders SET status')) {
    const [status, received_date, id, merchant_id] = params;
    const po = memoryStore.purchase_orders.find(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    if (po) {
      po.status = status;
      if (received_date !== undefined) po.received_date = received_date;
      return { rows: [po], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 57. Increment Product Stock Quantity: UPDATE products SET stock_quantity = stock_quantity + $1
  if (normalized.includes('UPDATE products SET stock_quantity = stock_quantity + $1')) {
    const [qty, id, merchant_id] = params;
    const prod = memoryStore.products.find(
      p => p.id === parseInt(id, 10) && p.merchant_id === parseInt(merchant_id, 10)
    );
    if (prod) {
      prod.stock_quantity = (prod.stock_quantity || 0) + parseInt(qty, 10);
      prod.updated_at = new Date();
      return { rows: [prod], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 58. Supplier Ledgers by Supplier: SELECT * FROM supplier_ledgers WHERE supplier_id = $1 AND merchant_id = $2
  if (normalized.includes('FROM supplier_ledgers WHERE supplier_id = $1 AND merchant_id = $2')) {
    const [supplier_id, merchant_id] = params;
    const rows = memoryStore.supplier_ledgers
      .filter(sl => sl.supplier_id === parseInt(supplier_id, 10) && sl.merchant_id === parseInt(merchant_id, 10))
      .sort((a, b) => b.id - a.id);
    return { rows, rowCount: rows.length };
  }

  // 59. INSERT INTO supplier_ledgers
  if (normalized.startsWith('INSERT INTO supplier_ledgers')) {
    const [merchant_id, supplier_id, purchase_order_id, transaction_type, amount, notes, reference_no, payment_date, payment_method, status] = params;
    const newLedger = {
      id: memoryStore.supplierLedgerSeq++,
      merchant_id: parseInt(merchant_id, 10),
      supplier_id: parseInt(supplier_id, 10),
      purchase_order_id: purchase_order_id ? parseInt(purchase_order_id, 10) : null,
      transaction_type: transaction_type || 'BILL',
      amount: parseFloat(amount) || 0,
      notes: notes || '',
      reference_no: reference_no || '',
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment_method || 'BANK_TRANSFER',
      status: status || 'PENDING',
      created_at: new Date()
    };
    memoryStore.supplier_ledgers.push(newLedger);
    return { rows: [newLedger], rowCount: 1 };
  }

  // 60. INSERT INTO debtor_call_logs
  if (normalized.startsWith('INSERT INTO debtor_call_logs')) {
    const [merchant_id, customer_id, ledger_id, call_sid, call_status, intent, transcript, summary, promised_date, callback_scheduled_at, payment_link_sent, payment_link_url, upi_intent_string] = params;
    const newLog = {
      id: memoryStore.callLogSeq++,
      merchant_id: parseInt(merchant_id, 10),
      customer_id: parseInt(customer_id, 10),
      ledger_id: ledger_id ? parseInt(ledger_id, 10) : null,
      call_sid: call_sid || `CALL-${Date.now().toString().slice(-6)}`,
      call_status: call_status || 'COMPLETED',
      intent: intent || 'GENERAL_INQUIRY',
      transcript: transcript || '',
      summary: summary || '',
      promised_date: promised_date || null,
      callback_scheduled_at: callback_scheduled_at || null,
      payment_link_sent: Boolean(payment_link_sent),
      payment_link_url: payment_link_url || null,
      upi_intent_string: upi_intent_string || null,
      created_at: new Date()
    };
    memoryStore.debtor_call_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  // 61. Scheduled Callbacks: FROM debtor_call_logs dcl ... WHERE dcl.merchant_id = $1 AND dcl.callback_scheduled_at IS NOT NULL
  if (normalized.includes('FROM debtor_call_logs') && normalized.includes('callback_scheduled_at IS NOT NULL')) {
    const merchant_id = parseInt(params[0], 10);
    const rows = memoryStore.debtor_call_logs
      .filter(l => l.merchant_id === merchant_id && l.callback_scheduled_at !== null)
      .map(l => {
        const cust = memoryStore.customers.find(c => c.id === l.customer_id);
        return {
          ...l,
          customer_name: cust ? cust.name : 'Unknown Customer',
          customer_phone: cust ? cust.phone : ''
        };
      })
      .sort((a, b) => new Date(a.callback_scheduled_at) - new Date(b.callback_scheduled_at));
    return { rows, rowCount: rows.length };
  }

  // 62. Debtor Call Logs List: FROM debtor_call_logs dcl ... WHERE dcl.merchant_id = $1
  if (normalized.includes('FROM debtor_call_logs')) {
    const merchant_id = parseInt(params[0], 10);
    const customerId = params[1] ? parseInt(params[1], 10) : null;
    let rows = memoryStore.debtor_call_logs.filter(l => l.merchant_id === merchant_id);
    if (customerId) {
      rows = rows.filter(l => l.customer_id === customerId);
    }
    const enriched = rows.map(l => {
      const cust = memoryStore.customers.find(c => c.id === l.customer_id);
      return {
        ...l,
        customer_name: cust ? cust.name : 'Unknown Customer',
        customer_phone: cust ? cust.phone : ''
      };
    }).sort((a, b) => b.id - a.id);
    return { rows: enriched, rowCount: enriched.length };
  }

  // 63. UPDATE customer_ledgers SET callback_date = $1, call_status = $2
  if (normalized.includes('UPDATE customer_ledgers SET') && normalized.includes('call_status')) {
    const [callback_date, call_status, payment_link_sent, customer_id, merchant_id] = params;
    const cId = parseInt(customer_id, 10);
    const mId = parseInt(merchant_id, 10);
    let updatedCount = 0;
    memoryStore.customer_ledgers.forEach(cl => {
      if (cl.customer_id === cId && cl.merchant_id === mId) {
        if (callback_date !== undefined) cl.callback_date = callback_date;
        if (call_status !== undefined) cl.call_status = call_status;
        if (payment_link_sent !== undefined) cl.payment_link_sent = Boolean(payment_link_sent);
        updatedCount++;
      }
    });
    return { rows: [], rowCount: updatedCount };
  }

  console.warn('[Unmatched Fallback Query]:', text);
  return { rows: [], rowCount: 0 };
}

export const getPool = () => pool;
export default { query, getPool, memoryStore };
