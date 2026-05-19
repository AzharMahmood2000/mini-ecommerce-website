const fs = require('fs');
const path = require('path');
const multer = require('multer');
const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again later';

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error('Invalid upload payload'), false);
  }

  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }

  cb(null, true);
};

const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const singleImageUpload = (req, res, next) => {
  const handler = uploadProductImage.single('image');

  handler(req, res, (err) => {
    if (err) {
      console.error('[MULTER] Upload error:', err.message);
      console.error('[MULTER] Stack:', err.stack);

      if (err instanceof multer.MulterError) {
        const friendlyMessage = err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Please upload a file up to 5MB.'
          : 'Unable to upload image. Please try a different file.';
        return res.status(400).json({
          success: false,
          message: friendlyMessage,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Unable to upload image. Please use a valid image file.',
      });
    }

    console.log('[MULTER] Upload processed', {
      contentType: req.headers?.['content-type'],
      hasBody: !!req.body,
      hasFile: !!req.file,
      fileField: req.file?.fieldname || null,
      savedAs: req.file?.filename || null,
    });

    return next();
  });
};

const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profiles');

if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const profileImageUpload = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const singleProfileImageUpload = (req, res, next) => {
  const handler = profileImageUpload.single('profileImage');

  handler(req, res, (err) => {
    if (err) {
      console.error('[PROFILE MULTER] Upload error:', err.message);

      if (err instanceof multer.MulterError) {
        const friendlyMessage = err.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Please upload a file up to 5MB.'
          : 'Unable to upload image. Please try a different file.';
        return res.status(400).json({
          success: false,
          message: friendlyMessage,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Unable to upload image. Please use a valid image file.',
      });
    }

    return next();
  });
};

const uploadProfileImage = singleProfileImageUpload;

module.exports = {
  uploadProductImage,
  singleImageUpload,
  profileImageUpload,
  singleProfileImageUpload,
  uploadProfileImage,
};