/**
 * InternalController
 * 
 * Admin-only endpoints for system operations:
 * - Manual job triggers for QA/testing
 * - System health checks
 * - Maintenance tasks
 * 
 * All endpoints require ADMIN role and JWT authentication.
 */

const LifecycleJobService = require('../../domain/services/LifecycleJobService');
const LifecycleJobResultDto = require('../../domain/dtos/LifecycleJobResultDto');
const MongoTripOfferRepository = require('../../infrastructure/repositories/MongoTripOfferRepository');
const MongoBookingRequestRepository = require('../../infrastructure/repositories/MongoBookingRequestRepository');
const MongoVehicleRepository = require('../../infrastructure/repositories/MongoVehicleRepository');
const MongoUserRepository = require('../../infrastructure/repositories/MongoUserRepository');
const NotificationTemplateService = require('../../domain/services/NotificationTemplateService');
const InAppNotification = require('../../infrastructure/database/models/InAppNotificationModel');
const NotificationDelivery = require('../../infrastructure/database/models/NotificationDeliveryModel');
const { v4: uuidv4 } = require('uuid');

class InternalController {
  constructor() {
    // Initialize repositories
    this.tripOfferRepository = new MongoTripOfferRepository();
    this.bookingRequestRepository = new MongoBookingRequestRepository();
    this.vehicleRepository = new MongoVehicleRepository();
    this.userRepository = new MongoUserRepository();

    // Initialize lifecycle job service
    this.lifecycleJobService = new LifecycleJobService(
      this.tripOfferRepository,
      this.bookingRequestRepository,
      this.vehicleRepository,
      this.userRepository
    );

    // Template renderer for admin preview
    this.templateService = new NotificationTemplateService();
  }

  /**
   * POST /internal/jobs/run?name=complete-trips
   * 
   * Manually trigger lifecycle jobs (US-3.4.4)
   * 
   * Admin-only endpoint for:
   * - QA/testing
   * - Manual intervention
   * - Immediate cleanup
   * 
   * Jobs:
   * - complete-trips: Auto-complete trips + expire pending bookings
   * - auto-complete-trips: Only complete trips
   * - expire-pendings: Only expire bookings
   * 
   * Query params:
   * - name: Job name (required)
   * - pendingTtlHours: TTL for pending bookings (optional, default: 48)
   * 
   * Response:
   * - 200: Job executed with metrics
   * - 400: Invalid job name
   * - 403: Not admin
   */
  async runLifecycleJob(req, res, next) {
    try {
      const { name = 'complete-trips', pendingTtlHours = 48 } = req.query;
      const adminId = req.user.sub;

      console.log(
        `[InternalController] Manual job trigger | name: ${name} | adminId: ${adminId} | pendingTtlHours: ${pendingTtlHours} | correlationId: ${req.correlationId}`
      );

      let result;

      switch (name) {
        case 'complete-trips':
          // Run both auto-complete and expire jobs
          result = await this.lifecycleJobService.runCompleteTripsJob({
            pendingTtlHours: parseInt(pendingTtlHours, 10)
          });
          break;

        case 'auto-complete-trips':
          // Only auto-complete trips
          result = await this.lifecycleJobService.runAutoCompleteTripsOnly();
          break;

        case 'expire-pendings':
          // Only expire pending bookings
          result = await this.lifecycleJobService.runExpirePendingsOnly(
            parseInt(pendingTtlHours, 10)
          );
          break;

        default:
          console.log(
            `[InternalController] Invalid job name | name: ${name} | correlationId: ${req.correlationId}`
          );
          return res.status(400).json({
            code: 'invalid_job_name',
            message: `Invalid job name: ${name}. Valid names: complete-trips, auto-complete-trips, expire-pendings`,
            correlationId: req.correlationId
          });
      }

      // Map to DTO
      const responseDto = LifecycleJobResultDto.fromJobResult(result);

      console.log(
        `[InternalController] Job completed | name: ${name} | completedTrips: ${result.completedTrips} | expiredPendings: ${result.expiredPendings} | correlationId: ${req.correlationId}`
      );

      res.status(200).json(responseDto);
    } catch (error) {
      console.error(
        `[InternalController] Job execution failed | error: ${error.message} | correlationId: ${req.correlationId}`
      );
      next(error);
    }
  }

  /**
   * POST /internal/notifications/templates/render
   * Admin-only preview of templates. Read-only.
   */
  async renderTemplate(req, res, next) {
    try {
      const { channel, type, variables } = req.body;
      console.log(`[InternalController] Template preview requested | type: ${type} | channel: ${channel} | adminId: ${req.user.sub} | correlationId: ${req.correlationId}`);

      const rendered = this.templateService.render(channel, type, variables);

      if (!rendered) {
        return res.status(400).json({ code: 'invalid_schema', message: 'Unsupported template type or missing variables', correlationId: req.correlationId });
      }

      // Standardize response shape: { subject, html, text }
      res.status(200).json(rendered);
    } catch (error) {
      console.error(`[InternalController] Template preview failed | error: ${error.message} | correlationId: ${req.correlationId}`);
      next(error);
    }
  }

  /**
   * POST /internal/notifications/templates/validate
   * Admin-only: Validate a draft template payload. No persistence.
   */
  async validateTemplate(req, res, next) {
    try {
      const draft = req.body;
      console.log(`[InternalController] Template validate requested | type: ${draft.type} | locale: ${draft.locale} | adminId: ${req.user.sub} | correlationId: ${req.correlationId}`);

      const templateRegistry = require('../../domain/services/templateRegistry');

      const result = templateRegistry.validateDraft(draft);

      return res.status(200).json({ valid: result.valid, warnings: result.warnings || [] });
    } catch (err) {
      // err is expected to be an object like { code, message }
      console.error(`[InternalController] Template validate failed | error: ${err && err.message ? err.message : err} | correlationId: ${req.correlationId}`);
      if (err && err.code && err.message) {
        return res.status(400).json({ code: err.code, message: err.message, correlationId: req.correlationId });
      }
      next(err);
    }
  }

  /**
   * POST /internal/notifications/dispatch
   * Admin-only: force-create an in-app notification and optionally queue an email (stub)
   */
  async dispatchNotification(req, res, next) {
    try {
      const { channel = 'both', type, userId, variables = {} } = req.body;

      // Create in-app notification if requested
      let createdNotification = null;
      if (channel === 'in-app' || channel === 'both') {
        const title = variables.title || (type === 'payment.succeeded' ? 'Payment received' : 'Notification');
        const body = variables.body || '';
        createdNotification = await InAppNotification.create({
          userId,
          type,
          title,
          body,
          data: variables,
          correlationId: req.correlationId
        });
      }

      // Simulate email dispatch by creating a NotificationDelivery record
      let delivery = null;
      if (channel === 'email' || channel === 'both') {
        const providerMessageId = uuidv4();
        delivery = await NotificationDelivery.create({
          providerMessageId,
          notificationId: createdNotification ? createdNotification._id : null,
          status: 'pending',
          meta: { intentType: type, queuedBy: req.user.sub }
        });
      }

      return res.status(201).json({
        ok: true,
        notification: createdNotification ? { id: createdNotification._id.toString(), type: createdNotification.type, title: createdNotification.title } : null,
        delivery: delivery ? { id: delivery._id.toString(), providerMessageId: delivery.providerMessageId, status: delivery.status } : null
      });
    } catch (error) {
      console.error(`[InternalController] Dispatch failed | error: ${error.message} | correlationId: ${req.correlationId}`);
      next(error);
    }
  }
}

module.exports = new InternalController();
