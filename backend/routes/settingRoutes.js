const express = require('express');
const router = express.Router();
const {
  getStoreSettings,
  updateStoreSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getShippingSettings,
  updateShippingSettings,
  getTaxSettings,
  updateTaxSettings,
  getEmailSettings,
  updateEmailSettings,
  getSEOSettings,
  updateSEOSettings
} = require('../controllers/settingController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('settings'));

// Settings routes
router.route('/store')
  .get(getStoreSettings)
  .put(updateStoreSettings);

router.route('/payment')
  .get(getPaymentSettings)
  .put(updatePaymentSettings);

router.route('/shipping')
  .get(getShippingSettings)
  .put(updateShippingSettings);

router.route('/tax')
  .get(getTaxSettings)
  .put(updateTaxSettings);

router.route('/email')
  .get(getEmailSettings)
  .put(updateEmailSettings);

router.route('/seo')
  .get(getSEOSettings)
  .put(updateSEOSettings);

module.exports = router;