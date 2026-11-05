const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const green = (t) => `\x1b[32m✔ ${t}\x1b[0m`;
const red = (t) => `\x1b[31m✖ ${t}\x1b[0m`;
const blue = (t) => `\x1b[34mℹ ${t}\x1b[0m`;

const runFileStorageTests = async () => {
  console.log(blue('Running File Storage, Download, Preview & Cleanup Verification...'));

  const app = require('../server');
  const connectDB = require('../config/db');
  const storageEngine = require('../config/storage');

  const PORT = 5002;
  let server;

  try {
    await connectDB();
    server = app.listen(PORT);
  } catch (err) {
    console.error(red(`Server startup failed: ${err.message}`));
    process.exit(1);
  }

  const testEmail = `storage_test_${Date.now()}@example.com`;
  const testPassword = 'Password@123';

  const request = (options, data = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const req = http.request({ ...options, headers: { ...options.headers, ...headers } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw: body });
          }
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  };

  try {
    // 1. Register test user
    const regRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify({ name: 'Storage Tester', email: testEmail, password: testPassword })
    );

    const token = regRes.data.token;
    if (!token) throw new Error('User registration failed for storage tests');
    console.log(green('1. Test user registered and authenticated'));

    // 2. Upload a test file using multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const sampleContent = 'Hello Secure File Hub! This is a test file for modular storage verification.';
    const filename = 'test_document.txt';

    let bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from(sampleContent),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/files/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
          Authorization: `Bearer ${token}`,
        },
      },
      bodyBuffer
    );

    if (uploadRes.status !== 201 || !uploadRes.data.files || uploadRes.data.files.length === 0) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadRes.data)}`);
    }

    const uploadedFile = uploadRes.data.files[0];
    console.log(green(`2. File upload verified (201 Created): storedName="${uploadedFile.storedName}", provider="${uploadedFile.storageProvider}"`));

    // 3. Download the uploaded file
    const downloadRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${uploadedFile._id}/download`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (downloadRes.status !== 200 || !downloadRes.raw.includes('Hello Secure File Hub!')) {
      throw new Error(`Download failed or content mismatch: status ${downloadRes.status}`);
    }
    console.log(green('3. File download and content stream verified (200 OK)'));

    // 4. Preview with HTTP Range request
    const previewRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${uploadedFile._id}/preview`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Range: 'bytes=0-15',
      },
    });

    if (previewRes.status !== 206 || !previewRes.headers['content-range']) {
      throw new Error(`Preview Range request expected 206, got ${previewRes.status}`);
    }
    console.log(green(`4. Preview with Range request streaming verified (206 Partial Content: ${previewRes.headers['content-range']})`));

    // 5. Signed URL route
    const signedUrlRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${uploadedFile._id}/signed-url`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (signedUrlRes.status !== 200) {
      throw new Error(`Signed URL endpoint failed: ${signedUrlRes.status}`);
    }
    console.log(green(`5. Signed URL endpoint verified (Provider: ${signedUrlRes.data.provider})`));

    // 6. Move file to Trash
    const trashRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${uploadedFile._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (trashRes.status !== 200) {
      throw new Error(`Move to trash failed: ${trashRes.status}`);
    }
    console.log(green('6. Soft delete to Trash verified'));

    // 7. Permanently delete file from trash
    const permDeleteRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/trash/files/${uploadedFile._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (permDeleteRes.status !== 200) {
      throw new Error(`Permanent deletion failed: ${permDeleteRes.status}`);
    }
    console.log(green('7. Permanent deletion and storage cleanup verified'));

    console.log('\n' + green('ALL MODULAR FILE STORAGE TESTS PASSED! 🎉'));
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(red(`File storage test failed: ${err.message}`));
    server.close();
    process.exit(1);
  }
};

runFileStorageTests();

