import db from '../db/index.js';

/**
 * AI Voice Agent & Callback Scheduler Controller
 * Handles outbound debtor voice calls, webhook response processing,
 * intent parsing (Promise to Pay, Request Callback, Payment Link Request),
 * callback scheduling, and automatic WhatsApp UPI payment link dispatch.
 */

// Heuristic Intent Parser
function parseDebtorSpeechIntent(text = '') {
  const lower = text.toLowerCase().trim();

  // 1. Payment Link / UPI Request
  if (
    lower.includes('link') ||
    lower.includes('upi') ||
    lower.includes('whatsapp') ||
    lower.includes('online') ||
    lower.includes('qr') ||
    lower.includes('send to my phone') ||
    lower.includes('text me')
  ) {
    return 'REQUEST_PAYMENT_LINK';
  }

  // 2. Callback Request / Busy
  if (
    lower.includes('call back') ||
    lower.includes('call later') ||
    lower.includes('busy') ||
    lower.includes('meeting') ||
    lower.includes('driving') ||
    lower.includes('tomorrow') ||
    lower.includes('afternoon') ||
    lower.includes('next week')
  ) {
    return 'REQUEST_CALLBACK';
  }

  // 3. Promise to Pay
  if (
    lower.includes('pay on') ||
    lower.includes('will pay') ||
    lower.includes('promise') ||
    lower.includes('clear') ||
    lower.includes('friday') ||
    lower.includes('monday') ||
    lower.includes('by end of') ||
    lower.includes('in two days') ||
    lower.includes('this week')
  ) {
    return 'PROMISE_TO_PAY';
  }

  // 4. Dispute / Wrong Number
  if (
    lower.includes('dispute') ||
    lower.includes('already paid') ||
    lower.includes('wrong number') ||
    lower.includes('don\'t owe') ||
    lower.includes('not my bill')
  ) {
    return 'DISPUTE';
  }

  // 5. No Answer
  if (lower.includes('no answer') || lower.includes('busy signal') || lower.includes('voicemail')) {
    return 'NO_ANSWER';
  }

  return 'GENERAL_INQUIRY';
}

