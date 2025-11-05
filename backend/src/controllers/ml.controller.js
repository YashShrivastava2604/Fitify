const { recognizeFood } = require('../services/mlService');
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

    console.log(`✅ Recognized: ${result.food_name} (${result.source})`);

    return successResponse(res, 200, 'Food recognized', result);

  } catch (error) {
    console.error('ML recognition error:', error);
    return errorResponse(res, 500, 'Recognition failed', error.message);
  }
};

module.exports = {
  recognizeFoodImage
};
