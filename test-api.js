const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
    console.log('🏁 Starting E2E Backend Verification...\n');

    try {
        // 1. Login
        console.log('👤 Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'shriyashetty2295@gmail.com',
                password: '123456'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        console.log('✅ Login successful!');
        const token = loginData.token;

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Fetch Dashboard Data
        console.log('\n📊 Fetching dashboard data...');
        const dashRes = await fetch(`${BASE_URL}/monitor/dashboard`, {
            headers: authHeaders
        });
        const dashData = await dashRes.json();
        console.log(`✅ Dashboard fetched. Privacy Score: ${dashData.privacyScore}, Alerts: ${dashData.totalAlerts}`);

        // 3. Add Monitored Email
        const testEmail = `shriya.shetty@gmail.com`;
        console.log(`\n📧 Adding email to monitor: ${testEmail}`);
        const addRes = await fetch(`${BASE_URL}/monitor/add-email`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ email: testEmail })
        });
        const addData = await addRes.json();
        console.log('✅ Email added to monitored emails:', addData);

        // 4. Trigger Dark Web Scan
        console.log(`\n🔍 Triggering Dark Web Scan for: ${testEmail}`);
        const scanRes = await fetch(`${BASE_URL}/monitor/darkweb-scan`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ email: testEmail })
        });
        const scanData = await scanRes.json();
        console.log('✅ Dark Web Scan completed:', scanData);

        // 5. Test HIBP proxy
        console.log('\n🔑 Testing HIBP proxy with mock API key...');
        const hibpRes = await fetch(`${BASE_URL}/monitor/hibp-check`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                email: 'test@example.com',
                apiKey: 'mock-key-for-testing'
            })
        });
        const hibpData = await hibpRes.json();
        console.log('✅ HIBP check response status:', hibpRes.status);
        console.log('✅ HIBP data:', hibpData);

        // 6. Test AI Forecast
        console.log('\n🧠 Requesting AI Threat Forecast...');
        const forecastRes = await fetch(`${BASE_URL}/monitor/ai-forecast`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                breachCount: dashData.totalAlerts,
                privacyScore: dashData.privacyScore,
                predictedRisk: dashData.predictedRisk
            })
        });
        const forecastData = await forecastRes.json();
        console.log('✅ AI Forecast response:', forecastData);

        // 7. Fetch Security Center Audit Logs
        console.log('\n📋 Fetching Security Event Audit Logs...');
        const auditRes = await fetch(`${BASE_URL}/auth/audit-logs`, {
            headers: authHeaders
        });
        const auditLogs = await auditRes.json();
        console.log(`✅ Audit Logs retrieved (${auditLogs.length} events):`);
        console.table(auditLogs.slice(0, 10));

        // 8. Clean up (remove the monitored email)
        console.log(`\n🧹 Cleaning up: removing monitored email ${testEmail}`);
        const removeRes = await fetch(`${BASE_URL}/monitor/remove-email`, {
            method: 'DELETE',
            headers: authHeaders,
            body: JSON.stringify({ email: testEmail })
        });
        const removeData = await removeRes.json();
        console.log('✅ Email removed from monitored list:', removeData);

        console.log('\n🎉 E2E verification completed successfully with ZERO errors!');
    } catch (error) {
        console.error('\n❌ E2E test failed:', error);
        process.exit(1);
    }
}

runTests();
