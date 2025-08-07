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
    scheduledAt: {
      type: Date,
      validate: {
        validator: function(value) {
          if (value && this.status === 'scheduled') {
            const now = new Date();
            const oneMinuteFromNow = new Date(now.getTime() + 60000); 
            return value > oneMinuteFromNow;
          }
          return true; 
        },
        message: 'Scheduled time must be at least 1 minute in the future'
      }
    },
    publishedAt: {
      type: Date,
      validate: {
        validator: function(value) {
          if (value) {
            return value <= new Date();
          }
          return true;
        },
        message: 'Published date cannot be in the future'
      }
    }, 
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
PostSchema.pre('save', function(next) {
  if (this.status === 'scheduled' && !this.scheduledAt) {
    return next(new Error('Scheduled posts must have a scheduledAt date'));
  }
  if (this.status !== 'scheduled') {
    this.scheduledAt = undefined;
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Post', PostSchema);