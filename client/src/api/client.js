const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Universal API fetcher that automatically attaches JWT token
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('loyalty_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({ success: false, error: 'Network response was not JSON' }));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Authentication & Profile
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    register: (details) => request('/auth/register', { method: 'POST', body: details }),
    getProfile: () => request('/auth/profile'),
    updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),
  },

  // Membership Plans
  plans: {
    getAll: () => request('/plans'),
    create: (planData) => request('/plans', { method: 'POST', body: planData }),
    update: (id, planData) => request(`/plans/${id}`, { method: 'PUT', body: planData }),
    delete: (id) => request(`/plans/${id}`, { method: 'DELETE' }),
  },

  // Customers
  customers: {
    getAll: () => request('/customers'),
    create: (customerData) => request('/customers', { method: 'POST', body: customerData }),
    update: (id, customerData) => request(`/customers/${id}`, { method: 'PUT', body: customerData }),
    delete: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  },

  // Memberships
  memberships: {
    assign: (data) => request('/memberships/assign', { method: 'POST', body: data }),
    cancel: (id) => request(`/memberships/${id}/cancel`, { method: 'PATCH' }),
  },

  // Fast POS cashier workflows
  pos: {
    verifyPhone: (phone) => request(`/pos/verify?phone=${encodeURIComponent(phone)}`),
    redeem: (redemptionData) => request('/pos/redeem', { method: 'POST', body: redemptionData }),
    getRedemptions: (limit = 50) => request(`/pos/redemptions?limit=${limit}`),
  },

  // Analytics & Dashboard
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
  },

  // Inventory & Stock Management
  products: {
    getAll: (params = '') => request(`/products${params ? `?${params}` : ''}`),
    getLowStock: () => request('/products/low-stock'),
    getById: (id) => request(`/products/${id}`),
    create: (data) => request('/products', { method: 'POST', body: data }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },

  // Digital Udhaar / Customer Khata Ledger
  udhaar: {
    getSummary: () => request('/udhaar'),
    getCustomerLedger: (customerId) => request(`/udhaar/${customerId}`),
    addEntry: (data) => request('/udhaar', { method: 'POST', body: data }),
    settle: (id) => request(`/udhaar/${id}/settle`, { method: 'PUT' }),
  },

  // Expense & P&L Accounting
  expenses: {
    getAll: (params = '') => request(`/expenses${params ? `?${params}` : ''}`),
    getPnL: () => request('/expenses/pnl'),
    create: (data) => request('/expenses', { method: 'POST', body: data }),
    delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  },

  // Staff Attendance & Payroll
  staff: {
    getAll: () => request('/staff'),
    create: (data) => request('/staff', { method: 'POST', body: data }),
    update: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
    getAttendance: (date = '') => request(`/staff/attendance${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    markAttendance: (data) => request('/staff/attendance', { method: 'POST', body: data }),
  },

  // Bulk WhatsApp Marketing
  whatsapp: {
    getCampaigns: () => request('/whatsapp/campaigns'),
    createCampaign: (data) => request('/whatsapp/campaigns', { method: 'POST', body: data }),
    getAudience: (targetSegment = 'ALL', templateMessage = '') =>
      request(`/whatsapp/audience?target_segment=${encodeURIComponent(targetSegment)}&template_message=${encodeURIComponent(templateMessage)}`),
  },

  // Suppliers & Vendor Management
  suppliers: {
    getAll: () => request('/suppliers'),
    getById: (id) => request(`/suppliers/${id}`),
    create: (data) => request('/suppliers', { method: 'POST', body: data }),
    update: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
    getLedger: (id) => request(`/suppliers/${id}/ledger`),
    recordPayment: (data) => request('/suppliers/payment', { method: 'POST', body: data }),
  },

  // Purchase Orders & Inwarding
  purchaseOrders: {
    getAll: () => request('/purchase-orders'),
    getById: (id) => request(`/purchase-orders/${id}`),
    create: (data) => request('/purchase-orders', { method: 'POST', body: data }),
    updateStatus: (id, status) => request(`/purchase-orders/${id}/status`, { method: 'PUT', body: { status } }),
  },

  // AI Business Assistant (Copilot)
  ai: {
    chat: (message, conversationHistory = []) =>
      request('/ai/chat', { method: 'POST', body: { message, conversationHistory } }),
  },

  // AI Voice Agent & Callback Scheduler (Digital Khata Debtors)
  voice: {
    triggerCall: (customerId) => request('/voice/trigger-call', { method: 'POST', body: { customer_id: customerId } }),
    sendWebhookResponse: (data) => request('/voice/webhook/call-response', { method: 'POST', body: data }),
    getScheduledCallbacks: () => request('/voice/scheduled-callbacks'),
    getCallLogs: (customerId = '') => request(`/voice/call-logs${customerId ? `?customer_id=${customerId}` : ''}`),
  },

  // Customer Digital Storefront & Ordering
  customer: {
    getProducts: (tenantId = 1) => request(`/customer/products?tenant_id=${tenantId}`),
    checkMembership: (tenantId = 1, phone = '') =>
      request(`/customer/membership-check?tenant_id=${tenantId}&phone=${encodeURIComponent(phone)}`),
    placeOrder: (data) => request('/customer/orders', { method: 'POST', body: data }),
    getOrders: (tenantId = 1, phone = '') =>
      request(`/customer/orders?tenant_id=${tenantId}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`),
    getMerchantOrders: () => request('/customer/merchant-orders'),
    updateOrderStatus: (id, status) => request(`/customer/orders/${id}/status`, { method: 'PUT', body: { status } }),
  },

  // 1. Marketing Pillar (AiSensy, Coupons, Greetings)
  marketing: {
    triggerAiSensy: (data) => request('/marketing/aisensy-campaign', { method: 'POST', body: data }),
    getCoupons: () => request('/marketing/coupons'),
    createCoupon: (data) => request('/marketing/coupons', { method: 'POST', body: data }),
    verifyCoupon: (code, bill_amount) => request('/marketing/coupons/verify', { method: 'POST', body: { code, bill_amount } }),
    deleteCoupon: (id) => request(`/marketing/coupons/${id}`, { method: 'DELETE' }),
    getGreetings: () => request('/marketing/greetings'),
    triggerGreeting: (id) => request(`/marketing/greetings/${id}/trigger`, { method: 'POST' }),
  },

  // 2. Sales Pillar (Daily Sales Analytics & Breakdown)
  sales: {
    getDailyAnalytics: () => request('/sales/daily-analytics'),
  },

  // 3. Operations Pillar (Auto-PO & Health Summary)
  operations: {
    generateAutoPO: () => request('/operations/auto-po', { method: 'POST' }),
    getSummary: () => request('/operations/summary'),
  },

  // 4. R&D Pillar (Feedback, Experiments, Beta Logs)
  rd: {
    getFeedback: () => request('/rd/feedback'),
    submitFeedback: (data) => request('/rd/feedback', { method: 'POST', body: data }),
    getExperiments: () => request('/rd/experiments'),
    createExperiment: (data) => request('/rd/experiments', { method: 'POST', body: data }),
    updateExperimentStatus: (id, status) => request(`/rd/experiments/${id}/status`, { method: 'PUT', body: { status } }),
    getBetaLogs: () => request('/rd/beta-logs'),
    submitBetaLog: (data) => request('/rd/beta-logs', { method: 'POST', body: data }),
    updateBetaLogStatus: (id, status) => request(`/rd/beta-logs/${id}/status`, { method: 'PUT', body: { status } }),
  },

  // 5. Accounts & Finance Pillar (GST & Tax Compliance Report)
  finance: {
    getTaxReport: () => request('/finance/tax-report'),
  },

  // 6. HR & Staff Pillar (Payroll & RBAC Matrix)
  hr: {
    getPayrollCalculation: () => request('/hr/payroll-calculation'),
    getRBACMatrix: () => request('/hr/rbac'),
    updateRBACRole: (id, data) => request(`/hr/rbac/${id}`, { method: 'PUT', body: data }),
  },

  // 7. Executive Dashboard Pillar (CEO KPI Suite & Multi-Branch)
  executive: {
    getOverview: () => request('/executive/overview'),
  }
};

export default api;
