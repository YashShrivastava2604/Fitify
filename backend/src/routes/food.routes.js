const express = require('express');
const router = express.Router();
const { searchFood } = require('../services/foodSearchService');

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    // Validate query parameter exists
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "query" is required',
        example: '/api/food/search?query=pav%20bhaji',
      });
    }

    // Validate query length
    if (query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        query: query,
      });
    }

    console.log(`📋 Route: Food search for "${query}"`);

    // Call service to search both INDB and USDA
    const result = await searchFood(query);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Food search completed successfully',
      source: result.source,
      count: result.count,
      data: result.data,
    });

  } catch (error) {
    console.error('🔴 Food search route error:', error.message);

    // Return error response
    return res.status(400).json({
      success: false,
      error: error.message,
      query: req.query.query,
    });
  }
});

module.exports = router;
