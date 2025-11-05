// Comprehensive nutrition database (per 100g serving)
const NUTRITION_DATABASE = {
  // Indian Veg Foods
  'biryani': { calories: 200, protein: 7, carbs: 35, fats: 4, fiber: 2 },
  'paneer_butter_masala': { calories: 265, protein: 12, carbs: 10, fats: 20, fiber: 2 },
  'palak_paneer': { calories: 180, protein: 11, carbs: 8, fats: 12, fiber: 3 },
  'dal_makhani': { calories: 150, protein: 7, carbs: 18, fats: 5, fiber: 5 },
  'dal_tadka': { calories: 105, protein: 6, carbs: 17, fats: 2, fiber: 4.5 },
  'chole': { calories: 164, protein: 9, carbs: 27, fats: 3, fiber: 7.6 },
  'rajma': { calories: 140, protein: 8.7, carbs: 25, fats: 0.5, fiber: 6.4 },
  'sambar': { calories: 80, protein: 4, carbs: 14, fats: 1.5, fiber: 3.5 },
  'aloo_gobi': { calories: 90, protein: 2.5, carbs: 15, fats: 2.5, fiber: 3 },
  'bhindi_masala': { calories: 65, protein: 2, carbs: 10, fats: 2, fiber: 3.5 },
  'baingan_bharta': { calories: 85, protein: 2, carbs: 12, fats: 3.5, fiber: 4 },
  
  // Rice & Breads
  'roti': { calories: 80, protein: 3, carbs: 15, fats: 1, fiber: 2 },
  'naan': { calories: 260, protein: 9, carbs: 45, fats: 5, fiber: 2 },
  'paratha': { calories: 300, protein: 6, carbs: 40, fats: 12, fiber: 3 },
  'dosa': { calories: 168, protein: 4, carbs: 28, fats: 4, fiber: 2 },
  'idli': { calories: 58, protein: 2, carbs: 12, fats: 0.4, fiber: 1 },
  
  // Snacks
  'samosa': { calories: 308, protein: 6, carbs: 40, fats: 13, fiber: 3 },
  'pakora': { calories: 280, protein: 8, carbs: 30, fats: 14, fiber: 4 },
  'vada': { calories: 250, protein: 6, carbs: 35, fats: 9, fiber: 3.5 },
  
  // Western Foods
  'pizza': { calories: 266, protein: 11, carbs: 33, fats: 10, fiber: 2.3 },
  'burger': { calories: 295, protein: 17, carbs: 28, fats: 14, fiber: 1.5 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fats: 1.1, fiber: 1.8 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
  
  // Fruits & Vegetables
  'apple': { calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6 },
  'salad': { calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, fiber: 1.3 },
  
  // Default fallback
  'default': { calories: 150, protein: 5, carbs: 20, fats: 5, fiber: 2 }
};

module.exports = NUTRITION_DATABASE;
