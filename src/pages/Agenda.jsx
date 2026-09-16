import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getStoreReservas, confirmReserva, cancelReserva } from '../firebase/reservas';

const ESTADO_LABEL = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' };

export default function Agenda() {
  const { store } = useStore();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        {loading ? (
          <p className="loading-inline">Cargando citas...</p>
        ) : reservas.length === 0 ? (
          <div className="welcome-card">
            <h3>Todavía no tenés citas</h3>
            <p>Cuando una clienta agende desde la app, va a aparecer acá.</p>
          </div>
        ) : (
          <div className="product-grid">
            {reservas.map(r => (
              <div key={r.id} className="product-card">
                <div className="product-card-body">
                  <h4>{r.fecha} · {r.hora}</h4>
                  {r.servicioNombre && <p className="product-brand">{r.servicioNombre}</p>}
                  <span className="product-category">{ESTADO_LABEL[r.estado] || r.estado}</span>
                  {r.estado !== 'cancelada' && (
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
