import client from '../../api/client';
import { suspendUser, forceCancelTrip, correctBookingState, setDriverPublishBan, createModerationUploadUrl, createModerationNote } from '../admin';

vi.mock('../../api/client');

describe('admin api helpers', () => {
  beforeEach(() => vi.resetAllMocks());

  it('suspendUser calls patch', async () => {
    client.patch.mockResolvedValue({ data: { ok: true } });
    const res = await suspendUser('u1', true, 'reason');
    expect(client.patch).toHaveBeenCalledWith('/admin/users/u1/suspension', { action: 'suspend', reason: 'reason' });
    expect(res).toEqual({ ok: true });
  });

  it('forceCancelTrip posts', async () => {
    client.post.mockResolvedValue({ data: { ok: true } });
    const res = await forceCancelTrip('t1', 'reason');
    expect(client.post).toHaveBeenCalledWith('/admin/trips/t1/force-cancel', { reason: 'reason' });
    expect(res).toEqual({ ok: true });
  });

  it('correctBookingState posts', async () => {
    client.post.mockResolvedValue({ data: { ok: true } });
    const res = await correctBookingState('b1', 'accepted', 'fix');
    expect(client.post).toHaveBeenCalledWith('/admin/bookings/b1/correct-state', { newState: 'accepted', reason: 'fix' });
    expect(res).toEqual({ ok: true });
  });

  it('setDriverPublishBan patch', async () => {
    client.patch.mockResolvedValue({ data: { ok: true } });
    const res = await setDriverPublishBan('d1', true, 'reason');
    expect(client.patch).toHaveBeenCalledWith('/admin/drivers/d1/publish-ban', { action: 'ban', reason: 'reason', until: undefined });
    expect(res).toEqual({ ok: true });
  });

  it('createModerationNote posts', async () => {
    client.post.mockResolvedValue({ data: { ok: true } });
    const res = await createModerationNote('User', 'u1', 'note', 'http://e');
    expect(client.post).toHaveBeenCalledWith('/admin/moderation/notes', { entity: 'User', entityId: 'u1', notes: 'note', evidenceUrl: 'http://e' });
    expect(res).toEqual({ ok: true });
  });
});
