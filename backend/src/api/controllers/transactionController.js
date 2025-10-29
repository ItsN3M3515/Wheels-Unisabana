/**
 * Transaction Controller
 * 
 * Handles HTTP requests for payment transactions
 * Endpoints:
 * - POST /transactions/payment-intent - Create payment intent
 * - GET /transactions/:id - Get transaction details
 * - GET /transactions - Get user transactions
 * - POST /transactions/:id/cancel - Cancel payment intent
 * - POST /webhooks/stripe - Handle Stripe webhooks
 */

const TransactionService = require('../../domain/services/TransactionService');
const MongoTransactionRepository = require('../../infrastructure/repositories/MongoTransactionRepository');
const MongoBookingRequestRepository = require('../../infrastructure/repositories/MongoBookingRequestRepository');
const StripePaymentProvider = require('../../domain/adapters/StripePaymentProvider');
const { TransactionResponseDto, PaymentIntentResponseDto } = require('../../domain/dtos/TransactionDto');
const stripeConfig = require('../../config/stripe');

class TransactionController {
  constructor() {
    // Initialize repositories
    this.transactionRepository = new MongoTransactionRepository();
    this.bookingRequestRepository = new MongoBookingRequestRepository();
    
    // Initialize Stripe provider
    this.paymentProvider = new StripePaymentProvider(stripeConfig.client);
    
    // Initialize service
    this.transactionService = new TransactionService(
      this.transactionRepository,
      this.bookingRequestRepository,
      this.paymentProvider
    );
  }

  /**
   * POST /transactions/payment-intent
   * 
   * Create a payment intent for an accepted booking
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async createPaymentIntent(req, res, next) {
    try {
      const { bookingId } = req.body;
      const passengerId = req.user.sub;

      console.log(`[TransactionController] Creating payment intent for booking ${bookingId}, passenger ${passengerId}`);

      // Validate bookingId
      if (!bookingId) {
        return res.status(400).json({
          code: 'invalid_schema',
          message: 'bookingId is required',
          correlationId: req.correlationId
        });
      }

      // Create payment intent
      const result = await this.transactionService.createPaymentIntent(bookingId, passengerId);

      // Return payment intent response
      const response = PaymentIntentResponseDto.fromTransaction(
        result.transaction,
        result.clientSecret
      );

      console.log(`[TransactionController] Created payment intent ${result.paymentIntentId}`);

      res.status(201).json({
        ...response,
        correlationId: req.correlationId
      });

    } catch (error) {
      console.error('[TransactionController] Error creating payment intent:', error);

      // Handle domain errors
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
          correlationId: req.correlationId
        });
      }

      // Handle validation errors
      if (error.message && error.message.includes('Validation errors')) {
        return res.status(400).json({
          code: 'invalid_schema',
          message: error.message,
          correlationId: req.correlationId
        });
      }

      // Generic error
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to create payment intent',
        correlationId: req.correlationId
      });
    }
  }

  /**
   * GET /transactions/:id
   * 
   * Get transaction details
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async getTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.sub;

      console.log(`[TransactionController] Getting transaction ${id} for user ${userId}`);

      const transaction = await this.transactionService.getTransaction(id, userId);
      const response = TransactionResponseDto.fromDocument(transaction);

      res.status(200).json({
        ...response,
        correlationId: req.correlationId
      });

    } catch (error) {
      console.error('[TransactionController] Error getting transaction:', error);

      // Handle domain errors
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
          correlationId: req.correlationId
        });
      }

      // Generic error
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to get transaction',
        correlationId: req.correlationId
      });
    }
  }

  /**
   * GET /transactions
   * 
   * Get user transactions with pagination
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async getUserTransactions(req, res, next) {
    try {
      const userId = req.user.sub;
      const userRole = req.user.role;
      
      // Parse query parameters
      const {
        status,
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        status,
        limit: Math.min(parseInt(pageSize), 100), // Max 100 items per page
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        sortBy,
        sortOrder
      };

      console.log(`[TransactionController] Getting transactions for ${userRole} ${userId}`);

      const result = await this.transactionService.getUserTransactions(userId, userRole, options);
      
      const response = {
        items: TransactionResponseDto.fromDocuments(result.items),
        pagination: {
          total: result.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(result.total / parseInt(pageSize)),
          hasMore: result.hasMore
        },
        correlationId: req.correlationId
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('[TransactionController] Error getting user transactions:', error);

      // Handle domain errors
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
          correlationId: req.correlationId
        });
      }

      // Generic error
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to get transactions',
        correlationId: req.correlationId
      });
    }
  }

  /**
   * POST /transactions/:id/cancel
   * 
   * Cancel a payment intent
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async cancelPaymentIntent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.sub;

      console.log(`[TransactionController] Canceling payment intent ${id} for user ${userId}`);

      const transaction = await this.transactionService.cancelPaymentIntent(id, userId);
      const response = TransactionResponseDto.fromDocument(transaction);

      res.status(200).json({
        ...response,
        correlationId: req.correlationId
      });

    } catch (error) {
      console.error('[TransactionController] Error canceling payment intent:', error);

      // Handle domain errors
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
          correlationId: req.correlationId
        });
      }

      // Generic error
      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to cancel payment intent',
        correlationId: req.correlationId
      });
    }
  }

  /**
   * POST /webhooks/stripe
   * 
   * Handle Stripe webhooks
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async handleStripeWebhook(req, res, next) {
    try {
      const signature = req.get('stripe-signature');
      const rawBody = req.body;

      console.log('[TransactionController] Processing Stripe webhook');

      const transaction = await this.transactionService.handleWebhook(
        { 'stripe-signature': signature },
        rawBody
      );

      if (transaction) {
        console.log(`[TransactionController] Updated transaction ${transaction._id} via webhook`);
      }

      // Always return 200 to acknowledge webhook receipt
      res.status(200).json({
        received: true,
        correlationId: req.correlationId
      });

    } catch (error) {
      console.error('[TransactionController] Error handling Stripe webhook:', error);

      // For webhook errors, we still return 200 to prevent retries
      // but log the error for investigation
      res.status(200).json({
        received: false,
        error: error.message,
        correlationId: req.correlationId
      });
    }
  }

  /**
   * GET /transactions/config
   * 
   * Get Stripe configuration status (for debugging)
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  async getConfig(req, res, next) {
    try {
      const config = stripeConfig.getStatus();
      
      res.status(200).json({
        stripe: config,
        correlationId: req.correlationId
      });

    } catch (error) {
      console.error('[TransactionController] Error getting config:', error);

      res.status(500).json({
        code: 'internal_error',
        message: 'Failed to get configuration',
        correlationId: req.correlationId
      });
    }
  }
}

module.exports = TransactionController;
