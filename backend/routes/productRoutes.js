const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getPublicProducts,
  getPublicProductsByCategory,
  getProductsByCategory,
  searchProducts,
  updateProductStock,
  bulkUpdateProducts,
  getProductStats,
  recalculateCategoryProductCounts
} = require('../controllers/productController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');

// Public routes (no authentication required)
router.get('/public', identifyStore, getPublicProducts);
router.get('/public/featured', identifyStore, getFeaturedProducts);
router.get('/public/search', identifyStore, searchProducts);
router.get('/public/category/:categoryId', identifyStore, getPublicProductsByCategory);
router.get('/public/:id', identifyStore, getProductById);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('products'));

// Product routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/stats', getProductStats);
router.get('/category/:categoryId', getProductsByCategory);
router.post('/recalculate-category-counts', recalculateCategoryProductCounts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.put('/:id/stock', updateProductStock);
router.put('/bulk/update', bulkUpdateProducts);

module.exports = router;