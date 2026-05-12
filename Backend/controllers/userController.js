const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

const registerUser = async (req, res) => {
  try {
    console.log('[REGISTER] Content-Type:', req.headers['content-type']);

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      console.log('Missing required fields in request body.');
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      console.log('Duplicate user found:', {
        emailExists: existingUser.email === normalizedEmail,
        usernameExists: existingUser.username === normalizedUsername,
      });

      const isEmailTaken = existingUser.email === normalizedEmail;
      const isUsernameTaken = existingUser.username === normalizedUsername;

      return res.status(409).json({
        success: false,
        message: isEmailTaken && isUsernameTaken
          ? 'Email and username already exist.'
          : isEmailTaken
            ? 'Email already exists.'
            : 'Username already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('Password hashed successfully.');

    const newUser = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    console.log('User saved successfully with id:', newUser._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Register user error:', error.message);
    console.error('Register user stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while registering the user.',
    });
  }
};

const loginUser = async (req, res) => {
  try {
    console.log('[LOGIN] Content-Type:', req.headers['content-type']);

    const { emailOrUsername, email, username, password } = req.body;
    const loginIdentifier = emailOrUsername || email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Provide emailOrUsername (or email or username) and password.',
      });
    }

    const normalizedIdentifier = String(loginIdentifier).trim();
    const normalizedEmail = normalizedIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedIdentifier }],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is missing in environment variables.',
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Login user error:', error.message);
    console.error('Login user stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while logging in.',
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile,
        location: user.location,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not fetch current user.',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
