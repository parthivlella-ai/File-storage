const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'File name is too long'],
    },
    storedName: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    extension: {
      type: String,
      lowercase: true,
      default: '',
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    category: {
      type: String,
      enum: ['documents', 'images', 'videos', 'audio', 'pdf', 'other'],
      default: 'other',
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
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
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      default: null,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching, filtering, and sorting
fileSchema.index({ owner: 1, isTrash: 1, createdAt: -1 });
fileSchema.index({ owner: 1, folder: 1, isTrash: 1 });
fileSchema.index({ owner: 1, category: 1, isTrash: 1 });
fileSchema.index({ originalName: 'text' });

module.exports = mongoose.model('File', fileSchema);
