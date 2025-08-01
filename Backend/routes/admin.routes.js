const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

router.use(auth, role('admin'));
router.post('/workflow', adminController.triggerWorkflow);
router.get('/analytics', adminController.getSystemAnalytics);
router.get('/posts', adminController.getAllPosts);
router.get('/analytics/report', adminController.getAnalyticsReport);

module.exports = router;