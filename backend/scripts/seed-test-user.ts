import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { connectMongo } from '../src/db';
import { User } from '../src/models/User';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  await connectMongo();
  const email = 'aruiz@uni.edu';
  const existing = await User.findOne({ corporateEmail: email });
  if (existing) {
    const existingId = idToString(existing._id);
    console.log('User exists:', existingId);
    fs.writeFileSync(path.resolve(__dirname, 'last_user_id.txt'), existingId);
    return;
  }
  const created = await User.create({
    role: 'passenger',
    firstName: 'Ana',
    lastName: 'Ruiz',
    universityId: '202420023',
    corporateEmail: email,
    phone: '+573001112233',
    profilePhotoUrl: 'https://cdn.example/u/665e2a/avatar.jpg',
    driver: { vehicleId: null }
  });
  const createdId = idToString(created._id);
  console.log('User created:', createdId);
  fs.writeFileSync(path.resolve(__dirname, 'last_user_id.txt'), createdId);
}

function idToString(id: unknown): string {
  if (typeof id === 'string') return id;
  if (id && typeof (id as any).toString === 'function') return (id as any).toString();
  return String(id);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