// 1. POST /api/voice/webhook/call-response - Process AI Voice Agent Call Webhook
export const handleVoiceWebhook = async (req, res, next) => {
  try {
    const {
      merchant_id,
      customer_id,
      ledger_id,
      call_sid,
      call_status = 'COMPLETED',
      transcript = '',
      speech_input = '',
      intent: providedIntent,
      promised_date: providedPromisedDate,
      callback_date: providedCallbackDate,
      summary: providedSummary
    } = req.body;

    // Support both explicit merchant_id and auth context
    const mId = parseInt(merchant_id || req.merchant?.id, 10);
    const cId = parseInt(customer_id, 10);

    if (!mId || !cId) {
      return res.status(400).json({ 
        success: false, 
        error: 'merchant_id and customer_id are required in voice webhook payload' 
      });
    }

    // Fetch customer & merchant details
    const custRes = await db.query(
      `SELECT * FROM customers WHERE id = $1 AND merchant_id = $2`,
      [cId, mId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = custRes.rows[0];

    const merchRes = await db.query(
      `SELECT * FROM merchants WHERE id = $1`,
      [mId]
    );
    const merchant = merchRes.rows[0] || {};
    const storeName = merchant.store_name || 'Our Store';
    const merchantUpi = merchant.email ? `${merchant.email.split('@')[0]}@upi` : 'merchant@upi';

    // Calculate customer's outstanding balance
    const ledgerRes = await db.query(
      `SELECT * FROM customer_ledgers WHERE customer_id = $1 AND merchant_id = $2`,
      [cId, mId]
    );
    const ledgers = ledgerRes.rows || [];
    const balance = ledgers.reduce((acc, entry) => {
      const amt = parseFloat(entry.amount) || 0;
      return entry.transaction_type === 'GIVEN' ? acc + amt : acc - amt;
    }, 0);

    const fullTranscript = transcript || speech_input || 'Customer engaged with AI voice agent.';

    // Intent Parsing: Use provided intent or auto-parse speech text
    const finalIntent = providedIntent || parseDebtorSpeechIntent(fullTranscript);

    let promisedDate = providedPromisedDate || null;
    let callbackScheduledAt = providedCallbackDate || null;
    let paymentLinkSent = false;
    let paymentLinkUrl = null;
    let upiIntentString = null;
    let whatsappLink = null;
    let autoSummary = providedSummary || '';

    // Action execution based on parsed intent
    if (finalIntent === 'REQUEST_PAYMENT_LINK') {
      paymentLinkSent = true;
      const formattedBalance = Math.max(balance, 10.00).toFixed(2);
      
      // Standard UPI Intent String (usable by Google Pay, PhonePe, Paytm, etc.)
      upiIntentString = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(storeName)}&am=${formattedBalance}&cu=INR&tn=Khata-Settlement-${customer.id}`;
      
      // Instant web payment redirect link
      paymentLinkUrl = `https://pay.mithracrm.app/upi?pa=${merchantUpi}&am=${formattedBalance}&ref=${customer.id}`;

      // Automatic WhatsApp dispatch message with direct payment link
      const whatsappMsg = `Hi ${customer.name}! ☕\n\nAs requested during our call, here is your direct UPI payment link to settle your pending account balance of *$${formattedBalance}* at *${storeName}*:\n\n👉 *Pay via UPI Link:* ${paymentLinkUrl}\n\nOr click your UPI App: ${upiIntentString}\n\nThank you for your valued support!`;
      
      const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
      whatsappLink = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`
        : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

      autoSummary = autoSummary || `Debtor requested WhatsApp payment link during voice call. Dispatched UPI link for $${formattedBalance}.`;

      // Update customer ledger status
      await db.query(
        `UPDATE customer_ledgers 
         SET call_status = $1, payment_link_sent = true 
         WHERE customer_id = $2 AND merchant_id = $3`,
        ['PAYMENT_LINK_DISPATCHED', cId, mId]
      );
    } 
    else if (finalIntent === 'PROMISE_TO_PAY') {
      if (!promisedDate) {
        // Default to 4 days from now if not specified
        promisedDate = new Date(Date.now() + 3600 * 1000 * 24 * 4).toISOString().split('T')[0];
      }
      autoSummary = autoSummary || `Customer promised to pay outstanding balance by ${promisedDate}.`;

      await db.query(
        `UPDATE customer_ledgers 
         SET due_date = $1, call_status = $2 
         WHERE customer_id = $3 AND merchant_id = $4`,
        [promisedDate, 'PROMISED_TO_PAY', cId, mId]
      );
    } 
    else if (finalIntent === 'REQUEST_CALLBACK') {
      if (!callbackScheduledAt) {
        // Default to tomorrow 10:00 AM
        const tomorrow = new Date(Date.now() + 3600 * 1000 * 24);
        tomorrow.setHours(10, 0, 0, 0);
        callbackScheduledAt = tomorrow.toISOString();
      }
      autoSummary = autoSummary || `Debtor was unavailable; requested follow-up callback at ${new Date(callbackScheduledAt).toLocaleString()}.`;

      await db.query(
        `UPDATE customer_ledgers 
         SET callback_date = $1, call_status = $2 
         WHERE customer_id = $3 AND merchant_id = $4`,
        [callbackScheduledAt, 'CALLBACK_SCHEDULED', cId, mId]
      );
    } 
    else if (finalIntent === 'DISPUTE') {
      autoSummary = autoSummary || `Debtor disputed the ledger balance. Follow-up manual merchant verification required.`;
      await db.query(
        `UPDATE customer_ledgers 
         SET call_status = $1 
         WHERE customer_id = $2 AND merchant_id = $3`,
        ['DISPUTED', cId, mId]
      );
    }

    const generatedSid = call_sid || `CALL-AI-${Date.now().toString().slice(-6)}`;

    // Insert into debtor_call_logs table
    const logRes = await db.query(
      `INSERT INTO debtor_call_logs 
        (merchant_id, customer_id, ledger_id, call_sid, call_status, intent, transcript, summary, promised_date, callback_scheduled_at, payment_link_sent, payment_link_url, upi_intent_string)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        mId,
        cId,
        ledger_id ? parseInt(ledger_id, 10) : null,
        generatedSid,
        call_status,
        finalIntent,
        fullTranscript,
        autoSummary,
        promisedDate,
        callbackScheduledAt,
        paymentLinkSent,
        paymentLinkUrl,
        upiIntentString
      ]
    );

    res.status(200).json({
      success: true,
      message: 'AI Voice call webhook parsed and executed successfully',
      call_sid: generatedSid,
      intent: finalIntent,
      actions: {
        payment_link_sent: paymentLinkSent,
        payment_link_url: paymentLinkUrl,
        whatsapp_link: whatsappLink,
        promised_date: promisedDate,
        callback_scheduled_at: callbackScheduledAt
      },
      log: logRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// 2. POST /api/voice/trigger-call - Initiate or Simulate an AI Debtor Call
export const triggerAICall = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, error: 'customer_id is required' });
    }

    const custRes = await db.query(
      `SELECT * FROM customers WHERE id = $1 AND merchant_id = $2`,
      [customer_id, merchantId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = custRes.rows[0];
    const storeName = req.merchant.store_name || 'Our Store';

    // Calculate pending balance
    const ledgerRes = await db.query(
      `SELECT * FROM customer_ledgers WHERE customer_id = $1 AND merchant_id = $2`,
      [customer_id, merchantId]
    );
    const balance = (ledgerRes.rows || []).reduce((acc, entry) => {
      const amt = parseFloat(entry.amount) || 0;
      return entry.transaction_type === 'GIVEN' ? acc + amt : acc - amt;
    }, 0);

    const callSid = `CALL-AI-${Date.now().toString().slice(-6)}`;

    // Initial greeting script generated for AI Voice Agent
    const promptScript = `Hello ${customer.name}! This is the AI assistant calling from ${storeName}. We are checking in regarding your outstanding ledger balance of $${balance.toFixed(2)}. Would you like us to schedule a payment date, or dispatch an instant UPI payment link to your WhatsApp?`;

    res.json({
      success: true,
      message: `AI Voice call initiated for ${customer.name} (${customer.phone})`,
      call_sid: callSid,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        outstanding_balance: balance.toFixed(2)
      },
      agent_script: promptScript,
      webhook_endpoint: '/api/voice/webhook/call-response'
    });
  } catch (err) {
    next(err);
  }
};

