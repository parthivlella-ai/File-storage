const Folder = require('../models/Folder');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const { sanitizeFilename } = require('../utils/fileHelpers');

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res, next) => {
  try {
    const { name, parentFolder, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required',
      });
    }

    const cleanName = sanitizeFilename(name.trim());
    let parentId = null;

    if (parentFolder && parentFolder !== 'null' && parentFolder !== 'root') {
      const parent = await Folder.findOne({
        _id: parentFolder,
        owner: req.user._id,
        isTrash: false,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder does not exist or has been deleted',
        });
      }
      parentId = parent._id;
    }

    // Check for duplicate folder name in same parent
    const existing = await Folder.findOne({
      name: cleanName,
      owner: req.user._id,
      parentFolder: parentId,
      isTrash: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A folder with this name already exists in this location',
      });
    }

    const folder = await Folder.create({
      name: cleanName,
      owner: req.user._id,
      parentFolder: parentId,
      color: color || '#3b82f6',
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'create_folder',
      itemType: 'folder',
      itemName: cleanName,
      targetId: folder._id,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all folders for user (filtered by parentFolder) with file counts
// @route   GET /api/folders
// @access  Private
const getFolders = async (req, res, next) => {
  try {
    const { parentFolder, all } = req.query;

    const query = {
      owner: req.user._id,
      isTrash: false,
    };

    if (all === 'true') {
      // Return flat list of all folders (useful for move modal)
    } else if (parentFolder && parentFolder !== 'null' && parentFolder !== 'root') {
      query.parentFolder = parentFolder;
    } else {
      query.parentFolder = null;
    }

    const folders = await Folder.find(query).sort({ name: 1 }).lean();

    // Attach fileCount and subfolderCount to each folder
    const enrichedFolders = await Promise.all(
      folders.map(async (folder) => {
        const [fileCount, subfolderCount] = await Promise.all([
          File.countDocuments({ folder: folder._id, isTrash: false, owner: req.user._id }),
          Folder.countDocuments({ parentFolder: folder._id, isTrash: false, owner: req.user._id }),
        ]);

        return {
          ...folder,
          fileCount,
          subfolderCount,
        };
      })
    );

    res.json({
      success: true,
      folders: enrichedFolders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get folder breadcrumb path
// @route   GET /api/folders/:id/breadcrumbs
// @access  Private
const getBreadcrumbs = async (req, res, next) => {
  try {
    const breadcrumbs = [];
    let currentFolderId = req.params.id;

    while (currentFolderId && currentFolderId !== 'root' && currentFolderId !== 'null') {
      const folder = await Folder.findOne({ _id: currentFolderId, owner: req.user._id });
      if (!folder) break;

      breadcrumbs.unshift({
        _id: folder._id,
        name: folder.name,
      });

      currentFolderId = folder.parentFolder;
    }

    res.json({
      success: true,
      breadcrumbs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update folder (rename, change color, move)
// @route   PUT /api/folders/:id
// @access  Private
const updateFolder = async (req, res, next) => {
  try {
    const { name, color, parentFolder, isStarred } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    if (name) {
      folder.name = sanitizeFilename(name.trim());
    }

    if (color) {
      folder.color = color;
    }

    if (isStarred !== undefined) {
      folder.isStarred = Boolean(isStarred);
    }

    if (parentFolder !== undefined) {
      if (parentFolder === folder._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move folder inside itself',
        });
      }
      folder.parentFolder = parentFolder === 'root' || !parentFolder ? null : parentFolder;
    }

    await folder.save();

    res.json({
      success: true,
      message: 'Folder updated successfully',
      folder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move folder to trash
// @route   DELETE /api/folders/:id
// @access  Private
const moveToTrash = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    folder.isTrash = true;
    folder.trashDate = new Date();
    await folder.save();

    // Also mark contained files as trash
    await File.updateMany(
      { folder: folder._id, owner: req.user._id },
      { isTrash: true, trashDate: new Date() }
    );

    res.json({
      success: true,
      message: 'Folder moved to Trash',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFolder,
  getFolders,
  getBreadcrumbs,
  updateFolder,
  moveToTrash,
};
