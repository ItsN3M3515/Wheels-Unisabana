/**
 * NotificationTemplateService
 *
 * Simple template renderer for notification previews.
 * - Read-only: does not send or persist anything
 * - Returns { subject, html, text }
 *
 * This is a minimal renderer used by admin preview endpoints.
 */

class NotificationTemplateService {
  constructor() {}

  render(channel, type, variables = {}) {
    // Normalize
    const ch = (channel || '').toLowerCase();
    const t = type;

    switch (t) {
      case 'payment.succeeded':
        return this._renderPaymentSucceeded(ch, variables);

      default:
        // Unsupported template type
        return null;
    }
  }

  _safeFirstName(v) {
    if (!v || typeof v !== 'string') return 'Customer';
    return v;
  }

  _formatCurrency(amount, currency) {
    try {
      const code = (currency || 'COP').toUpperCase();
      // Use Intl.NumberFormat; fall back to simple formatting when unsupported
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0
      });
      return formatter.format(amount / 100); // assume amount is in cents (e.g., 6000 -> 60.00) OR user's API uses cents
    } catch (e) {
      // Fallback: show raw amount with currency
      if (typeof amount === 'number') return `${currency || ''} ${amount}`;
      return `${currency || ''} ${amount || ''}`;
    }
  }

  _formatTime(isoString) {
    if (!isoString) return 'an unknown time';
    try {
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) return 'an unknown time';
      // HH:MM in 24-hour
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'an unknown time';
    }
  }

  _renderPaymentSucceeded(channel, vars) {
    const firstName = this._safeFirstName(vars.firstName);
    const amount = typeof vars.amount === 'number' ? vars.amount : Number(vars.amount || 0);
    // Many systems store amounts as cents; the example shows 6000 -> COP 6,000 (so it's likely integer amount in currency units).
    // We'll present amount in a reasonable way: if amount > 1000 assume it's in cents? To avoid guessing, format as provided.
    // The acceptance example expects "COP 6,000" for 6000 — we'll format without dividing.
    const currency = vars.currency || 'COP';

    // Format amount: try to use Intl with no fractional digits and treat amount as whole units
    let formattedAmount;
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0
      });
      formattedAmount = formatter.format(amount);
    } catch (e) {
      formattedAmount = `${currency} ${amount}`;
    }

    const timeStr = this._formatTime(vars.tripTime);

    // Build templates
    const subject = 'Your payment was successful';
    const html = `<h1>Thanks, ${firstName}!</h1><p>Your payment of ${formattedAmount} was successful for the trip at ${timeStr}.</p>`;
    const text = `Thanks, ${firstName}! Your payment of ${formattedAmount} was successful for the trip at ${timeStr}.`;

    // For in-app channel we keep same structure but shorter subject
    if (channel === 'in-app') {
      const inAppSubject = 'Payment received';
      const inAppHtml = `<strong>Thanks, ${firstName}!</strong> Your payment of ${formattedAmount} was recorded for the trip at ${timeStr}.`;
      const inAppText = `Thanks, ${firstName}! Payment of ${formattedAmount} recorded for the trip at ${timeStr}.`;
      return {
        subject: inAppSubject,
        html: inAppHtml,
        text: inAppText
      };
    }

    return { subject, html, text };
  }
}

module.exports = NotificationTemplateService;
