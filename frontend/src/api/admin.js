import client from './client';

// Admin actions API helpers

export async function suspendUser(userId, suspend, reason) {
  // suspend: true => suspend, false => unsuspend
  const action = suspend ? 'suspend' : 'unsuspend';
  const response = await client.patch(`/admin/users/${userId}/suspension`, { action, reason });
  return response.data;
}

export async function forceCancelTrip(tripId, reason) {
  const response = await client.post(`/admin/trips/${tripId}/force-cancel`, { reason });
  return response.data;
}

export async function correctBookingState(bookingId, newState, reason) {
  const response = await client.post(`/admin/bookings/${bookingId}/correct-state`, { newState, reason });
  return response.data;
}

export async function setDriverPublishBan(driverId, ban, reason, until) {
  // ban: true/false, until optional ISO date
  const response = await client.patch(`/admin/drivers/${driverId}/publish-ban`, { action: ban ? 'ban' : 'unban', reason, until });
  return response.data;
}

export async function createModerationUploadUrl(meta) {
  const response = await client.post('/admin/moderation/evidence/upload-url', meta);
  return response.data;
}

export async function createModerationNote(entity, entityId, notes, evidenceUrl) {
  const response = await client.post('/admin/moderation/notes', { entity, entityId, notes, evidenceUrl });
  return response.data;
}
