# LoyaltyHub | Multi-Tenant Merchant Loyalty & Membership SaaS CRM

A production-ready Multi-Tenant Loyalty and Membership SaaS CRM platform designed for retail, cafes, salons, restaurants, and service merchants. Built using **Node.js**, **Express**, **PostgreSQL (Neon DB)**, and **React** with **Tailwind CSS**.

---

## 🌟 Key Features

1. **Multi-Tenant Architecture**:
   - Strict tenant isolation: every merchant has their own customers, loyalty tiers, membership records, and transaction logs.
   - `UNIQUE (merchant_id, phone)` constraint ensures phone numbers are unique per merchant while allowing cross-tenant numbers.
   - Foreign key cascade protections (`ON DELETE CASCADE`) to keep database integrity.

2. **Neon DB Serverless & In-Memory Dual Engine**:
   - Native support for Neon DB PostgreSQL connection strings with serverless SSL connection pooling.
   - Auto-migrator (`schema.sql`) and sample seeder script.
   - Embedded multi-tenant mock store enables instant local testing without waiting for cloud credentials.

3. **Fast POS Cashier Terminal**:
   - Sub-second customer lookup by phone number.
   - Real-time membership status badge (e.g. Gold Tier - 20% discount).
   - Milestone celebrations: automated Birthday & Anniversary perk badges.
   - Instant bill deduction calculator: enter bill amount -> automatic discount calculation -> 1-click redemption execution.
   - Printable receipt modal with instant reset for the next customer in queue.

4. **Merchant CRM Portal**:
   - **KPI Dashboard**: Gross sales processed, discounts provided, active member loyalty rate, recent redemptions stream.
   - **Customer Directory**: Add, update, delete, view birthdays/anniversaries, and assign or upgrade membership plans.
   - **Membership Plans**: Configure tiered subscriptions (e.g. Basic, Gold, VIP) with custom validity, prices, discount percentages, and perks.
   - **Redemption Audit Log**: Complete transaction ledger with net collected, discount saved, cashier timestamps, and customer details.

5. **Inventory & Stock Management**:
   - **SKU Tracking**: Product name, SKU barcode, category, purchase cost, and selling price.
   - **Real-Time Reorder Alerts**: Automated warning badges for low-stock items (`stock_quantity <= low_stock_threshold`) and out-of-stock items.
   - **Valuation Metrics**: Real-time warehouse cost valuation, estimated retail value, and gross profit margin percentages.
   - **Quick Adjustments**: Inline 1-click `+ / -` stock level adjustment directly from the table, plus full modal editing.

6. **Digital Udhaar / Customer Khata Ledger**:
   - **Credit Book Tracking**: Manage credit balances (`GIVEN`) and partial/full repayments (`PAID`).
   - **Customer Passbook**: Full statement history with transaction debit/credit breakdown, notes, repayment due dates, and settlement status.
   - **1-Click WhatsApp Payment Reminders**: Opens pre-composed polite payment reminder messages in WhatsApp Web with customer name, store name, outstanding amount, and due date.
   - **Market Exposure Insights**: Real-time KPI metrics for total outstanding market debt and recovery rate.

7. **Expense & P&L Accounting**:
   - **Operational Cost Tracking**: Record line-item expenses across Rent, Inventory, Utilities, Salaries, Marketing, Maintenance, Packaging, and Misc.
   - **Real-Time P&L Income Statement**: Automatically aggregates Gross Sales, POS Discounts, Net Sales Revenue, Total Expenses, and computes Net Profit / Loss with Profit Margin %.
   - **Category Breakdown Visualization**: Visual spending distribution bars showing percentage of total outflows per operational category.

8. **Staff Attendance & Payroll**:
   - **Employee Directory**: Track staff roster, designations, contact numbers, joining dates, and monthly salary liabilities.
   - **1-Click Daily Attendance Matrix**: Calendar-driven daily attendance with quick-tap markers for `PRESENT`, `ABSENT`, `HALF_DAY`, and `LEAVE`.
   - **Automatic Attendance Rate & Payroll Aggregation**: Real-time tracking of team attendance percentage and monthly fixed payroll commitments.

9. **Bulk WhatsApp Marketing**:
   - **Targeted Broadcast Campaigns**: Compose personalized promotional messages segmented by `ALL`, `ACTIVE_MEMBERS`, `VIP`, or `NON_MEMBERS`.
   - **Dynamic Tag Personalization**: Automatic replacement of `{customer_name}` and `{store_name}` tags.
   - **Pre-Configured Promotional Presets**: 1-click templates for Weekend Flash Discounts, Holiday Specials, VIP Double Points, and Loyalty Invitations.
   - **Interactive WhatsApp Web Launcher**: Generate direct `https://wa.me/...` links for cashier/owner to dispatch offers directly without third-party API costs.

