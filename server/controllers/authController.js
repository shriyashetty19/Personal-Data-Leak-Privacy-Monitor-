import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { isDbConnected } from '../config/db.js';
import mockStore from '../utils/mockStore.js';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { validateEmailExistence } from '../utils/emailValidator.js';
import emailService from '../utils/emailService.js';
import { logAction } from '../utils/auditLogger.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password' });
        }

        // 1. Realistic Email Existence Check
        const validation = await validateEmailExistence(email);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        // Check if user exists
        let existingUser;
        if (isDbConnected) {
            existingUser = await User.findOne({ email });
        } else {
            existingUser = await mockStore.findUserByEmail(email);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (existingUser) {
            // Case 1: Already verified -> Block
            if (existingUser.isVerified) {
                return res.status(400).json({ message: 'User already exists and is verified. Please log in.' });
            }

            // Case 2: Exists but NOT verified -> Update OTP and send new one
            console.log(`🔄 User ${email} exists but unverified. Refreshing OTP...`);
            
            if (isDbConnected) {
                existingUser.verificationOTP = otp;
                existingUser.otpExpires = otpExpires;
                await existingUser.save();
            } else {
                await mockStore.updateUserDetails(existingUser._id, {
                    verificationOTP: otp,
                    otpExpires: otpExpires
                });
            }

            await emailService.sendVerificationEmail(email, otp);

            return res.status(201).json({
                message: 'Account pending verification. A fresh code has been sent.',
                email: email,
                requiresVerification: true
            });
        }

        // Case 3: Fresh User -> Create new
        let newUser;
        if (isDbConnected) {
            newUser = await User.create({
                name,
                email,
                password,
                isVerified: false,
                verificationOTP: otp,
                otpExpires: otpExpires
            });
        } else {
            newUser = await mockStore.createUser({
                name,
                email,
                password,
                isVerified: false,
                verificationOTP: otp,
                otpExpires: otpExpires
            });
        }

        // 3. Send Verification Email (for new user)
        await emailService.sendVerificationEmail(email, otp);

        res.status(201).json({
            message: 'Verification code sent to email',
            email: newUser.email,
            requiresVerification: true
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify
// @access  Public
export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        let user;
        if (isDbConnected) {
            user = await User.findOne({ email }).select('+verificationOTP +otpExpires');
        } else {
            user = await mockStore.findUserByEmail(email);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check OTP
        if (user.verificationOTP !== otp) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Check Expiry
        if (new Date() > new Date(user.otpExpires)) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        // Activate User
        if (isDbConnected) {
            user.isVerified = true;
            user.verificationOTP = undefined;
            user.otpExpires = undefined;
            await user.save();
        } else {
            await mockStore.verifyUser(user._id);
        }

        res.status(200).json({
            message: 'Email verified successfully',
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });

        // Audit Log
        await logAction({
            userId: user._id,
            action: 'EMAIL_VERIFIED',
            resource: 'USER',
            details: { email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Verification error: ' + error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user;
        if (isDbConnected) {
            user = await User.findOne({ email }).select('+password');
        } else {
            user = await mockStore.findUserByEmail(email);
        }

        if (!user || (isDbConnected ? !(await user.matchPassword(password)) : user.password !== password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in',
                email: user.email,
                requiresVerification: true 
            });
        }

        // 5. Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            return res.status(200).json({
                _id: user._id || user.id,
                email: user.email,
                mfaRequired: true,
                message: 'MFA token required'
            });
        }

        const token = generateToken(user._id || user.id);

        res.json({
            _id: user._id || user.id,
            name: user.name,
            email: user.email,
            token: token,
        });

        // Audit Log
        await logAction({
            userId: user._id || user.id,
            action: 'LOGIN_SUCCESS',
            resource: 'USER',
            details: { email: user.email }
        }, req);
    } catch (error) {
        res.status(500).json({ message: 'Login error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        let user;
        if (isDbConnected) {
            user = await User.findOne({ email });
        } else {
            user = await mockStore.findUserByEmail(email);
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        if (isDbConnected) {
            user.verificationOTP = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            await mockStore.setOTP(user._id, otp, otpExpires);
        }

        await emailService.sendVerificationEmail(email, otp);
        res.status(200).json({ message: 'New verification code sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error resending OTP' });
    }
};

export const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Refresh JWT
// @route   POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Refresh token required' });

        if (isDbConnected) {
            const RefreshToken = (await import('../models/RefreshToken.js')).default;
            const existingToken = await RefreshToken.findOne({ token }).populate('user');
            
            if (!existingToken || existingToken.isExpired || existingToken.revoked) {
                return res.status(401).json({ message: 'Invalid or expired refresh token' });
            }
            
            const newAccessToken = generateToken(existingToken.user._id);
            res.status(200).json({ token: newAccessToken });
        } else {
            // Mock handling: just return a new token assuming validity for simplicity
            res.status(200).json({ token: generateToken('mock_user_id') });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error refreshing token' });
    }
};

// @desc    Change Password
// @route   POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });

        if (isDbConnected) {
            const user = await User.findById(req.user._id).select('+password');
            if (!(await user.matchPassword(currentPassword))) {
                return res.status(401).json({ message: 'Incorrect current password' });
            }
            user.password = newPassword;
            await user.save();
            res.status(200).json({ message: 'Password updated successfully' });
        } else {
            // Mock
            res.status(200).json({ message: 'Password updated successfully (Mock)' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error changing password' });
    }
};

// @desc    Setup 2FA (Generate Secret & QR)
// @route   POST /api/auth/setup-2fa
// @access  Private
export const setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({
            name: `DataLeakMonitor (${user.email})`
        });

        user.twoFactorSecret = secret.base32;
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });

        await logAction({
            userId: user._id,
            action: 'MFA_SETUP_INITIATED',
            resource: 'USER'
        }, req);
    } catch (error) {
        res.status(500).json({ message: 'Error setting up 2FA' });
    }
};

