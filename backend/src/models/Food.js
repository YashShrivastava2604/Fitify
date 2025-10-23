const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    // USDA Identifiers
    usdaId: {
      type: String,
      unique: true,
      sparse: true, // Allows null for custom foods
      index: true,
    },
    
    // Food Details
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text', // For text search
    },
    
    description: {
      type: String,
    },
    
    category: {
      type: String,
      enum: [
        'fruit', 'vegetable', 'protein', 'dairy', 'grain', 
        'legume', 'nut', 'seed', 'beverage', 'snack', 
        'condiment', 'oil', 'sweetener', 'other'
      ],
      default: 'other',
    },
    
    // Serving Information
    serving: {
      size: { type: Number, required: true, default: 100 },
      unit: { type: String, required: true, default: 'g' },
      description: { type: String }, // e.g., "1 medium apple"
    },
    
    // Macronutrients (per serving)
    nutrition: {
      calories: { type: Number, required: true, default: 0 },
      protein: { type: Number, required: true, default: 0 },
      carbs: { type: Number, required: true, default: 0 },
      fats: { type: Number, required: true, default: 0 },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 }, // mg
      cholesterol: { type: Number, default: 0 }, // mg
      saturatedFat: { type: Number, default: 0 },
      transFat: { type: Number, default: 0 },
    },
    
    // Micronutrients (optional)
    vitamins: {
      vitaminA: { type: Number, default: 0 }, // mcg
      vitaminC: { type: Number, default: 0 }, // mg
      vitaminD: { type: Number, default: 0 }, // mcg
      vitaminE: { type: Number, default: 0 }, // mg
      vitaminK: { type: Number, default: 0 }, // mcg
      vitaminB6: { type: Number, default: 0 }, // mg
      vitaminB12: { type: Number, default: 0 }, // mcg
      folate: { type: Number, default: 0 }, // mcg
      niacin: { type: Number, default: 0 }, // mg
    },
    
    minerals: {
      calcium: { type: Number, default: 0 }, // mg
      iron: { type: Number, default: 0 }, // mg
      magnesium: { type: Number, default: 0 }, // mg
      phosphorus: { type: Number, default: 0 }, // mg
      potassium: { type: Number, default: 0 }, // mg
      zinc: { type: Number, default: 0 }, // mg
      selenium: { type: Number, default: 0 }, // mcg
    },
    
    // Usage Statistics
    searchCount: {
      type: Number,
      default: 0,
    },
    
    logCount: {
      type: Number,
      default: 0,
    },
    
    // Data Source
    source: {
      type: String,
      enum: ['usda', 'custom', 'user'],
      default: 'usda',
    },
    
    // For user-created foods
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
foodSchema.index({ name: 'text' });
foodSchema.index({ category: 1 });
foodSchema.index({ searchCount: -1 });
foodSchema.index({ usdaId: 1 });

module.exports = mongoose.model('Food', foodSchema);
