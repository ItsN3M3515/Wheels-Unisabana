import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const ALLOWED_SCALAR_FIELDS = new Set(['firstName', 'lastName', 'phone']);
export const IMMUTABLE_FIELDS = new Set(['corporateEmail', 'universityId', 'role', 'id', '_id']);

function toE164OrError(phone: string | undefined): string | null | 'invalid' {
  if (!phone) return null;
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed || !parsed.isValid()) return 'invalid';
  return parsed.number;
}

export function validatePatchMe(req: Request, res: Response, next: NextFunction) {
  const fields = (req.body ?? {}) as Record<string, any>;
  const file = (req as any).file as Express.Multer.File | undefined;

  // Collect immutable violations
  const immutableViolations: Array<{ field: string; issue: string }> = [];
  for (const k of Object.keys(fields)) {
    if (IMMUTABLE_FIELDS.has(k)) immutableViolations.push({ field: k, issue: 'immutable' });
  }
  if (immutableViolations.length) {
    if (file && file.path) fs.promises.unlink(file.path).catch(() => void 0);
    return res.status(403).json({
      code: 'immutable_field',
      message: 'One or more fields cannot be updated',
      details: immutableViolations
    });
  }

  // Reject any keys not in allow-list. Allow 'profilePhoto' to pass through (handled by upload adapter).
  const disallowed: Array<{ field: string; issue: string }> = [];
  for (const k of Object.keys(fields)) {
    if (!ALLOWED_SCALAR_FIELDS.has(k) && k !== 'profilePhoto') {
      disallowed.push({ field: k, issue: 'not allowed' });
    }
  }
  if (disallowed.length) {
    if (file && file.path) fs.promises.unlink(file.path).catch(() => void 0);
    return res.status(400).json({
      code: 'invalid_schema',
      message: 'Validation failed',
      details: disallowed
    });
  }

  // Normalize and validate allowed fields
  const details: Array<{ field: string; issue: string }> = [];
  const normalized: Record<string, any> = {};

  if (typeof fields.firstName !== 'undefined') {
    const v = String(fields.firstName).trim();
    if (v.length < 2) details.push({ field: 'firstName', issue: 'min length 2' });
    else normalized.firstName = v;
  }
  if (typeof fields.lastName !== 'undefined') {
    const v = String(fields.lastName).trim();
    if (v.length < 2) details.push({ field: 'lastName', issue: 'min length 2' });
    else normalized.lastName = v;
  }
  if (typeof fields.phone !== 'undefined') {
    const e164 = toE164OrError(String(fields.phone));
    if (e164 === 'invalid') details.push({ field: 'phone', issue: 'invalid E.164 phone' });
    else normalized.phone = e164; // may be null
  }

  if (details.length) {
    if (file && file.path) fs.promises.unlink(file.path).catch(() => void 0);
    return res.status(400).json({ code: 'invalid_schema', message: 'Validation failed', details });
  }

  // Replace body with normalized subset to avoid drift
  req.body = normalized;
  return next();
}
