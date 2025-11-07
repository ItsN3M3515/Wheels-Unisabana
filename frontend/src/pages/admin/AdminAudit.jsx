import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAudit, exportAudit } from '../../api/adminAudit';
import useAuthStore from '../../store/authStore';

export default function AdminAuditPage() {
  const user = useAuthStore.getState().user;
  const [filters, setFilters] = useState({ actor: '', entity: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAudit({ page, perPage, ...filters });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || 'Error al obtener logs');
    } finally {
      setLoading(false);
    }
  }

  function onChangeFilter(e) {
    const { name, value } = e.target;
    setFilters((s) => ({ ...s, [name]: value }));
  }

  async function onApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    await fetchList();
  }

  async function onExport() {
    try {
      const res = await exportAudit({ ...filters, from: filters.from || undefined, to: filters.to || undefined });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/x-ndjson' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export-${new Date().toISOString()}.ndjson`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Error al exportar');
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <div>
          <Link to="/admin" className="text-sm text-blue-600 mr-4">Volver al panel</Link>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={onExport}
            disabled={loading}
          >
            Exportar NDJSON
          </button>
        </div>
      </div>

      <form className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2" onSubmit={onApplyFilters}>
        <input name="actor" placeholder="actor id" value={filters.actor} onChange={onChangeFilter} className="border rounded p-2" />
        <input name="entity" placeholder="entity (e.g. Review, User)" value={filters.entity} onChange={onChangeFilter} className="border rounded p-2" />
        <input name="from" type="datetime-local" value={filters.from} onChange={onChangeFilter} className="border rounded p-2" />
        <input name="to" type="datetime-local" value={filters.to} onChange={onChangeFilter} className="border rounded p-2" />
        <div className="sm:col-span-4">
          <button className="bg-blue-600 text-white px-3 py-1 rounded mr-2" type="submit">Aplicar filtros</button>
          <button type="button" className="px-3 py-1 border rounded" onClick={() => { setFilters({ actor: '', entity: '', from: '', to: '' }); setPage(1); }}>Limpiar</button>
        </div>
      </form>

      {error && <div className="text-red-600 mb-2">{String(error)}</div>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">When</th>
              <th className="p-2">Who</th>
              <th className="p-2">Action</th>
              <th className="p-2">Entity</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Correlation</th>
              <th className="p-2">Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-4">No hay registros</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-2 align-top">{new Date(it.when || it.createdAt || it.ts || '').toISOString()}</td>
                  <td className="p-2 align-top">{(it.actor && it.actor.id) || it.who || (it.actor && it.actor.name) || '-'}</td>
                  <td className="p-2 align-top">{it.action}</td>
                  <td className="p-2 align-top">{(it.entity && it.entity.type) || it.entity || ''} {it.entityId || (it.entity && it.entity.id) || ''}</td>
                  <td className="p-2 align-top">{it.reason || (it.from && it.to ? `${JSON.stringify(it.from)} → ${JSON.stringify(it.to)}` : '')}</td>
                  <td className="p-2 align-top">{it.correlationId || '-'}</td>
                  <td className="p-2 align-top text-xs break-words">{it.hash || it._id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>Mostrando {items.length} de {total}</div>
        <div>
          <button className="px-3 py-1 border rounded mr-2" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}>Anterior</button>
          <span className="mx-2">Página {page}</span>
          <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => p + 1)} disabled={items.length < perPage}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}