// 3. GET /api/voice/scheduled-callbacks - List upcoming debtor callbacks
export const getScheduledCallbacks = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;

    const result = await db.query(
      `SELECT dcl.*, c.name as customer_name, c.phone as customer_phone
       FROM debtor_call_logs dcl
       JOIN customers c ON dcl.customer_id = c.id
       WHERE dcl.merchant_id = $1 AND dcl.callback_scheduled_at IS NOT NULL
       ORDER BY dcl.callback_scheduled_at ASC`,
      [merchantId]
    );

    const callbacks = result.rows || [];

    res.json({
      success: true,
      callbacks,
      count: callbacks.length
    });
  } catch (err) {
    next(err);
  }
};

// 4. GET /api/voice/call-logs - List all voice call history and intents
export const getCallLogs = async (req, res, next) => {
  try {
    const merchantId = req.merchant.id;
    const { customer_id } = req.query;

    const params = [merchantId];
    let query = `
      SELECT dcl.*, c.name as customer_name, c.phone as customer_phone
      FROM debtor_call_logs dcl
      JOIN customers c ON dcl.customer_id = c.id
      WHERE dcl.merchant_id = $1
    `;

    if (customer_id) {
      query += ` AND dcl.customer_id = $2`;
      params.push(parseInt(customer_id, 10));
    }

    query += ` ORDER BY dcl.created_at DESC`;

    const result = await db.query(query, params);
    const logs = result.rows || [];

    const promiseCount = logs.filter(l => l.intent === 'PROMISE_TO_PAY').length;
    const callbackCount = logs.filter(l => l.intent === 'REQUEST_CALLBACK').length;
    const paymentLinkCount = logs.filter(l => l.payment_link_sent).length;

    res.json({
      success: true,
      logs,
      summary: {
        totalCalls: logs.length,
        promisedToPayCount: promiseCount,
        callbacksScheduledCount: callbackCount,
        paymentLinksSentCount: paymentLinkCount
      }
    });
  } catch (err) {
    next(err);
  }
};
