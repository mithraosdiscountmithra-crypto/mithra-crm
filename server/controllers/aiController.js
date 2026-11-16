import db from '../db/index.js';

/**
 * AI Business Assistant (Copilot) Controller
 * Integrates with Google Gemini API (gemini-1.5-flash) with context-aware live store snapshot
 * and provides an intelligent fallback engine when GEMINI_API_KEY is not set or offline.
 */

// Helper to assemble store business context for the AI
async function getStoreContext(merchantId, merchantInfo = {}) {
  try {
    // 1. Sales & Loyalty Metrics
    const salesRes = await db.query(
      `/* ANALYTICS_SUMMARY */
       SELECT 
         COALESCE(SUM(bill_amount), 0) AS total_sales,
         COALESCE(SUM(discount_given), 0) AS total_discounts,
         COUNT(id) AS redemptions_count
       FROM redemptions 
       WHERE merchant_id = $1`,
      [merchantId]
    );
    const salesStats = salesRes.rows[0] || {};
    const grossSales = parseFloat(salesStats.total_sales || 0);
    const totalDiscounts = parseFloat(salesStats.total_discounts || 0);
    const netSales = grossSales - totalDiscounts;

    // 2. Low-Stock Products Alert
    const lowStockRes = await db.query(
      `SELECT * FROM products WHERE merchant_id = $1 AND stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC`,
      [merchantId]
    );
    const lowStockItems = lowStockRes.rows || [];

    // All Products Count
    const allProdRes = await db.query(
      `SELECT * FROM products WHERE merchant_id = $1`,
      [merchantId]
    );
    const totalProducts = allProdRes.rows?.length || 0;

    // 3. Customer Udhaar / Khata
    const ledgerRes = await db.query(
      `SELECT cl.*, c.name as customer_name, c.phone as customer_phone
       FROM customer_ledgers cl
       JOIN customers c ON cl.customer_id = c.id
       WHERE cl.merchant_id = $1
       ORDER BY cl.created_at DESC`,
      [merchantId]
    );
    const ledgerEntries = ledgerRes.rows || [];
    
    // Group by customer
    const customerMap = {};
    ledgerEntries.forEach(entry => {
      const cId = entry.customer_id;
      if (!customerMap[cId]) {
        customerMap[cId] = {
          name: entry.customer_name || `Customer #${cId}`,
          phone: entry.customer_phone || '',
          balance: 0,
          pendingDueDate: entry.due_date
        };
      }
      const amt = parseFloat(entry.amount) || 0;
      if (entry.transaction_type === 'GIVEN') {
        customerMap[cId].balance += amt;
      } else if (entry.transaction_type === 'PAID') {
        customerMap[cId].balance -= amt;
      }
    });

    const pendingDebtCustomers = Object.values(customerMap).filter(c => c.balance > 0);
    const totalMarketUdhaar = pendingDebtCustomers.reduce((acc, c) => acc + c.balance, 0);

    // 4. Expenses & P&L
    const expRes = await db.query(
      `SELECT * FROM expenses WHERE merchant_id = $1 ORDER BY expense_date DESC`,
      [merchantId]
    );
    const expenses = expRes.rows || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfitLoss = netSales - totalExpenses;

    // 5. Staff & Today's Attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const staffRes = await db.query(`SELECT * FROM staff WHERE merchant_id = $1`, [merchantId]);
    const staffList = staffRes.rows || [];
    const activeStaff = staffList.filter(s => s.is_active);
    const monthlyPayroll = activeStaff.reduce((sum, s) => sum + (parseFloat(s.monthly_salary) || 0), 0);

    const attRes = await db.query(`SELECT * FROM staff_attendance WHERE merchant_id = $1 AND attendance_date = $2`, [merchantId, todayStr]);
    const todayAttendance = attRes.rows || [];
    const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;

    // 6. Suppliers & Accounts Payable
    const supRes = await db.query(`SELECT * FROM suppliers WHERE merchant_id = $1`, [merchantId]);
    const suppliers = supRes.rows || [];
    const totalPayableToSuppliers = suppliers.reduce((sum, s) => {
      const bal = parseFloat(s.net_balance) || 0;
      return bal > 0 ? sum + bal : sum;
    }, 0);

    return {
      store: {
        name: merchantInfo.store_name || 'Retail Store',
        owner: merchantInfo.owner_name || 'Merchant Owner',
        category: merchantInfo.category || 'Retail',
        city: merchantInfo.city || 'Downtown'
      },
      sales: {
        grossSales: grossSales.toFixed(2),
        totalDiscounts: totalDiscounts.toFixed(2),
        netSales: netSales.toFixed(2),
        redemptionsCount: salesStats.redemptions_count || 0,
        activeMembers: salesStats.active_members || 0
      },
      inventory: {
        totalProducts,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map(p => ({
          name: p.product_name,
          sku: p.sku,
          stock: p.stock_quantity,
          threshold: p.low_stock_threshold,
          price: p.selling_price
        }))
      },
      udhaar: {
        totalMarketUdhaar: totalMarketUdhaar.toFixed(2),
        debtorsCount: pendingDebtCustomers.length,
        topDebtors: pendingDebtCustomers.slice(0, 5)
      },
      pnl: {
        totalExpenses: totalExpenses.toFixed(2),
        netProfitLoss: netProfitLoss.toFixed(2),
        isProfitable: netProfitLoss >= 0
      },
      staff: {
        totalStaff: activeStaff.length,
        presentToday,
        monthlyPayroll: monthlyPayroll.toFixed(2)
      },
      suppliers: {
        totalSuppliers: suppliers.length,
        totalPayable: totalPayableToSuppliers.toFixed(2)
      }
    };
  } catch (err) {
    console.error('[AI Context Assembly Error]:', err.message);
    return null;
  }
}

