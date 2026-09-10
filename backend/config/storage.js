const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

/**
 * Storage Abstraction
 * Handles localized file disk operations with per-user isolation and safe error handling.
 */
class LocalStorageEngine {
  constructor() {
    this.rootDir = UPLOADS_ROOT;
  }

  getUserUploadDir(userId) {
    const userDir = path.join(this.rootDir, userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  getFilePath(userId, storedName) {
    return path.join(this.getUserUploadDir(userId), storedName);
  }

  deleteFile(userId, storedName) {
    try {
      const fullPath = this.getFilePath(userId, storedName);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error deleting physical file ${storedName}:`, err);
      return false;
    }
  }

  fileExists(userId, storedName) {
    const fullPath = this.getFilePath(userId, storedName);
    return fs.existsSync(fullPath);
  }
}

module.exports = new LocalStorageEngine();
