const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

const runVerification = async () => {
  console.log(blue('Running Backend Health, Auth & Error Handling Verification...'));

  const app = require('../server');
  const connectDB = require('../config/db');

  let server;
  const PORT = 5001; // Use isolated port for test execution

  try {
    await connectDB();
    server = app.listen(PORT);
  } catch (err) {
    console.error(red(`Failed to start test server: ${err.message}`));
    process.exit(1);
  }

  const testEmail = `test_verifier_${Date.now()}@example.com`;
  const testPassword = 'Password@123';
  let token = null;

  try {
    // 1. Health check
    const health = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });
    if (health.status !== 200 || health.data.status !== 'healthy') {
      throw new Error(`Health check failed: ${JSON.stringify(health.data)}`);
    }
    console.log(green(`1. Health check endpoint OK: status=${health.data.status}, db=${health.data.database}`));

    // 2. Readiness check
    const ready = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/ready',
      method: 'GET',
    });
    if (ready.status !== 200 || ready.data.database !== 'connected') {
      throw new Error(`Readiness check failed: ${JSON.stringify(ready.data)}`);
    }
    console.log(green(`2. Database readiness endpoint OK: readyState=${ready.data.database}`));

    // 3. Validation: Register without required fields -> 400
    const badRegister = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Incomplete User' }
    );
    if (badRegister.status !== 400 || badRegister.data.success !== false) {
      throw new Error(`Validation check failed: expected 400, got ${badRegister.status}`);
    }
    console.log(green(`3. Validation error handled correctly (400 Bad Request): "${badRegister.data.message}"`));

    // 4. Registration: valid new user -> 201
    const regRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Verifier Test User', email: testEmail, password: testPassword }
    );
    if (regRes.status !== 201 || !regRes.data.token || !regRes.data.user) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    token = regRes.data.token;
    console.log(green(`4. User registration succeeded (201 Created) for ${testEmail}`));

    // 5. Duplicate Registration -> 400
    const dupRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Verifier Test User', email: testEmail, password: testPassword }
    );
    if (dupRes.status !== 400 || dupRes.data.success !== false) {
      throw new Error(`Duplicate registration expected 400, got ${dupRes.status}`);
    }
    console.log(green(`5. Duplicate registration correctly rejected (400 Bad Request): "${dupRes.data.message}"`));

    // 6. Login with valid credentials -> 200
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: testEmail, password: testPassword }
    );
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    console.log(green(`6. User login succeeded (200 OK) with JWT token`));

    // 7. Login with invalid password -> 401
    const badLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: testEmail, password: 'WrongPassword999' }
    );
    if (badLogin.status !== 401 || badLogin.data.success !== false) {
      throw new Error(`Invalid password expected 401, got ${badLogin.status}`);
    }
    console.log(green(`7. Invalid password correctly rejected (401 Unauthorized): "${badLogin.data.message}"`));

    // 8. Protected route with valid token -> 200
    const meRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meRes.status !== 200 || meRes.data.user?.email !== testEmail.toLowerCase()) {
      throw new Error(`Protected route /api/auth/me failed: ${JSON.stringify(meRes.data)}`);
    }
    console.log(green(`8. Protected route /api/auth/me verified (200 OK): user="${meRes.data.user.name}"`));

    // 9. Protected route without token -> 401
    const noTokenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
    });
    if (noTokenRes.status !== 401) {
      throw new Error(`Missing token expected 401, got ${noTokenRes.status}`);
    }
    console.log(green(`9. Missing token correctly rejected (401 Unauthorized)`));

    console.log('\n' + green('ALL AUTH, READINESS AND ERROR HANDLING VERIFICATIONS PASSED! 🎉'));
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(red(`Verification failed: ${err.message}`));
    if (server) server.close();
    process.exit(1);
  }
};

runVerification();
