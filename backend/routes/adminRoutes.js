const express = require('express');
const router = express.Router();
const {
  getSystemStats,
  getAllUsers,
  toggleUserBlock,
  updateUserQuota,
  getAllFilesMetadata,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(requireAdmin);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-block', toggleUserBlock);
router.put('/users/:id/quota', updateUserQuota);
router.get('/files', getAllFilesMetadata);

module.exports = router;
