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
    const crypto = require('crypto');
    const AuditAnchor = require('../../infrastructure/database/models/AuditAnchorModel');

    const when = new Date();
    const entryBase = {
      action,
      entity,
      entityId,
      who,
      when,
      what: { before, after },
      why: why || '',
      correlationId: req && req.correlationId ? req.correlationId : null,
      ip: req && (req.ip || (req.headers && req.headers['x-forwarded-for'])) ? (req.ip || req.headers['x-forwarded-for']) : null,
      userAgent: req && req.headers ? req.headers['user-agent'] : null
    };

    try {
      // Fetch previous hash (global chain) - best-effort
      const prev = await AuditLogModel.findOne({}, { hash: 1 }).sort({ when: -1 }).lean();
      const prevHash = prev && prev.hash ? prev.hash : null;

      // Compute content for hashing (deterministic order)
      const toHash = JSON.stringify({ action: entryBase.action, entity: entryBase.entity, entityId: entryBase.entityId, who: entryBase.who, when: entryBase.when.toISOString(), what: entryBase.what, why: entryBase.why, correlationId: entryBase.correlationId, ip: entryBase.ip, userAgent: entryBase.userAgent, prevHash });
      const hash = crypto.createHash('sha256').update(toHash).digest('hex');

      const entry = Object.assign({}, entryBase, { prevHash, hash });

      await AuditLogModel.create(entry);

      // Update daily anchor (incremental HMAC): use AUDIT_HMAC_SECRET env var
      const secret = process.env.AUDIT_HMAC_SECRET || 'dev_audit_secret';
      const dateKey = when.toISOString().slice(0,10); // YYYY-MM-DD

      // Get existing anchor for the date
      const existing = await AuditAnchor.findOne({ date: dateKey }).lean();
      const prevDaily = existing && existing.hmac ? existing.hmac : '';
      const hmac = crypto.createHmac('sha256', secret).update(prevDaily + hash).digest('hex');

      // Upsert anchor
      await AuditAnchor.findOneAndUpdate({ date: dateKey }, { date: dateKey, hmac, updatedAt: new Date(), createdAt: existing ? existing.createdAt : new Date() }, { upsert: true, new: true });

    } catch (err) {
      console.error('[AuditService] Failed to write audit entry or anchor:', err && err.message);
    }
  }
}

module.exports = AuditService;
