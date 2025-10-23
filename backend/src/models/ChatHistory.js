const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Track conversation metadata
    totalMessages: {
      type: Number,
      default: 0,
    },
    
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ clerkId: 1, createdAt: -1 });

// Update message count and last message time before saving
chatHistorySchema.pre('save', function(next) {
  this.totalMessages = this.messages.length;
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
