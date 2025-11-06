const AuditLogModel = require('../../infrastructure/database/models/AuditLogModel');

class AuditService {
  /**
   * Record an admin action as an audit log entry.
   * @param {Object} params
   * @param {string} params.action
   * @param {string} params.entity
   * @param {string|Object} params.entityId
   * @param {string} params.who - admin user id
   * @param {Object} params.before
   * @param {Object} params.after
   * @param {string} params.why
   * @param {Object} req - express request (optional, for correlationId/ip/ua)
   */
  static async recordAdminAction({ action, entity, entityId = null, who = null, before = {}, after = {}, why = '', req = null }) {
    const entry = {
      action,
      entity,
      entityId,
      who,
      when: new Date(),
      what: { before, after },
      why: why || '',
      correlationId: req && req.correlationId ? req.correlationId : null,
      ip: req && (req.ip || req.headers && req.headers['x-forwarded-for']) ? (req.ip || req.headers['x-forwarded-for']) : null,
      userAgent: req && req.headers ? req.headers['user-agent'] : null
    };

    try {
      await AuditLogModel.create(entry);
    } catch (err) {
      // Audit writes should not fail the main flow; log internally
      console.error('[AuditService] Failed to write audit entry:', err && err.message);
    }
  }
}

module.exports = AuditService;
