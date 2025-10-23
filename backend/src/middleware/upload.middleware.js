const multer = require('multer');
const path = require('path');
const { errorResponse } = require('../utils/responses');

// Configure storage (memory storage for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

/**
 * Error handling middleware for multer
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'File size too large. Maximum 5MB allowed.');
    }
    return errorResponse(res, 400, `Upload error: ${err.message}`);
  }
  
  if (err) {
    return errorResponse(res, 400, err.message);
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError,
};