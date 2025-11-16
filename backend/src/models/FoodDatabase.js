// backend/src/models/FoodDatabase.js
const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  alternateNames: [String],
  servingSize: Number,
  servingUnit: String,
  source: { type: String, enum: ['indb', 'usda'], default: 'indb' },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    fiber: Number,
  },
  metadata: {
    category: String,  
    region: String,    
  }
});

foodSchema.index({ name: 'text', alternateNames: 'text' });

module.exports = mongoose.model('FoodDatabase', foodSchema);