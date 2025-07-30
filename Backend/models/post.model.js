const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50,
    }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'pending', 'rejected'],
      default: 'draft',
    },
    scheduledAt: Date, 
    publishedAt: Date, 
    channel: {
      type: String, 
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    approval: {
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      comment: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);