import client from './client';

/**
 * List audit entries with pagination and optional filters.
 * params: { page, perPage, actor, entity, from, to }
 */
export async function listAudit(params = {}) {
  const response = await client.get('/admin/audit', { params });
  return response.data;
}

/**
 * Export audit entries for given query as NDJSON stream. Returns the raw response.
 * params: { actor, entity, from, to }
 */
export async function exportAudit(params = {}) {
  // We expect NDJSON; set responseType 'blob' so caller can download
  const response = await client.get('/admin/audit/export', { params, responseType: 'blob' });
  return response;
}
