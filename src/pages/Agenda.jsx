import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getStoreReservas, confirmReserva, cancelReserva } from '../firebase/reservas';

const ESTADO_LABEL = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const texto = date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const TABS = [
  { key: 'proximas', label: 'Próximas' },
  { key: 'pasadas', label: 'Pasadas' },
  { key: 'canceladas', label: 'Canceladas' },
];

export default function Agenda() {
  const { store } = useStore();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('proximas');

  useEffect(() => {
    loadReservas();
  }, []);

  async function loadReservas() {
    setLoading(true);
    setError('');
    try {
      setReservas(await getStoreReservas(store.storeId));
    } catch {
      setError('No se pudieron cargar las citas.');
    }
    setLoading(false);
  }

  async function handleConfirm(reservaId) {
    try {
      await confirmReserva(reservaId);
      setReservas(rs => rs.map(r => (r.id === reservaId ? { ...r, estado: 'confirmada' } : r)));
    } catch {
      setError('No se pudo confirmar la cita.');
    }
  }

  async function handleCancel(reserva) {
    if (!confirm('¿Cancelar esta cita? El horario vuelve a quedar disponible.')) return;
    try {
      await cancelReserva(store.storeId, reserva.id, reserva.slotIds || []);
      setReservas(rs => rs.map(r => (r.id === reserva.id ? { ...r, estado: 'cancelada' } : r)));
    } catch {
      setError('No se pudo cancelar la cita.');
    }
  }

  const grouped = useMemo(() => {
    const hoy = todayStr();
    const proximas = [];
    const pasadas = [];
    const canceladas = [];
    for (const r of reservas) {
      if (r.estado === 'cancelada') canceladas.push(r);
      else if (r.fecha >= hoy) proximas.push(r);
      else pasadas.push(r);
    }
    proximas.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    pasadas.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    canceladas.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    return { proximas, pasadas, canceladas };
  }, [reservas]);

  const visibles = grouped[tab];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="back-link">← Volver</Link>
          <h2>Mi agenda</h2>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="auth-error">{error}</p>}

        <div className="tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="tab-count">{grouped[t.key].length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading-inline">Cargando citas...</p>
        ) : visibles.length === 0 ? (
          <div className="welcome-card">
            <h3>
              {tab === 'proximas' && 'No tenés citas próximas'}
              {tab === 'pasadas' && 'Todavía no hay citas pasadas'}
              {tab === 'canceladas' && 'No hay citas canceladas'}
            </h3>
            {tab === 'proximas' && <p>Cuando una clienta agende desde la app, va a aparecer acá.</p>}
          </div>
        ) : (
          <div className="product-grid">
            {visibles.map(r => (
              <div key={r.id} className="product-card">
                <div className="product-card-body">
                  <h4>{formatFecha(r.fecha)} · {r.hora}</h4>
                  {r.servicioNombre && <p className="product-brand">{r.servicioNombre}</p>}
                  <span className={`product-category estado-${r.estado}`}>{ESTADO_LABEL[r.estado] || r.estado}</span>
                  {tab === 'proximas' && (
                    <div className="product-card-actions">
                      {r.estado !== 'confirmada' && (
                        <button className="btn-ghost" onClick={() => handleConfirm(r.id)}>Confirmar</button>
                      )}
                      <button className="btn-ghost btn-danger" onClick={() => handleCancel(r)}>Cancelar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
