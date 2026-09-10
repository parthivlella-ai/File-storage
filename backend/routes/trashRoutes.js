const express = require('express');
const router = express.Router();
const {
  getTrashItems,
  restoreFile,
  restoreFolder,
  permanentlyDeleteFile,
  permanentlyDeleteFolder,
  emptyTrash,
} = require('../controllers/trashController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTrashItems);
router.put('/files/:id/restore', restoreFile);
router.put('/folders/:id/restore', restoreFolder);
router.delete('/files/:id', permanentlyDeleteFile);
router.delete('/folders/:id', permanentlyDeleteFolder);
router.delete('/empty', emptyTrash);

module.exports = router;
