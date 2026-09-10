const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolders,
  getBreadcrumbs,
  updateFolder,
  moveToTrash,
} = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id/breadcrumbs', getBreadcrumbs);
router.put('/:id', updateFolder);
router.delete('/:id', moveToTrash);

module.exports = router;
