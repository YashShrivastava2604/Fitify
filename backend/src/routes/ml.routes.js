const express = require('express');
const router = express.Router();
const { verifyClerkToken } = require('../middleware/clerkAuth.middleware');
const { recognizeFoodImage } = require('../controllers/ml.controller');

// POST /api/ml/recognize
router.post('/recognize', verifyClerkToken, recognizeFoodImage);

module.exports = router;
