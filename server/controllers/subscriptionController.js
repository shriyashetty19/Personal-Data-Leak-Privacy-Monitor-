import stripe from '../config/stripe.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Create a Stripe checkout session
// @route   POST /api/subscription/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
    try {
        const { planId } = req.body;
        const user = await User.findById(req.user._id);

        if (!planId || !['pro', 'enterprise'].includes(planId)) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const priceMap = {
            pro: process.env.STRIPE_PRO_PRICE_ID || 'price_mock_pro',
            enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_mock_ent'
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price: priceMap[planId],
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pricing`,
            metadata: {
                userId: user._id.toString(),
                planId: planId
            }
        });

        res.status(200).json({ sessionId: session.id, url: session.url });

        await logAction({
            userId: user._id,
            action: 'CHECKOUT_INITIATED',
            resource: 'SUBSCRIPTION',
            details: { planId }
        }, req);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/subscription/webhook
// @access  Public
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret'
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSubscriptionCreated(session);
            break;
        case 'invoice.payment_succeeded':
            // Handle successful recurring payment
            break;
        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            await handleSubscriptionCancelled(subscription);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

const handleSubscriptionCreated = async (session) => {
    const { userId, planId } = session.metadata;
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    await Subscription.findOneAndUpdate(
        { user: userId },
        {
            user: userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            planId: planId,
            status: 'active',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: false
        },
        { upsert: true, new: true }
    );

    await logAction({
        userId,
        action: 'SUBSCRIPTION_CREATED',
        resource: 'SUBSCRIPTION',
        details: { planId, subscriptionId: session.subscription }
    });
};

const handleSubscriptionCancelled = async (stripeSubscription) => {
    const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
    if (sub) {
        sub.status = 'canceled';
        await sub.save();

        await logAction({
            userId: sub.user,
            action: 'SUBSCRIPTION_CANCELLED',
            resource: 'SUBSCRIPTION',
            details: { subscriptionId: stripeSubscription.id }
        });
    }
};

// @desc    Get current user subscription
// @route   GET /api/subscription/me
// @access  Private
export const getMySubscription = async (req, res) => {
    try {
        let sub;
        const { isDbConnected } = await import('../config/db.js');
        const mockStore = (await import('../utils/mockStore.js')).default;

        if (isDbConnected) {
            sub = await Subscription.findOne({ user: req.user._id });
        } else {
            sub = await mockStore.findSubscriptionByUser(req.user._id);
        }
        
        res.status(200).json(sub || { planId: 'free', status: 'active' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
