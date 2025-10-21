import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ensureUploadsRoot } from './lib/uploads';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import driversRouter from './routes/drivers';
import { connectMongo } from './db';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';

dotenv.config();

export const app = express();
app.set('trust proxy', 1); // needed for secure cookies behind proxies

// Try to connect to Mongo (warn if not configured); server still runs
connectMongo().catch(() => {
  console.warn('MongoDB connection failed; API will still serve routes that do not require DB.');
});

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'PATCH', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));
app.use(cookieParser());
app.use(express.json());

// Serve static uploads
const UPLOADS_DIR = ensureUploadsRoot();
app.use('/uploads', express.static(UPLOADS_DIR));

// OpenAPI docs and explorer
app.get('/openapi.json', (_req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/drivers', driversRouter);

if (require.main === module) {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

// Global error handler to ensure uniform JSON
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.status === 401) return res.status(401).json({ code: 'unauthorized', message: 'Missing or invalid session' });
  if (err?.status === 403) return res.status(403).json({ code: 'forbidden', message: 'Access denied' });
  console.error('Unhandled error:', err);
  return res.status(500).json({ code: 'internal_error', message: 'Something went wrong' });
});
