const fs = require('fs');
const path = require('path');
const os = require('os');

class LocalStorageEngine {
  constructor() {
    let uploadsRoot = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

    try {
      if (!fs.existsSync(uploadsRoot)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
      }
    } catch (err) {
      console.warn(`[Local Storage Warning]: Cannot write to ${uploadsRoot} (${err.message}). Falling back to os.tmpdir().`);
      uploadsRoot = path.join(os.tmpdir(), 'secure_file_hub_uploads');
      try {
        if (!fs.existsSync(uploadsRoot)) {
          fs.mkdirSync(uploadsRoot, { recursive: true });
        }
      } catch (tmpErr) {
        console.error(`[Local Storage Error]: Failed to create fallback directory: ${tmpErr.message}`);
      }
    }

    this.rootDir = uploadsRoot;
    this.providerType = 'local';
  }

  getUserUploadDir(userId) {
    const userDir = path.join(this.rootDir, userId.toString());
    try {
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[Local Storage Warning]: Failed to create user directory: ${err.message}. Using root.`);
      return this.rootDir;
    }
    return userDir;
  }

  getFilePath(userId, storedName) {
    return path.join(this.getUserUploadDir(userId), storedName);
  }

  async uploadFile({ userId, storedName, localFilePath }) {
    // For local storage, Multer has already written the file to localFilePath (or userDir)
    const targetPath = this.getFilePath(userId, storedName);
    if (localFilePath && localFilePath !== targetPath && fs.existsSync(localFilePath)) {
      try {
        fs.copyFileSync(localFilePath, targetPath);
        fs.unlinkSync(localFilePath);
      } catch {
        // keep localFilePath
      }
    }

    return {
      storageKey: targetPath,
      storedName,
      storageProvider: 'local',
      filePath: targetPath,
    };
  }

  async deleteFile(userId, storedName, storageKey) {
    try {
      const fullPath = storageKey && fs.existsSync(storageKey)
        ? storageKey
        : this.getFilePath(userId, storedName);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Local Storage Error] Deleting ${storedName}:`, err.message);
      return false;
    }
  }

  async fileExists(userId, storedName, storageKey) {
    const fullPath = storageKey && fs.existsSync(storageKey)
      ? storageKey
      : this.getFilePath(userId, storedName);
    return fs.existsSync(fullPath);
  }

  async getFileStream(file, range = null) {
    const filePath = (file.filePath && fs.existsSync(file.filePath))
      ? file.filePath
      : this.getFilePath(file.owner, file.storedName);

    if (!fs.existsSync(filePath)) {
      const err = new Error('File not found on local disk');
      err.code = 'ENOENT';
      throw err;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      return {
        stream,
        contentLength: chunkSize,
        contentType: file.mimeType || 'application/octet-stream',
        contentRange: `bytes ${start}-${end}/${fileSize}`,
        isRange: true,
        statusCode: 206,
      };
    }

    return {
      stream: fs.createReadStream(filePath),
      contentLength: fileSize,
      contentType: file.mimeType || 'application/octet-stream',
      isRange: false,
      statusCode: 200,
    };
  }

  async getSignedDownloadUrl() {
    return null; // Local files stream through the backend API
  }

  async getSignedPreviewUrl() {
    return null;
  }
}

module.exports = LocalStorageEngine;

