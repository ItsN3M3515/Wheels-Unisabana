/**
 * Stripe Payment Provider Implementation
 * 
 * Concrete implementation of PaymentProviderAdapter for Stripe
 */

const PaymentProviderAdapter = require('./PaymentProviderAdapter');
const crypto = require('crypto');

class StripePaymentProvider extends PaymentProviderAdapter {
  constructor(stripeClient) {
    super();
    this.stripe = stripeClient;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent({ amount, currency, metadata }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
        // Enable payment method collection
        payment_method_types: ['card'],
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStatus(paymentIntent.status),
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('[StripePaymentProvider] Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Parse and verify Stripe webhook
   */
  async parseAndVerifyWebhook(headers, rawBody) {
    try {
      const signature = headers['stripe-signature'];
      
      if (!signature) {
        throw new Error('Missing Stripe signature');
      }

      if (!this.webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      // Verify signature
      const isValid = this.validateSignature(signature, rawBody, this.webhookSecret);
      if (!isValid) {
        throw new Error('Invalid Stripe signature');
      }

      // Parse the event
      const event = JSON.parse(rawBody);
      
      return {
        id: event.id,
        type: event.type,
        data: event.data,
        created: event.created,
        livemode: event.livemode
      };
    } catch (error) {
      console.error('[StripePaymentProvider] Error parsing webhook:', error);
      throw new Error(`Failed to parse webhook: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent from Stripe
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: this.mapStatus(paymentIntent.status),
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
        lastPaymentError: paymentIntent.last_payment_error
      };
    } catch (error) {
      console.error('[StripePaymentProvider] Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: this.mapStatus(paymentIntent.status),
        canceledAt: new Date()
      };
    } catch (error) {
      console.error('[StripePaymentProvider] Error canceling payment intent:', error);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(paymentIntentId, amount = null) {
    try {
      // First, retrieve the payment intent to get the charge ID
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.charges || paymentIntent.charges.data.length === 0) {
        throw new Error('No charges found for payment intent');
      }

      const chargeId = paymentIntent.charges.data[0].id;
      
      const refundParams = {
        charge: chargeId,
        metadata: {
          paymentIntentId,
          refundedAt: new Date().toISOString()
        }
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await this.stripe.refunds.create(refundParams);
      
      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      console.error('[StripePaymentProvider] Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Map Stripe status to our internal status
   */
  mapStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'requires_payment_method',
      'requires_confirmation': 'processing',
      'requires_action': 'processing',
      'processing': 'processing',
      'succeeded': 'succeeded',
      'canceled': 'canceled',
      'payment_failed': 'failed'
    };

    return statusMap[stripeStatus] || 'failed';
  }

  /**
   * Validate Stripe webhook signature
   */
  validateSignature(signature, payload, secret) {
    try {
      const elements = signature.split(',');
      const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
      const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !v1) {
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(timestamp + '.' + payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(v1, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('[StripePaymentProvider] Error validating signature:', error);
      return false;
    }
  }
}

module.exports = StripePaymentProvider;
