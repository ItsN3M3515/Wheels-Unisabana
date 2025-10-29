/**
 * Transaction Service
 * 
 * Business logic for payment transactions
 * Handles creation, validation, and status updates
 */

const DomainError = require('../errors/DomainError');

class TransactionService {
  constructor(transactionRepository, bookingRequestRepository, paymentProvider) {
    this.transactionRepository = transactionRepository;
    this.bookingRequestRepository = bookingRequestRepository;
    this.paymentProvider = paymentProvider;
  }

  /**
   * Create a payment intent for an accepted booking
   * 
   * @param {string} bookingId - Booking request ID
   * @param {string} passengerId - Passenger user ID
   * @returns {Promise<Object>} Transaction with payment intent
   * 
   * @throws {DomainError} duplicate_payment - If payment already exists
   * @throws {DomainError} booking_not_accepted - If booking is not accepted
   * @throws {DomainError} booking_not_owned - If booking doesn't belong to passenger
   */
  async createPaymentIntent(bookingId, passengerId) {
    try {
      console.log(`[TransactionService] Creating payment intent for booking ${bookingId}, passenger ${passengerId}`);

      // Step 1: Validate booking exists and is accepted
      const booking = await this.bookingRequestRepository.findById(bookingId);
      if (!booking) {
        throw new DomainError('booking_not_found', 'Booking request not found', 404);
      }

      if (booking.status !== 'accepted') {
        throw new DomainError('booking_not_accepted', 'Booking must be accepted to create payment', 409);
      }

      if (booking.passengerId.toString() !== passengerId) {
        throw new DomainError('booking_not_owned', 'Booking does not belong to this passenger', 403);
      }

      // Step 2: Check for existing active or succeeded transaction
      const existingActive = await this.transactionRepository.findActiveByBookingId(bookingId);
      if (existingActive) {
        throw new DomainError('duplicate_payment', 'Payment intent already exists for this booking', 409);
      }

      const existingSucceeded = await this.transactionRepository.findSucceededByBookingId(bookingId);
      if (existingSucceeded) {
        throw new DomainError('duplicate_payment', 'Payment already succeeded for this booking', 409);
      }

      // Step 3: Calculate amount from trip snapshot
      const trip = await booking.tripId.populate('driverId');
      const amount = trip.pricePerSeat * booking.seats; // Amount in smallest currency unit (cents)
      const currency = 'COP'; // Default to Colombian Pesos

      // Step 4: Create payment intent with provider
      const paymentIntentData = await this.paymentProvider.createPaymentIntent({
        amount,
        currency,
        metadata: {
          bookingId,
          tripId: trip._id.toString(),
          passengerId,
          driverId: trip.driverId._id.toString(),
          seats: booking.seats,
          pricePerSeat: trip.pricePerSeat
        }
      });

      // Step 5: Create transaction record
      const transactionData = {
        bookingId,
        tripId: trip._id,
        driverId: trip.driverId._id,
        passengerId,
        amount,
        currency,
        provider: 'stripe',
        providerPaymentIntentId: paymentIntentData.paymentIntentId,
        providerClientSecret: paymentIntentData.clientSecret,
        status: paymentIntentData.status,
        metadata: paymentIntentData.metadata
      };

      const transaction = await this.transactionRepository.create(transactionData);

      console.log(`[TransactionService] Created payment intent ${paymentIntentData.paymentIntentId} for booking ${bookingId}`);

      return {
        transaction,
        clientSecret: paymentIntentData.clientSecret,
        paymentIntentId: paymentIntentData.paymentIntentId
      };

    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      console.error('[TransactionService] Error creating payment intent:', error);
      throw new DomainError('internal_error', 'Failed to create payment intent', 500);
    }
  }

