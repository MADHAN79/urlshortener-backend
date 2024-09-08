const Url = require('../models/Url');
const shortid = require('shortid');

// @desc    Shorten a new URL
// @route   POST /api/url/shorten
// @access  Private
const shortenUrl = async (req, res) => {
  const { longUrl } = req.body;

  try {
    // Generate unique short code
    let shortCode = shortid.generate();

    // Ensure uniqueness
    let existing = await Url.findOne({ shortCode });
    while (existing) {
      shortCode = shortid.generate();
      existing = await Url.findOne({ shortCode });
    }

    // Create new URL entry
    const url = await Url.create({
      longUrl,
      shortCode,
      createdBy: req.user._id,
    });

    res.status(201).json({ shortUrl: url.shortCode });
  } catch (error) {
    console.error('Shorten URL Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Redirect to long URL
// @route   GET /:shortCode
// @access  Public
const redirectUrl = async (req, res) => {
  const { shortCode } = req.params;

  try {
    // Find URL by short code
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Increment click count
    url.clicks += 1;
    await url.save();

    // Redirect to long URL
    res.redirect(url.longUrl);
  } catch (error) {
    console.error('Redirect URL Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all URLs for the authenticated user
// @route   GET /api/url
// @access  Private
const getUrls = async (req, res) => {
  try {
    const urls = await Url.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Get URLs Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get URL creation stats per day
// @route   GET /api/url/stats/daily
// @access  Private
const getDailyStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const stats = await Url.aggregate([
      { $match: { createdBy: req.user._id, createdAt: { $gte: startOfDay } } },
      { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } },
    ]);

    const result = {};
    stats.forEach((item) => {
      result[`Day ${item._id}`] = item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Get Daily Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get URL creation stats per month
// @route   GET /api/url/stats/monthly
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await Url.aggregate([
      { $match: { createdBy: req.user._id, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    ]);

    const result = {};
    stats.forEach((item) => {
      result[`Month ${item._id}`] = item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Get Monthly Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { shortenUrl, redirectUrl, getUrls, getDailyStats, getMonthlyStats };
