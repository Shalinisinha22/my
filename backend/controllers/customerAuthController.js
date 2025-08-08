const Customer = require('../models/Customer');
const Store = require('../models/Store');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// @desc    Customer signup
// @route   POST /api/customer/auth/signup
// @access  Public
const customerSignup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, storeName } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !storeName) {
      return res.status(400).json({ 
        message: 'Please provide firstName, lastName, email, password, and storeName' 
      });
    }

    // Find store by name
    const store = await Store.findOne({ 
      name: { $regex: new RegExp(storeName, 'i') },
      status: 'active'
    });

    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found. Please check the store name and try again.' 
      });
    }

    // Check if customer already exists in this store
    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase(),
      storeId: store._id
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        message: 'Customer with this email already exists in this store' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const customer = await Customer.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      storeId: store._id,
      status: 'active'
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.email, 
        storeId: store._id,
        type: 'customer'
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: customerResponse,
      token,
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug
      }
    });
  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// @desc    Customer login
// @route   POST /api/customer/auth/login
// @access  Public
const customerLogin = async (req, res) => {
  try {
    const { email, password, storeName } = req.body;

    // Validate required fields
    if (!email || !password || !storeName) {
      return res.status(400).json({ 
        message: 'Please provide email, password, and storeName' 
      });
    }

    // Find store by name
    const store = await Store.findOne({ 
      name: { $regex: new RegExp(storeName, 'i') },
      status: 'active'
    });

    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found. Please check the store name and try again.' 
      });
    }

    // Find customer in this store
    const customer = await Customer.findOne({
      email: email.toLowerCase(),
      storeId: store._id
    }).select('+password');

    if (!customer) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Check if customer is blocked
    if (customer.status === 'blocked') {
      return res.status(401).json({ 
        message: 'Your account has been blocked. Please contact support.' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Update login stats
    customer.lastLogin = new Date();
    customer.loginCount += 1;
    await customer.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        email: customer.email, 
        storeId: store._id,
        type: 'customer'
      },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.json({
      message: 'Login successful',
      customer: customerResponse,
      token,
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get customer profile
// @route   GET /api/customer/auth/profile
// @access  Private
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/auth/profile
// @access  Private
const updateCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'addresses', 'preferences'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    const updatedCustomer = await customer.save();

    // Remove password from response
    const customerResponse = updatedCustomer.toObject();
    delete customerResponse.password;

    res.json({
      message: 'Profile updated successfully',
      customer: customerResponse
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change customer password
// @route   PUT /api/customer/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide current password and new password' 
      });
    }

    const customer = await Customer.findById(req.customer.id).select('+password');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  customerSignup,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  changePassword
}; 