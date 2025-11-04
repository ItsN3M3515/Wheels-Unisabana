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
  constructor() {
    // metadata describing required variables per template
    this.templateMeta = {
      'payment.succeeded': {
        required: ['firstName', 'amount', 'currency']
      }
    };
  }

  render(channel, type, variables = {}, locale = 'en') {
    // Normalize
    const ch = (channel || '').toLowerCase();
    const t = type;

    // Ensure required variables are present for the template
    const meta = this.templateMeta[t];
    if (meta && Array.isArray(meta.required)) {
      const missing = meta.required.filter(k => variables[k] === undefined || variables[k] === null || variables[k] === '');
      if (missing.length) {
        throw { code: 'invalid_schema', message: `Variables missing: ${missing.join(', ')}` };
      }
    }

    switch (t) {
      case 'payment.succeeded':
        return this._renderPaymentSucceeded(ch, variables, locale);

      default:
        // Unsupported template type
        return null;
    }
  }

  _safeFirstName(v) {
    if (!v || typeof v !== 'string') return 'Customer';
    return v;
  }

  _formatCurrency(amount, currency, locale) {
    try {
      const code = (currency || 'COP').toUpperCase();
      const nf = new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0
      });
      // Use amount as whole units (the app appears to pass 6000 -> "6,000")
      return nf.format(amount);
    } catch (e) {
      if (typeof amount === 'number') return `${currency || ''} ${amount}`;
      return `${currency || ''} ${amount || ''}`;
    }
  }

  _formatTime(isoString, locale) {
    if (!isoString) return 'an unknown time';
    try {
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) return 'an unknown time';
      // HH:MM in 24-hour for many locales; pick a locale-aware formatter
      const opts = { hour: '2-digit', minute: '2-digit' };
      return d.toLocaleTimeString(locale === 'es' ? 'es-CO' : 'en-GB', opts);
    } catch (e) {
      return 'an unknown time';
    }
  }

  _renderPaymentSucceeded(channel, vars, locale) {
    const firstName = this._safeFirstName(vars.firstName);
    const amount = typeof vars.amount === 'number' ? vars.amount : Number(vars.amount || 0);
    const currency = vars.currency || 'COP';

    const formattedAmount = this._formatCurrency(amount, currency, locale);
    const timeStr = this._formatTime(vars.tripTime, locale);

    // Build templates per locale
    if (locale === 'es') {
      const subject = '¡Tu pago fue exitoso!';
      const html = `<h1>Gracias, ${firstName}!</h1><p>Tu pago de ${formattedAmount} fue exitoso para el viaje a las ${timeStr}.</p>`;
      const text = `Gracias, ${firstName}! Tu pago de ${formattedAmount} fue exitoso para el viaje a las ${timeStr}.`;

      if (channel === 'in-app') {
        return {
          subject: 'Pago recibido',
          html: `<strong>Gracias, ${firstName}!</strong> Tu pago de ${formattedAmount} fue registrado para el viaje a las ${timeStr}.`,
          text: `Gracias, ${firstName}! Pago de ${formattedAmount} registrado para el viaje a las ${timeStr}.`
        };
      }

      return { subject, html, text };
    }

    // Default: English
    const subject = 'Your payment was successful';
    const html = `<h1>Thanks, ${firstName}!</h1><p>Your payment of ${formattedAmount} was successful for the trip at ${timeStr}.</p>`;
    const text = `Thanks, ${firstName}! Your payment of ${formattedAmount} was successful for the trip at ${timeStr}.`;

    if (channel === 'in-app') {
      return {
        subject: 'Payment received',
        html: `<strong>Thanks, ${firstName}!</strong> Your payment of ${formattedAmount} was recorded for the trip at ${timeStr}.`,
        text: `Thanks, ${firstName}! Payment of ${formattedAmount} recorded for the trip at ${timeStr}.`
      };
    }

    return { subject, html, text };
  }
}

module.exports = NotificationTemplateService;