// Generate intelligent contextual response without external API keys (zero-config fallback)
function generateContextualHeuristicReply(userMessage, context) {
  const query = userMessage.toLowerCase().trim();
  const store = context?.store || {};
  const sales = context?.sales || {};
  const inv = context?.inventory || {};
  const udhaar = context?.udhaar || {};
  const pnl = context?.pnl || {};
  const staff = context?.staff || {};
  const suppliers = context?.suppliers || {};

  // Intent 1: Sales / Revenue / Performance
  if (query.includes('sale') || query.includes('revenue') || query.includes('income') || query.includes('performance') || query.includes('earn')) {
    return `### 📊 Real-Time Sales & Revenue Summary for **${store.name}**

* **Gross Sales (POS)**: \`₹${sales.grossSales || '0.00'}\`
* **Loyalty Discounts Given**: \`-₹${sales.totalDiscounts || '0.00'}\`
* **Net Realized Revenue**: **\`₹${sales.netSales || '0.00'}\`**
* **Customer Redemptions**: **${sales.redemptionsCount || 0} checkout transactions**
* **Active Membership Tier Holders**: **${sales.activeMembers || 0} members**

> 💡 **Copilot Tip**: Loyalty members account for repeat transactions. Promoting a 15% weekend upgrade can boost checkout volume by ~22%.`;
  }

  // Intent 2: Low Stock / Inventory / Restock
  if (query.includes('stock') || query.includes('inventor') || query.includes('reorder') || query.includes('low') || query.includes('item')) {
    if (inv.lowStockCount === 0) {
      return `### 📦 Inventory Status: **All Clear** ✅

* All **${inv.totalProducts} catalog products** are currently maintained well above safety reorder thresholds.
* No immediate vendor purchase orders are required right now!`;
    }

    const itemsTable = inv.lowStockItems.map(it => 
      `| **${it.name}** | \`${it.sku}\` | <span style="color:#f87171;font-weight:bold">${it.stock} units</span> | ${it.threshold} units | ₹${parseFloat(it.price).toFixed(2)} |`
    ).join('\n');

    return `### ⚠️ Low-Stock Reorder Alert: **${inv.lowStockCount} Items at Risk**

The following products have dropped to or below their safety reorder thresholds:

| Product Name | SKU | Current Stock | Safety Threshold | Retail Price |
| :--- | :--- | :--- | :--- | :--- |
${itemsTable}

> 🛒 **Recommended Action**: You can 1-click auto-populate these ${inv.lowStockCount} items into a new Purchase Order under **Suppliers & POs** to restock before weekend rush hours.`;
  }

  // Intent 3: Udhaar / Khata / Customer Credit
  if (query.includes('udhaar') || query.includes('khata') || query.includes('credit') || query.includes('debt') || query.includes('owe') || query.includes('due')) {
    const debtorsList = udhaar.topDebtors?.length > 0
      ? udhaar.topDebtors.map(d => `* **${d.name}** (${d.phone || 'No phone'}): **\`₹${parseFloat(d.balance).toFixed(2)}\`** ${d.pendingDueDate ? `(Due: ${String(d.pendingDueDate).split('T')[0]})` : ''}`).join('\n')
      : '*No pending customer credit balances!*';

    return `### 📒 Digital Khata / Market Udhaar Ledger

* **Total Outstanding Market Udhaar**: **\`₹${udhaar.totalMarketUdhaar || '0.00'}\`**
* **Customers with Pending Balance**: **${udhaar.debtorsCount || 0} customers**

#### Top Outstanding Balances:
${debtorsList}

> 📲 **Action**: You can send polite pre-filled payment reminders via WhatsApp Web from the **Digital Khata** tab with 1-click!`;
  }

  // Intent 4: WhatsApp Marketing / Promo Campaign Draft
  if (query.includes('whatsapp') || query.includes('message') || query.includes('promo') || query.includes('draft') || query.includes('offer') || query.includes('deal') || query.includes('campaign') || query.includes('festival')) {
    return `### 🚀 Draft WhatsApp Promotional Broadcast

Here is a high-converting promotional campaign draft personalized for **${store.name}**:

\`\`\`
Hey {customer_name}! 🌟

We appreciate your loyalty at ${store.name}! This weekend only, show this WhatsApp message at the counter to unlock an EXCLUSIVE 20% OFF your entire bill. ☕✨

Valid through Sunday evening. Bring a friend and enjoy handcrafted favorites!

📍 ${store.name}, ${store.city}
\`\`\`

> 📲 **How to send**: Navigate to the **WhatsApp Marketing** tab, select target segment (e.g. \`ACTIVE_MEMBERS\` or \`ALL\`), paste this template, and launch direct WhatsApp Web links!`;
  }

  // Intent 5: Expenses / Profit & Loss
  if (query.includes('profit') || query.includes('loss') || query.includes('expense') || query.includes('pnl') || query.includes('margin') || query.includes('cost')) {
    const isProf = pnl.isProfitable;
    return `### 📈 Profit & Loss Statement for **${store.name}**

* **Net Sales Revenue**: \`₹${sales.netSales || '0.00'}\`
* **Total Operating Expenses**: \`-₹${pnl.totalExpenses || '0.00'}\`
* **Net Bottom-Line ${isProf ? 'Profit' : 'Loss'}**: **\`${isProf ? '+' : ''}₹${pnl.netProfitLoss || '0.00'}\`**

> 💡 **Observation**: ${isProf 
  ? 'Your store is operating at a positive operating surplus!' 
  : 'Operating expenses currently exceed net POS revenue. Consider reviewing utility or wholesale supplier costs.'}`;
  }

  // Intent 6: Staff / Attendance / Payroll
  if (query.includes('staff') || query.includes('attendance') || query.includes('employee') || query.includes('payroll') || query.includes('worker')) {
    return `### 👥 Staff Directory & Today's Attendance

* **Active Team Members**: **${staff.totalStaff || 0} employees**
* **Present Today**: **${staff.presentToday || 0} / ${staff.totalStaff || 0} marked present**
* **Monthly Fixed Payroll Commitment**: **\`₹${staff.monthlyPayroll || '0.00'}\`**

> 📋 Log daily check-ins or mark leaves on the **Staff & Attendance** calendar page.`;
  }

  // Intent 7: Suppliers / Purchase Orders / Accounts Payable
  if (query.includes('supplier') || query.includes('vendor') || query.includes('payable') || query.includes('purchase order') || query.includes('po')) {
    return `### 🚚 Wholesalers & Accounts Payable

* **Registered Suppliers**: **${suppliers.totalSuppliers || 0} vendors**
* **Accounts Payable (You Owe Wholesalers)**: **\`₹${suppliers.totalPayable || '0.00'}\`**

> 📦 Inward newly arrived stock or send purchase orders directly via WhatsApp from the **Suppliers & POs** screen.`;
  }

  // Default Greeting / Multi-purpose overview
  return `### 👋 Hello! I am your AI Business Copilot for **${store.name}**

I have direct access to your real-time store database and can help you with:

* 📊 **Sales & Revenue**: "What are today's sales and discount figures?"
* ⚠️ **Inventory Reorder Alerts**: "Which items are low in stock?"
* 📒 **Customer Udhaar**: "Who owes us money and what is total debt?"
* 💬 **Marketing Campaigns**: "Draft a 20% off WhatsApp festival message"
* 📈 **Profit & Loss**: "Show our net profit and expense breakdown"
* 👥 **Staff Attendance**: "Who is on duty today and monthly payroll?"
* 🚚 **Suppliers & POs**: "How much do we owe wholesalers?"

Ask me anything about your business metrics!`;
}

