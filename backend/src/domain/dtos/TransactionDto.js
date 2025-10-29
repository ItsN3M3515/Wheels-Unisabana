/**
 * Transaction DTOs
 * 
 * Data Transfer Objects for transaction-related operations
 */

class CreateTransactionDto {
  constructor(data) {
    this.bookingId = data.bookingId;
    this.tripId = data.tripId;
    this.driverId = data.driverId;
    this.passengerId = data.passengerId;
    this.amount = data.amount;
    this.currency = data.currency;
    this.provider = data.provider || 'stripe';
    this.providerPaymentIntentId = data.providerPaymentIntentId;
    this.providerClientSecret = data.providerClientSecret;
    this.status = data.status || 'requires_payment_method';
    this.metadata = data.metadata || {};
  }

  static fromBookingAndPaymentIntent(booking, paymentIntentData) {
    return new CreateTransactionDto({
      bookingId: booking._id,
      tripId: booking.tripId._id,
      driverId: booking.tripId.driverId._id,
      passengerId: booking.passengerId._id,
      amount: paymentIntentData.amount,
      currency: paymentIntentData.currency,
      provider: 'stripe',
      providerPaymentIntentId: paymentIntentData.paymentIntentId,
      providerClientSecret: paymentIntentData.clientSecret,
      status: paymentIntentData.status,
      metadata: paymentIntentData.metadata
    });
  }

  validate() {
    const errors = [];

    if (!this.bookingId) errors.push('bookingId is required');
    if (!this.tripId) errors.push('tripId is required');
    if (!this.driverId) errors.push('driverId is required');
    if (!this.passengerId) errors.push('passengerId is required');
    if (!this.amount || this.amount < 1) errors.push('amount must be at least 1');
    if (!this.currency) errors.push('currency is required');
    if (!this.providerPaymentIntentId) errors.push('providerPaymentIntentId is required');
    if (!this.providerClientSecret) errors.push('providerClientSecret is required');

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return true;
  }
}

class TransactionResponseDto {
  constructor(data) {
    this.id = data._id || data.id;
    this.bookingId = data.bookingId;
    this.tripId = data.tripId;
    this.driverId = data.driverId;
    this.passengerId = data.passengerId;
    this.amount = data.amount;
    this.currency = data.currency;
    this.provider = data.provider;
    this.providerPaymentIntentId = data.providerPaymentIntentId;
    this.status = data.status;
    this.errorCode = data.errorCode;
    this.errorMessage = data.errorMessage;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.succeededAt = data.succeededAt;
    this.failedAt = data.failedAt;

    // Populated fields
    if (data.bookingId && typeof data.bookingId === 'object') {
      this.booking = {
        id: data.bookingId._id,
        status: data.bookingId.status,
        seats: data.bookingId.seats
      };
    }

    if (data.tripId && typeof data.tripId === 'object') {
      this.trip = {
        id: data.tripId._id,
        origin: data.tripId.origin,
        destination: data.tripId.destination,
        pricePerSeat: data.tripId.pricePerSeat,
        departureAt: data.tripId.departureAt
      };
    }

    if (data.passengerId && typeof data.passengerId === 'object') {
      this.passenger = {
        id: data.passengerId._id,
        firstName: data.passengerId.firstName,
        lastName: data.passengerId.lastName,
        corporateEmail: data.passengerId.corporateEmail
      };
    }

    if (data.driverId && typeof data.driverId === 'object') {
      this.driver = {
        id: data.driverId._id,
        firstName: data.driverId.firstName,
        lastName: data.driverId.lastName,
        corporateEmail: data.driverId.corporateEmail
      };
    }
  }

  static fromDocument(document) {
    return new TransactionResponseDto(document);
  }

  static fromDocuments(documents) {
    return documents.map(doc => TransactionResponseDto.fromDocument(doc));
  }

  // Helper methods
  isActive() {
    return ['requires_payment_method', 'processing'].includes(this.status);
  }

  isCompleted() {
    return ['succeeded', 'failed', 'canceled', 'refunded'].includes(this.status);
  }

  canRefund() {
    return this.status === 'succeeded';
  }

  getFormattedAmount() {
    const amount = this.amount / 100; // Convert from cents
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

class PaymentIntentResponseDto {
  constructor(transaction, clientSecret) {
    this.transactionId = transaction._id || transaction.id;
    this.paymentIntentId = transaction.providerPaymentIntentId;
    this.clientSecret = clientSecret;
    this.amount = transaction.amount;
    this.currency = transaction.currency;
    this.status = transaction.status;
    this.formattedAmount = new TransactionResponseDto(transaction).getFormattedAmount();
    
    // Include booking and trip info for frontend
    if (transaction.bookingId && typeof transaction.bookingId === 'object') {
      this.booking = {
        id: transaction.bookingId._id,
        status: transaction.bookingId.status,
        seats: transaction.bookingId.seats
      };
    }

    if (transaction.tripId && typeof transaction.tripId === 'object') {
      this.trip = {
        id: transaction.tripId._id,
        origin: transaction.tripId.origin,
        destination: transaction.tripId.destination,
        pricePerSeat: transaction.tripId.pricePerSeat,
        departureAt: transaction.tripId.departureAt
      };
    }
  }

  static fromTransaction(transaction, clientSecret) {
    return new PaymentIntentResponseDto(transaction, clientSecret);
  }
}

module.exports = {
  CreateTransactionDto,
  TransactionResponseDto,
  PaymentIntentResponseDto
};
