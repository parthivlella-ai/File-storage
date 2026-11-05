const fs = require('fs');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3StorageEngine {
  constructor(options = {}) {
    this.providerType = options.providerType || 'r2'; // 'r2' or 's3'
    this.bucket = options.bucket;
    this.region = options.region || 'auto';
    this.endpoint = options.endpoint;

    const accessKeyId = options.accessKeyId;
    const secretAccessKey = options.secretAccessKey;

    if (accessKeyId && secretAccessKey && this.bucket) {
      const clientConfig = {
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      if (this.endpoint) {
        clientConfig.endpoint = this.endpoint;
      }

      this.client = new S3Client(clientConfig);
      this.configured = true;
      console.log(`[Cloud Storage]: Initialized ${this.providerType.toUpperCase()} client for bucket '${this.bucket}'`);
    } else {
      this.configured = false;
      this.client = null;
    }
  }

  isConfigured() {
    return this.configured;
  }

  getStorageKey(userId, storedName) {
    return `uploads/${userId.toString()}/${storedName}`;
  }

  async uploadFile({ userId, originalName, storedName, localFilePath, mimeType, size }) {
    if (!this.configured) {
      throw new Error(`Cloud storage provider '${this.providerType}' is not properly configured with credentials and bucket.`);
    }

    const key = this.getStorageKey(userId, storedName);
    const fileStream = fs.createReadStream(localFilePath);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileStream,
      ContentType: mimeType || 'application/octet-stream',
      ContentLength: size,
      Metadata: {
        userId: userId.toString(),
        originalName: encodeURIComponent(originalName || storedName),
      },
    });

    try {
      await this.client.send(command);

      // Clean up temporary local file after successful upload to cloud
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (cleanupErr) {
        console.warn(`[Storage Warning]: Failed cleaning temp file ${localFilePath}:`, cleanupErr.message);
      }

      return {
        storageKey: key,
        storedName,
        storageProvider: this.providerType,
        filePath: `s3://${this.bucket}/${key}`,
      };
    } catch (err) {
      console.error(`[Cloud Storage Error] Upload failed for ${key}:`, err.message);
      throw new Error(`Failed to upload file to cloud storage: ${err.message}`);
    }
  }

  async deleteFile(userId, storedName, storageKey) {
    if (!this.configured) return false;

    const key = storageKey || this.getStorageKey(userId, storedName);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (err) {
      console.error(`[Cloud Storage Error] Deleting ${key}:`, err.message);
      return false;
    }
  }

  async fileExists(userId, storedName, storageKey) {
    if (!this.configured) return false;

    const key = storageKey || this.getStorageKey(userId, storedName);

    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  async getFileStream(file, range = null) {
    if (!this.configured) {
      throw new Error('Cloud storage client is not configured.');
    }

    const key = file.storageKey || this.getStorageKey(file.owner, file.storedName);

    const commandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    if (range) {
      commandInput.Range = range;
    }

    const s3Response = await this.client.send(new GetObjectCommand(commandInput));

    const isRange = Boolean(range && s3Response.ContentRange);

    return {
      stream: s3Response.Body,
      contentLength: s3Response.ContentLength,
      contentType: s3Response.ContentType || file.mimeType || 'application/octet-stream',
      contentRange: s3Response.ContentRange,
      isRange,
      statusCode: isRange ? 206 : 200,
    };
  }

  async getSignedDownloadUrl(file, expiresInSeconds = 3600) {
    if (!this.configured) return null;

    const key = file.storageKey || this.getStorageKey(file.owner, file.storedName);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      ResponseContentType: file.mimeType || 'application/octet-stream',
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getSignedPreviewUrl(file, expiresInSeconds = 3600) {
    if (!this.configured) return null;

    const key = file.storageKey || this.getStorageKey(file.owner, file.storedName);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `inline; filename="${encodeURIComponent(file.originalName)}"`,
      ResponseContentType: file.mimeType || 'application/octet-stream',
    });

    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

module.exports = S3StorageEngine;

