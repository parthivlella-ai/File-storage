const mongoose = require('mongoose');
const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get user dashboard statistics and storage breakdown
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalFiles,
      totalFolders,
      recentFiles,
      starredCount,
      recentActivity,
      categoryStats,
    ] = await Promise.all([
      File.countDocuments({ owner: userId, isTrash: false }),
      Folder.countDocuments({ owner: userId, isTrash: false }),
      File.find({ owner: userId, isTrash: false })
        .populate('folder', 'name color')
        .sort({ createdAt: -1 })
        .limit(8),
      File.countDocuments({ owner: userId, isTrash: false, isStarred: true }),
      ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
      File.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            isTrash: false,
          },
        },
        {
          $group: {
            _id: '$category',
            totalBytes: { $sum: '$size' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format category breakdown with defaults for all standard categories
    const categoriesMap = {
      documents: { count: 0, totalBytes: 0, color: '#3b82f6', label: 'Documents' },
      images: { count: 0, totalBytes: 0, color: '#10b981', label: 'Images' },
      videos: { count: 0, totalBytes: 0, color: '#f59e0b', label: 'Videos' },
      audio: { count: 0, totalBytes: 0, color: '#ec4899', label: 'Audio' },
      pdf: { count: 0, totalBytes: 0, color: '#ef4444', label: 'PDFs' },
      other: { count: 0, totalBytes: 0, color: '#8b5cf6', label: 'Other' },
    };

    let calculatedStorageUsed = 0;
    categoryStats.forEach((cat) => {
      const key = cat._id || 'other';
      if (categoriesMap[key]) {
        categoriesMap[key].count = cat.count;
        categoriesMap[key].totalBytes = cat.totalBytes;
      } else {
        categoriesMap.other.count += cat.count;
        categoriesMap.other.totalBytes += cat.totalBytes;
      }
      calculatedStorageUsed += cat.totalBytes;
    });

    const user = await User.findById(userId);
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    const storageUsed = calculatedStorageUsed;
    const usagePercentage = Math.min(100, parseFloat(((storageUsed / storageLimit) * 100).toFixed(1)));

    res.json({
      success: true,
      stats: {
        totalFiles,
        totalFolders,
        starredCount,
        storageUsed,
        storageLimit,
        usagePercentage,
        categories: categoriesMap,
        recentFiles,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
