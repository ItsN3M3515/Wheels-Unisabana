/**
 * MongoSeatLedgerRepository
 * 
 * MongoDB implementation for Seat Ledger operations.
 * Provides atomic, race-safe seat allocation operations.
 */

const SeatLedgerModel = require('../database/models/SeatLedgerModel');

class MongoSeatLedgerRepository {
  /**
   * Atomically allocate seats for a trip
   * Race-safe: uses conditional update to prevent over-allocation
   * 
   * @param {string} tripId - Trip ObjectId
   * @param {number} totalSeats - Total seats available on trip
   * @param {number} seatsToAllocate - Number of seats to allocate
   * @returns {Promise<Object|null>} Updated ledger or null if capacity exceeded
   */
  async allocateSeats(tripId, totalSeats, seatsToAllocate = 1) {
    const ledger = await SeatLedgerModel.allocateSeats(tripId, totalSeats, seatsToAllocate);
    
    if (!ledger) {
      return null; // Capacity exceeded
    }

    return {
      tripId: ledger.tripId.toString(),
      allocatedSeats: ledger.allocatedSeats,
      remainingSeats: totalSeats - ledger.allocatedSeats,
      updatedAt: ledger.updatedAt
    };
  }

  /**
   * Get current allocation for a trip
   * Creates ledger if it doesn't exist
   * 
   * @param {string} tripId - Trip ObjectId
   * @returns {Promise<Object>} Current ledger state
   */
  async getOrCreateLedger(tripId) {
    const ledger = await SeatLedgerModel.getOrCreateLedger(tripId);

    return {
      tripId: ledger.tripId.toString(),
      allocatedSeats: ledger.allocatedSeats,
      updatedAt: ledger.updatedAt
    };
  }

  /**
   * Get ledger for a trip (returns null if doesn't exist)
   * 
   * @param {string} tripId - Trip ObjectId
   * @returns {Promise<Object|null>} Ledger or null
   */
  async getLedgerByTripId(tripId) {
    const ledger = await SeatLedgerModel.getLedgerByTripId(tripId);
    
    if (!ledger) {
      return null;
    }

    return {
      tripId: ledger.tripId.toString(),
      allocatedSeats: ledger.allocatedSeats,
      updatedAt: ledger.updatedAt
    };
  }

  /**
   * Check if trip has capacity for seats
   * 
   * @param {string} tripId - Trip ObjectId
   * @param {number} totalSeats - Total seats on trip
   * @param {number} requestedSeats - Seats requested
   * @returns {Promise<boolean>} True if has capacity
   */
  async hasCapacity(tripId, totalSeats, requestedSeats = 1) {
    const ledger = await SeatLedgerModel.getLedgerByTripId(tripId);
    
    if (!ledger) {
      // No ledger means no allocations yet
      return requestedSeats <= totalSeats;
    }

    return ledger.allocatedSeats + requestedSeats <= totalSeats;
  }

  /**
   * Get remaining seats for a trip
   * 
   * @param {string} tripId - Trip ObjectId
   * @param {number} totalSeats - Total seats on trip
   * @returns {Promise<number>} Remaining seats
   */
  async getRemainingSeats(tripId, totalSeats) {
    const ledger = await SeatLedgerModel.getLedgerByTripId(tripId);
    
    if (!ledger) {
      return totalSeats; // No allocations yet
    }

    return Math.max(0, totalSeats - ledger.allocatedSeats);
  }

  /**
   * Delete ledger (for testing only)
   * 
   * @param {string} tripId - Trip ObjectId
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(tripId) {
    const result = await SeatLedgerModel.findOneAndDelete({ tripId });
    return !!result;
  }
}

module.exports = MongoSeatLedgerRepository;

