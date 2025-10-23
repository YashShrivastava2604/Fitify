const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
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
    
    // Meal Details
    date: {
      type: Date,
      required: true,
      index: true,
    },
    
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    
    // Food Information
    food: {
      name: {
        type: String,
        required: true,
      },
      
      // Reference to Food collection (optional, if food exists in DB)
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
      },
      
      // Serving size
      servingSize: {
        type: Number,
        required: true,
      },
      
      servingUnit: {
        type: String,
        required: true,
        default: 'g',
      },
    },
    
    // Nutrition Information
    nutrition: {
      calories: { type: Number, required: true, default: 0 },
      protein: { type: Number, required: true, default: 0 }, // grams
      carbs: { type: Number, required: true, default: 0 }, // grams
      fats: { type: Number, required: true, default: 0 }, // grams
      fiber: { type: Number, default: 0 }, // grams
      sugar: { type: Number, default: 0 }, // grams
      sodium: { type: Number, default: 0 }, // mg
    },
    
    // Source of entry
    source: {
      type: String,
      enum: ['manual', 'scan', 'recipe', 'barcode'],
      default: 'manual',
    },
    
    // Image URL (if scanned)
    imageUrl: {
      type: String, // Cloudinary URL
    },
    
    cloudinaryPublicId: {
      type: String, // For deletion from Cloudinary
    },
    
    // Notes
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for queries
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ clerkId: 1, date: -1 });
mealSchema.index({ date: -1 });

// Calculate date string for easy querying (YYYY-MM-DD)
mealSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

mealSchema.set('toJSON', { virtuals: true });
mealSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Meal', mealSchema);