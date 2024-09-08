const express = require('express');
const { registerUser, activateAccount, authUser, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.get('/activate/:token', activateAccount);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
