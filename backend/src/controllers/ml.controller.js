const { recognizeFood, searchDishes } = require('../services/mlService');
const { successResponse, errorResponse } = require('../utils/responses');

/**
 * Recognize food from uploaded image
 * POST /api/ml/recognize
 */
const recognizeFoodImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return errorResponse(res, 400, 'Image data is required');
    }

    console.log('📸 Processing food recognition...');

    const result = await recognizeFood(image);

    if (!result.success) {
      return errorResponse(res, 422, result.error, result.message);
    }

    console.log(`✅ Recognized: ${result.is_multi_dish ? `${result.dishes.length} dishes` : result.dishes[0].name} (${result.source})`);

    return successResponse(res, 200, 'Food recognized', result);

  } catch (error) {
    console.error('ML recognition error:', error);
    return errorResponse(res, 500, 'Recognition failed', error.message);
  }
};

/**
 * Search dishes from database
 * GET /api/ml/search?q=query
 */
const searchDishesController = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return successResponse(res, 200, 'Search results', []);
    }

    console.log(`🔍 Searching dishes for: "${q}"`);

    const results = await searchDishes(q, 20);

    console.log(`✅ Found ${results.length} results`);

    return successResponse(res, 200, 'Search results', results);

  } catch (error) {
    console.error('Search dishes error:', error);
    return errorResponse(res, 500, 'Search failed', error.message);
  }
};

module.exports = {
  recognizeFoodImage,
  searchDishesController,
};
