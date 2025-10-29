/**
 * Payment Provider Adapter Interface
 * 
 * Abstract interface for payment providers (Stripe, PayPal, etc.)
 * Defines the contract that all payment providers must implement.
 */

class PaymentProviderAdapter {
  /**
   * Create a payment intent with the provider
   * 
   * @param {Object} params - Payment intent parameters
   * @param {number} params.amount - Amount in smallest currency unit
   * @param {string} params.currency - ISO 4217 currency code
   * @param {Object} params.metadata - Additional metadata
   * @param {string} params.metadata.bookingId - Booking request ID
   * @param {string} params.metadata.tripId - Trip offer ID
   * @param {string} params.metadata.passengerId - Passenger user ID
   * @param {string} params.metadata.driverId - Driver user ID
   * 
   * @returns {Promise<Object>} Payment intent response
   * @returns {string} paymentIntentId - Provider's payment intent ID
   * @returns {string} clientSecret - Client secret for frontend
   * @returns {string} status - Initial status
   */
  async createPaymentIntent(params) {
    throw new Error('createPaymentIntent must be implemented by subclass');
  }

  /**
   * Parse and verify webhook payload
   * 
   * @param {Object} headers - HTTP headers from webhook request
   * @param {string|Buffer} rawBody - Raw request body
   * 
   * @returns {Promise<Object>} Parsed webhook event
   * @returns {string} id - Event ID
   * @returns {string} type - Event type
   * @returns {Object} data - Event data
   * @returns {string} data.object.id - Payment intent ID
   * @returns {string} data.object.status - Payment status
   */
  async parseAndVerifyWebhook(headers, rawBody) {
    throw new Error('parseAndVerifyWebhook must be implemented by subclass');
  }

  /**
   * Retrieve payment intent from provider
   * 
   * @param {string} paymentIntentId - Provider's payment intent ID
   * 
   * @returns {Promise<Object>} Payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    throw new Error('getPaymentIntent must be implemented by subclass');
  }

  /**
   * Cancel a payment intent
   * 
   * @param {string} paymentIntentId - Provider's payment intent ID
   * 
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelPaymentIntent(paymentIntentId) {
    throw new Error('cancelPaymentIntent must be implemented by subclass');
  }

  /**
   * Create a refund
   * 
   * @param {string} paymentIntentId - Provider's payment intent ID
   * @param {number} amount - Refund amount (optional, full refund if not provided)
   * 
   * @returns {Promise<Object>} Refund response
   */
  async createRefund(paymentIntentId, amount = null) {
    throw new Error('createRefund must be implemented by subclass');
  }

  /**
   * Map provider status to our internal status
   * 
   * @param {string} providerStatus - Provider's status
   * 
   * @returns {string} Internal status
   */
  mapStatus(providerStatus) {
    throw new Error('mapStatus must be implemented by subclass');
  }

  /**
   * Validate webhook signature
   * 
   * @param {string} signature - Webhook signature header
   * @param {string|Buffer} payload - Raw payload
   * @param {string} secret - Webhook secret
   * 
   * @returns {boolean} Whether signature is valid
   */
  validateSignature(signature, payload, secret) {
    throw new Error('validateSignature must be implemented by subclass');
  }
}

module.exports = PaymentProviderAdapter;