// @desc    Verify and Enable 2FA
// @route   POST /api/auth/verify-2fa
// @access  Private
export const verifyAndEnable2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA token' });
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.status(200).json({ message: '2FA enabled successfully' });

        await logAction({
            userId: user._id,
            action: 'MFA_ENABLED',
            resource: 'USER'
        }, req);
    } catch (error) {
        res.status(500).json({ message: 'Error verifying 2FA' });
    }
};

// @desc    Login with 2FA token
// @route   POST /api/auth/login-mfa
// @access  Public
export const loginWithMFA = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId).select('+twoFactorSecret');

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA not enabled' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid 2FA token' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });

        await logAction({
            userId: user._id,
            action: 'LOGIN_MFA_SUCCESS',
            resource: 'USER'
        }, req);
    } catch (error) {
        res.status(500).json({ message: 'Error during MFA login' });
    }
};

// @desc    Toggle 2FA (Disable)
// @route   POST /api/auth/toggle-2fa
// @access  Private
export const toggle2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();
        
        res.status(200).json({ 
            message: '2FA Disabled',
            enabled: false
        });

        await logAction({
            userId: user._id,
            action: 'MFA_DISABLED',
            resource: 'USER'
        }, req);
    } catch (error) {
        res.status(500).json({ message: 'Error disabling 2FA' });
    }
};

// @desc    Get audit logs for the authenticated user
// @route   GET /api/auth/audit-logs
// @access  Private
export const getAuditLogs = async (req, res) => {
    try {
        let logs;
        if (isDbConnected) {
            logs = await AuditLog.find({ user: req.user._id }).sort({ createdAt: -1 });
        } else {
            logs = mockStore.auditLogs || [];
            // Filter logs by this user's ID
            logs = logs.filter(l => l.user && l.user.toString() === req.user._id.toString());
        }

        const formattedLogs = logs.map(l => ({
            _id: l._id,
            action: l.action,
            resource: l.resource,
            ipAddress: l.ipAddress || 'N/A',
            timestamp: l.createdAt || l.timestamp || new Date(),
            status: l.details?.status || 'success'
        }));

        res.status(200).json(formattedLogs);
    } catch (error) {
        console.error('❌ Get Audit Logs Error:', error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};
