const express = require('express');
const { shortenUrl, getUrls, getDailyStats, getMonthlyStats, redirectUrl } = require('../controllers/urlController');
const { protect } = require('../config/authMiddleware');

const router = express.Router();

// Public route for redirection
router.get('/:shortCode', redirectUrl);
//Note: The redirection route (/:shortCode) should be placed before other routes to avoid conflicts.


// Protected routes
router.post('/shorten', protect, shortenUrl);
router.get('/', protect, getUrls);
router.get('/stats/daily', protect, getDailyStats);
router.get('/stats/monthly', protect, getMonthlyStats);

module.exports = router;
