const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
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

module.exports = {
  uploadProductImage,
  singleImageUpload,
};