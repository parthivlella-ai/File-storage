/**
 * Migration Utility: Migrate local disk files to Cloudflare R2 / AWS S3 Object Storage
 *
 * Usage:
 *   node backend/utils/migrateToCloudStorage.js [--delete-local]
 *
 * Options:
 *   --delete-local   Delete the local disk file after verified upload to cloud.
 *                    (Default: keeps local files safe on disk).
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const storageEngine = require('../config/storage');
const File = require('../models/File');

const green = (t) => `\x1b[32m✔ ${t}\x1b[0m`;
const red = (t) => `\x1b[31m✖ ${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m⚠ ${t}\x1b[0m`;
const blue = (t) => `\x1b[34mℹ ${t}\x1b[0m`;

const deleteLocalAfterMigration = process.argv.includes('--delete-local');

const migrate = async () => {
  console.log(blue('==========================================================='));
  console.log(blue('📦 Secure File Hub: Local Disk to Cloud Storage Migration'));
  console.log(blue('==========================================================='));

  if (!storageEngine.isCloud()) {
    console.error(red('\n✖ Cloud storage is not configured!'));
    console.log(yellow('Please configure Cloudflare R2 or S3 environment variables first:'));
    console.log('   - STORAGE_PROVIDER=r2 (or s3)');
    console.log('   - R2_BUCKET_NAME (or S3_BUCKET_NAME)');
    console.log('   - R2_ACCOUNT_ID (for Cloudflare R2)');
    console.log('   - R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const cloudProvider = storageEngine.getProviderType();
  console.log(green(`\n✔ Cloud storage target verified: ${cloudProvider.toUpperCase()}`));

  await connectDB();

  // Find all files that are currently stored locally or have no storageProvider set
  const filesToMigrate = await File.find({
    $or: [
      { storageProvider: 'local' },
      { storageProvider: { $exists: false } },
      { storageProvider: null },
      { storageKey: null },
    ],
  });

  console.log(blue(`Found ${filesToMigrate.length} file record(s) eligible for migration.\n`));

  if (filesToMigrate.length === 0) {
    console.log(green('All files are already migrated to cloud storage!'));
    process.exit(0);
  }

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filesToMigrate.length; i++) {
    const file = filesToMigrate[i];
    const progress = `[${i + 1}/${filesToMigrate.length}]`;

    // Locate physical local file
    let localPath = file.filePath;
    if (!localPath || !fs.existsSync(localPath)) {
      localPath = storageEngine.getFilePath(file.owner, file.storedName);
    }

    if (!fs.existsSync(localPath)) {
      console.log(yellow(`${progress} Skipped "${file.originalName}" (ID: ${file._id}) - physical file not found on disk.`));
      skippedCount++;
      continue;
    }

    try {
      // Upload to cloud storage
      const uploadResult = await storageEngine.uploadFile({
        userId: file.owner,
        originalName: file.originalName,
        storedName: file.storedName,
        localFilePath: localPath,
        mimeType: file.mimeType,
        size: file.size,
      });

      // Update MongoDB metadata with cloud object key
      file.storageProvider = uploadResult.storageProvider || cloudProvider;
      file.storageKey = uploadResult.storageKey;
      file.filePath = uploadResult.filePath || `s3://${uploadResult.storageKey}`;
      await file.save();

      console.log(green(`${progress} Migrated "${file.originalName}" ➔ ${uploadResult.storageKey}`));

      if (deleteLocalAfterMigration) {
        try {
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        } catch {
          // ignore
        }
      }

      successCount++;
    } catch (err) {
      console.error(red(`${progress} Failed migrating "${file.originalName}": ${err.message}`));
      errorCount++;
    }
  }

  console.log(blue('\n==========================================================='));
  console.log(blue('📊 Migration Summary:'));
  console.log(green(`   ✔ Successfully migrated: ${successCount}`));
  console.log(yellow(`   ⚠ Skipped (file not on disk): ${skippedCount}`));
  console.log(red(`   ✖ Errors: ${errorCount}`));
  console.log(blue('==========================================================='));

  process.exit(errorCount > 0 ? 1 : 0);
};

migrate().catch((err) => {
  console.error(red(`Migration fatal error: ${err.message}`));
  process.exit(1);
});

