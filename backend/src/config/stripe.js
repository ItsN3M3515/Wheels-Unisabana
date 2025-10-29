/**
 * Stripe Configuration
 * 
 * Configuration and initialization for Stripe payment provider
 */

const Stripe = require('stripe');

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[Stripe Config] Warning: ${envVar} is not set. Stripe functionality will be limited.`);
  }
}

// Initialize Stripe client
let stripeClient = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('[Stripe Config] Stripe client initialized successfully');
} else {
  console.warn('[Stripe Config] Stripe client not initialized - STRIPE_SECRET_KEY missing');
}

// Configuration object
const stripeConfig = {
  // Stripe client instance
  client: stripeClient,
  
  // Webhook secret for signature verification
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Default currency
  defaultCurrency: 'cop',
  
  // Payment method types
  paymentMethodTypes: ['card'],
  
  // Automatic payment methods
  automaticPaymentMethods: {
    enabled: true,
  },
  
  // Configuration validation
  isConfigured: () => {
    return !!(stripeClient && process.env.STRIPE_WEBHOOK_SECRET);
  },
  
  // Get configuration status
  getStatus: () => {
    return {
      clientInitialized: !!stripeClient,
      webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretKeySet: !!process.env.STRIPE_SECRET_KEY,
      isFullyConfigured: stripeConfig.isConfigured()
    };
  }
};

module.exports = stripeConfig;
