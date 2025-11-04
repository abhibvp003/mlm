const { v4: uuidv4 } = require('uuid');

/**
 * Generate a GUID (UUID v4)
 * @returns {string} A unique GUID string
 */
const generateGUID = () => {
  return uuidv4();
};

/**
 * Generate a shorter GUID (8 characters)
 * @returns {string} A shorter unique identifier
 */
const generateShortGUID = () => {
  return uuidv4().substring(0, 8).toUpperCase();
};

/**
 * Generate a numeric GUID (8 digits)
 * @returns {string} A numeric unique identifier
 */
const generateNumericGUID = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

module.exports = {
  generateGUID,
  generateShortGUID,
  generateNumericGUID
};
