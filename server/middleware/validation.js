const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  
  body('phone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Please provide a valid phone number (10-15 digits)')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Phone number can only contain digits, spaces, hyphens, parentheses, and optional + prefix'),
  
  body('sponsorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid sponsor ID'),
  
  body('position')
    .optional()
    .isString()
    .withMessage('Position must be a string'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name is required and must be less than 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Product description is required and must be less than 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('pv')
    .isFloat({ min: 0 })
    .withMessage('Point Value must be a positive number'),
  
  body('category')
    .isIn(['product', 'package', 'subscription'])
    .withMessage('Category must be product, package, or subscription'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct
};
