const FoodDatabase = require('../models/FoodDatabase');
const { recognizeFoodWithGemini } = require('./geminiService');

/**
 * Recognize food - Gemini provides nutrition directly
 */
const recognizeFood = async (base64Image) => {
  console.log('🍽️ Starting food recognition with Gemini...');

  try {
    const result = await recognizeFoodWithGemini(base64Image);

    // Gemini already provides nutrition - no database lookup needed!
    console.log('✅ Recognition complete with nutrition data');

    return {
      success: true,
      is_multi_dish: result.is_multi_dish,
      dishes: result.dishes, // Already has nutrition from Gemini
      overall_confidence: result.overall_confidence,
      platter_type: result.platter_type,
      source: result.source,
    };

  } catch (error) {
    console.error('❌ Food recognition failed:', error);
    return {
      success: false,
      error: 'recognition_failed',
      message: error.message
    };
  }
};

/**
 * Search dishes from database (for manual add)
 */
const searchDishes = async (query, limit = 20) => {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    console.log(`🔍 Searching dishes for: "${query}"`);

    // Text search
    const results = await FoodDatabase.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('name nutrition source');

    console.log(`✅ Found ${results.length} results`);

    return results;
  } catch (error) {
    console.error('Search dishes error:', error);
    return [];
  }
};

module.exports = {
  recognizeFood,
  searchDishes,
};
