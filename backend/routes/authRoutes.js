const express = require('express');
const router = express.Router();
const {
  signUp, signIn, refreshToken, logout,
  getMe, changePassword, verifyEmail,
  getPendingRegistrations, updateRegistrationStatus,
  resendVerification
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { isAdminOrHR } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { signUpValidator, signInValidator, changePasswordValidator } = require('../validators/authValidator');

// Public routes
router.post('/signup', signUpValidator, validate, signUp);
router.post('/signin', signInValidator, validate, signIn);
router.post('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.use(authenticate);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/change-password', changePasswordValidator, validate, changePassword);

// HR/Admin routes for registration management
router.get('/pending-registrations', isAdminOrHR, getPendingRegistrations);
router.put('/registration/:id/status', isAdminOrHR, updateRegistrationStatus);

module.exports = router;