const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const storageEngine = require('../config/storage');
const { detectCategory, sanitizeFilename } = require('../utils/fileHelpers');

// @desc    Upload one or multiple files
// @route   POST /api/files/upload
// @access  Private
const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded. Please select at least one file.',
      });
    }

    const { folderId } = req.body;
    let targetFolder = null;

    if (folderId && folderId !== 'null' && folderId !== 'undefined' && folderId !== 'root') {
      targetFolder = await Folder.findOne({ _id: folderId, owner: req.user._id, isTrash: false });
      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: 'Destination folder does not exist or has been deleted.',
        });
      }
    }

    // Calculate total batch size
    const batchSize = req.files.reduce((sum, file) => sum + file.size, 0);

    // Check user's storage limit
    const currentUser = await User.findById(req.user._id);
    if (currentUser.storageUsed + batchSize > currentUser.storageLimit) {
      // Clean up newly written files from disk
      req.files.forEach((f) => {
        try {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Storage limit exceeded. Please free up space or upgrade your plan.',
      });
    }

    const createdFiles = [];

    for (const file of req.files) {
      const sanitizedName = sanitizeFilename(file.originalname);
      const ext = path.extname(sanitizedName).toLowerCase().replace('.', '');
      const category = detectCategory(sanitizedName, file.mimetype);

      // Upload file via storage abstraction (uploads to Cloud R2/S3 or keeps in Local)
      let uploadResult;
      try {
        uploadResult = await storageEngine.uploadFile({
          userId: req.user._id,
          originalName: sanitizedName,
          storedName: file.filename,
          localFilePath: file.path,
          mimeType: file.mimetype || 'application/octet-stream',
          size: file.size,
        });
      } catch (uploadErr) {
        if (fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch {}
        }
        throw uploadErr;
      }

      let newFile;
      try {
        newFile = await File.create({
          originalName: sanitizedName,
          storedName: file.filename,
          filePath: uploadResult.filePath || file.path,
          storageProvider: uploadResult.storageProvider || 'local',
          storageKey: uploadResult.storageKey || null,
          mimeType: file.mimetype || 'application/octet-stream',
          extension: ext,
          size: file.size,
          category,
          owner: req.user._id,
          folder: targetFolder ? targetFolder._id : null,
          shareToken: crypto.randomBytes(16).toString('hex'),
        });
      } catch (dbErr) {
        // SAFE CLEANUP: If MongoDB creation fails, immediately remove the uploaded cloud/local file!
        await storageEngine.deleteFile(req.user._id, file.filename, uploadResult.storageKey, uploadResult.storageProvider);
        throw dbErr;
      }

      createdFiles.push(newFile);

      // Log activity
      await ActivityLog.create({
        user: req.user._id,
        action: 'upload',
        itemType: 'file',
        itemName: sanitizedName,
        targetId: newFile._id,
        details: { size: file.size, category },
      });
    }

    // Update user's storageUsed
    currentUser.storageUsed += batchSize;
    await currentUser.save();

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdFiles.length} file(s)`,
      files: createdFiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all files for current user (with search, category, folder filter & sorting)
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res, next) => {
  try {
    const {
      folderId,
      category,
      search,
      isStarred,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 100,
    } = req.query;

    const query = {
      owner: req.user._id,
      isTrash: false,
    };

    // Folder filtering:
    // If folderId === 'all', query all files across folders (e.g. for Recent or Search)
    // If folderId is not specified or 'root' / 'null', query root files
    if (folderId === 'all') {
      // Don't filter by folder
    } else if (folderId && folderId !== 'null' && folderId !== 'root') {
      query.folder = folderId;
    } else if (!category && !search && isStarred === undefined) {
      query.folder = null;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    // Starred filter
    if (isStarred === 'true') {
      query.isStarred = true;
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.originalName = searchRegex;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    if (sortBy === 'name') {
      sortObj.originalName = sortOrder;
    } else if (sortBy === 'size') {
      sortObj.size = sortOrder;
    } else if (sortBy === 'updatedAt') {
      sortObj.updatedAt = sortOrder;
    } else {
      sortObj.createdAt = sortOrder;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .populate('folder', 'name color')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      files,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search files across all folders
// @route   GET /api/files/search
// @access  Private
const searchFiles = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, files: [], folders: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const fileQuery = {
      owner: req.user._id,
      isTrash: false,
      originalName: regex,
    };

    if (category && category !== 'all') {
      fileQuery.category = category;
    }

    const [files, folders] = await Promise.all([
      File.find(fileQuery).populate('folder', 'name color').limit(50),
      Folder.find({
        owner: req.user._id,
        isTrash: false,
        name: regex,
      }).limit(20),
    ]);

    res.json({
      success: true,
      files,
      folders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single file by ID
// @route   GET /api/files/:id
// @access  Private
const getFileById = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate('folder', 'name color');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check ownership
    if (file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this file',
      });
    }

    res.json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// Helper to verify file access (via share token, user ownership, or admin privileges)
const authenticateFileAccess = async (req, file, shareToken) => {
  // 1. If valid shareToken is provided, grant access
  if (shareToken && file.shareToken && shareToken === file.shareToken) {
    return { authorized: true };
  }

  // 2. If no shareToken, user authentication is required
  let user = req.user;
  if (!user) {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return { authorized: false, status: 401, message: 'Authentication required. No token or valid share link provided.' };
    }

    try {
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret || 'dev_secret_local_only_secure_file_hub_2026');
      user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return { authorized: false, status: 401, message: 'User belonging to this token no longer exists.' };
      }
      if (user.isBlocked) {
        return { authorized: false, status: 403, message: 'Your account has been suspended by an administrator.' };
      }
      req.user = user;
    } catch {
      return { authorized: false, status: 401, message: 'Invalid or expired authorization token.' };
    }
  }

  // 3. Check ownership or admin privileges
  if (user.role === 'admin' || file.owner.toString() === user._id.toString()) {
    return { authorized: true, user };
  }

  return { authorized: false, status: 403, message: 'Unauthorized access to this file.' };
};

// @desc    Download a file
// @route   GET /api/files/:id/download
// @access  Private (or via share token)
const downloadFile = async (req, res, next) => {
  try {
    const { shareToken, redirect } = req.query;
    let file;

    if (shareToken) {
      file = await File.findOne({ _id: req.params.id, shareToken });
    } else {
      file = await File.findById(req.params.id);
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or link has expired',
      });
    }

    // Verify access rights (token ownership, share token, or admin)
    const access = await authenticateFileAccess(req, file, shareToken);
    if (!access.authorized) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // Optional short-lived signed URL redirect if requested and available
    if (redirect === 'true' && (file.storageProvider === 's3' || file.storageProvider === 'r2')) {
      const signedUrl = await storageEngine.getSignedDownloadUrl(file, 900); // 15 mins
      if (signedUrl) {
        return res.redirect(signedUrl);
      }
    }

    // Stream file content (works seamlessly for both Local and Cloud S3/R2)
    const streamData = await storageEngine.getFileStream(file);

    // Update download count and access time
    file.downloadCount += 1;
    file.lastAccessedAt = new Date();
    await file.save();

    // Log activity if authenticated
    if (req.user) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'download',
        itemType: 'file',
        itemName: file.originalName,
        targetId: file._id,
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    if (streamData.contentLength) {
      res.setHeader('Content-Length', streamData.contentLength);
    }

    streamData.stream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'NoSuchKey') {
      return res.status(404).json({
        success: false,
        message: 'File content does not exist in storage',
      });
    }
    next(error);
  }
};

// @desc    Stream / preview file content inline (image, audio, video, pdf, text)
// @route   GET /api/files/:id/preview
// @access  Private (or via share token)
const previewFile = async (req, res, next) => {
  try {
    const { shareToken, redirect } = req.query;
    let file;

    if (shareToken) {
      file = await File.findOne({ _id: req.params.id, shareToken });
    } else {
      file = await File.findById(req.params.id);
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Verify access rights (token ownership, share token, or admin)
    const access = await authenticateFileAccess(req, file, shareToken);
    if (!access.authorized) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    // Optional presigned URL redirect for direct client rendering if requested
    if (redirect === 'true' && (file.storageProvider === 's3' || file.storageProvider === 'r2')) {
      const signedUrl = await storageEngine.getSignedPreviewUrl(file, 900);
      if (signedUrl) {
        return res.redirect(signedUrl);
      }
    }

    // Stream content (supports HTTP Range headers for audio/video streaming on both local and S3/R2)
    const range = req.headers.range;
    const streamData = await storageEngine.getFileStream(file, range);

    const headers = {
      'Content-Type': streamData.contentType || file.mimeType || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
    };

    if (streamData.contentLength) {
      headers['Content-Length'] = streamData.contentLength;
    }

    if (streamData.isRange && streamData.contentRange) {
      headers['Content-Range'] = streamData.contentRange;
      res.writeHead(206, headers);
    } else {
      res.writeHead(200, headers);
    }

    streamData.stream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'NoSuchKey') {
      return res.status(404).json({
        success: false,
        message: 'File content does not exist in storage',
      });
    }
    next(error);
  }
};

// @desc    Get temporary signed URL for direct file access
// @route   GET /api/files/:id/signed-url
// @access  Private (or via share token)
const getFileSignedUrl = async (req, res, next) => {
  try {
    const { shareToken, type = 'download' } = req.query;
    let file;

    if (shareToken) {
      file = await File.findOne({ _id: req.params.id, shareToken });
    } else {
      file = await File.findById(req.params.id);
    }

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Verify access rights (token ownership, share token, or admin)
    const access = await authenticateFileAccess(req, file, shareToken);
    if (!access.authorized) {
      return res.status(access.status).json({
        success: false,
        message: access.message,
      });
    }

    let url = null;
    if (file.storageProvider === 's3' || file.storageProvider === 'r2') {
      url = type === 'preview'
        ? await storageEngine.getSignedPreviewUrl(file, 3600)
        : await storageEngine.getSignedDownloadUrl(file, 3600);
    }

    res.json({
      success: true,
      url,
      provider: file.storageProvider || 'local',
      expiresIn: url ? 3600 : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update file (Rename, Move folder, Toggle Star)
// @route   PUT /api/files/:id
// @access  Private
const updateFile = async (req, res, next) => {
  try {
    const { name, folderId, isStarred, isPublic } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (name) {
      const sanitized = sanitizeFilename(name);
      file.originalName = sanitized;
      const ext = path.extname(sanitized).toLowerCase().replace('.', '');
      file.extension = ext;
      file.category = detectCategory(sanitized, file.mimeType);

      await ActivityLog.create({
        user: req.user._id,
        action: 'rename',
        itemType: 'file',
        itemName: sanitized,
        targetId: file._id,
      });
    }

    if (folderId !== undefined) {
      if (folderId === null || folderId === 'root') {
        file.folder = null;
      } else {
        const destFolder = await Folder.findOne({ _id: folderId, owner: req.user._id, isTrash: false });
        if (!destFolder) {
          return res.status(404).json({
            success: false,
            message: 'Destination folder not found',
          });
        }
        file.folder = destFolder._id;
      }

      await ActivityLog.create({
        user: req.user._id,
        action: 'move',
        itemType: 'file',
        itemName: file.originalName,
        targetId: file._id,
      });
    }

    if (isStarred !== undefined) {
      file.isStarred = Boolean(isStarred);
    }

    if (isPublic !== undefined) {
      file.isPublic = Boolean(isPublic);
    }

    await file.save();
    const updatedFile = await File.findById(file._id).populate('folder', 'name color');

    res.json({
      success: true,
      message: 'File updated successfully',
      file: updatedFile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move file to trash (Soft Delete)
// @route   DELETE /api/files/:id
// @access  Private
const moveToTrash = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    file.isTrash = true;
    file.trashDate = new Date();
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete',
      itemType: 'file',
      itemName: file.originalName,
      targetId: file._id,
    });

    res.json({
      success: true,
      message: 'File moved to Trash',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch operations (move, trash, star)
// @route   POST /api/files/batch
// @access  Private
const batchActions = async (req, res, next) => {
  try {
    const { action, fileIds, folderId } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files specified for batch operation',
      });
    }

    if (action === 'trash') {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { isTrash: true, trashDate: new Date() }
      );
      return res.json({ success: true, message: `${fileIds.length} file(s) moved to Trash` });
    }

    if (action === 'move') {
      const target = folderId === 'root' || folderId === null ? null : folderId;
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { folder: target }
      );
      return res.json({ success: true, message: `${fileIds.length} file(s) moved successfully` });
    }

    if (action === 'star') {
      await File.updateMany(
        { _id: { $in: fileIds }, owner: req.user._id },
        { isStarred: true }
      );
      return res.json({ success: true, message: `${fileIds.length} file(s) starred` });
    }

    return res.status(400).json({ success: false, message: 'Invalid batch action' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFiles,
  getFiles,
  searchFiles,
  getFileById,
  downloadFile,
  previewFile,
  getFileSignedUrl,
  updateFile,
  moveToTrash,
  batchActions,
};
