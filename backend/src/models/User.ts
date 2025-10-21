import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '../types';

export interface UserDoc extends Document {
  role: UserRole;
  firstName: string;
  lastName: string;
  universityId: string;
  corporateEmail: string;
  phone: string;
  profilePhotoUrl?: string | null;
  passwordHash?: string;
  flags?: Record<string, unknown>;
  driver?: {
    vehicleId?: string | null;
  } | null;
}

const DriverSchema = new Schema({
  vehicleId: { type: String, default: null }
}, { _id: false });

const UserSchema = new Schema<UserDoc>({
  role: { type: String, enum: ['passenger', 'driver', 'admin'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  universityId: { type: String, required: true, index: true },
  corporateEmail: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profilePhotoUrl: { type: String, default: null },
  passwordHash: { type: String },
  flags: { type: Schema.Types.Mixed },
  driver: { type: DriverSchema, default: null }
}, { timestamps: true });

export const User: Model<UserDoc> = (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>('User', UserSchema);
