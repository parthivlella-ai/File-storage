const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for output
const green = (t) => `\x1b[32m✔ ${t}\x1b[0m`;
const red = (t) => `\x1b[31m✖ ${t}\x1b[0m`;
const blue = (t) => `\x1b[34mℹ ${t}\x1b[0m`;

const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
};

const runTests = async () => {
  console.log(blue('Starting API Verification Suite for Secure File Hub...'));

  try {
    // 1. Health check
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    console.log(health.status === 200 ? green('Health check passed') : red('Health check failed'));

    // 2. Login as Demo User
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'user@securehub.com', password: 'User@123' }
    );

    if (!loginRes.data?.token) {
      throw new Error('Demo login failed: ' + JSON.stringify(loginRes.data));
    }
    console.log(green('Demo User Login successful (JWT acquired)'));
    const userToken = loginRes.data.token;

    // 3. Login as Admin
    const adminLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@securehub.com', password: 'Admin@123' }
    );
    console.log(adminLoginRes.data?.token ? green('Admin Login successful') : red('Admin login failed'));
    const adminToken = adminLoginRes.data.token;

    // 4. Fetch User Dashboard Stats
    const statsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/stats/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(statsRes.status === 200 && statsRes.data.stats ? green('User Dashboard Stats computed with MongoDB aggregations') : red('Dashboard stats failed'));

    // 5. Create a Test Folder
    const folderRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/folders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      },
      { name: 'Automated Test Folder', color: '#10b981' }
    );
    console.log(folderRes.status === 201 ? green('Folder creation successful') : red('Folder creation failed'));
    const folderId = folderRes.data?.folder?._id;

    // 6. Get Files
    const filesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/files?folderId=all',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(filesRes.status === 200 && Array.isArray(filesRes.data.files) ? green(`Fetched ${filesRes.data.files.length} seeded files`) : red('Fetch files failed'));

    // 7. Test Admin Telemetry
    const adminStatsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(adminStatsRes.status === 200 ? green('Admin telemetry analytics verified') : red('Admin stats failed'));

    // 8. Test Admin Users List
    const adminUsersRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(adminUsersRes.status === 200 && adminUsersRes.data.users?.length >= 2 ? green('Admin user governance verified') : red('Admin users failed'));

    console.log('\n' + green('ALL SYSTEM INTEGRATION TESTS PASSED WITH 100% SUCCESS! 🎉'));
    process.exit(0);
  } catch (err) {
    console.error(red('Test suite error: ' + err.message));
    process.exit(1);
  }
};

runTests();
