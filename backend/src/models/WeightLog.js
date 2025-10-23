const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
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
    
    date: {
      type: Date,
      required: true,
      index: true,
    },
    
    weight: {
      type: Number,
      required: true,
      min: 20,
      max: 500,
    },
    
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg',
    },
    
    note: {
      type: String,
      maxlength: 200,
    },
    
    // Optional body measurements
    measurements: {
      waist: { type: Number }, // cm
      hips: { type: Number }, // cm
      chest: { type: Number }, // cm
      arms: { type: Number }, // cm
      thighs: { type: Number }, // cm
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for same user on same date
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Get date string
weightLogSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

weightLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('WeightLog', weightLogSchema);