10. **Purchase Orders & Supplier Management**:
   - **Wholesaler & Vendor Directory**: Manage supplier contact profiles, payment terms (`Net 30`, `Net 15`, `COD`), tax ID, and address.
   - **Purchase Orders (POs)**: Create purchase orders with multiple product line items, quantities, and negotiated unit costs.
   - **1-Click Low-Stock Auto-Population**: Automatically scans inventory for low-stock items (`stock_quantity <= low_stock_threshold`) and populates recommended reorder quantities into the PO.
   - **WhatsApp PO Dispatch**: Generate direct pre-filled `https://wa.me/...` links to dispatch structured Purchase Orders to suppliers via WhatsApp Web.
   - **Automated Inventory Inwarding**: Marking a PO as `RECEIVED` automatically updates received dates and increments product `stock_quantity` in the store catalog.
   - **Supplier Khata Ledger**: Real-time accounts payable tracking (`BILLS - PAYMENTS`), statement view, and settlement recording.

---

## 📂 Project Structure

```
merchant-loyalty-saas/
├── package.json               # Root scripts for server and client
├── README.md                  # Complete documentation
│
├── server/                    # Node.js & Express Backend
│   ├── package.json
│   ├── index.js               # Express entrypoint, middleware, and route mounting
│   ├── .env.example           # Neon DB connection & JWT environment template
│   ├── db/
│   │   ├── schema.sql         # PostgreSQL DDL with indexes and constraints
│   │   ├── index.js           # pg.Pool with Neon SSL & fallback multi-tenant engine
│   │   ├── migrate.js         # Automated schema migration script
│   │   └── seed.js            # Demo merchant seed data for Neon DB
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & tenant context injection (req.merchant)
│   │   └── errorHandler.js    # Centralized API error handling
│   ├── controllers/
│   │   ├── authController.js        # Merchant register, login, store profile update
│   │   ├── plansController.js       # CRUD for loyalty membership plans
│   │   ├── customersController.js   # Customer directory with active plan details
│   │   ├── membershipsController.js # Plan enrollment, renewal, and cancellation
│   │   ├── posController.js         # Fast phone verification & redemption execution
│   │   ├── analyticsController.js   # KPI stats & recent redemption stream
│   │   ├── productsController.js    # Stock & inventory CRUD, low-stock alerts
│   │   ├── udhaarController.js      # Digital Khata / Udhaar transactions & statements
│   │   ├── expensesController.js    # Expense recording & real-time P&L Net Profit/Loss
│   │   ├── staffController.js       # Staff directory, daily attendance & payroll
│   │   ├── whatsappController.js    # Bulk promotional campaigns & audience links
│   │   ├── suppliersController.js   # Suppliers directory & Accounts Payable Khata
│   │   └── purchaseOrdersController.js # PO creation, WhatsApp links & stock inwarding
│   ├── routes/
│   │   ├── index.js           # Central API router (/api)
│   │   ├── authRoutes.js
│   │   ├── plansRoutes.js
│   │   ├── customersRoutes.js
│   │   ├── membershipsRoutes.js
│   │   ├── posRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── productsRoutes.js
│   │   ├── udhaarRoutes.js
│   │   ├── expensesRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── whatsappRoutes.js
│   │   ├── suppliersRoutes.js
│   │   └── purchaseOrdersRoutes.js
│   └── test-unit.js           # Automated controller verification test suite
│
└── client/                    # React & Tailwind CSS Frontend
    ├── package.json
    ├── vite.config.js         # Vite dev server with /api proxy
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx           # App bootstrap with AuthProvider
        ├── App.jsx            # Dynamic workspace shell and view routing
        ├── index.css          # Tailwind CSS styling and theme
        ├── api/
        │   └── client.js      # Fetch wrapper with JWT header injection
        ├── context/
        │   └── AuthContext.jsx# Authentication session and tenant state
        ├── components/
        │   ├── Navbar.jsx     # Top bar with store info & quick POS toggle
        │   ├── Sidebar.jsx    # Navigation menu
        │   ├── StatCard.jsx   # KPI metric card
        │   └── Modal.jsx      # Reusable dialog component
        └── pages/
            ├── Dashboard.jsx        # Sales, discounts, and customer stats
            ├── POSCheckout.jsx      # High-speed cashier checkout terminal
            ├── DigitalKhata.jsx     # Credit ledger, passbook statements & WhatsApp reminders
            ├── Inventory.jsx        # Stock tracking, low-stock alerts & SKU manager
            ├── SuppliersAndPOs.jsx  # Vendor directory, PO creation, WhatsApp dispatch & inwarding
            ├── Expenses.jsx         # Expenses ledger, category breakdown & P&L Statement
            ├── StaffPayroll.jsx     # Staff directory, 1-click attendance & payroll
            ├── WhatsAppMarketing.jsx# Broadcast campaign composer & WhatsApp links
            ├── Customers.jsx        # Customer list and enrollment actions
            ├── MembershipPlans.jsx  # Tier configuration (Bronze, Gold, VIP)
            ├── RedemptionsList.jsx  # Transaction audit log
            ├── Settings.jsx         # Store profile & database settings
            ├── Login.jsx            # Merchant login with 1-Click Demo
            └── Register.jsx         # New tenant store registration
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- 1. Merchants (Tenants)
CREATE TABLE merchants (
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
CREATE TABLE membership_plans (
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

-- 3. Customers (Tenant-isolated)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    birthday DATE,
    anniversary DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_merchant_customer_phone UNIQUE (merchant_id, phone)
);

-- 4. Customer Memberships (Active subscription tier)
CREATE TABLE customer_memberships (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Redemptions (Cashier discount transaction ledger)
CREATE TABLE redemptions (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bill_amount NUMERIC(10, 2) NOT NULL,
    discount_given NUMERIC(10, 2) NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products & Inventory (Tenant-isolated stock management)
CREATE TABLE products (
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
CREATE TABLE customer_ledgers (
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

-- 8. Expenses & Financial Ledger
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    paid_to VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Staff Directory & Payroll
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Staff',
    phone VARCHAR(20),
    monthly_salary NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    joining_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Staff Daily Attendance
CREATE TABLE staff_attendance (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
    check_in_time VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (merchant_id, staff_id, attendance_date)
);

-- 11. WhatsApp Marketing Campaigns
CREATE TABLE whatsapp_campaigns (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_segment VARCHAR(50) NOT NULL DEFAULT 'ALL',
    message TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-speed lookup indexes
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_customers_merchant_phone ON customers(merchant_id, phone);
CREATE INDEX idx_membership_plans_merchant ON membership_plans(merchant_id);
CREATE INDEX idx_customer_memberships_cust_status ON customer_memberships(customer_id, status);
CREATE INDEX idx_customer_memberships_expiry ON customer_memberships(expiry_date);
CREATE INDEX idx_redemptions_merchant_date ON redemptions(merchant_id, redeemed_at DESC);
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_merchant_sku ON products(merchant_id, sku);
CREATE INDEX idx_products_low_stock ON products(merchant_id, stock_quantity, low_stock_threshold);
CREATE INDEX idx_customer_ledgers_merchant ON customer_ledgers(merchant_id);
CREATE INDEX idx_customer_ledgers_customer ON customer_ledgers(customer_id);
CREATE INDEX idx_customer_ledgers_status ON customer_ledgers(merchant_id, status);
CREATE INDEX idx_customer_ledgers_created ON customer_ledgers(merchant_id, created_at DESC);
CREATE INDEX idx_expenses_merchant ON expenses(merchant_id);
CREATE INDEX idx_expenses_merchant_date ON expenses(merchant_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(merchant_id, category);
CREATE INDEX idx_staff_merchant ON staff(merchant_id);
CREATE INDEX idx_staff_attendance_merchant_date ON staff_attendance(merchant_id, attendance_date);
CREATE INDEX idx_whatsapp_campaigns_merchant ON whatsapp_campaigns(merchant_id);
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Environment Setup
In `server/.env`:
```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret_loyalty_crm
JWT_EXPIRES_IN=7d

