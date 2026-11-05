const LocalStorageEngine = require('./storage/localStorageEngine');
const S3StorageEngine = require('./storage/s3StorageEngine');

/**
 * Modular Storage Manager
 * Seamlessly manages local filesystem and cloud object storage (Cloudflare R2 / AWS S3)
 */
class StorageManager {
  constructor() {
    this.localEngine = new LocalStorageEngine();
    this.cloudEngine = null;

    const providerEnv = (process.env.STORAGE_PROVIDER || '').toLowerCase();

    // 1. Initialize Cloudflare R2 if configured
    if (providerEnv === 'r2' || process.env.R2_BUCKET_NAME) {
      const accountId = process.env.R2_ACCOUNT_ID;
      const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

      this.cloudEngine = new S3StorageEngine({
        providerType: 'r2',
        bucket: process.env.R2_BUCKET_NAME,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        region: 'auto',
        endpoint,
      });
    }

    // 2. Initialize AWS S3 or custom S3-compatible service if configured
    if ((providerEnv === 's3' || process.env.S3_BUCKET_NAME) && (!this.cloudEngine || !this.cloudEngine.isConfigured())) {
      this.cloudEngine = new S3StorageEngine({
        providerType: 's3',
        bucket: process.env.S3_BUCKET_NAME,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || undefined,
      });
    }

    // 3. Determine active default engine for new uploads
    if (this.cloudEngine && this.cloudEngine.isConfigured() && providerEnv !== 'local') {
      this.activeEngine = this.cloudEngine;
      console.log(`[Storage Manager]: Active storage provider is '${this.activeEngine.providerType.toUpperCase()}' (Cloud Object Storage)`);
    } else {
      this.activeEngine = this.localEngine;
      console.log('[Storage Manager]: Active storage provider is \'LOCAL\' (Local Disk Storage)');
    }
  }

  isCloud() {
    return this.activeEngine !== this.localEngine;
  }

  getProviderType() {
    return this.activeEngine.providerType;
  }

  /**
   * Staging directory for Multer temporary uploads
   */
  getUserUploadDir(userId) {
    return this.localEngine.getUserUploadDir(userId);
  }

  /**
   * Physical file path on local disk (for backward compatibility)
   */
  getFilePath(userId, storedName) {
    return this.localEngine.getFilePath(userId, storedName);
  }

  /**
   * Upload file to active storage provider
   */
  async uploadFile(params) {
    return await this.activeEngine.uploadFile(params);
  }

  /**
   * Delete physical or cloud file
   */
  async deleteFile(userId, storedName, storageKey, storageProvider) {
    const isCloudFile = storageProvider === 's3' || storageProvider === 'r2' || (this.cloudEngine && this.cloudEngine.isConfigured() && storageKey && storageKey.startsWith('uploads/'));

    let success = false;

    if (isCloudFile && this.cloudEngine && this.cloudEngine.isConfigured()) {
      success = await this.cloudEngine.deleteFile(userId, storedName, storageKey);
    } else {
      success = await this.localEngine.deleteFile(userId, storedName, storageKey);
    }

    // Safe fallback cleanup: also check local disk in case a local copy exists
    if (isCloudFile) {
      await this.localEngine.deleteFile(userId, storedName, storageKey);
    }

    return success;
  }

  /**
   * Stream file content (supports video/audio HTTP Range streaming for both local and cloud)
   */
  async getFileStream(file, range = null) {
    const isCloudFile = file.storageProvider === 's3' || file.storageProvider === 'r2';

    if (isCloudFile && this.cloudEngine && this.cloudEngine.isConfigured()) {
      return await this.cloudEngine.getFileStream(file, range);
    }

    return await this.localEngine.getFileStream(file, range);
  }

  /**
   * Generate secure short-lived presigned download URL (R2 / S3)
   */
  async getSignedDownloadUrl(file, expiresInSeconds = 3600) {
    const isCloudFile = file.storageProvider === 's3' || file.storageProvider === 'r2';

    if (isCloudFile && this.cloudEngine && this.cloudEngine.isConfigured()) {
      return await this.cloudEngine.getSignedDownloadUrl(file, expiresInSeconds);
    }

    return null;
  }

  /**
   * Generate secure short-lived presigned inline preview URL (R2 / S3)
   */
  async getSignedPreviewUrl(file, expiresInSeconds = 3600) {
    const isCloudFile = file.storageProvider === 's3' || file.storageProvider === 'r2';

    if (isCloudFile && this.cloudEngine && this.cloudEngine.isConfigured()) {
      return await this.cloudEngine.getSignedPreviewUrl(file, expiresInSeconds);
    }

    return null;
  }

  async fileExists(userId, storedName, storageKey, storageProvider) {
    const isCloudFile = storageProvider === 's3' || storageProvider === 'r2';

    if (isCloudFile && this.cloudEngine && this.cloudEngine.isConfigured()) {
      return await this.cloudEngine.fileExists(userId, storedName, storageKey);
    }

    return await this.localEngine.fileExists(userId, storedName, storageKey);
  }
}

module.exports = new StorageManager();
