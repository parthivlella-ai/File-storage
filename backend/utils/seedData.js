const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Folder = require('../models/Folder');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const storageEngine = require('../config/storage');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secure_file_hub';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing data
    await User.deleteMany();
    await Folder.deleteMany();
    await File.deleteMany();
    await ActivityLog.deleteMany();
    console.log('[Seed] Cleared existing database records');

    // 1. Create Admin & Demo Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@securehub.com',
      password: 'Admin@123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      storageLimit: 50 * 1024 * 1024 * 1024, // 50GB
    });

    const demoUser = await User.create({
      name: 'Alex Johnson',
      email: 'user@securehub.com',
      password: 'User@123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
    });

    console.log('[Seed] Created default users:');
    console.log('   Admin: admin@securehub.com / Admin@123');
    console.log('   User : user@securehub.com / User@123');

    // 2. Create Folders for Demo User
    const docFolder = await Folder.create({
      name: 'Company Documents',
      owner: demoUser._id,
      color: '#3b82f6',
    });

    const mediaFolder = await Folder.create({
      name: 'Design Assets',
      owner: demoUser._id,
      color: '#10b981',
    });

    const projectFolder = await Folder.create({
      name: 'Cloud Storage Spec 2026',
      owner: demoUser._id,
      parentFolder: docFolder._id,
      color: '#8b5cf6',
    });

    // 3. Create real physical sample files on disk and corresponding File documents
    const userDir = storageEngine.getUserUploadDir(demoUser._id);

    const sampleFilesConfig = [
      {
        name: 'Project_Architecture_Overview.pdf',
        mime: 'application/pdf',
        category: 'pdf',
        folder: projectFolder._id,
        content: '%PDF-1.4\n1 0 obj\n<< /Title (Secure File Hub Architecture) /Author (Alex Johnson) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
        size: 1024 * 45, // 45 KB
      },
      {
        name: 'Q3_Financial_Summary.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        category: 'documents',
        folder: docFolder._id,
        content: 'Quarter,Revenue,Expenses,Net Profit\nQ1,$120000,$80000,$40000\nQ2,$150000,$90000,$60000\nQ3,$190000,$105000,$85000',
        size: 1024 * 128, // 128 KB
      },
      {
        name: 'Product_Roadmap_2026.docx',
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'documents',
        folder: docFolder._id,
        content: 'SECURE FILE HUB 2026 PRODUCT ROADMAP\n1. End-to-End Encryption\n2. Real-time Multi-user Sharing\n3. Mobile Native Companion App',
        size: 1024 * 84, // 84 KB
      },
      {
        name: 'hero_cloud_illustration.png',
        mime: 'image/png',
        category: 'images',
        folder: mediaFolder._id,
        // Minimal valid 1x1 transparent PNG buffer
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
        size: 1024 * 340, // 340 KB mock
      },
      {
        name: 'brand_palette_guide.svg',
        mime: 'image/svg+xml',
        category: 'images',
        folder: mediaFolder._id,
        content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3b82f6"/></svg>',
        size: 1024 * 12, // 12 KB
      },
      {
        name: 'meeting_notes_september.txt',
        mime: 'text/plain',
        category: 'documents',
        folder: null, // Root
        content: 'Team Meeting Notes - September 2026\nDiscussed deployment checklist, rate-limiting policies, and automated backups.',
        size: 1024 * 4,
      },
      {
        name: 'welcome_podcast_intro.mp3',
        mime: 'audio/mpeg',
        category: 'audio',
        folder: null, // Root
        content: 'ID3\x03\x00\x00\x00\x00\x00\x00Demo Audio Stream for Secure File Hub',
        size: 1024 * 1024 * 2.4, // 2.4 MB
      },
      {
        name: 'demo_product_walkthrough.mp4',
        mime: 'video/mp4',
        category: 'videos',
        folder: null, // Root
        content: '\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free',
        size: 1024 * 1024 * 14.5, // 14.5 MB
      },
    ];

    let totalUserBytes = 0;

    for (const item of sampleFilesConfig) {
      const ext = path.extname(item.name).toLowerCase();
      const storedName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const filePath = path.join(userDir, storedName);

      if (item.buffer) {
        fs.writeFileSync(filePath, item.buffer);
      } else {
        fs.writeFileSync(filePath, item.content || 'File payload');
      }

      const fileDoc = await File.create({
        originalName: item.name,
        storedName,
        filePath,
        mimeType: item.mime,
        extension: ext.replace('.', ''),
        size: item.size,
        category: item.category,
        owner: demoUser._id,
        folder: item.folder,
        shareToken: crypto.randomBytes(16).toString('hex'),
      });

      totalUserBytes += item.size;

      await ActivityLog.create({
        user: demoUser._id,
        action: 'upload',
        itemType: 'file',
        itemName: item.name,
        targetId: fileDoc._id,
        details: { size: item.size, category: item.category },
      });
    }

    demoUser.storageUsed = totalUserBytes;
    await demoUser.save();

    console.log(`[Seed] Seeded ${sampleFilesConfig.length} real files across folders with ${(totalUserBytes / (1024*1024)).toFixed(2)} MB storage`);
    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
