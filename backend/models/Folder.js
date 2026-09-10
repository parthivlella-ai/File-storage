const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // Tailwind blue-500 default
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isTrash: {
      type: Boolean,
      default: false,
      index: true,
    },
    trashDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique folder names inside the same parent folder per user
folderSchema.index({ owner: 1, parentFolder: 1, name: 1, isTrash: 1 }, { unique: false });

module.exports = mongoose.model('Folder', folderSchema);