// POST /api/ai/chat - Process merchant prompt with Gemini API or Context Engine
export const chatWithAICopilot = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message prompt is required' });
    }

    // 1. Gather live store business context
    const context = await getStoreContext(merchantId, req.merchant);

    // 2. Check for Google Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const systemPrompt = `You are "Mithra AI Copilot", a friendly, knowledgeable, and sharp AI Business Assistant for "${context.store.name}", a ${context.store.category} business owned by ${context.store.owner}.

Here is the LIVE real-time store database snapshot:
- Sales: Gross Sales ₹${context.sales.grossSales}, Discounts Given -₹${context.sales.totalDiscounts}, Net Sales ₹${context.sales.netSales}, Redemptions: ${context.sales.redemptionsCount}, Active Members: ${context.sales.activeMembers}.
- Inventory: Total products: ${context.inventory.totalProducts}, Low stock items (${context.inventory.lowStockCount}): ${JSON.stringify(context.inventory.lowStockItems)}.
- Digital Khata / Udhaar: Total Market Debt: ₹${context.udhaar.totalMarketUdhaar}, Debtors (${context.udhaar.debtorsCount}): ${JSON.stringify(context.udhaar.topDebtors)}.
- P&L: Total Expenses ₹${context.pnl.totalExpenses}, Net Profit/Loss ₹${context.pnl.netProfitLoss}.
- Staff: Active staff: ${context.staff.totalStaff}, Present today: ${context.staff.presentToday}, Monthly payroll: ₹${context.staff.monthlyPayroll}.
- Suppliers & Accounts Payable: Total suppliers: ${context.suppliers.totalSuppliers}, Total payable (merchant owes vendors): ₹${context.suppliers.totalPayable}.

