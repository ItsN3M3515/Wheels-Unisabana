import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCsrf } from '../middleware/csrf';
import { InternalUserRecord, UserProfileDTO } from '../types';
import { connectMongo } from '../db';
import { User } from '../models/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { validatePatchMe } from '../middleware/patchMeValidation';
import { profilePhotoUpload } from '../middleware/uploadAdapter';
import { getUploadsRoot } from '../lib/uploads';

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
      const doc = await User.findById(userId).lean<any>();
      if (doc) {
        user = {
          _id: doc._id?.toString?.() ?? String(doc._id),
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
  } catch (e) {
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

const upload = profilePhotoUpload;

function badRequest(res: Response, details: Array<{ field: string; issue: string }>) {
  return res.status(400).json({ code: 'invalid_schema', message: 'Validation failed', details });
}

function idToString(id: unknown): string {
  if (typeof id === 'string') return id;
  if (id && typeof (id as any).toString === 'function') return (id as any).toString();
  return String(id);
}

router.patch('/me', requireAuth, requireCsrf, upload.single('profilePhoto'), validatePatchMe, async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });

  // Determine payload source: JSON or multipart fields
  const fields = (req.body ?? {}) as Record<string, any>;
  const file = (req as any).file as Express.Multer.File | undefined;

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
    const root = getUploadsRoot();
    const fileUrl = `/uploads/${path.basename(file.path)}`;
    oldPath = doc.profilePhotoUrl && doc.profilePhotoUrl.startsWith('/uploads/')
      ? path.resolve(root, path.basename(doc.profilePhotoUrl))
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
  if (err.message === 'invalid_file_type' || err.code === 'INVALID_MIME') {
    return res.status(400).json({ code: 'invalid_file_type', message: 'Unsupported MIME type' });
  }
  return next(err);
});
