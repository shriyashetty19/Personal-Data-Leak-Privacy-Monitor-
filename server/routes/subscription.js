import express from 'express';
import { createCheckoutSession, getMySubscription, handleStripeWebhook } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Webhook must be before the JSON middleware if we want to handle raw body, 
// but here we'll handle it in server.js to use express.raw() for this specific route.
router.get('/me', protect, getMySubscription);
router.post('/create-checkout-session', protect, createCheckoutSession);

export default router;
