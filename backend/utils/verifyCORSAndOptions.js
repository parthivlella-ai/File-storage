const http = require('http');

const green = (t) => `\x1b[32m✔ ${t}\x1b[0m`;
const red = (t) => `\x1b[31m✖ ${t}\x1b[0m`;
const blue = (t) => `\x1b[34mℹ ${t}\x1b[0m`;

const runCorsTests = async () => {
  console.log(blue('Testing CORS and OPTIONS Preflight configuration...'));

  // Start temporary server instance with CLIENT_URL configured
  process.env.CLIENT_URL = 'https://my-secure-hub.vercel.app';
  process.env.PORT = '5055';
  process.env.NODE_ENV = 'development';

  const app = require('../server');
  const server = app.listen(5055);

  const request = (options) => {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
      req.end();
    });
  };

  try {
    // 1. Test OPTIONS preflight for configured CLIENT_URL
    const preflight = await request({
      hostname: 'localhost',
      port: 5055,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        Origin: 'https://my-secure-hub.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    if (preflight.status !== 204) {
      throw new Error(`Preflight status expected 204, got ${preflight.status}`);
    }
    if (preflight.headers['access-control-allow-origin'] !== 'https://my-secure-hub.vercel.app') {
      throw new Error(`Expected allow-origin header, got ${preflight.headers['access-control-allow-origin']}`);
    }
    console.log(green('1. OPTIONS preflight request succeeded with status 204 and correct CORS headers'));

    // 2. Test GET request with configured Origin
    const getRes = await request({
      hostname: 'localhost',
      port: 5055,
      path: '/api/health',
      method: 'GET',
      headers: {
        Origin: 'https://my-secure-hub.vercel.app',
      },
    });

    if (getRes.headers['access-control-allow-origin'] !== 'https://my-secure-hub.vercel.app') {
      throw new Error(`Expected allow-origin on GET, got ${getRes.headers['access-control-allow-origin']}`);
    }
    console.log(green('2. GET request with authorized origin returned Access-Control-Allow-Origin header'));

    // 3. Test Localhost dev origin allowed in development
    const devRes = await request({
      hostname: 'localhost',
      port: 5055,
      path: '/api/health',
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    if (devRes.headers['access-control-allow-origin'] !== 'http://localhost:5173') {
      throw new Error(`Expected dev origin to be allowed, got ${devRes.headers['access-control-allow-origin']}`);
    }
    console.log(green('3. Local development origin (http://localhost:5173) allowed'));

    console.log('\n' + green('ALL CORS AND PREFLIGHT VERIFICATIONS PASSED! 🎉'));
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(red(`CORS verification failed: ${err.message}`));
    server.close();
    process.exit(1);
  }
};

runCorsTests();