INSTRUCTIONS:
1. Always base your answers on this real-time store data.
2. Format answers with clean Markdown, bullet points, and bold key numbers.
3. Be concise, actionable, and encouraging to the merchant.
4. If asked to draft WhatsApp messages, include placeholder tags {customer_name} and {store_name} and relevant emojis.`;

        // Format Gemini request payload
        const contents = [];

        // Add previous conversation history if provided
        if (Array.isArray(conversationHistory)) {
          for (const item of conversationHistory.slice(-6)) {
            if (item.sender === 'user' || item.role === 'user') {
              contents.push({ role: 'user', parts: [{ text: item.text || item.content }] });
            } else if (item.sender === 'ai' || item.role === 'model') {
              contents.push({ role: 'model', parts: [{ text: item.text || item.content }] });
            }
          }
        }

        // Add current user prompt
        contents.push({
          role: 'user',
          parts: [{ text: message.trim() }]
        });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({
              success: true,
              reply: replyText,
              source: 'gemini-1.5-flash',
              contextSnapshot: context
            });
          }
        } else {
          const errorData = await response.text();
          console.warn('[Gemini API Response non-200, falling back to Context Engine]:', errorData);
        }
      } catch (geminiErr) {
        console.warn('[Gemini API Call Failed, using Context Engine fallback]:', geminiErr.message);
      }
    }

    // 3. Fallback to smart Context-Aware Heuristic Copilot
    const heuristicReply = generateContextualHeuristicReply(message, context);
    return res.json({
      success: true,
      reply: heuristicReply,
      source: 'context-engine',
      contextSnapshot: context
    });
  } catch (err) {
    next(err);
  }
};
