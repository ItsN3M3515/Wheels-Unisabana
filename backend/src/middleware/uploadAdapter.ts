import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ensureUploadsRoot, mapMimeToExt, sanitizeBase } from '../lib/uploads';
import { Request } from 'express';

const MB = 1024 * 1024;
const DEFAULT_MAX_MB = Number(process.env.MAX_PROFILE_PHOTO_MB || 5);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const profilePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = ensureUploadsRoot();
      cb(null, dir);
    },
    filename: (req: Request, file, cb) => {
      const userId = (req as any).user?.sub || 'anon';
      const base = sanitizeBase(file.originalname);
      const ext = mapMimeToExt(file.mimetype) || path.extname(file.originalname).toLowerCase() || '.bin';
      const name = `u_${userId}_${Date.now()}_${base}${ext}`;
      cb(null, name);
    }
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      const err: any = new Error('invalid_file_type');
      err.code = 'INVALID_MIME';
      return cb(err);
    }
    cb(null, true);
  },
  limits: { fileSize: DEFAULT_MAX_MB * MB }
});
