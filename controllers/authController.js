const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    // Generate activation token
    const activationToken = generateToken(user._id);

    // Create activation URL
    const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

    // Email message
    const message = `
      <h1>Account Activation</h1>
      <p>Please click the link below to activate your account:</p>
      <a href="${activationUrl}" clicktracking=off>${activationUrl}</a>
    `;

    // Send activation email
    await sendEmail({
      to: user.email,
      subject: 'Account Activation',
      html: message,
    });

    res.status(201).json({ message: 'Registration successful! Please check your email to activate your account.' });
  } catch (error) {
    console.error('Register User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Activate user account
// @route   GET /api/auth/activate/:token
// @access  Public
// Corrected activation controller
const activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: 'Account already activated' });
    }

    // Activate user
    user.isActive = true;
    await user.save();

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Activate Account Error:', error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};


// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account not activated. Please check your email.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Auth User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    // Generate reset token
    const resetToken = generateToken(user._id);

    // Set reset token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email message
    const message = `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    `;

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: message,
    });

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find user
    const user = await User.findById(userId);

    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { registerUser, activateAccount, authUser, forgotPassword, resetPassword };
