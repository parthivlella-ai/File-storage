const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const storageEngine = require('../config/storage');

// @desc    Get all trashed files and folders
// @route   GET /api/trash
// @access  Private
const getTrashItems = async (req, res, next) => {
  try {
    const [files, folders] = await Promise.all([
      File.find({ owner: req.user._id, isTrash: true }).sort({ trashDate: -1 }),
      Folder.find({ owner: req.user._id, isTrash: true }).sort({ trashDate: -1 }),
    ]);

    res.json({
      success: true,
      files,
      folders,
      totalItems: files.length + folders.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a file from trash
// @route   PUT /api/trash/files/:id/restore
// @access  Private
const restoreFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isTrash: true });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash',
      });
    }

    // Check if original folder still exists and is not trashed
    if (file.folder) {
      const folderExists = await Folder.findOne({ _id: file.folder, isTrash: false });
      if (!folderExists) {
        // Move to root if parent folder was deleted
        file.folder = null;
      }
    }

    file.isTrash = false;
    file.trashDate = null;
    await file.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'restore',
      itemType: 'file',
      itemName: file.originalName,
      targetId: file._id,
    });

    res.json({
      success: true,
      message: `Restored '${file.originalName}'`,
      file,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a folder from trash
// @route   PUT /api/trash/folders/:id/restore
// @access  Private
const restoreFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isTrash: true });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found in trash',
      });
    }

    folder.isTrash = false;
    folder.trashDate = null;
    await folder.save();

    // Restore files inside folder
    await File.updateMany(
      { folder: folder._id, owner: req.user._id },
      { isTrash: false, trashDate: null }
    );

    res.json({
      success: true,
      message: `Restored folder '${folder.name}'`,
      folder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a file
// @route   DELETE /api/trash/files/:id
// @access  Private
const permanentlyDeleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isTrash: true });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in trash',
      });
    }

    // Delete physical file from disk
    storageEngine.deleteFile(req.user._id, file.storedName);

    // Deduct user storageUsed
    const user = await User.findById(req.user._id);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - (file.size || 0));
      await user.save();
    }

    await File.deleteOne({ _id: file._id });

    res.json({
      success: true,
      message: `Permanently deleted '${file.originalName}'`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a folder and all its contents
// @route   DELETE /api/trash/folders/:id
// @access  Private
const permanentlyDeleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id, isTrash: true });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found in trash',
      });
    }

    // Find all files in folder to delete from disk
    const files = await File.find({ folder: folder._id, owner: req.user._id });
    let totalDeduction = 0;

    for (const f of files) {
      storageEngine.deleteFile(req.user._id, f.storedName);
      totalDeduction += f.size || 0;
    }

    await File.deleteMany({ folder: folder._id, owner: req.user._id });
    await Folder.deleteOne({ _id: folder._id });

    // Deduct storage
    const user = await User.findById(req.user._id);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - totalDeduction);
      await user.save();
    }

    res.json({
      success: true,
      message: `Permanently deleted folder '${folder.name}' and its contents`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Empty entire trash for user
// @route   DELETE /api/trash/empty
// @access  Private
const emptyTrash = async (req, res, next) => {
  try {
    const trashedFiles = await File.find({ owner: req.user._id, isTrash: true });
    let totalDeduction = 0;

    for (const f of trashedFiles) {
      storageEngine.deleteFile(req.user._id, f.storedName);
      totalDeduction += f.size || 0;
    }

    await File.deleteMany({ owner: req.user._id, isTrash: true });
    await Folder.deleteMany({ owner: req.user._id, isTrash: true });

    const user = await User.findById(req.user._id);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - totalDeduction);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Trash emptied successfully',
      filesDeleted: trashedFiles.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrashItems,
  restoreFile,
  restoreFolder,
  permanentlyDeleteFile,
  permanentlyDeleteFolder,
  emptyTrash,
};
