const express = require('express');
const router = express.Router();
const {
  customerSignup,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  changePassword
} = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/customerAuth');

// Public routes
router.post('/signup', customerSignup);
router.post('/login', customerLogin);

// Protected routes
router.use(protectCustomer);
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.put('/change-password', changePassword);

module.exports = router; 