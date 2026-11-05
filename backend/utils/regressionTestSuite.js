/**
 * Comprehensive End-to-End Regression Test Suite for Secure File Hub
 * Tests all authentication, file management, folder, sharing, tenant isolation, and admin workflows.
 */
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const green = (t) => `\x1b[32m✔ ${t}\x1b[0m`;
const red = (t) => `\x1b[31m✖ ${t}\x1b[0m`;
const blue = (t) => `\x1b[34mℹ ${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m⚠ ${t}\x1b[0m`;

const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

    if (data) {
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
};

const createMultipartPayload = (files, boundary) => {
  const buffers = [];
  files.forEach((f) => {
    buffers.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${f.filename}"\r\nContent-Type: ${f.contentType || 'application/octet-stream'}\r\n\r\n`
      )
    );
    buffers.push(Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content));
    buffers.push(Buffer.from('\r\n'));
  });
  buffers.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(buffers);
};

const runRegressionSuite = async () => {
  console.log(blue('======================================================================'));
  console.log(blue('🚀 STARTING COMPREHENSIVE REGRESSION AUDIT: SECURE FILE HUB'));
  console.log(blue('======================================================================\n'));

  const app = require('../server');
  const connectDB = require('../config/db');
  const User = require('../models/User');

  const PORT = 5003;
  let server;

  try {
    await connectDB();
    server = app.listen(PORT);
    console.log(green(`Test HTTP Server listening on port ${PORT}`));
  } catch (err) {
    console.error(red(`FATAL: Could not initialize test server: ${err.message}`));
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const record = (name, passed, detail = '') => {
    if (passed) {
      results.passed++;
      results.tests.push({ name, status: 'PASSED', detail });
      console.log(green(`PASS: ${name} ${detail ? `(${detail})` : ''}`));
    } else {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', detail });
      console.error(red(`FAIL: ${name} ${detail ? `- ${detail}` : ''}`));
    }
  };

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: SYSTEM HEALTH & READINESS PROBES
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 1. SYSTEM LIVENESS & READINESS PROBES ---'));

    const healthRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });
    record('Liveness Probe (/api/health)', healthRes.status === 200 && healthRes.data.status === 'healthy', `db: ${healthRes.data.database}`);

    const readyRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/ready',
      method: 'GET',
    });
    record('Readiness Probe (/api/ready)', readyRes.status === 200 && readyRes.data.database === 'connected');

    // -------------------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & SESSION MANAGEMENT
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 2. AUTHENTICATION & ACCESS CONTROL ---'));

    const timestamp = Date.now();
    const userA_Email = `alice_${timestamp}@testvault.com`;
    const userB_Email = `bob_${timestamp}@testvault.com`;
    const adminEmail = `admin_${timestamp}@testvault.com`;
    const testPassword = 'Password@Secure2026!';

    // Register User A
    const regUserA = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Alice Walker', email: userA_Email, password: testPassword }
    );
    record('User A Registration', regUserA.status === 201 && !!regUserA.data.token, `ID: ${regUserA.data.user?._id}`);
    const tokenA = regUserA.data.token;
    const userA_Id = regUserA.data.user?._id;

    // Register User B
    const regUserB = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Bob Smith', email: userB_Email, password: testPassword }
    );
    record('User B Registration', regUserB.status === 201 && !!regUserB.data.token);
    const tokenB = regUserB.data.token;
    const userB_Id = regUserB.data.user?._id;

    // Create Admin User directly in DB with admin role
    const adminUser = await User.create({
      name: 'Super Administrator',
      email: adminEmail,
      password: testPassword,
      role: 'admin',
    });
    const adminLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: adminEmail, password: testPassword }
    );
    record('Admin Authentication & Role verification', adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'admin');
    const adminToken = adminLoginRes.data.token;

    // Validation: Duplicate Registration
    const dupReg = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Alice Duplicate', email: userA_Email, password: testPassword }
    );
    record('Duplicate Email Registration Blocked (400)', dupReg.status === 400 && dupReg.data.success === false);

    // Validation: Invalid Password Login
    const badLogin = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: userA_Email, password: 'WrongPassword999!' }
    );
    record('Invalid Password Login Blocked (401)', badLogin.status === 401 && badLogin.data.success === false);

    // Session Restoration: /api/auth/me
    const meRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    record('Session Restoration (/api/auth/me)', meRes.status === 200 && meRes.data.user?.email === userA_Email);

    // Profile Update: /api/auth/profile
    const updateProfileRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/profile',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      },
      { name: 'Alice Walker Updated' }
    );
    record('User Profile Update (/api/auth/profile)', updateProfileRes.status === 200 && updateProfileRes.data.user?.name === 'Alice Walker Updated');

    // Password Change: /api/auth/change-password
    const newPassword = 'NewSecretPassword2026!';
    const changePwRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/change-password',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      },
      { currentPassword: testPassword, newPassword }
    );
    record('Password Change Workflow', changePwRes.status === 200 && changePwRes.data.success === true);

    // Verify Login with New Password
    const loginNewPw = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: userA_Email, password: newPassword }
    );
    record('Login with New Password Succeeded', loginNewPw.status === 200 && !!loginNewPw.data.token);
    const updatedTokenA = loginNewPw.data.token;

    // Token Validation: Expired or Tampered Token
    const tamperedRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' },
    });
    record('Tampered/Invalid JWT Blocked (401)', tamperedRes.status === 401);

    // -------------------------------------------------------------------------
    // SECTION 3: FOLDER MANAGEMENT & NESTING
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 3. FOLDER CREATION, NESTING & BREADCRUMBS ---'));

    // Create Root Folder
    const rootFolderRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/folders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { name: 'Projects 2026', color: '#3b82f6' }
    );
    record('Root Folder Creation', rootFolderRes.status === 201 && !!rootFolderRes.data.folder);
    const rootFolderId = rootFolderRes.data.folder?._id;

    // Create Nested Subfolder
    const subfolderRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/folders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { name: 'Design Specs', parentFolder: rootFolderId, color: '#10b981' }
    );
    record('Nested Subfolder Creation', subfolderRes.status === 201 && subfolderRes.data.folder?.parentFolder === rootFolderId);
    const subfolderId = subfolderRes.data.folder?._id;

    // Create Deeply Nested Subfolder
    const deepFolderRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/folders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { name: 'Mobile App Mockups', parentFolder: subfolderId, color: '#f59e0b' }
    );
    record('Deeply Nested Folder Creation (3 levels)', deepFolderRes.status === 201);
    const deepFolderId = deepFolderRes.data.folder?._id;

    // Breadcrumb Navigation
    const breadcrumbRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/folders/${deepFolderId}/breadcrumbs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    const crumbs = breadcrumbRes.data.breadcrumbs || [];
    record(
      'Hierarchical Breadcrumb Resolution',
      breadcrumbRes.status === 200 && crumbs.length === 3 && crumbs[0].name === 'Projects 2026' && crumbs[2].name === 'Mobile App Mockups',
      `crumbs: ${crumbs.map((c) => c.name).join(' > ')}`
    );

    // Rename Folder
    const renameFolderRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/folders/${deepFolderId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { name: 'Mobile App High-Fidelity UI' }
    );
    record('Folder Renaming', renameFolderRes.status === 200 && renameFolderRes.data.folder?.name === 'Mobile App High-Fidelity UI');

    // -------------------------------------------------------------------------
    // SECTION 4: FILE UPLOAD, MULTI-UPLOAD, STORAGE & STREAMING
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 4. FILE UPLOADS, DOWNLOADS & STREAMING ---'));

    // Upload Single File to Nested Folder
    const boundarySingle = '----WebKitFormBoundarySingle' + timestamp;
    const documentBody = 'CONFIDENTIAL SPECIFICATION 2026\r\nAntigravity Cloud Storage System Documentation.';
    const singlePayload = createMultipartPayload(
      [{ filename: 'Project_Specification.pdf', contentType: 'application/pdf', content: documentBody }],
      boundarySingle
    );

    const uploadSingleRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/files/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundarySingle}`,
          'Content-Length': singlePayload.length,
          Authorization: `Bearer ${updatedTokenA}`,
        },
      },
      singlePayload
    );
    record('Single File Upload (PDF)', uploadSingleRes.status === 201 && uploadSingleRes.data.files?.length === 1);
    const fileA = uploadSingleRes.data.files?.[0];

    // Upload Multiple Files in Batch (Image, Text, Audio)
    const boundaryMulti = '----WebKitFormBoundaryMulti' + timestamp;
    const multiPayload = createMultipartPayload(
      [
        { filename: 'app_icon.png', contentType: 'image/png', content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
        { filename: 'meeting_notes.txt', contentType: 'text/plain', content: 'Discussion on cloud file storage architecture.' },
        { filename: 'intro_theme.mp3', contentType: 'audio/mpeg', content: Buffer.alloc(1024, 0x55) },
      ],
      boundaryMulti
    );

    const uploadMultiRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/files/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundaryMulti}`,
          'Content-Length': multiPayload.length,
          Authorization: `Bearer ${updatedTokenA}`,
        },
      },
      multiPayload
    );
    record('Batch Upload Multiple Files (3 files)', uploadMultiRes.status === 201 && uploadMultiRes.data.files?.length === 3);

    // Download File Content
    const downloadRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/download`,
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record(
      'File Download Streaming',
      downloadRes.status === 200 && downloadRes.headers['content-disposition']?.includes('Project_Specification.pdf'),
      `Content-Length: ${downloadRes.headers['content-length']}`
    );

    // Preview File with HTTP Range Streaming (Audio/Video support)
    const previewRangeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/preview`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${updatedTokenA}`,
        Range: 'bytes=0-20',
      },
    });
    record('Media Preview Range Streaming (206 Partial Content)', previewRangeRes.status === 206 && !!previewRangeRes.headers['content-range']);

    // Signed URL Endpoint
    const signedUrlRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/signed-url?type=download`,
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('Signed URL Endpoint (/api/files/:id/signed-url)', signedUrlRes.status === 200 && signedUrlRes.data.success === true);

    // Star / Unstar File
    const starRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/files/${fileA._id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { isStarred: true }
    );
    record('Star File (/api/files/:id)', starRes.status === 200 && starRes.data.file?.isStarred === true);

    // Rename File
    const renameFileRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/files/${fileA._id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${updatedTokenA}` },
      },
      { name: 'Final_Audited_Project_Specification.pdf' }
    );
    record('Rename File', renameFileRes.status === 200 && renameFileRes.data.file?.originalName === 'Final_Audited_Project_Specification.pdf');

    // Search Files by Keyword
    const searchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/files/search?q=Specification',
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('Search Files by Keyword', searchRes.status === 200 && searchRes.data.files?.length >= 1);

    // -------------------------------------------------------------------------
    // SECTION 5: TENANT ISOLATION & PERMISSION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 5. MULTI-TENANT ISOLATION & ACCESS SECURITY ---'));

    // User B tries to download User A's private file
    const leakDownloadRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/download`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    record('Cross-Tenant Download Blocked (403 Forbidden)', leakDownloadRes.status === 403);

    // User B tries to preview User A's private file
    const leakPreviewRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/preview`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    record('Cross-Tenant Preview Blocked (403 Forbidden)', leakPreviewRes.status === 403);

    // User B tries to delete User A's file
    const leakDeleteRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    record('Cross-Tenant Modification/Deletion Blocked (404/403)', leakDeleteRes.status === 404);

    // User B lists files - User A's files must not appear
    const userBFilesRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/files?folderId=all',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBFiles = userBFilesRes.data.files || [];
    const hasLeak = userBFiles.some((f) => f._id === fileA._id);
    record('File Listing Data Isolation (User A files hidden from User B)', userBFilesRes.status === 200 && !hasLeak);

    // Public File Sharing Token Access
    const shareToken = fileA.shareToken;
    const tokenDownloadRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/download?shareToken=${shareToken}`,
      method: 'GET',
    });
    record('Public Access via Secure Share Token (Unauthenticated Download)', tokenDownloadRes.status === 200);

    // -------------------------------------------------------------------------
    // SECTION 6: TRASH, RESTORE & PERMANENT DELETION
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 6. TRASH LIFECYCLE & STORAGE RECLAMATION ---'));

    // Soft Delete (Move to Trash)
    const trashFileRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('File Soft Delete (Move to Trash)', trashFileRes.status === 200);

    // Verify in Trash List
    const trashListRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/trash',
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    const inTrash = (trashListRes.data.files || []).some((f) => f._id === fileA._id);
    record('File Appears in Trashed Items List', inTrash);

    // Restore from Trash
    const restoreFileRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/trash/files/${fileA._id}/restore`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('File Restoration from Trash', restoreFileRes.status === 200);

    // Trash again to test Permanent Deletion
    await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });

    // Permanent Deletion
    const permDeleteRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/trash/files/${fileA._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('Permanent Deletion & Storage Quota Reclaimed', permDeleteRes.status === 200);

    // Verify Deleted File Cannot Be Downloaded
    const deletedDownloadRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/files/${fileA._id}/download`,
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    record('Permanently Deleted File Returns 404', deletedDownloadRes.status === 404);

    // -------------------------------------------------------------------------
    // SECTION 7: DASHBOARD METRICS & STORAGE AGGREGATIONS
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 7. DASHBOARD METRICS & STORAGE AGGREGATIONS ---'));

    const dashboardRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/stats/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${updatedTokenA}` },
    });
    const stats = dashboardRes.data.stats;
    record(
      'Dashboard Analytics & Storage Quota Calculation',
      dashboardRes.status === 200 && stats && typeof stats.storageUsed === 'number' && stats.categories?.images !== undefined,
      `storageUsed: ${stats?.storageUsed} bytes, limit: ${stats?.storageLimit} bytes`
    );

    // -------------------------------------------------------------------------
    // SECTION 8: ADMIN OPERATIONS, GOVERNANCE & BLOCKING
    // -------------------------------------------------------------------------
    console.log(blue('\n--- 8. ADMIN GOVERNANCE, TELEMETRY & USER BLOCKING ---'));

    // Non-Admin User B tries to access Admin endpoints
    const forbiddenAdminRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    record('Non-Admin Denied Access to Admin Telemetry (403)', forbiddenAdminRes.status === 403);

    // Admin accesses system-wide stats
    const adminStatsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record(
      'Admin System-Wide Telemetry (/api/admin/stats)',
      adminStatsRes.status === 200 && adminStatsRes.data.stats?.totalUsers >= 2,
      `totalUsers: ${adminStatsRes.data.stats?.totalUsers}`
    );

    // Admin lists all users with pagination
    const adminUsersRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/admin/users?limit=10',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Admin User Governance Listing (/api/admin/users)', adminUsersRes.status === 200 && adminUsersRes.data.users?.length >= 2);

    // Admin Updates User Storage Quota
    const quotaRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/admin/users/${userB_Id}/quota`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      },
      { storageLimitGB: 25 }
    );
    record('Admin Storage Quota Adjustment (Updated to 25GB)', quotaRes.status === 200 && quotaRes.data.storageLimit === 25 * 1024 * 1024 * 1024);

    // Admin Blocks User B
    const blockRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/admin/users/${userB_Id}/toggle-block`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Admin Suspended User Account', blockRes.status === 200 && blockRes.data.isBlocked === true);

    // Blocked User B tries to login
    const blockedLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: userB_Email, password: testPassword }
    );
    record('Suspended User Login Blocked (403 Forbidden)', blockedLoginRes.status === 403 && blockedLoginRes.data.message.includes('suspended'));

    // Blocked User B's existing token blocked on protected route
    const blockedSessionRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    record('Suspended User Active Session Intercepted (403)', blockedSessionRes.status === 403);

    // Admin Unblocks User B
    const unblockRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/admin/users/${userB_Id}/toggle-block`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Admin Reactivated User Account', unblockRes.status === 200 && unblockRes.data.isBlocked === false);

    // User B can now log in again
    const reactivatedLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: userB_Email, password: testPassword }
    );
    record('Reactivated User Login Succeeded', reactivatedLoginRes.status === 200 && !!reactivatedLoginRes.data.token);

    // -------------------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------------------
    console.log(blue('\n======================================================================'));
    console.log(blue('📊 REGRESSION AUDIT SUMMARY:'));
    console.log(green(`   ✔ Tests Passed: ${results.passed}`));
    console.log(red(`   ✖ Tests Failed: ${results.failed}`));
    console.log(blue(`   📈 Total Tests: ${results.passed + results.failed}`));
    console.log(blue('======================================================================\n'));

    server.close();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(red(`\nFATAL UNHANDLED ERROR IN REGRESSION SUITE: ${err.message}`));
    console.error(err.stack);
    if (server) server.close();
    process.exit(1);
  }
};

runRegressionSuite();

