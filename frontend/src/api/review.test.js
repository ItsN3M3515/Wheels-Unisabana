import * as review from './review';

console.log('[TEST MODULE] review.test.js loaded');

// Mock the client used by review.js
vi.mock('./client', () => ({
  default: {
    post: vi.fn((url, data) => Promise.resolve({ data: { ...data, id: 'r1' } })),
    get: vi.fn((url) => {
      if (url.endsWith('/me')) return Promise.reject({ status: 404 });
      return Promise.resolve({ data: { id: 'r1', rating: 5 } });
    }),
    patch: vi.fn((url, data) => Promise.resolve({ data: { ...data, id: 'r1' } })),
    delete: vi.fn((url) => Promise.resolve({ data: { deleted: true } })),
  }
}));

describe('review API', () => {
  it('createReview should post and return data', async () => {
    const res = await review.createReview('trip1', { rating: 5, text: 'Nice', tags: [] });
    expect(res).toHaveProperty('id', 'r1');
    expect(res.rating).toBe(5);
  });

  it('getMyReviewForTrip should throw 404 when not found', async () => {
    // The mock makes any /me request reject with status 404
    await expect(review.getMyReviewForTrip('trip1')).rejects.toEqual({ status: 404 });
  });

  it('editMyReview should patch and return updated', async () => {
    const res = await review.editMyReview('trip1', 'r1', { rating: 4 });
    expect(res).toHaveProperty('id', 'r1');
    expect(res.rating).toBe(4);
  });

  it('deleteMyReview should return deleted true', async () => {
    const res = await review.deleteMyReview('trip1', 'r1');
    expect(res).toHaveProperty('deleted', true);
  });
});
