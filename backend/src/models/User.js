const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Clerk user ID (primary identifier)
    clerkId: {
      type: String,
      required: true,
      unique: true,
      // index: true 
    },
    
    // Basic Info (from Clerk)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // REMOVED: index: true  ← This was causing duplicate index warning
    },
    
    firstName: {
      type: String,
      trim: true,
    },
    
    lastName: {
      type: String,
      trim: true,
    },
    
    profileImageUrl: {
      type: String,
    },
    
    // Profile Data
    age: {
      type: Number,
      min: 13,
      max: 120,
    },
    
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    
    height: {
      type: Number,
      min: 50,
      max: 300,
    },
    
    currentWeight: {
      type: Number,
      min: 20,
      max: 500,
    },
    
    // Goals
    goal: {
      type: String,
      enum: ['lose', 'maintain', 'gain'],
      default: 'maintain',
    },
    
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      default: 'sedentary',
    },
    
    // Calculated Metrics
    bmi: {
      type: Number,
    },
    
    bmiCategory: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'obese'],
    },
    
    bmr: {
      type: Number,
    },
    
    tdee: {
      type: Number,
    },
    
    dailyCalorieTarget: {
      type: Number,
    },
    
    // Macro Targets (in grams)
    macroTargets: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fats: { type: Number, default: 0 },
    },
    
    // Dietary Preferences
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'halal', 'kosher', 'keto', 'paleo'],
    }],
    
    // Onboarding Status
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    
    onboardingCompletedAt: {
      type: Date,
    },
    
    // App Settings
    settings: {
      notificationsEnabled: { type: Boolean, default: true },
      mealReminders: { type: Boolean, default: false },
      waterReminders: { type: Boolean, default: false },
      weightTrackingFrequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly',
      },
    },
    
    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes ONLY here (not in field definitions)
// userSchema.index({ email: 1 });
// userSchema.index({ clerkId: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.email;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
