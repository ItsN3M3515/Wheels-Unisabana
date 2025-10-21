import mongoose from 'mongoose';

let connected = false;

export async function connectMongo(uri?: string) {
  if (connected) return mongoose;
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('MONGODB_URI is not set; proceeding without DB connection.');
    return mongoose;
  }
  await mongoose.connect(mongoUri);
  connected = true;
  console.log('Connected to MongoDB');
  return mongoose;
}