  /**
   * Handle webhook from payment provider
   * 
   * @param {Object} headers - HTTP headers
   * @param {string|Buffer} rawBody - Raw request body
   * @returns {Promise<Object>} Updated transaction
   */
  async handleWebhook(headers, rawBody) {
    try {
      console.log('[TransactionService] Processing webhook');

      // Step 1: Parse and verify webhook
      const event = await this.paymentProvider.parseAndVerifyWebhook(headers, rawBody);
      
      console.log(`[TransactionService] Webhook event: ${event.type} for payment intent ${event.data.object.id}`);

      // Step 2: Find transaction by provider payment intent ID
      const transaction = await this.transactionRepository.findByProviderIntentId(event.data.object.id);
      if (!transaction) {
        console.warn(`[TransactionService] Transaction not found for payment intent ${event.data.object.id}`);
        return null;
      }

      // Step 3: Map provider status to our status
      const newStatus = this.paymentProvider.mapStatus(event.data.object.status);
      
      // Step 4: Update transaction status (idempotent)
      if (transaction.status !== newStatus) {
        const updateData = {
          status: newStatus
        };

        // Add error information if payment failed
        if (newStatus === 'failed' && event.data.object.last_payment_error) {
          updateData.errorCode = event.data.object.last_payment_error.code;
          updateData.errorMessage = event.data.object.last_payment_error.message;
        }

        const updatedTransaction = await this.transactionRepository.updateByProviderIntentId(
          event.data.object.id,
          updateData
        );

        console.log(`[TransactionService] Updated transaction ${transaction._id} status to ${newStatus}`);
        return updatedTransaction;
      }

      console.log(`[TransactionService] Transaction ${transaction._id} already has status ${newStatus}`);
      return transaction;

    } catch (error) {
      console.error('[TransactionService] Error handling webhook:', error);
      throw new DomainError('webhook_error', 'Failed to process webhook', 500);
    }
  }

  /**
   * Get transaction by ID
   * 
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Transaction
   */
  async getTransaction(transactionId, userId) {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new DomainError('transaction_not_found', 'Transaction not found', 404);
      }

      // Check if user is authorized to view this transaction
      if (transaction.passengerId._id.toString() !== userId && 
          transaction.driverId._id.toString() !== userId) {
        throw new DomainError('transaction_not_owned', 'Transaction does not belong to this user', 403);
      }

      return transaction;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      console.error('[TransactionService] Error getting transaction:', error);
      throw new DomainError('internal_error', 'Failed to get transaction', 500);
    }
  }

  /**
   * Get transactions for a user
   * 
   * @param {string} userId - User ID
   * @param {string} userRole - User role (passenger or driver)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Transactions with pagination
   */
  async getUserTransactions(userId, userRole, options = {}) {
    try {
      let result;
      
      if (userRole === 'passenger') {
        result = await this.transactionRepository.findByPassengerId(userId, options);
      } else if (userRole === 'driver') {
        result = await this.transactionRepository.findByDriverId(userId, options);
      } else {
        throw new DomainError('invalid_role', 'Invalid user role', 400);
      }

      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      console.error('[TransactionService] Error getting user transactions:', error);
      throw new DomainError('internal_error', 'Failed to get transactions', 500);
    }
  }

  /**
   * Cancel a payment intent
   * 
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated transaction
   */
  async cancelPaymentIntent(transactionId, userId) {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new DomainError('transaction_not_found', 'Transaction not found', 404);
      }

      // Check if user is authorized to cancel this transaction
      if (transaction.passengerId._id.toString() !== userId) {
        throw new DomainError('transaction_not_owned', 'Transaction does not belong to this user', 403);
      }

      // Check if transaction can be canceled
      if (!transaction.isActive()) {
        throw new DomainError('transaction_not_cancelable', 'Transaction cannot be canceled', 400);
      }

      // Cancel with provider
      await this.paymentProvider.cancelPaymentIntent(transaction.providerPaymentIntentId);

      // Update transaction status
      const updatedTransaction = await this.transactionRepository.updateStatus(
        transactionId,
        'canceled'
      );

      console.log(`[TransactionService] Canceled payment intent ${transaction.providerPaymentIntentId}`);
      return updatedTransaction;

    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      console.error('[TransactionService] Error canceling payment intent:', error);
      throw new DomainError('internal_error', 'Failed to cancel payment intent', 500);
    }
  }
}

module.exports = TransactionService;
