const express = require('express');
const router = express.Router();
const {
  uploadFiles,
  getFiles,
  searchFiles,
  getFileById,
  downloadFile,
  previewFile,
  updateFile,
  moveToTrash,
  batchActions,
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public/Token routes for direct preview/download links
router.get('/:id/download', downloadFile);
router.get('/:id/preview', previewFile);

// Protected routes
router.use(protect);

router.post('/upload', upload.array('files', 20), uploadFiles);
router.get('/search', searchFiles);
router.post('/batch', batchActions);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.put('/:id', updateFile);
router.delete('/:id', moveToTrash);

module.exports = router;
