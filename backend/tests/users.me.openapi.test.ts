import request from 'supertest';
import { app } from '../src/server';

describe('OpenAPI contract - /users/me', () => {
  it('GET /users/me unauthorized matches schema', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'unauthorized' });
    expect(res).toSatisfyApiSpec();
  });
});
