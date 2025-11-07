import client from '../../api/client';
import { submitVerification, getMyVerification } from '../driverVerification';

vi.mock('../../api/client');

describe('driverVerification API', () => {
  beforeEach(() => vi.resetAllMocks());

  it('submitVerification posts multipart form data', async () => {
    const fakeResp = { data: { status: 'pending_review' } };
    client.post.mockResolvedValue(fakeResp);

    const fd = new FormData();
    fd.append('fullName', 'Test');

    const res = await submitVerification(fd);
    expect(client.post).toHaveBeenCalledWith('/drivers/verification', fd, expect.any(Object));
    expect(res).toEqual(fakeResp.data);
  });

  it('getMyVerification calls GET endpoint', async () => {
    const fake = { data: { status: 'unverified' } };
    client.get.mockResolvedValue(fake);
    const res = await getMyVerification();
    expect(client.get).toHaveBeenCalledWith('/drivers/verification');
    expect(res).toEqual(fake.data);
  });
});
