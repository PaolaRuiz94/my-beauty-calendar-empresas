import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { logoutStore, updateStoreWebsite, updateStoreHorarios } from '../firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const DIAS = [
  ['lunes', 'Lunes'], ['martes', 'Martes'], ['miercoles', 'Miércoles'],
  ['jueves', 'Jueves'], ['viernes', 'Viernes'], ['sabado', 'Sábado'], ['domingo', 'Domingo'],
];

function horariosFromStore(store) {
  const h = store?.horarios || {};
  const result = {};
  for (const [key] of DIAS) {
    const rango = Array.isArray(h[key]) && h[key][0] ? h[key][0] : null;
    result[key] = { abierto: !!rango, inicio: rango?.inicio || '09:00', fin: rango?.fin || '18:00' };
  }
  return result;
}

export default function Dashboard() {
  const { store, setStore } = useStore();
  const navigate = useNavigate();
  const isPeluqueria = store?.businessType === 'peluqueria';
  const [website, setWebsite] = useState(store?.website || '');
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [horarios, setHorarios] = useState(() => horariosFromStore(store));
  const [savingHorarios, setSavingHorarios] = useState(false);

  async function handleLogout() {
    await logoutStore();
    setStore(null);
    navigate('/login');
  }

  async function handleSaveWebsite(e) {
    e.preventDefault();
    setSavingWebsite(true);
    try {
      await updateStoreWebsite(store.storeId, website);
      setStore({ ...store, website: website ? website.trim() : null });
    } finally {
      setSavingWebsite(false);
    }
  }

  function handleDayChange(day, field, value) {
    setHorarios(h => ({ ...h, [day]: { ...h[day], [field]: value } }));
  }

  async function handleSaveHorarios(e) {
    e.preventDefault();
    setSavingHorarios(true);
    try {
      const data = {};
      for (const [key] of DIAS) {
        const d = horarios[key];
        data[key] = d.abierto ? [{ inicio: d.inicio, fin: d.fin }] : null;
      }
      await updateStoreHorarios(store.storeId, data);
      setStore({ ...store, horarios: data });
    } finally {
      setSavingHorarios(false);
    }
  }

  if (!store) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h2>{store.nombre}</h2>
          <span className="store-id">/{store.storeId}</span>
        </div>
        <button onClick={handleLogout} className="btn-ghost">Cerrar sesión</button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h3>Bienvenida a tu panel</h3>
          <p>Desde aquí podrás gestionar tus productos, ver tu link de diagnóstico y revisar tus métricas.</p>
        </div>

        <form onSubmit={handleSaveWebsite} className="welcome-card">
          <h3>Sitio web de tu tienda</h3>
          <p>Si tenés una página propia, el cliente va a poder ir directo ahí al comprar tus productos.</p>
          <div className="form-row">
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://tutienda.co"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={savingWebsite}>
              {savingWebsite ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

        {isPeluqueria && (
          <form onSubmit={handleSaveHorarios} className="welcome-card">
            <h3>Horarios de atención</h3>
            <p>Definí en qué días y horarios atendés — de eso depende qué turnos les aparecen disponibles a tus clientes.</p>
            <div className="horarios-list">
              {DIAS.map(([key, label]) => (
                <div key={key} className="horario-row">
                  <div className="horario-day">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={horarios[key].abierto}
                        onChange={e => handleDayChange(key, 'abierto', e.target.checked)}
                      />
                      <span className="toggle-track"><span className="toggle-thumb" /></span>
                    </label>
                    <span>{label}</span>
                  </div>
                  {horarios[key].abierto ? (
                    <div className="horario-times">
                      <input
                        type="time"
                        value={horarios[key].inicio}
                        onChange={e => handleDayChange(key, 'inicio', e.target.value)}
                      />
                      <span className="horario-times-sep">a</span>
                      <input
                        type="time"
                        value={horarios[key].fin}
                        onChange={e => handleDayChange(key, 'fin', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="horario-closed">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={savingHorarios}>
                {savingHorarios ? 'Guardando...' : 'Guardar horarios'}
              </button>
            </div>
          </form>
        )}

        <div className="coming-soon-grid">
          <Link to="/dashboard/productos" className="coming-soon-card coming-soon-card-active">
            <span className="card-icon">📦</span>
            <h4>Mis productos</h4>
            <p>Gestiona tu catálogo</p>
          </Link>
          {isPeluqueria && (
            <>
              <Link to="/dashboard/servicios" className="coming-soon-card coming-soon-card-active">
                <span className="card-icon">✂️</span>
                <h4>Mis servicios</h4>
                <p>Gestiona lo que ofrecés</p>
              </Link>
              <Link to="/dashboard/agenda" className="coming-soon-card coming-soon-card-active">
                <span className="card-icon">📅</span>
                <h4>Mi agenda</h4>
                <p>Citas de tus clientes</p>
              </Link>
            </>
          )}
          <div className="coming-soon-card">
            <span className="card-icon">📊</span>
            <h4>Métricas</h4>
            <p>Próximamente</p>
          </div>
        </div>
      </main>
    </div>
  );
}
