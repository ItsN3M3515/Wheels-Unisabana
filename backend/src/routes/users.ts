import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { InternalUserRecord, UserProfileDTO } from '../types';
import { connectMongo } from '../db';
import { User } from '../models/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const router = Router();

// Mock DB call: replace with real data access in future
async function getUserById(userId: string): Promise<InternalUserRecord | null> {
  // Demo user; do NOT include internal fields in output
  const demo: InternalUserRecord = {
    _id: userId,
    role: 'passenger',
    firstName: 'Ana',
    lastName: 'Ruiz',
    universityId: '202420023',
    corporateEmail: 'aruiz@uni.edu',
    phone: '+573001112233',
    profilePhotoUrl: 'https://cdn.example/u/665e2a/avatar.jpg',
    passwordHash: '$2b$10$xxxx',
    flags: { verified: true },
    driver: { vehicleId: null }
  };
  return demo;
}

function toUserProfileDTO(user: InternalUserRecord): UserProfileDTO {
  return {
    id: user._id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    universityId: user.universityId,
    corporateEmail: user.corporateEmail,
    phone: user.phone,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    driver: { hasVehicle: Boolean(user.driver?.vehicleId) }
  };
}

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }

  // Try DB first if configured
  let user: InternalUserRecord | null = null;
  try {
    await connectMongo();
    if (User.db?.readyState) {
      const doc = await User.findById(userId).lean<{
        _id: { toString(): string };
        role: InternalUserRecord['role'];
        firstName: string;
        lastName: string;
        universityId: string;
        corporateEmail: string;
        phone: string;
        profilePhotoUrl?: string | null;
        driver?: { vehicleId?: string | null } | null;
      }>();
      if (doc) {
        user = {
          _id: doc._id.toString(),
          role: doc.role,
          firstName: doc.firstName,
          lastName: doc.lastName,
          universityId: doc.universityId,
          corporateEmail: doc.corporateEmail,
          phone: doc.phone,
          profilePhotoUrl: doc.profilePhotoUrl ?? null,
          driver: doc.driver ?? null
        };
      }
    }
  } catch {
    // ignore DB errors and fall back to mock
  }

  if (!user) {
    user = await getUserById(userId);
  }
  if (!user) {
    return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  }

  const dto = toUserProfileDTO(user);
  return res.status(200).json(dto);
});

export default router;

// ============ PATCH /users/me ============

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.resolve(process.cwd(), 'uploads');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const userId = (req as Request & { user?: { sub?: string } }).user?.sub || 'anon';
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `u_${userId}_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Accept only common image types
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('invalid_mime'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

function badRequest(res: Response, details: Array<{ field: string; issue: string }>) {
  return res.status(400).json({ code: 'invalid_schema', message: 'Validation failed', details });
}

function idToString(id: unknown): string {
  if (typeof id === 'string') return id;
  if (id && typeof (id as any).toString === 'function') return (id as any).toString();
  return String(id);
}

function toE164OrError(phone: string | undefined): string | null | 'invalid' {
  if (!phone) return null;
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed || !parsed.isValid()) return 'invalid';
  return parsed.number; // E.164
}

router.patch('/me', requireAuth, upload.single('profilePhoto'), async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });

  // Determine payload source: JSON or multipart fields
  const fields = (req.body ?? {}) as Record<string, any>;
  const file = (req as any).file as Express.Multer.File | undefined;

  // Allow-list: firstName, lastName, phone, profilePhoto
  const allowed = new Set(['firstName', 'lastName', 'phone', 'profilePhoto']);
  const immutable = new Set(['corporateEmail', 'universityId', 'role', 'id', '_id']);

  for (const k of Object.keys(fields)) {
    if (immutable.has(k)) {
      return res.status(403).json({ code: 'immutable_field', message: `Field '${k}' cannot be updated` });
    }
    if (!allowed.has(k)) {
      // ignore unknown fields silently to be lenient
      delete (fields as any)[k];
    }
  }

  // Validate names
  const errors: Array<{ field: string; issue: string }> = [];
  if (typeof fields.firstName !== 'undefined') {
    const v = String(fields.firstName).trim();
    if (v.length < 2) errors.push({ field: 'firstName', issue: 'min length 2' });
    else fields.firstName = v;
  }
  if (typeof fields.lastName !== 'undefined') {
    const v = String(fields.lastName).trim();
    if (v.length < 2) errors.push({ field: 'lastName', issue: 'min length 2' });
    else fields.lastName = v;
  }

  // Validate phone to E.164
  if (typeof fields.phone !== 'undefined') {
    const resE164 = toE164OrError(String(fields.phone));
    if (resE164 === 'invalid') errors.push({ field: 'phone', issue: 'invalid E.164 phone' });
    else fields.phone = resE164; // set to null or e164
  }

  // Validate file (multer already checks size/mime). Map errors to our codes.
  // If multer rejected due to size, Express will not reach here; we can add a global handler later.

  if (errors.length) {
    // Clean up uploaded file if present
    if (file && file.path) {
      fs.promises.unlink(file.path).catch(() => void 0);
    }
    return badRequest(res, errors);
  }

  // Fetch user
  await connectMongo();
  const doc = await User.findById(userId);
  if (!doc) return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });

  // Apply updates
  if (typeof fields.firstName !== 'undefined') doc.firstName = fields.firstName;
  if (typeof fields.lastName !== 'undefined') doc.lastName = fields.lastName;
  if (typeof fields.phone !== 'undefined') doc.phone = fields.phone ?? doc.phone;

  // Atomic profile photo replace: write new -> persist -> delete old
  let oldPath: string | null = null;
  if (file) {
    // we expose via /uploads/:file; store public URL
    const fileUrl = `/uploads/${path.basename(file.path)}`;
    oldPath = doc.profilePhotoUrl && doc.profilePhotoUrl.startsWith('/uploads/')
      ? path.resolve(process.cwd(), doc.profilePhotoUrl.replace('/uploads/', 'uploads/'))
      : null;
    doc.profilePhotoUrl = fileUrl;
  }

  await doc.save();

  // After successful save, delete old file if present
  if (oldPath) {
    fs.promises.unlink(oldPath).catch(() => void 0);
  }

  // Return DTO
  const dto: UserProfileDTO = {
    id: idToString(doc._id),
    role: doc.role,
    firstName: doc.firstName,
    lastName: doc.lastName,
    universityId: doc.universityId,
    corporateEmail: doc.corporateEmail,
    phone: doc.phone,
    profilePhotoUrl: doc.profilePhotoUrl ?? null,
    driver: { hasVehicle: Boolean(doc.driver?.vehicleId) }
  };
  return res.status(200).json(dto);
});

// Multer/Upload error mapping for this router
router.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (!err) return next();
  // Payload too large
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ code: 'payload_too_large', message: 'File exceeds limit' });
  }
  // Invalid mime type from our fileFilter
  if (err.message === 'invalid_mime') {
    return res.status(400).json({
      code: 'invalid_schema',
      message: 'Validation failed',
      details: [{ field: 'profilePhoto', issue: 'invalid mime type' }]
    });
  }
  return next(err);
});
