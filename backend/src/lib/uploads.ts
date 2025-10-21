import path from 'path';
import fs from 'fs';

export function getUploadsRoot(): string {
  const configured = process.env.UPLOADS_ROOT;
  if (configured) return path.resolve(configured);
  const env = process.env.NODE_ENV || 'development';
  return path.resolve(process.cwd(), 'uploads', env);
}

export function ensureUploadsRoot(): string {
  const root = getUploadsRoot();
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
  return root;
}

export function sanitizeBase(name: string): string {
  // drop extension, keep alphanumerics, dashes, underscores; max 50
  const base = name.replace(/\.[^.]+$/, '');
  const safe = base.normalize('NFKD').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return safe || 'file';
}

export function mapMimeToExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}
