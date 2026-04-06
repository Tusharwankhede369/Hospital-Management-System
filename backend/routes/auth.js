const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register patient (only patients can self-register). Phone mandatory. Sends verification OTP to email.
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address, gender, dateOfBirth, bloodGroup, emergencyContact } = req.body;
    const emailNorm = email.toLowerCase().trim();
    const phoneNorm = String(phone).trim();

    let user = await User.findOne({ $or: [{ email: emailNorm }, { phone: phoneNorm }] });
    if (user) {
      if (user.email === emailNorm) return res.status(400).json({ message: 'This email is already registered' });
      return res.status(400).json({ message: 'This phone number is already registered' });
    }

    const verificationCode = String(crypto.randomInt(100000, 999999));

    user = new User({
      name,
      email: emailNorm,
      password,
      phone: phoneNorm,
      role: 'patient',
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: Date.now() + 15 * 60 * 1000, // 15 min
      address,
      gender,
      dateOfBirth,
      bloodGroup,
      emergencyContact
    });

    await user.save();

    const sent = await sendOTPEmail(user.email, verificationCode, 'verify');
    if (!sent) {
      console.log('[Dev] Email verification OTP for', user.email, ':', verificationCode);
    }

    res.status(201).json({
      message: 'Registration successful. Verify your email with the code we sent.',
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login with email + password OR phone + password
// @access  Public
router.post('/login', [
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Please provide email or phone number' });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      user = await User.findOne({ phone: String(phone).trim() });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // New patients must verify email before login (existing users without field can still login)
    if (user.role === 'patient' && user.emailVerified === false) {
      return res.status(400).json({ message: 'Please verify your email first. Check your inbox for the verification code.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send 6-digit OTP to email for password reset
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    const otp = String(crypto.randomInt(100000, 999999));
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const sent = await sendOTPEmail(user.email, otp, 'reset');
    if (!sent) {
      console.log('[Dev] Password reset OTP for', user.email, ':', otp);
    }

    res.json({ message: 'OTP sent to your email. Check your inbox (and spam).' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with email + OTP received by email
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: String(otp).trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Request a new code.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // Once user has proven ownership of email via OTP, treat email as verified
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP sent at registration (proves real email)
// @access  Public
router.post('/verify-email', [
  body('email').isEmail().withMessage('Email is required'),
  body('code').notEmpty().withMessage('Verification code is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationCode: String(code).trim(),
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code. Request a new one.' });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fixed admin registration password (only this password allows admin registration)
const ADMIN_REGISTRATION_PASSWORD = 'Tushar@hmsadmin$1977';

// @route   POST /api/auth/register-admin
// @desc    Register admin (fixed password required; only first admin can register)
// @access  Public
router.post('/register-admin', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    if (password !== ADMIN_REGISTRATION_PASSWORD) {
      return res.status(403).json({ message: 'Invalid admin registration password.' });
    }

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists. Please contact existing admin.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration code for Doctor/Staff/HR self-registration (must match DEFAULT_NEW_USER_PASSWORD or set REGISTRATION_CODE)
const getRegistrationCode = () => process.env.REGISTRATION_CODE || process.env.DEFAULT_NEW_USER_PASSWORD;

// @route   POST /api/auth/register-doctor
// @desc    Register doctor (requires registration code from admin if set)
// @access  Public
router.post('/register-doctor', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const code = getRegistrationCode();
    if (code && req.body.registrationCode !== code) {
      return res.status(403).json({ message: 'Invalid registration code. Contact admin for the code.' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, qualification, department, experience, consultationFees } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create doctor user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'doctor',
      qualification,
      department,
      experience,
      consultationFees,
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-hr
// @desc    Register HR (requires registration code from admin if set)
// @access  Public
router.post('/register-hr', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const code = getRegistrationCode();
    if (code && req.body.registrationCode !== code) {
      return res.status(403).json({ message: 'Invalid registration code. Contact admin for the code.' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, salary } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create HR user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'hr',
      salary,
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-staff
// @desc    Register staff (requires registration code from admin if set)
// @access  Public
router.post('/register-staff', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const code = getRegistrationCode();
    if (code && req.body.registrationCode !== code) {
      return res.status(403).json({ message: 'Invalid registration code. Contact admin for the code.' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, staffType, assignedDepartment } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create staff user
    user = new User({
      name,
      email,
      password,
      phone,
      role: 'staff',
      staffType,
      assignedDepartment,
      isActive: true
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

