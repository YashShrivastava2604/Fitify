/**
 * Utility validation functions
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate if string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate date string (YYYY-MM-DD)
 */
const isValidDateString = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate if number is within range
 */
const isInRange = (value, min, max) => {
  return typeof value === 'number' && value >= min && value <= max;
};

/**
 * Sanitize string (remove HTML tags)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};


/**
 * Validate image file type
 */
const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

module.exports = {
  isValidEmail,
  isValidObjectId,
  isValidDateString,
  isInRange,
  sanitizeString,
  isValidImageType,
};
