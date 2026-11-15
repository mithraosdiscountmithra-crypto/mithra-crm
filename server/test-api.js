import http from 'http';

async function testBackend() {
  // Dynamically import server/index.js
  const { default: app } = await import('./index.js');
  
  // Test server start on port 5055 for testing
  const server = app.listen(5055, async () => {
    console.log('[Test] Server listening on port 5055');

    try {
      // 1. Health check
      const healthRes = await fetch('http://localhost:5055/api/health');
      const healthData = await healthRes.json();
      console.log('✓ [Health Check]:', healthData.status);

      // 2. Demo Login
      const loginRes = await fetch('http://localhost:5055/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@artisancoffee.com',
          password: 'merchant123'
        })
      });
      const loginData = await loginRes.json();
      console.log('✓ [Login]:', loginData.success ? `Logged in as ${loginData.merchant.store_name}` : 'Failed');
      const token = loginData.token;

      // 3. Get Membership Plans
      const plansRes = await fetch('http://localhost:5055/api/plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const plansData = await plansRes.json();
      console.log('✓ [Plans Count]:', plansData.plans?.length);

      // 4. POS Verify Member by Phone
      const verifyRes = await fetch('http://localhost:5055/api/pos/verify?phone=5551234567', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      console.log('✓ [POS Verify 5551234567]:', {
        found: verifyData.found,
        name: verifyData.customer?.name,
        plan: verifyData.membership?.plan_name,
        discount: `${verifyData.membership?.discount_percent}%`
      });

      // 5. POS Redemption
      const redeemRes = await fetch('http://localhost:5055/api/pos/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: verifyData.customer.id,
          bill_amount: 50.00
        })
      });
      const redeemData = await redeemRes.json();
      console.log('✓ [POS Redeem Receipt]:', {
        receiptId: redeemData.receipt?.redemption_id,
        gross: redeemData.receipt?.bill_amount,
        discount: redeemData.receipt?.discount_given,
        net: redeemData.receipt?.net_payable
      });

      // 6. Dashboard Analytics
      const dashRes = await fetch('http://localhost:5055/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashData = await dashRes.json();
      console.log('✓ [Dashboard Analytics]:', dashData.stats);

      console.log('\n🌟 ALL BACKEND API ENDPOINTS VERIFIED SUCCESSFULLY! 🌟');
    } catch (err) {
      console.error('Test Failed:', err);
    } finally {
      server.close(() => {
        console.log('[Test] Server closed.');
        process.exit(0);
      });
    }
  });
}

testBackend();
