const express = require('express');
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { singleProfileImageUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, singleProfileImageUpload, updateProfile);

module.exports = router;