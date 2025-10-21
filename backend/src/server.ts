import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import usersRouter from './routes/users';
import { connectMongo } from './db';

dotenv.config();

const app = express();

// Try to connect to Mongo (warn if not configured); server still runs
connectMongo().catch(() => {
  console.warn('MongoDB connection failed; API will still serve routes that do not require DB.');
});

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Serve static uploads
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/users', usersRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
