const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get system-wide analytics & stats for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalFiles,
      totalFolders,
      storageAggregate,
      categoryAggregate,
      recentUsers,
      recentSystemActivity,
    ] = await Promise.all([
      User.countDocuments(),
      File.countDocuments({ isTrash: false }),
      Folder.countDocuments({ isTrash: false }),
      File.aggregate([
        { $match: { isTrash: false } },
        { $group: { _id: null, totalStorageBytes: { $sum: '$size' } } },
      ]),
      File.aggregate([
        { $match: { isTrash: false } },
        { $group: { _id: '$category', totalBytes: { $sum: '$size' }, count: { $sum: 1 } } },
      ]),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      ActivityLog.find().populate('user', 'name email avatar').sort({ createdAt: -1 }).limit(15),
    ]);

    const totalStorageBytes = storageAggregate.length > 0 ? storageAggregate[0].totalStorageBytes : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFiles,
        totalFolders,
        totalStorageBytes,
        categoryAggregate,
        recentUsers,
        recentSystemActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list (with storage used, status)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    // Enrich users with accurate file count
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const fileCount = await File.countDocuments({ owner: u._id, isTrash: false });
        return {
          ...u,
          fileCount,
        };
      })
    );

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock user status
// @route   PUT /api/admin/users/:id/toggle-block
// @access  Private/Admin
const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent blocking self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot block their own account',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User '${user.name}' has been ${user.isBlocked ? 'suspended' : 'activated'}.`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user storage quota
// @route   PUT /api/admin/users/:id/quota
// @access  Private/Admin
const updateUserQuota = async (req, res, next) => {
  try {
    const { storageLimitGB } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!storageLimitGB || storageLimitGB <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid positive storage limit in GB',
      });
    }

    user.storageLimit = parseFloat(storageLimitGB) * 1024 * 1024 * 1024;
    await user.save();

    res.json({
      success: true,
      message: `Storage quota for ${user.name} updated to ${storageLimitGB} GB`,
      storageLimit: user.storageLimit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all files metadata (safe: metadata only, never exposes private contents)
// @route   GET /api/admin/files
// @access  Private/Admin
const getAllFilesMetadata = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const query = { isTrash: false };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.originalName = new RegExp(search.trim(), 'i');
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await File.countDocuments(query);
    const files = await File.find(query)
      .select('-filePath -storedName') // Never expose disk paths to API
      .populate('owner', 'name email')
      .populate('folder', 'name')
      .sort({ createdAt: -1 })
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

module.exports = {
  getSystemStats,
  getAllUsers,
  toggleUserBlock,
  updateUserQuota,
  getAllFilesMetadata,
};
