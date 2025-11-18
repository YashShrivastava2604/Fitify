const express = require('express');
const router = express.Router();
const { verifyClerkToken } = require('../middleware/clerkAuth.middleware');
const { recognizeFoodImage, searchDishesController } = require('../controllers/ml.controller');

// POST /api/ml/recognize
router.post('/recognize', verifyClerkToken, recognizeFoodImage);

// GET /api/ml/search?q=query
router.get('/search', verifyClerkToken, searchDishesController);

module.exports = router;
