const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

      const newFile = await File.create({
        originalName: sanitizedName,
        storedName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype || 'application/octet-stream',
        extension: ext,
        size: file.size,
        category,
        owner: req.user._id,
        folder: targetFolder ? targetFolder._id : null,
        shareToken: crypto.randomBytes(16).toString('hex'),
      });

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

// @desc    Download a file
// @route   GET /api/files/:id/download
// @access  Private (or via share token)
const downloadFile = async (req, res, next) => {
  try {
    const { shareToken } = req.query;
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

    // Check ownership if not shared via token
    if (!shareToken && req.user && file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this file',
      });
    }

    const filePath = storageEngine.getFilePath(file.owner, file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File content does not exist on disk',
      });
    }

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
    res.setHeader('Content-Length', file.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Stream / preview file content inline (image, audio, video, pdf, text)
// @route   GET /api/files/:id/preview
// @access  Private (or via share token)
const previewFile = async (req, res, next) => {
  try {
    const { shareToken } = req.query;
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

    if (!shareToken && req.user && file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const filePath = storageEngine.getFilePath(file.owner, file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File does not exist on disk',
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Handle range requests for video and audio streaming
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.mimeType || 'application/octet-stream',
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      });
      fs.createReadStream(filePath).pipe(res);
    }
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
  updateFile,
  moveToTrash,
  batchActions,
};