# Neon DB Connection String (Optional for local testing; app runs in embedded mode if unset)
DATABASE_URL=postgres://user:password@ep-sample-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Database Migration & Seeding (For Neon DB)
If connecting to a live Neon DB:
```bash
# Apply schema to Neon DB
npm run migrate

# (Optional) Seed demo merchant and sample customers
npm run seed
```

### 4. Running the Application
From the project root:

**Terminal 1 (Backend):**
```bash
npm run server
# Starts server at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
npm run client
# Starts Vite dev server at http://localhost:3000
```

---

## 🔑 Demo Credentials

To test immediately, click **"1-Click Demo"** on the login screen, or sign in with:
- **Email**: `demo@artisancoffee.com`
- **Password**: `merchant123`

### Demo Customers Available for POS Testing:
| Customer Name | Phone Number | Membership Tier | Discount | Perks |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Rivera** | `5551234567` | Gold Brew Connoisseur | **20% OFF** | Priority ordering & gifts |
| **Emily Watson** | `5559876543` | Coffee Club Basic | **10% OFF** | Free size upgrade |
| **David Chen** | `5553456789` | VIP Roaster Pass | **25% OFF** | Monthly tasting & 250g beans |
| **Sophia Martinez** | `5554567890` | Non-Member | **0%** | Standard Customer |

---

## ⚡ Fast POS Verification API Flow

1. **Cashier checks customer by phone number**:
   `GET /api/pos/verify?phone=5551234567`
   - Executes indexed query on `(merchant_id, phone)`
   - Returns customer details, active membership tier, discount %, and birthday perk status.

2. **Cashier enters bill amount & applies discount**:
   `POST /api/pos/redeem`
   ```json
   {
     "customer_id": 1,
     "bill_amount": 50.00
   }
   ```
   - Automatically computes 20% discount ($10.00).
   - Net payable: $40.00.
   - Logs transaction into `redemptions` table and returns a printable receipt.
