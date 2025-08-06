const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

router.post('/register', validate.register, authController.register);
router.post('/login', validate.login, authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', validate.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-verification', authController.resendVerificationEmail);
router.get('/social-login/google', authController.googleAuth);
router.get('/social-login/google/callback', authController.googleCallback);

module.exports = router;