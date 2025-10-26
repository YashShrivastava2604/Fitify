const express = require('express');
const router = express.Router();
const { handleClerkWebhook } = require('../controllers/webhook.controller');

// Clerk webhook endpoint
// POST /api/webhooks/clerk
// router.get('/verify', (req, res) => res.status(200).json({ success: true }));
router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

module.exports = router;