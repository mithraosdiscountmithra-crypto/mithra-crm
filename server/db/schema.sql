-- PostgreSQL Database Schema for Multi-Tenant Merchant Loyalty and Membership SaaS CRM
-- Designed for PostgreSQL & Neon Serverless DB

-- 1. Merchants (Tenants)
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Retail',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Membership Plans (Configured per merchant)
CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    validity_months INTEGER NOT NULL DEFAULT 12,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    benefits_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers (Tenant-isolated: customers belong to a merchant)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    birthday DATE,
    anniversary DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_merchant_customer_phone UNIQUE (merchant_id, phone)
);

-- 4. Customer Memberships (Subscriptions / enrolled tiers)
CREATE TABLE IF NOT EXISTS customer_memberships (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Redemptions (Cashier / POS transaction logs with discounts)
CREATE TABLE IF NOT EXISTS redemptions (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bill_amount NUMERIC(10, 2) NOT NULL,
    discount_given NUMERIC(10, 2) NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products & Inventory (Tenant-isolated stock management)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100) DEFAULT 'General',
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    unit VARCHAR(50) DEFAULT 'pcs',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Customer Ledgers / Digital Udhaar (Credit & Khata Book)
CREATE TABLE IF NOT EXISTS customer_ledgers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('GIVEN', 'PAID')),
    amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Expenses (P&L Accounting)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'Cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Staff Members (Team & Payroll)
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    monthly_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Staff Attendance (Daily Present / Absent Tracking)
CREATE TABLE IF NOT EXISTS staff_attendance (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
    check_in_time VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_attendance_date UNIQUE (staff_id, attendance_date)
);

-- 11. WhatsApp Marketing Campaigns (Promotions & Broadcasts)
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    target_audience VARCHAR(100) DEFAULT 'ALL',
    message_template TEXT NOT NULL,
    discount_offer VARCHAR(100),
    status VARCHAR(50) DEFAULT 'SENT',
    sent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Suppliers (Wholesalers & Vendors Directory)
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_or_tax_id VARCHAR(100),
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Purchase Orders (Procurement from Suppliers)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_merchant_po_number UNIQUE (merchant_id, po_number)
);

-- 14. Purchase Order Items (Line Items with Products)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Supplier Ledgers / Khata (Billed & Paid Accounts Payable)
CREATE TABLE IF NOT EXISTS supplier_ledgers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('BILL', 'PAYMENT')),
    amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    reference_no VARCHAR(100),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and fast POS lookup
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_phone ON customers(merchant_id, phone);
CREATE INDEX IF NOT EXISTS idx_membership_plans_merchant ON membership_plans(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_cust_status ON customer_memberships(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_expiry ON customer_memberships(expiry_date);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant_date ON redemptions(merchant_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_sku ON products(merchant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(merchant_id, stock_quantity, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_customer_ledgers_merchant ON customer_ledgers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_ledgers_customer ON customer_ledgers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ledgers_status ON customer_ledgers(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_ledgers_created ON customer_ledgers(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant_date ON expenses(merchant_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(merchant_id, category);
CREATE INDEX IF NOT EXISTS idx_staff_merchant ON staff(merchant_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_lookup ON staff_attendance(merchant_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_merchant ON whatsapp_campaigns(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_merchant ON suppliers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_merchant ON purchase_orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledgers_merchant ON supplier_ledgers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledgers_supplier ON supplier_ledgers(supplier_id);
