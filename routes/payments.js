const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const User = require('../models/User');

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  stripe = null;
}

const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PRICE_ID;

function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3000';
}

function formatStripePrice(price) {
  const product = price.product || {};

  return {
    id: product.id || 'premium',
    name: product.name || 'Premium',
    description: product.description || 'For couples serious about deepening their connection.',
    priceId: price.id,
    currency: price.currency,
    unitAmount: price.unit_amount,
    recurringInterval: price.recurring?.interval || null,
    active: price.active,
    features: [
      'Unlimited daily prompts',
      'Advanced alignment analytics',
      'Priority partner matching',
      'Personalized programs',
      '1:1 coaching sessions',
      'Exclusive content library',
      'Early access to features'
    ]
  };
}

function fallbackProducts() {
  return [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for couples starting their alignment journey.',
      priceId: null,
      currency: 'usd',
      unitAmount: 0,
      recurringInterval: null,
      active: true,
      features: [
        'Daily prompts (limited)',
        'Basic alignment insights',
        'Partner linking',
        'Weekly check-ins',
        'Community access'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For couples serious about deepening their connection.',
      priceId: premiumPriceId || null,
      currency: 'usd',
      unitAmount: 1200,
      recurringInterval: 'month',
      active: Boolean(premiumPriceId),
      features: [
        'Unlimited daily prompts',
        'Advanced alignment analytics',
        'Priority partner matching',
        'Personalized programs',
        '1:1 coaching sessions',
        'Exclusive content library',
        'Early access to features'
      ]
    }
  ];
}

router.get('/products', async (req, res) => {
  const products = fallbackProducts();

  if (!stripe || !premiumPriceId) {
    return res.json({
      stripeConfigured: Boolean(stripe && premiumPriceId),
      products
    });
  }

  try {
    const premiumPrice = await stripe.prices.retrieve(premiumPriceId, {
      expand: ['product']
    });

    return res.json({
      stripeConfigured: true,
      products: [products[0], formatStripePrice(premiumPrice)]
    });
  } catch (error) {
    return res.status(502).json({
      message: 'Could not load Stripe products right now.',
      products
    });
  }
});

// Create checkout endpoint
router.post('/checkout', express.json(), requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }

  if (!premiumPriceId) {
    return res.status(503).json({ error: 'Stripe premium price ID is not configured.' });
  }

  const requestedPriceId = req.body.priceId || premiumPriceId;

  if (requestedPriceId !== premiumPriceId) {
    return res.status(400).json({ error: 'That Stripe price is not available.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      ...(req.user.stripeCustomerId
        ? { customer: req.user.stripeCustomerId }
        : { customer_email: req.user.email }),
      line_items: [{
        price: requestedPriceId,
        quantity: 1,
      }],
      success_url: `${getClientUrl()}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getClientUrl()}/products?payment=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: req.user._id.toString(),
      metadata: { userId: req.user._id.toString() },
      subscription_data: {
        metadata: { userId: req.user._id.toString() }
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook handler to securely update membership status
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    await User.findByIdAndUpdate(session.metadata.userId, { 
      isPremium: true,
      stripeCustomerId: session.customer 
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;

    if (userId) {
      await User.findByIdAndUpdate(userId, { isPremium: false });
    } else if (subscription.customer) {
      await User.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        { isPremium: false }
      );
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const isPremium = ['active', 'trialing'].includes(subscription.status);
    const userId = subscription.metadata?.userId;

    if (userId) {
      await User.findByIdAndUpdate(userId, { isPremium });
    } else if (subscription.customer) {
      await User.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        { isPremium }
      );
    }
  }

  res.json({ received: true });
});

module.exports = router;
