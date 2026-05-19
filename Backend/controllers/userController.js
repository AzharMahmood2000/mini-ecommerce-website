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
        message: 'Invalid username or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive.',
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } catch (compareError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
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
        name: user.name,
        profileImage: user.profileImage || user.avatarUrl || '',
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

const buildUserProfileResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  name: user.name || '',
  mobile: user.mobile || '',
  location: user.location || '',
  profileImage: user.profileImage || user.avatarUrl || '',
  avatarUrl: user.avatarUrl || user.profileImage || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeOptionalString = (value, fallback = '') => {
  if (typeof value === 'undefined' || value === null) {
    return fallback;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('username email role name mobile location avatarUrl profileImage createdAt updatedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserProfileResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not fetch current user.',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log('[PROFILE GET] Endpoint hit');
    console.log('[PROFILE GET] req.user:', req.user);

    const user = await User.findById(req.user._id).select('username email role name mobile location avatarUrl profileImage createdAt updatedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserProfileResponse(user),
    });
  } catch (error) {
    console.error('[PROFILE GET] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not fetch profile.',
    });
  }
};

const getUserProfile = async (req, res) => {
  console.log('[ROUTE] GET profile route hit');
  return getProfile(req, res);
};

const updateProfile = async (req, res) => {
  try {
    console.log('[PROFILE UPDATE] Endpoint hit');
    console.log('[PROFILE UPDATE] req.user:', req.user);
    console.log('[PROFILE UPDATE] req.body:', req.body);
    console.log('[PROFILE UPDATE] req.file:', req.file || null);

    const {
      name,
      username,
      email,
      mobile,
      mobileNumber,
      location,
      profileImage,
      avatarUrl,
    } = req.body;

    const user = await User.findById(req.user._id).select('username email role name mobile location avatarUrl profileImage createdAt updatedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const normalizedName = normalizeOptionalString(name || username, user.name || user.username || '');
    const normalizedEmail = typeof email === 'string' && email.trim()
      ? email.trim().toLowerCase()
      : user.email;
    const normalizedMobile = normalizeOptionalString(mobile || mobileNumber, user.mobile || '');
    const normalizedLocation = normalizeOptionalString(location, user.location || '');
    const normalizedProfileImage = normalizeOptionalString(profileImage || avatarUrl, user.profileImage || user.avatarUrl || '');

    if (normalizedEmail !== user.email) {
      const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).select('_id');
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists.',
        });
      }
    }

    user.name = normalizedName;
    user.email = normalizedEmail;
    user.mobile = normalizedMobile;
    user.location = normalizedLocation;

    if (normalizedProfileImage) {
      user.profileImage = normalizedProfileImage;
      user.avatarUrl = normalizedProfileImage;
    }

    if (req.file) {
      const filePath = `/uploads/profiles/${req.file.filename}`;
      user.profileImage = filePath;
      user.avatarUrl = filePath;
    }

    await user.save();

    console.log('[PROFILE UPDATE] Saved user:', {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      location: user.location,
      profileImage: user.profileImage,
      avatarUrl: user.avatarUrl,
      updatedAt: user.updatedAt,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: buildUserProfileResponse(user),
    });
  } catch (error) {
    console.error('[PROFILE UPDATE] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not update profile.',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getProfile,
  getUserProfile,
  updateProfile,
};
