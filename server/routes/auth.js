import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getMe, 
    verifyEmail, 
    resendOTP,
    refreshToken,
    changePassword,
    toggle2FA,
    setup2FA,
    verifyAndEnable2FA,
    loginWithMFA,
    getAuditLogs
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-mfa', loginWithMFA);
router.post('/verify', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/refresh-token', refreshToken);
router.post('/change-password', protect, changePassword);
router.post('/toggle-2fa', protect, toggle2FA);
router.post('/setup-2fa', protect, setup2FA);
router.post('/verify-2fa', protect, verifyAndEnable2FA);
router.get('/me', protect, getMe);
router.get('/audit-logs', protect, getAuditLogs);

export default router;
