const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text',
    },
    
    description: {
      type: String,
      maxlength: 1000,
    },
    
    imageUrl: {
      type: String,
    },
    
    cloudinaryPublicId: {
      type: String,
    },
    
    // Timing
    prepTime: {
      type: Number, // minutes
      required: true,
    },
    
    cookTime: {
      type: Number, // minutes
      required: true,
    },
    
    totalTime: {
      type: Number, // minutes (auto-calculated)
    },
    
    servings: {
      type: Number,
      required: true,
      default: 1,
    },
    
    // Ingredients
    ingredients: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      notes: { type: String },
    }],
    
    // Instructions
    instructions: [{
      stepNumber: { type: Number, required: true },
      instruction: { type: String, required: true },
    }],
    
    // Nutrition (per serving)
    nutrition: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fats: { type: Number, required: true },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },
    
    // Tags & Categories
    tags: [{
      type: String,
      enum: [
        'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 
        'high_protein', 'low_carb', 'keto', 'paleo',
        'quick', 'easy', 'budget_friendly'
      ],
    }],
    
    mealType: [{
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    }],
    
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    
    // Cost & Availability
    estimatedCost: {
      type: Number, // in INR or USD
    },
    
    // User Interaction
    favoritedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    
    favoriteCount: {
      type: Number,
      default: 0,
    },
    
    viewCount: {
      type: Number,
      default: 0,
    },
    
    // Recipe Source
    source: {
      type: String,
      enum: ['admin', 'user', 'imported'],
      default: 'admin',
    },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total time before saving
recipeSchema.pre('save', function(next) {
  this.totalTime = this.prepTime + this.cookTime;
  next();
});

// Indexes
recipeSchema.index({ name: 'text', description: 'text' });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ 'nutrition.calories': 1 });
recipeSchema.index({ favoriteCount: -1 });

module.exports = mongoose.model('Recipe', recipeSchema);