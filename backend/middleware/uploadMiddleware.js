const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const storageEngine = require('../config/storage');

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

// Configure disk storage per user
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const userId = req.user ? req.user._id.toString() : 'general';
      const userDir = storageEngine.getUserUploadDir(userId);
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Generate secure random unique hash filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    const storedName = `${Date.now()}-${randomName}${ext}`;
    cb(null, storedName);
  },
});

// File security filter
const fileFilter = (req, file, cb) => {
  // Check dangerous executable extensions to protect the server
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.ps1', '.jar', '.com', '.scr'];

  if (blockedExtensions.includes(ext)) {
    return cb(
      new Error(`Files with extension '${ext}' are restricted for security reasons.`),
      false
    );
  }

  // Prevent null byte injection in filenames
  if (file.originalname.includes('\0')) {
    return cb(new Error('Invalid filename format detected.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 20, // Max 20 files at once
  },
  fileFilter,
});

module.exports = upload;
