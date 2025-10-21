export type UserRole = 'passenger' | 'driver' | 'admin';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  // any other claims as needed
}

export interface UserProfileDTO {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  universityId: string;
  corporateEmail: string;
  phone: string;
  profilePhotoUrl: string | null;
  driver: { hasVehicle: boolean };
}

// Internal user record type (e.g., from DB). Simulated here for demo purposes.
export interface InternalUserRecord {
  _id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  universityId: string;
  corporateEmail: string;
  phone: string;
  profilePhotoUrl?: string | null;
  passwordHash?: string; // internal - must not leak
  flags?: Record<string, unknown>; // internal - must not leak
  driver?: {
    vehicleId?: string | null;
  } | null;
}
