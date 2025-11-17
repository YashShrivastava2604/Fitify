const express = require('express');
const router = express.Router();
const { verifyClerkToken } = require('../middleware/clerkAuth.middleware');
const { searchFood } = require('../services/foodSearchService');

/**
 * Search for food
 * GET /api/food/search?query=chicken
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const result = await searchFood(query);

    return res.status(200).json({
      success: true,
      message: 'Food search completed',
      data: result.data,
      source: result.source
    });

  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
